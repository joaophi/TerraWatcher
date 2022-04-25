import "dotenv/config"
import express from "express"
import path from "path"
import { processTx } from "../collector/tx.js"
import { isAccount } from "../shared/account.js"
import { fcdClient } from "../shared/api.js"
import { db } from "../shared/db.js"

const APP_DIR = process.env["APP_DIR"]

const app = express()

app.use((req, res, next) => {
    console.log(`${req.method}:${req.url} FROM ${req.ip}`)
    next()
})

app.get("/api/v1/txs", async (req, res) => {
    try {
        const { data } = await fcdClient.get("/v1/txs", {
            params: {
                offset: req.query.offset,
                account: req.query.account,
                limit: req.query.limit
            }
        })

        const fixAmount = (amount) => {
            return {
                ...amount,
                amount: String(amount.amount)
            }
        }

        res.json({
            ...data,
            txs: (await Promise.all((await Promise.all(data.txs?.map(processTx)))
                .map(async tx => {
                    const address = tx.addresses.filter(a => a.address == req.query.account)
                    const addresses = tx.addresses.map(a => a.address).filter(a => a != req.query.account)
                    const accounts = await Promise.all(addresses.map(a => isAccount(a)))
                    return {
                        txHash: tx.hash,
                        addresses: addresses.filter((_, index) => accounts[index]),
                        amountIn: address.flatMap(a => a.amountIn.map(fixAmount)),
                        amountOut: address.flatMap(a => a.amountOut.map(fixAmount)),
                        timestamp: tx.timestamp
                    }
                })))
        })
    } catch (error) {
        res.status(error.response?.status ?? 500)
        res.json(error.response?.data ?? { error: error.message })
    }
})

app.get("/api/v1/label", async (req, res) => {
    try {
        if (!req.query.account) {
            throw new Error("account required")
        }
        const { rows: [row] } = await db.query(`
            SELECT label
            FROM address
            WHERE address = $1
        `, [req.query.account])
        res.json(row ?? { label: null })
    } catch (error) {
        res.status(error.response?.status ?? 500)
        res.json(error.response?.data ?? { error: error.message })
    }
})

app.use(express.static(APP_DIR))

app.get("*", (req, res) => {
    res.sendFile(path.resolve(APP_DIR, "index.html"))
})

app.listen(3001)