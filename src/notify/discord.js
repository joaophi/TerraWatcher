import getFinderLink from "../format/finderLink.js"
import { discord } from "../shared/discord.js"
import format from "../shared/format.js"

const formatCoin = ({ amount, denom, usd }) => `${amount} ${denom} - ${usd} USD`

export const sendDiscordNotification = async (address, label, channelId, amountIn, amountOut, hash, timestamp, addresses, mention) => {
    try {
        const content = mention ? "@everyone" : undefined
        const embeds = {
            fields: [
                {
                    name: "ADDRESS",
                    value: getFinderLink(format.label(address, label), "address", address),
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
                    name: "ACCOUNTS INVOLVED",
                    value: addresses
                        .map(({ address, label }) => getFinderLink(format.label(address, label), "address", address))
                        .join("\n") || "not found"
                },
                {
                    name: "HASH",
                    value: getFinderLink(format.truncate(hash, [8, 8]), "tx", hash),
                },
                {
                    name: "TIME",
                    value: format.date(timestamp),
                }
            ]
        }

        const channel = discord.channels.cache.get(channelId) ?? await discord.channels.fetch(channelId)
        await channel.send({ content, embeds: [embeds] })
    } catch (error) {
        console.error("notifyTx error: %s", error.message)
    }
}