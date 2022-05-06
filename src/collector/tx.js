import _ from "lodash"
import { saveAddress } from "../shared/account.js"
import { lcdClient } from "../shared/api.js"
import { db } from "../shared/db.js"
import { getAddresses } from "./address.js"
import { getAmounts } from "./amount.js"
import { getLiquidations } from "./liquidation.js"
import { getUsdPrice } from "./price.js"

export const processTx = async (tx) => {
    // AMOUNT
    const addresses = getAddresses(tx).map(address => ({ address, ...getAmounts(tx, address) }))

    for (const amount of addresses.flatMap(a => [...a.amountIn, ...a.amountOut])) {
        amount.usd = amount.amount * (await getUsdPrice(amount.denom))
    }

    // LIQUIDATION

    // const liquidations = getLiquidations(tx)
    // console.log(liquidations)

    return {
        hash: tx.txhash,
        addresses,
        timestamp: tx.timestamp,
        json: JSON.stringify(tx)//,
        // liquidations
    }
}

const getTx = async (hash) => {
    const { data: res } = await lcdClient.get(`/cosmos/tx/v1beta1/txs/${hash}`)

    if (!res || !res.tx_response) {
        throw new Error(ErrorTypes.NOT_FOUND_ERROR, '', `transaction not found on node (hash: ${hash})`)
    }

    const intermediate = _.pickBy(
        _.pick(res.tx_response, [
            'height',
            'txhash',
            'logs',
            'gas_wanted',
            'gas_used',
            'codespace',
            'code',
            'timestamp',
            'raw_log'
        ])
    )

    const { auth_info, body, signatures } = res.tx_response.tx

    return {
        ...intermediate,
        tx: {
            type: 'core/StdTx',
            value: {
                fee: {
                    amount: auth_info.fee.amount,
                    gas: auth_info.fee.gas_limit
                },
                msg: body.messages.map((m) => {
                    // '/terra.oracle.v1beta1.MsgAggregateExchangeRatePrevote' ->
                    // [ 'terra', 'oracle', 'v1beta1', 'MsgAggregateExchangeRatePrevote' ]
                    const tokens = m['@type'].match(/([a-zA-Z0-9]+)/g)
                    let type

                    if (tokens[0] === 'terra' || tokens[0] === 'cosmos') {
                        type = `${tokens[1]}/${tokens[tokens.length - 1]}`
                    } else {
                        type = `${tokens[0]}/${tokens[tokens.length - 1]}`
                    }

                    type = type
                        .replace('distribution/MsgSetWithdrawAddress', 'distribution/MsgModifyWithdrawAddress')
                        .replace('distribution/MsgWithdrawDelegatorReward', 'distribution/MsgWithdrawDelegationReward')
                        .replace('authz/MsgGrant', 'msgauth/MsgGrantAuthorization')
                        .replace('authz/MsgRevoke', 'msgauth/MsgRevokeAuthorization')
                        .replace('authz/MsgExec', 'msgauth/MsgExecAuthorized')
                        .replace('ibc/MsgTransfer', 'cosmos-sdk/MsgTransfer')

                    return {
                        type,
                        value: _.pick(
                            m,
                            Object.keys(m).filter((key) => key !== '@type')
                        )
                    }
                }),
                signatures: auth_info.signer_infos.map((si, idx) => ({
                    pub_key: {
                        type: 'tendermint/PubKeySecp256k1',
                        value: si.public_key?.key || null
                    },
                    signature: signatures[idx]
                })),
                memo: body.memo,
                timeout_height: body.timeout_height
            }
        }
    }
}

export const collectTx = async (hash) => {
    try {
        const raw_tx = await getTx(hash)
        const tx = await processTx(raw_tx)
        await saveTx(tx)
        console.log("tx: %s", hash)
    } catch (error) {
        console.error("collectTx %s error: %s", hash, error.message)
    }
}

const saveTx = async ({ hash, addresses, timestamp, json }) => {
    const client = await db.connect()
    try {
        await client.query("BEGIN")

        const result = await client.query(`
            INSERT INTO tx(hash, "timestamp", json)
            VALUES ($1, $2, $3)
            RETURNING id
        `, [hash, timestamp, json])
        const id = result.rows[0].id

        for (const address of addresses) {
            await saveAddress(address.address, client)

            await client.query(`
                INSERT INTO tx_address(tx_id, address, processed)
                VALUES ($1, $2, false)
            `, [id, address.address])

            for (const amount of address.amountIn) {
                await client.query(`
                    INSERT INTO tx_amount(tx_id, address, denom, amount, usd, in_out)
                    VALUES ($1, $2, $3, $4, $5, $6);
                `, [id, address.address, amount.denom, amount.amount, amount.usd, "I"])
            }

            for (const amount of address.amountOut) {
                await client.query(`
                    INSERT INTO tx_amount(tx_id, address, denom, amount, usd, in_out)
                    VALUES ($1, $2, $3, $4, $5, $6);
                `, [id, address.address, amount.denom, amount.amount, amount.usd, "O"])
            }
        }

        await client.query("COMMIT")
    } catch (error) {
        await client.query("ROLLBACK")
        throw error
    } finally {
        client.release()
    }
}