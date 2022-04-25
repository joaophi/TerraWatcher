import { truncate } from "terra-utils"
import getFinderLink from "../format/finderLink.js"
import { discord } from "../shared/discord.js"
import format from "../shared/format.js"

const formatCoin = ({ amount, denom, usd }) => `${amount} ${denom} - ${usd} USD`

const getLabel = (address, label) => {
    if (label) {
        return `${label} (${truncate(address)})`
    } else {
        return address
    }
}

export const sendDiscordNotification = async (address, label, channelId, amountIn, amountOut, hash, timestamp, addresses) => {
    const embeds = {
        fields: [
            {
                name: "ADDRESS",
                value: getFinderLink(getLabel(address, label), "address", address),
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
                    .map(({ address, label }) => getFinderLink(getLabel(address, label), "address", address))
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