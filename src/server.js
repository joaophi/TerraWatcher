import express from "express"
import path from "path"
import { isOneSided, parseTx } from "./amount.js"

export const server = (client) => {
    const server = express()

    const proxyPass = async (req, res) => {
        try {
            const response = await client.get(req.url.slice(4))
            res.status(response.status)
            res.json(response.data)
        } catch (error) {
            res.status(error.response?.status ?? 500)
            res.json(error.response?.data ?? { error: error.message })
        }
    }

    server.get("/api/v1/txs", async (req, res) => {
        try {
            const response = await client.get(req.url.slice(4))
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

    server.get("/api/*", proxyPass)

    const APP_DIR = process.env["APP_DIR"]

    server.use(express.static(APP_DIR))

    server.get("*", (req, res) => {
        res.sendFile(path.resolve(APP_DIR, "index.html"))
    })

    server.listen(3001)
}
