import "dotenv/config"
import express from "express"
import path from "path"
import { isAccount } from "../shared/account.js"
import { getTxs } from "./indexer.js"

const APP_DIR = process.env["APP_DIR"]

const app = express()

app.use((req, res, next) => {
    console.log(`${req.method}:${req.url} FROM ${req.ip}`)
    next()
})

app.get("/api/v1/txs", async (req, res) => {
    try {
        if (!req.query.account) {
            throw new Error("account required")
        }
        const allTxs = (await getTxs(req.query.account, !req.query.offset))
        const after = allTxs.findIndex(tx => tx.txHash == req.query.offset) + 1

        const limit = Number(req.query.limit) ?? 100
        const txs = allTxs.slice(after, after + limit)
        const next = txs.at(-1).txHash

        res.json({ limit, txs, next })
    } catch (error) {
        res.status(error.response?.status ?? 500)
        res.json(error.response?.data ?? { error: error.message })
    }
})

app.get("/api/v1/label", async (req, res) => {
    try {
        if (!req.query.account || !(await isAccount(req.query.account))) {
            throw new Error("account required")
        }
        const label = "teste"
        res.json({ label })
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