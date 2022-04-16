import { AccAddress, ValAddress } from "@terra-money/terra.js";
import getCoins from "./coins.js";
import getTerraAddress from "./terraAddress.js";
import getValidatorAddress from "./validatorAddress.js";
import getWord from "./word.js";

export const REGEXP = {
    COIN: /^\d+((terra1[a-z0-9]{38})|(u[a-z]{1,4}))/g,
    IBC: /(ibc)/g,
}

export const isCoins = (word) =>
    word.match(REGEXP.COIN) || word.match(REGEXP.IBC)

export const getTxDescription = async (sentence) => {
    const renderWord = async (word) => {
        if (ValAddress.validate(word)) {
            return await getValidatorAddress(word)
        } else if (AccAddress.validate(word)) {
            return await getTerraAddress(word)
        } else if (isCoins(word)) {
            return await getCoins(word);
        } else {
            return getWord(word)
        }
    };

    return (await Promise.all(sentence.split(" ").map(renderWord))).join(" ")
};

export default getTxDescription