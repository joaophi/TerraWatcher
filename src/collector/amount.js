import { createAmountRuleSet, createLogMatcherForAmounts, getTxAmounts } from "@terra-money/log-finder-ruleset"
import { Coin } from "@terra-money/terra.js"
import BigNumber from "bignumber.js"
import { assetsClient } from "../utils/api.js"

export const getAmounts = (tx, address) => {
    const amountRuleset = createAmountRuleSet()
    const amountLogMatcher = createLogMatcherForAmounts(amountRuleset)
    const amountMatchedMsg = getTxAmounts(JSON.stringify(tx), amountLogMatcher, address)

    const amountIn = []
    const amountOut = []
    amountMatchedMsg?.forEach(matchedLog => {
        if (matchedLog && matchedLog[0]?.transformed?.type === "multiSend") {
            const amountInMap = new Map()
            const amountOutMap = new Map()

            matchedLog.forEach(log => {
                const recipient = log.match[0].value
                const coin = log.match[1].value.split(",").map(splitCoinData)

                coin.forEach(data => {
                    if (data) {
                        const { amount, denom } = data
                        const amountInStack = amountInMap.get(denom)
                        const amountOutStack = amountOutMap.get(denom)

                        const inStack = amountInStack ? plus(amountInStack, amount) : amount
                        const outStack = amountOutStack ? plus(amountOutStack, amount) : amount

                        if (recipient === address) {
                            amountInMap.set(denom, inStack)
                        } else {
                            amountOutMap.set(denom, outStack)
                        }
                    }
                })
            })

            amountInMap.forEach((amount, denom) =>
                amountIn.push({ amount, denom })
            )

            amountOutMap.forEach((amount, denom) =>
                amountOut.push({ amount, denom })
            )
        } else {
            matchedLog?.forEach(log => {
                const amounts = log.transformed?.amount?.split(",");
                const sender = log.transformed?.sender;
                const recipient = log.transformed?.recipient;

                if (address === sender) {
                    amounts?.forEach(amount => {
                        const coin = splitCoinData(amount.trim());
                        if (coin) {
                            const { amount, denom } = coin
                            amountOut.push({ amount, denom })
                        }
                    })
                }

                if (address === recipient) {
                    amounts?.forEach(amount => {
                        const coin = splitCoinData(amount.trim());
                        if (coin) {
                            const { amount, denom } = coin
                            amountIn.push({ amount, denom })
                        }
                    })
                }
            })
        }
    })
    return { amountIn, amountOut }
}

const plus = (a, b) => new BigNumber(a || 0).plus(b || 0).toString();

const TERRA_ADDRESS_REGEX = /(terra[0-9][a-z0-9]{38})/g;
const splitCoinData = (coin) => {
    try {
        const coinData = Coin.fromString(coin)
        const denom = coinData.denom
        const amount = formatAmount(coinData.amount.toString(), denom)
        return { amount, denom }
    } catch {
        const denom = coin.match(TERRA_ADDRESS_REGEX)?.[0]
        const amount = coin.replace(TERRA_ADDRESS_REGEX, "")
        if (denom && amount) {
            return { amount: formatAmount(amount, denom), denom }
        }
    }
}

const { data: { mainnet: whitelist } } = await assetsClient.get("cw20/tokens.json")

const formatAmount = (amount, denom) => new BigNumber(amount)
    .div(new BigNumber(10).pow(whitelist?.[denom]?.decimals ?? 6))
    .decimalPlaces(6, BigNumber.ROUND_DOWN)
    .toNumber()