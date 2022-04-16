import { createAmountRuleSet, createLogMatcherForAmounts, getTxAmounts } from "@terra-money/log-finder-ruleset";
import { AccAddress, Coin } from "@terra-money/terra.js";
import axios from "axios";
import BN from "bignumber.js";
import format from "./format.js";

const assetsConfig = { baseURL: "https://assets.terra.money" }
const { data: { mainnet: whitelist } } = await axios.get("cw20/tokens.json", assetsConfig)
const { data: { mainnet: contracts } } = await axios.get("cw20/contracts.json", assetsConfig)

const TERRA_ADDRESS_REGEX = /(terra[0-9][a-z0-9]{38})/g;
const splitCoinData = (coin) => {
    try {
        const coinData = Coin.fromString(coin)
        const amount = coinData.amount.toString()
        const denom = coinData.denom
        return { amount, denom }
    } catch {
        const denom = coin.match(TERRA_ADDRESS_REGEX)?.[0]
        const amount = coin.replace(TERRA_ADDRESS_REGEX, "")
        if (denom && amount) {
            return { amount, denom }
        }
    }
}

const plus = (a, b) => new BN(a || 0).plus(b || 0).toString();

const isTerraAddress = (keyword) => { return keyword && keyword.length === 44 && keyword.indexOf("terra") > -1 }

const parseAmount = ({ amount, denom }) => {
    const decimals = whitelist?.[denom]?.decimals ?? 6
    const list = whitelist?.[denom]
    const contract = contracts?.[denom]
    if (isTerraAddress(denom) && (list || contract)) {
        return {
            amount: format.amount(amount, decimals),
            denom: list?.symbol ? list?.symbol : contract?.name
        }
    } else if (format.denom(denom).length >= 40) {
        return {
            amount: format.amount(amount, decimals),
            denom: "Token"
        }
    } else {
        return {
            amount: format.amount(amount, decimals),
            denom: format.denom(denom)
        }
    }
}

const amountRuleset = createAmountRuleSet()
const amountLogMatcher = createLogMatcherForAmounts(amountRuleset)

const parseAmounts = (tx, address) => {
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

                amountInMap.forEach((amount, denom) =>
                    amountIn.push({ amount, denom })
                );

                amountOutMap.forEach((amount, denom) =>
                    amountOut.push({ amount, denom })
                );
            })
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
    return {
        amountIn: amountIn.map(parseAmount),
        amountOut: amountOut.map(parseAmount)
    }
}

const parseAddresses = (tx, address) => {
    const addresses = new Set()
    tx.tx.value.msg
        .forEach(msg =>
            Object.keys(msg.value).map(key => {
                if (AccAddress.validate(msg.value[key])) {
                    addresses.add(msg.value[key])
                }
            })
        )
    return Array.from(addresses).filter(a => a && a != address)
}

export const parseTx = (tx, address) => {
    const { amountIn, amountOut } = parseAmounts(tx, address)
    const addresses = parseAddresses(tx, address)

    return {
        txHash: tx.txhash,
        addresses,
        amountIn,
        amountOut,
        timestamp: tx.timestamp,
        rawTx: tx
    }
}

export const isOneSided = ({ amountIn, amountOut }) => {
    return (amountIn.length > 0 && amountOut.length == 0)
        || (amountOut.length > 0 && amountIn.length == 0)
}