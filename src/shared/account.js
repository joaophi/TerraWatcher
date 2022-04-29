import { AccAddress } from "@terra-money/terra.js"
import { contracts, lcdClient } from "./api.js"
import { db } from "./db.js"

export const saveAddress = async (address) => {
    if (AccAddress.validate(address)) {
        const { rows } = await db.query(`
            SELECT account
            FROM address
            WHERE address = $1
        `, [address])
        if (rows.length) {
            return rows[0].account
        }

        let account = false
        try {
            if (!contracts?.[address]) {
                await lcdClient.get(`/terra/wasm/v1beta1/contracts/${address}`)
            }
        } catch (error) {
            account = true
        }

        await db.query(`
            INSERT INTO address(address, label, account)
            VALUES ($1, NULL, $2)
            ON CONFLICT (address) DO
            UPDATE SET account = $2
        `, [address, account])

        return account
    }
}