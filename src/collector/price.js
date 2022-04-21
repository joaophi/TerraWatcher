import { fcdClient, swapClient } from "../shared/api.js"

const ONE_HOUR = 60 * 60 * 1000
const CACHE = new Map()

const { data: RATES } = await fcdClient.get("/v1/market/swaprate/uusd")
const { data: PAIRS } = await swapClient.get("/dashboard/pairs")

const getSwapRate = (denom) => {
    if (denom == "uusd") {
        return 1
    }

    let swaprate = RATES.find(rate => rate.denom == denom)?.swaprate
    if (!swaprate) {
        return 0
    }

    return 1 / Number(swaprate)
}

export const getUsdPrice = async (denom) => {
    denom = denom.toLowerCase()
    if (CACHE.has(denom) && ((new Date()) - CACHE.get(denom).timestamp) < ONE_HOUR) {
        return CACHE.get(denom).price
    }

    let price = getSwapRate(denom)
    if (!price) {
        const denomPairs = filterPairs(PAIRS, [denom])
        const usdPairs = filterPairs(denomPairs, ["uusd"])
        if (usdPairs.length) {
            for (const pair of usdPairs) {
                price = await getPrice(denom, pair.pairAddress)
                if (price) break
            }
        } else {
            const possibilities = RATES.map(rate => rate.denom)
            const possiblePairs = filterPairs(denomPairs, possibilities)
            for (const pair of possiblePairs) {
                price = (await getPrice(denom, pair.pairAddress)) * getSwapRate(pair.token0 == denom ? pair.token1 : pair.token0)
                if (price) break
            }
        }
    }

    CACHE.set(denom, { price, timestamp: new Date() })
    return price
}

const filterPairs = (pairs, denom) => pairs.filter(({ token0, token1 }) => denom.includes(token0) || denom.includes(token1))

const getPrice = async (denom, address) => {
    const { data: pair } = await swapClient.get(`/dashboard/pairs/${address}`)
    const token = [pair.token0, pair.token1]
        .find(token => token.tokenAddress == denom)
    return token ? Number(token.price) : 0
}