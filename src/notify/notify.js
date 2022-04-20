import { AccAddress } from "@terra-money/terra.js"
import format from "../format.js"
import getFinderLink from "../format/finderLink.js"
import { sleep } from "../utils.js"
import { assetsClient, lcdClient } from "../utils/api.js"
import { db } from "../utils/db.js"
import { sendDiscordNotification } from "./discord.js"

const notify = async () => {
    while (true) {
        try {
            const res = await db.query(`
                SELECT W.address, W.channel, W.amount, T.id, T.hash, T.timestamp
                FROM watch W
                    INNER JOIN tx_address A ON A.address = W.address
                    INNER JOIN tx T ON T.id = A.tx_id
                WHERE A.processed = false
            `)
            if (!res.rows.length) {
                await sleep(5_000)
                continue
            }

            const promises = res.rows.map(notifyTx)

            await db.query(`
                UPDATE tx_address
                SET processed = true
                WHERE processed = false AND address NOT IN (SELECT address FROM watch)
            `)

            await Promise.all(promises)
        } catch (error) {
            console.error("notify error: %s", error.message)
        }
    }
}

const notifyTx = async ({ address, channel, amount, id, hash, timestamp }) => {
    try {
        const allAddresses = await getAddressess(id)
        const addresses = []
        for (const a of allAddresses) {
            if (a != address && await isAccount(a)) {
                addresses.push(a)
            }
        }
        const amounts = (await getAmount(id, address)).map(parseAmount)
        const amountIn = amounts.filter(amount => amount.in_out == "I")
        const amountOut = amounts.filter(amount => amount.in_out == "O")

        const inUsd = amountIn.reduce((a, b) => a + b.usd, 0)
        const outUsd = amountOut.reduce((a, b) => a + b.usd, 0)

        if (outUsd > amount || inUsd > amount) {
            sendDiscordNotification(address, channel, amount, amountIn, amountOut, hash, timestamp, addresses)
            console.log("notifyTx %d sent", id)
        } else {
            console.log("notifyTx %d dont needed", id)
        }

        await db.query(`
            UPDATE tx_address
            SET processed = true
            WHERE tx_id = $1
              AND address = $2
        `, [id, address])
    } catch (error) {
        console.error("notifyTx %d error: %s", id, error.message)
    }
}

const getAddressess = async (tx) => {
    const res = await db.query(`
        SELECT address
        FROM tx_address
        WHERE tx_id = $1
    `, [tx])
    return res.rows.map(({ address }) => address)
}

const isAccount = async (address) => {
    const lcd = lcdClient

    if (AccAddress.validate(address)) {
        if (contracts?.[address]) {
            return false
        }

        try {
            await lcd.get(`/terra/wasm/v1beta1/contracts/${address}`)
            return false
        } catch (error) {
            return true
        }
    }
}

const getAmount = async (tx, address) => {
    const res = await db.query(`
        SELECT denom, amount, usd, in_out
        FROM tx_amount
        WHERE tx_id = $1
          AND address = $2
    `, [tx, address])
    return res.rows.map(({ denom, amount, usd, in_out }) => { return { denom, amount, usd, in_out } })
}

const { data: { mainnet: whitelist } } = await assetsClient.get("cw20/tokens.json")
const { data: { mainnet: contracts } } = await assetsClient.get("cw20/contracts.json")

const isTerraAddress = (keyword) => { return keyword && keyword.length === 44 && keyword.indexOf("terra") > -1 }

const parseAmount = ({ amount, denom, usd, in_out }) => {
    const list = whitelist?.[denom]
    const contract = contracts?.[denom]
    if (isTerraAddress(denom) && (list || contract)) {
        denom = getFinderLink(list?.symbol ? list?.symbol : contract?.name, "address", denom)
    } else if (format.denom(denom).length >= 40) {
        denom = "Token"
    } else {
        denom = format.denom(denom)
    }
    return { amount, denom, usd, in_out }
}

await notify()