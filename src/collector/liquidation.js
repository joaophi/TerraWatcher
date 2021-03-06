import { createReturningLogFinder } from "@terra-money/log-finder"

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
            ],
        },
        (fragment, match) => ({
            custody: match[0].value,
            liquidator: match[2].value,
            borrower: match[3].value
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