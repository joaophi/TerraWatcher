import axios from "axios"
import axiosRateLimit from "axios-rate-limit"
import { Client, Intents } from "discord.js"
import "dotenv/config"
import { LCDClient } from "@terra-money/terra.js"
import { open } from "sqlite"
import sqlite3 from "sqlite3"
import { commands } from "./command.js"
import { loadLabels } from "./format/finderLink.js"
import { notify } from "./notification.js"
import { process as processtx } from "./process.js"
import { watch } from "./watch.js"
import { sleep } from "./utils.js"
import { collect } from "./collector/collector.js"

// const db = await open({
//     filename: "app.db",
//     driver: sqlite3.Database
// })

// const api = axiosRateLimit(
//     axios.create({ baseURL: "https://fcd.terra.dev", }),
//     { maxRequests: 1, perMilliseconds: 1500 }
// )

// const discord = new Client({ intents: [Intents.FLAGS.GUILDS] })
// discord.login(process.env["DISCORD_TOKEN"])

// watch(db, api)
// processtx(db)
// notify(db, discord)
// commands(db, discord)
// loadLabels(db)

await collect()