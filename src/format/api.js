import { AccAddress, LCDClient } from "@terra-money/terra.js";
import { contracts, LCD_URL, whitelist } from "../shared/api";

export const chainID = "mainnet"

const lcd = new LCDClient({ URL: LCD_URL, chainID })

export const useLCDClient = () => lcd

export const useWhitelist = () => whitelist

export const useContracts = () => contracts

export const useTokenContractQuery = async (address) => {
    const lcd = useLCDClient()
    const whitelist = useWhitelist()

    if (AccAddress.validate(address)) {
        if (whitelist?.[address]) {
            return whitelist[address]
        }

        try {
            const tokenInfo = await lcd.wasm.contractQuery(address, {
                token_info: {},
            })
            return tokenInfo
        } catch (error) {

        }
    }
}

export const isAccount = async (address) => {
    const lcd = useLCDClient()
    const contracts = useContracts()

    if (AccAddress.validate(address)) {
        if (contracts?.[address]) {
            return false
        }

        try {
            await lcd.wasm.contractInfo(address)
            return false
        } catch (error) {
            return true
        }
    }
}

export const useDenomTrace = async (denom = "", lcd) => {
    if (denom.startsWith('ibc')) {
        const hash = denom.replace('ibc/', '')
        const denom_trace = await lcd.ibcTransfer.denomTrace(hash)
        return denom_trace
    }
}