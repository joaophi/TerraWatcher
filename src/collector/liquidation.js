import { createReturningLogFinder } from "@terra-money/log-finder"
import { queryContract } from "../shared/api.js"

export const overseerAddress = "terra1tmnqgvg567ypvsvk6rwsga3srp7e3lg6u0elp8"
export const liquidationAddress = "terra1e25zllgag7j9xsun3me4stnye2pcg66234je3u"

const rules = {
    liquidateCollateral: createReturningLogFinder(
        {
            type: "from_contract",
            attributes: [
                ["contract_address"],
                ["action", "liquidate_collateral"],
                ["liquidator"],
                ["borrower"],
                ["amount"],
            ],
        },
        (fragment, match) => ({
            custody: match[0].value,
            liquidator: match[2].value,
            borrower: match[3].value,
            amount: match[4].value,
        })
    ),
    executeBid: createReturningLogFinder(
        {
            type: "from_contract",
            attributes: [
                ["contract_address", liquidationAddress],
                ["action", "execute_bid"],
                ["stable_denom"],
                ["repay_amount"],
                ["bid_fee"],
                ["liquidator_fee"],
                ["collateral_token"],
                ["collateral_amount"],
            ],
        },
        (fragment, match) => ({
            stable_denom: match[2].value,
            repay_amount: match[3].value,
            bid_fee: match[4].value,
            liquidator_fee: match[5].value,
            collateral_token: match[6].value,
            collateral_amount: match[7].value,
        })
    ),
    claimLiquidation: createReturningLogFinder(
        {
            type: "from_contract",
            attributes: [
                ["contract_address", liquidationAddress],
                ["action", "claim_liquidations"],
                ["collateral_token"],
                ["collateral_amount"],
            ],
        },
        (fragment, match) => ({
            collateral_token: match[2].value,
            collateral_amount: match[3].value,
        })
    ),
}

const { data: { query_result: { elems: collaterals } } } = await queryContract(overseerAddress, { whitelist: {} })

export const getPools = async () => {
    return (await Promise.all(
        collaterals.map(async ({ collateral_token }) => {
            const { data: { query_result: { bid_pools } } } = await queryContract(liquidationAddress, {
                bid_pools_by_collateral: { collateral_token, limit: 31 }
            })
            return bid_pools.map(bid_pool => ({ ...bid_pool, collateral_token }))
        })
    )).flat()
}


export const getLiquidations = (tx) => {
    const entries = Object.entries(rules)
        .map(([name, rule]) => {
            const finds = tx.logs.flatMap(log =>
                log.events.flatMap(event =>
                    rule(event).map(m => m.transformed)
                )
            )
            return [name, finds]
        })
    return Object.fromEntries(entries)
}