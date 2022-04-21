import { discord } from "../shared/discord.js"
import format from "../shared/format.js"
import getFinderLink from "../format/finderLink.js"

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