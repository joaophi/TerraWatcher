import getFinderLink from "../format/finderLink.js"
import { contracts, whitelist } from "../shared/api.js"
import { db } from "../shared/db.js"
import format from "../shared/format.js"
import { sleep } from "../shared/utils.js"
import { sendDiscordNotification } from "./discord.js"

const notify = async () => {
    const client = await db.connect()
    try {
        while (true) {
            try {
                await client.query(`
                    UPDATE tx_address
                    SET processed = true
                    WHERE processed = false AND address NOT IN (SELECT address FROM watch)
                `)

                const res = await client.query(`
                    SELECT W.address, AD.label, W.channel, W.amount, T.id, T.hash, T.timestamp
                    FROM watch W
                        INNER JOIN tx_address A ON A.address = W.address
                        INNER JOIN tx T ON T.id = A.tx_id
                        INNER JOIN address AD ON AD.address = W.address
                    WHERE A.processed = false
                `)

                res.rows.map(notifyTx)
            } catch (error) {
                console.error("notify error: %s", error.message)
            } finally {
                await sleep(5_000)
            }
        }
    } finally {
        client.release()
    }
}

const notifyTx = async ({ address, label, channel, amount, id, hash, timestamp }) => {
    try {
        const amounts = (await getAmount(id, address)).map(parseAmount)
        const amountIn = amounts.filter(amount => amount.in_out == "I")
        const amountOut = amounts.filter(amount => amount.in_out == "O")

        const inUsd = amountIn.reduce((a, b) => a + b.usd, 0)
        const outUsd = amountOut.reduce((a, b) => a + b.usd, 0)

        if (outUsd > amount || inUsd > amount) {
            const addresses = await getAddressess(id)
            sendDiscordNotification(address, label, channel, amountIn, amountOut, hash, timestamp, addresses.filter(it => it.address !== address))
            console.log("notifyTx %d sent", id)
        } else {
            console.log("notifyTx %d not needed", id)
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
    const { rows } = await db.query(`
        SELECT T.address, A.label
        FROM tx_address T
         INNER JOIN address A ON A.address = T.address
        WHERE T.tx_id = $1
          AND A.account = true
    `, [tx])
    return rows
}

const getAmount = async (tx, address) => {
    const { rows } = await db.query(`
        SELECT denom, amount, usd, in_out
        FROM tx_amount
        WHERE tx_id = $1
          AND address = $2
    `, [tx, address])
    return rows.map(({ denom, amount, usd, in_out }) => { return { denom, amount, usd, in_out } })
}

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