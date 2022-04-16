import getCoin from "./coin.js";

export const getCoins = async (coins) => {
    if (coins.endsWith(","))
        return await getCoin(coins.slice(0, -1))

    return (await Promise.all(coins.split(",").map(getCoin))).join(", ")
}

export default getCoins