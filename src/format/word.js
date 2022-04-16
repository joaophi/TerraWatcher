import { isDenomTerraNative, readDenom } from "terra-utils"

export const getWord = (word) => {
    const content = isDenomTerraNative(word) ? readDenom(word) : word
    return content
}

export default getWord