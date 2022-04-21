import { Client, Intents } from "discord.js"

export const DISCORD_TOKEN = "OTYwMzA3OTAyNDUzNzg0NjA2.YkoibQ.U6d8K3vu48db9Wtg1OBOdyy8IDU"
export const DISCORD_APP_ID = "960307902453784606"
export const DISCORD_GUILD_ID = "959199128259285093"

export const discord = new Client({ intents: [Intents.FLAGS.GUILDS] })

await discord.login(DISCORD_TOKEN)