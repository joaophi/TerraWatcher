import * as crypto from 'crypto'
import { lcdClient } from "../shared/api.js"
import { sleep } from "../shared/utils.js"
import { collectTx } from './tx.js'

export const collect = async () => {
    let lastIndexedHeight
    while (true) {
        try {
            const { data: latestBlock } = await lcdClient.get(`/blocks/latest`)

            const lastHeight = Number(latestBlock.block.header.height)
            if (lastHeight == lastIndexedHeight) {
                continue
            }

            const remaining = lastIndexedHeight
                ? Array.from({ length: lastHeight - lastIndexedHeight - 1 }, (_, i) => i + lastIndexedHeight + 1)
                : [];
            [...remaining, latestBlock].map(collectBlock)

            if (!lastIndexedHeight || lastHeight > lastIndexedHeight)
                lastIndexedHeight = lastHeight

        } catch (error) {
            console.error("collect error: %s", error.message)
        } finally {
            await sleep(5_000)
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

        await sleep(10_000)

        console.log("start block %s: %d txs", info.block.header.height, info.block.data.txs.length)

        info.block.data.txs
            .map(getHash)
            .map(hash => collectTx(hash))
    } catch (error) {
        console.error("collectBlock %s error: %s", info?.block?.header?.height ?? info, error.message)
    }
}

await collect()