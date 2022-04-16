import { useContracts } from "./api.js"
import getFinderLink from "./finderLink.js"
import getTokenAddress from "./tokenAddress.js"

const getTerraAddress = async (address) => {
    const contracts = useContracts()

    const getContractName = (contractAddress) => {
        const contract = contracts?.[contractAddress]
        if (!contract) {
            return undefined
        }
        const { protocol, name: contractName } = contract

        return [protocol, contractName].join(' ')
    }

    return getFinderLink(getContractName(address) ?? await getTokenAddress(address), "address", address)
}

export default getTerraAddress