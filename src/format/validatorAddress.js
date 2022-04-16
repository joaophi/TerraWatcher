import { truncate } from "terra-utils"
import { useLCDClient } from "./api.js"
import getFinderLink from "./finderLink.js"

const getValidatorAddress = async (address) => {
    const lcd = useLCDClient()
    const { data } = await lcd.staking.validators()

    if (!data) {
        return getFinderLink(truncate(address), "validator", address)
    }

    const [validators] = data
    const moniker = validators.find(
        (validator) => validator.operator_address === address,
    )?.description.moniker

    return getFinderLink(moniker, "validator", address)
}

export default getValidatorAddress