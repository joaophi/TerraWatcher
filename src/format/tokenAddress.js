import { truncate } from "terra-utils";
import { useContracts, useTokenContractQuery } from "./api.js";

export const getTokenAddress = async (address) => {
    const contracts = useContracts()
    const token = contracts?.[address]?.name || (await useTokenContractQuery(address))?.symbol

    return token ?? truncate(address)
}

export default getTokenAddress