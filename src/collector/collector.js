import * as crypto from 'crypto'
import { sleep } from "../utils.js"
import { lcdClient } from "../utils/api.js"
import { db } from '../utils/db.js'
import { processTx } from './tx.js'

export const collect = async () => {
    let lastIndexedHeight
    while (true) {
        try {
            const { data: latestBlock } = await lcdClient.get(`/blocks/latest`)

            const lastHeight = Number(latestBlock.block.header.height)
            if (lastHeight == lastIndexedHeight) {
                await sleep(5_000)
                continue
            }

            const remaining = lastIndexedHeight
                ? Array.from({ length: lastHeight - lastIndexedHeight - 1 }, (_, i) => i + lastIndexedHeight + 1)
                : []
            const promises = [...remaining, latestBlock].map(collectBlock)

            lastIndexedHeight = lastHeight

            await Promise.all(promises)
        } catch (error) {
            console.error("collect error: %s", error.message)
        }
    }
}

const getBlock = async (height) => {
    const { data: block } = await lcdClient.get(`/blocks/${height}`)
    return block
}

const getHash = (tx) => {
    const s256Buffer = crypto.createHash("sha256").update(Buffer.from(tx, "base64")).digest()
    const txbytes = new Uint8Array(s256Buffer)
    return Buffer.from(txbytes.slice(0, 32)).toString("hex").toUpperCase()
}

const collectBlock = async (info) => {
    try {
        if (typeof info === 'number') {
            info = await getBlock(info)
        }

        await sleep(5_000)

        console.log("start block %s: %d txs", info.block.header.height, info.block.data.txs.length)

        info.block.data.txs
            .map(getHash)
            .map(collectTx)
    } catch (error) {
        console.error("collectBlock %s error: %s", info?.block?.header?.height ?? info, error.message)
    }
}

const collectTx = async (hash) => {
    try {
        const { addresses, timestamp, json } = await processTx(hash)

        const result = await db.query(`
            INSERT INTO tx(hash, "timestamp", json)
            VALUES ($1, $2, $3)
            RETURNING id
        `, [hash, timestamp, json])
        const id = result.rows[0].id

        for (const address of addresses) {
            await db.query(`
                INSERT INTO tx_address(tx_id, address)
                VALUES ($1, $2)
            `, [id, address.address])

            for (const amount of address.amountIn) {
                await db.query(`
                    INSERT INTO tx_amount(tx_id, address, denom, amount, usd, in_out)
                    VALUES ($1, $2, $3, $4, $5, $6);
                `, [id, address.address, amount.denom, amount.amount, amount.usd, "I"])
            }

            for (const amount of address.amountOut) {
                await db.query(`
                    INSERT INTO tx_amount(tx_id, address, denom, amount, usd, in_out)
                    VALUES ($1, $2, $3, $4, $5, $6);
                `, [id, address.address, amount.denom, amount.amount, amount.usd, "O"])
            }
        }

        console.log("tx: %s", hash)
    } catch (error) {
        console.error("collectTx %s error: %s", hash, error)
    }
}

await collect()