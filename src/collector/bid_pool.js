import { queryContract } from "../shared/api.js"
import { db } from "../shared/db.js"
import { liquidationAddress } from "./liquidation.js"

const overseerAddress = "terra1tmnqgvg567ypvsvk6rwsga3srp7e3lg6u0elp8"

const { data: { query_result: { elems: collaterals } } } = await queryContract(overseerAddress, { whitelist: {} })

const getPools = async () => {
    return (await Promise.all(
        collaterals.map(async ({ collateral_token }) => {
            const { data: { query_result: { bid_pools } } } = await queryContract(liquidationAddress, {
                bid_pools_by_collateral: { collateral_token, limit: 31 }
            })
            return bid_pools.map(bid_pool => ({ ...bid_pool, collateral_token }))
        })
    )).flat()
}

const savePool = async ({ collateral_token, current_epoch, current_scale, premium_rate, sum_snapshot, product_snapshot, total_bid_amount }) => {
    db.query(`
        INSERT INTO bid_pool(collateral_token, current_epoch, current_scale, premium_rate, sum_snapshot, product_snapshot, total_bid_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [collateral_token, current_epoch, current_scale, premium_rate, sum_snapshot, product_snapshot, total_bid_amount])
}

let isRunning = false
export const updatePoolInfo = async () => {
    if (isRunning) {
        return
    }

    isRunning = true
    try {
        const promises = (await getPools()).map(savePool)
        await Promise.all(promises)
    } catch (error) {
        console.error("update pool error: %s", error.message)
    } finally {
        isRunning = false
    }
}