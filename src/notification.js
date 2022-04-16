import format from "./format.js"
import getFinderLink from "./format/finderLink.js"
import { sleep } from "./utils.js"

export const notify = async (db, discord) => {
    while (true) {
        const txs = await db.all(
            `SELECT tx.id, tx.address, tx.hash, tx.amount, tx.addresses, tx.actions, tx.timestamp, W.channel, W.minimum
             FROM tx
                 INNER JOIN watch W ON W.address = TX.address
             WHERE tx.processed = 1
               AND tx.notified IS NULL
             ORDER BY id`
        )

        const promises = txs.map(tx => notifyTx(db, discord, tx))

        await Promise.allSettled(promises)

        await sleep(10000)
    }
}

const notifyTx = async (db, discord, tx) => {
    try {
        const channel = discord.channels.cache.get(tx.channel) ?? await discord.channels.fetch(tx.channel)
        const shouldNotify = tx.amount > tx.minimum
        if (shouldNotify) {
            await sendDiscordNotification(channel, tx)
            console.log("notify tx %d: channel %s", tx.id, tx.channel)
        }
        await db.run(
            `UPDATE tx
             SET notified = $notified
             WHERE id = $id`,
            { $notified: shouldNotify, $id: tx.id }
        )
    } catch (error) {
        console.error("notify tx %d: error %s", tx.id, error.message)
    }
}

const sendDiscordNotification = async (channel, tx) => {
    const embeds = {
        fields: [
            {
                name: "CONTRACT",
                value: getFinderLink(tx.address, "address", tx.address),
            },
            {
                name: "VALUE",
                value: `${format.amount(tx.amount, 0)} UST`,
            },
            {
                name: "ACTIONS",
                value: tx.actions.substring(0, 1024),
            },
            {
                name: "SENDER/RECEIVER",
                value: tx.addresses || "not found"
            },
            {
                name: "HASH",
                value: getFinderLink(tx.hash, "tx", tx.hash),
            },
            {
                name: "TIME",
                value: format.date(tx.timestamp),
            }
        ]
    }

    await channel.send({ embeds: [embeds] })
}