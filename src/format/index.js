import { createActionRuleSet, createLogMatcherForActions, getTxAllCanonicalMsgs } from "@terra-money/log-finder-ruleset"
import { chainID } from "./api.js"
import getTxDescription from "./description.js"

const getTxActions = async (tx) => {
    const logmatcher = createLogMatcherForActions(createActionRuleSet(chainID))
    const matchedMsg = getTxAllCanonicalMsgs(JSON.stringify(tx), logmatcher)

    const actions = await Promise.all(
        tx.tx.value.msg.map((_msg, index) => Promise.all(
            matchedMsg?.[index]?.flatMap(msg =>
                msg.transformed.canonicalMsg.map(getTxDescription)
            )
        ))
    )
    return actions.map(action => action.join("\n")).join("\n\n")
}

export default getTxActions