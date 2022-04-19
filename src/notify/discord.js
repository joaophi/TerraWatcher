import { Client, Intents } from "discord.js"
import format from "../format.js"
import getFinderLink from "../format/finderLink.js"

export const discord = new Client({ intents: [Intents.FLAGS.GUILDS] })
await discord.login("OTYwMzA3OTAyNDUzNzg0NjA2.YkoibQ.U6d8K3vu48db9Wtg1OBOdyy8IDU")

const formatCoin = ({ amount, denom, usd }) => `${amount} ${denom} - ${usd} USD`

export const sendDiscordNotification = async (address, channelId, amount, amountIn, amountOut, hash, timestamp, addresses) => {
    const embeds = {
        fields: [
            {
                name: "ADDRESS",
                value: getFinderLink(address, "address", address),
            },
            ...(amountIn.length ? [{
                name: "AMOUNT IN",
                value: amountIn.map(formatCoin).join("\n"),
            }] : []),
            ...(amountOut.length ? [{
                name: "AMOUNT OUT",
                value: amountOut.map(formatCoin).join("\n"),
            }] : []),
            {
                name: "SENDER/RECEIVER",
                value: addresses
                    .map(addr => getFinderLink(addr, "address", addr))
                    .join("\n") || "not found"
            },
            {
                name: "HASH",
                value: getFinderLink(hash, "tx", hash),
            },
            {
                name: "TIME",
                value: format.date(timestamp),
            }
        ]
    }

    const channel = discord.channels.cache.get(channelId) ?? await discord.channels.fetch(channelId)
    await channel.send({ embeds: [embeds] })
}