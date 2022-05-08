import { AccAddress } from "@terra-money/terra.js"
import { contracts, lcdClient, whitelist } from "./api.js"
import { db } from "./db.js"

export const saveAddress = async (address, client = db) => {
    if (AccAddress.validate(address)) {
        const { rows } = await client.query(`
            SELECT 1
            FROM address
            WHERE address = $1
        `, [address])
        if (rows.length) {
            return
        }

        let account = false
        let label = null
        let decimals = null
        if (address in whitelist) {
            label = whitelist[address].symbol
            decimals = whitelist[address].decimals ?? 6
        } else if (address in contracts) {
            label = contracts[address].name
        } else {
            try {
                const { data } = await lcdClient.get(`/terra/wasm/v1beta1/contracts/${address}`)
                label = data?.contract_info?.init_msg?.symbol
                decimals = data?.contract_info?.init_msg?.decimals
            } catch (error) {
                account = true
            }
        }

        await client.query(`
            INSERT INTO address(address, label, account, decimals)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (address) DO
            UPDATE SET label = $2, account = $3, decimals = $4
        `, [address, label, account, decimals])
    }
}