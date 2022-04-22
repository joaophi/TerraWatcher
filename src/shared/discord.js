import "dotenv/config"
import { Client, Intents } from "discord.js"

export const DISCORD_TOKEN = process.env["DISCORD_TOKEN"]
export const DISCORD_APP_ID = process.env["DISCORD_APP_ID"]
export const DISCORD_GUILD_ID = process.env["DISCORD_GUILD_ID"]

export const discord = new Client({ intents: [Intents.FLAGS.GUILDS] })

await discord.login(DISCORD_TOKEN)