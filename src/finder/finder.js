import "dotenv/config"
import express from "express"
import path from "path"
import { fcdClient } from "../shared/api.js"
import { isOneSided, parseTx } from "./amount.js"

const APP_DIR = process.env["APP_DIR"]

const app = express()

app.use((req, res, next) => {
    console.log(`${req.method}:${req.url} ${res.statusCode} FROM ${req.ip}`)
    next()
})

const proxyPass = async (req, res) => {
    try {
        const response = await fcdClient.get(req.url.slice(4))
        res.status(response.status)
        res.json(response.data)
    } catch (error) {
        res.status(error.response?.status ?? 500)
        res.json(error.response?.data ?? { error: error.message })
    }
}

app.get("/api/v1/txs", async (req, res) => {
    try {
        const response = await fcdClient.get(req.url.slice(4))
        response.data.txs = response.data.txs
            .map(tx => parseTx(tx, req.query.account))
            .filter(isOneSided)
        res.status(response.status)
        res.json(response.data)
    } catch (error) {
        res.status(error.response?.status ?? 500)
        res.json(error.response?.data ?? { error: error.message })
    }
})

app.get("/api/*", proxyPass)

app.use(express.static(APP_DIR))

app.get("*", (req, res) => {
    res.sendFile(path.resolve(APP_DIR, "index.html"))
})

app.listen(3001)