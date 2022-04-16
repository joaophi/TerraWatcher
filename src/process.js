import { parseTx } from "./amount.js";
import { isAccount } from "./format/api.js";
import getFinderLink from "./format/finderLink.js";
import getTxActions from "./format/index.js";
import { sleep } from "./utils.js";

export const process = async (db) => {
    while (true) {
        const watches = await db.all(
            `SELECT DISTINCT address, type
             FROM watch`
        )

        const promises = watches.map((watch) => processWatch(db, watch))

        await Promise.allSettled(promises)

        await sleep(10000)
    }
}

const processWatch = async (db, { address, type }) => {
    const txs = await db.all(
        `SELECT id, json
         FROM tx
         WHERE address = $address
           AND processed = 0`,
        { $address: address }
    )

    const promises = txs.map(tx => processTx(db, address, tx, type))

    await Promise.allSettled(promises)
}

const processTx = async (db, address, { id, json }, type) => {
    try {
        const tx = { ...parseTx(JSON.parse(json), address), id, address }
        const usts = [...tx.amountIn, ...tx.amountOut]
            .filter(({ _, denom }) => denom == "UST")
            .map(({ amount }) => parseFloat(amount.replace(",", "")))
        const amount = Math.max(...usts, 0)

        console.log("process tx %d: amount %f", tx.id, amount)

        const [actions, AisAccount] = [
            await getTxActions(tx.rawTx),
            await Promise.all(tx.addresses.map(isAccount))
        ]
        const addresses = tx.addresses
            .filter((_, index) => AisAccount[index])
            .map(addresses => getFinderLink(addresses, "address", addresses))
            .join("\n") ?? ""

        await db.run(
            `UPDATE tx
             SET hash = $hash,
                 amount = $amount,
                 addresses = $addresses,
                 actions = $actions,
                 timestamp = $timestamp,
                 processed = 1
             WHERE id = $id
               AND address = $address`,
            {
                $hash: tx.txHash,
                $amount: amount,
                $addresses: addresses,
                $actions: actions,
                $timestamp: tx.timestamp,

                $id: tx.id,
                $address: address
            }
        )
    } catch (error) {
        console.error("process tx %d: error %s", id, error.message)
    }
}