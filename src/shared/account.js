import { AccAddress } from "@terra-money/terra.js"
import { contracts, lcdClient } from "./api.js"

export const isAccount = async (address) => {
    const lcd = lcdClient

    if (AccAddress.validate(address)) {
        if (contracts?.[address]) {
            return false
        }

        try {
            await lcd.get(`/terra/wasm/v1beta1/contracts/${address}`)
            return false
        } catch (error) {
            return true
        }
    }
}