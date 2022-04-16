import { AccAddress } from "@terra-money/terra.js"
import { isDenomTerraNative, readAmount, readDenom } from "terra-utils"
import { useDenomTrace, useLCDClient, useTokenContractQuery } from "./api.js"
import getFinderLink from "./finderLink.js"
import getTokenAddress from "./tokenAddress.js"

export const REGEXP_COIN = /^\d+((terra1[a-z0-9]{38})|(u[a-z]{1,4}))/g

export const DEFAULT_DECIMALS = 6

export const splitTokenText = (string = "") => {
    const [, amount] = string.split(/(\d+)(\w+)/)
    const [, token] = string.split(REGEXP_COIN)
    return { amount, token }
}

export const formatDenom = (denom) => {
    if (denom.startsWith("u")) {
        try {
            return readDenom(denom)
        } catch {
            return denom.replace("u", "").toUpperCase()
        }
    } else {
        return denom
    }
}

export const getCoin = async (coin) => {
    const { amount, token } = splitTokenText(coin)
    const tokenInfo = await useTokenContractQuery(token)
    const lcd = useLCDClient()
    const data = await useDenomTrace(coin.replace(amount, ""), lcd)

    let unit
    if (AccAddress.validate(token)) {
        unit = getFinderLink(await getTokenAddress(token), "address", token)
    } else if (isDenomTerraNative(token)) {
        unit = readDenom(token)
    } else if (data) {
        unit = formatDenom(data.base_denom)
    } else {
        unit = token;
    }

    const decimals = tokenInfo?.decimals || DEFAULT_DECIMALS;

    return readAmount(amount, { decimals, comma: true }) + " " + unit
}

export default getCoin