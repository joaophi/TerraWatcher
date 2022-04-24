import { collectTx } from "../collector/tx.js"
import { fcdClient } from "../shared/api.js"
import { db } from "../shared/db.js"

const indexOnce = async (account, offset) => {
    const { data } = await fcdClient.get("/v1/txs", {
        params: {
            offset,
            account,
            limit: 100
        }
    })

    offset = data.next
    const promises = data.txs?.map(tx => collectTx(tx.txhash, true)) ?? []

    return { offset, promises }
}

const isIndexing = new Set()
const indexAll = async (account, offset) => {
    if (isIndexing.has(account)) {
        return
    }

    isIndexing.add(account)
    try {
        const promises = []
        do {
            const { offset: newOffset, promises: newPromises } = await indexOnce(account, offset)

            offset = newOffset
            promises.push(...newPromises)
        } while (offset)

        await Promise.all(promises)
    } finally {
        isIndexing.delete(account)
    }
}

export const getTxs = async (address, index) => {
    if (index) {
        const { offset, promises } = await indexOnce(address)
        await Promise.all(promises)
        indexAll(address, offset)
    }
    const { rows: [{ json }] } = await db.query(`
        WITH amount AS (
            SELECT tx_id, in_out, 
                   json_agg(json_build_object('amount', amount::text, 'denom', denom, 'usd', usd)) json
            FROM tx_amount
            WHERE address = $1
            GROUP BY tx_id, address, in_out
        ), addresses AS (
            SELECT A.tx_id, json_agg(AA.address) addresses
            FROM tx T
                INNER JOIN tx_address A ON A.tx_id = T.id
                INNER JOIN tx_address AA ON AA.tx_id = T.id AND AA.address <> A.Address
                INNER JOIN address AAA ON AAA.address = AA.address AND AAA.account = true
            WHERE A.address = $1
            GROUP BY A.tx_id
        )
        SELECT json_agg(X) json
        FROM (
            SELECT T.hash "txHash",
                COALESCE(AD.addresses, '[]'::json) "addresses",
                COALESCE(AI.json     , '[]'::json) "amountIn", 
                COALESCE(AO.json     , '[]'::json) "amountOut", 
                T.timestamp
            FROM tx T
                INNER JOIN tx_address A ON A.tx_id = T.id
                LEFT JOIN addresses AD ON AD.tx_id = T.id
                LEFT JOIN amount AI ON AI.tx_id = T.id AND AI.in_out = 'I'
                LEFT JOIN amount AO ON AO.tx_id = T.id AND AO.in_out = 'O'
            WHERE A.address = $1
            ORDER BY T.timestamp DESC, T.hash
        ) X    
    `, [address])
    return json
}