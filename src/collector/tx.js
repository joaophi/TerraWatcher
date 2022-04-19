import _ from "lodash"
import { lcdClient } from "../utils/api.js"
import { getAddresses } from "./address.js"
import { getAmounts } from "./amount.js"
import { getUsdPrice } from "./price.js"

export const processTx = async (hash) => {
    const tx = await getTx(hash)
    const addresses = getAddresses(tx)
        .map(address => {
            return {
                address,
                ...getAmounts(tx, address)
            }
        })

    for (const address of addresses) {
        for (const amount of address.amountIn) {
            amount.usd = amount.amount * (await getUsdPrice(amount.denom))
        }
        for (const amount of address.amountOut) {
            amount.usd = amount.amount * (await getUsdPrice(amount.denom))
        }
    }

    return {
        hash: tx.txhash,
        addresses,
        timestamp: tx.timestamp,
        json: JSON.stringify(tx)
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