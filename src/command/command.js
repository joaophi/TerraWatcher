import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import getFinderLink, { LABELS } from "../format/finderLink.js";
import { db } from "../shared/db.js";
import { discord, DISCORD_APP_ID, DISCORD_GUILD_ID, DISCORD_TOKEN } from "../shared/discord.js";
import format from "../shared/format.js";

export const commands = async () => {
    const commands = [
        new SlashCommandBuilder()
            .setName("watch")
            .setDescription("Add address to channel watchlist")
            .addStringOption(option =>
                option.setName("address")
                    .setDescription("The address to watch")
                    .setRequired(true)
            )
            .addNumberOption(option =>
                option.setName("amount")
                    .setDescription("The minimum amount to notify")
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName("unwatch")
            .setDescription("Remove address from channel watchlist")
            .addStringOption(option =>
                option.setName("address")
                    .setDescription("The address to unwatch")
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName("watchlist")
            .setDescription("Show channel watchlist"),
        new SlashCommandBuilder()
            .setName("all")
            .setDescription("Change minimum amount of all watches in this channel")
            .addNumberOption(option =>
                option.setName("amount")
                    .setDescription("The minimum amount to notify")
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName("label")
            .setDescription("Label address")
            .addStringOption(option =>
                option.setName("address")
                    .setDescription("The address to be labeled")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName("label")
                    .setDescription("The label")
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName("unlabel")
            .setDescription("Unlabel address")
            .addStringOption(option =>
                option.setName("address")
                    .setDescription("The address to be unlabeled")
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName("labels")
            .setDescription("Show Label list"),
    ].map(command => command.toJSON());

    await new REST({ version: "9" })
        .setToken(DISCORD_TOKEN)
        .put(Routes.applicationGuildCommands(DISCORD_APP_ID, DISCORD_GUILD_ID), { body: commands })

    console.log("Successfully registered application commands.")

    discord.on("interactionCreate", async (interaction) => {
        if (!interaction.isCommand())
            return

        console.log(`command '${interaction.commandName}' received`)
        await interaction.deferReply()
        await handlers[interaction.commandName](interaction)
    })
}

const handlers = {
    watch: async (interaction) => {
        const address = interaction.options.getString("address")
        const amount = interaction.options.getNumber("amount")
        await db.query(
            `INSERT INTO watch (address, channel, amount)
             VALUES ($1, $2, $3)
             ON CONFLICT (address, channel) DO
             UPDATE SET amount = $3`,
            [address, interaction.channelId, amount]
        )
        await interaction.editReply(`ADDED ${getFinderLink(address, "address", address)} - ${format.amount(amount, 0)} UST`)
    },
    unwatch: async (interaction) => {
        const address = interaction.options.getString("address")
        await db.query(
            `DELETE FROM watch
             WHERE address = $1
               AND channel = $2`,
            [address, interaction.channelId]
        )
        await interaction.editReply(`REMOVED ${address}`)
    },
    watchlist: async (interaction) => {
        const { rows: watches } = await db.query(
            `SELECT address, amount
             FROM watch
             WHERE channel = $1`,
            [interaction.channelId]
        )
        const reply = watches
            .map(({ address, amount }) => `${getFinderLink(address, "address", address)} - ${format.amount(amount, 0)} UST`)
            .join("\n")
        await interaction.editReply(reply || "None")
    },
    all: async (interaction) => {
        const amount = interaction.options.getNumber("amount")
        await db.query(
            `UPDATE watch
             SET amount = $1
             WHERE channel = $2`,
            [amount, interaction.channelId]
        )
        await interaction.editReply(`CHANGED ALL WATCHES TO ${format.amount(amount, 0)} UST MINIMUM`)
    },
    label: async (interaction) => {
        const address = interaction.options.getString("address")
        const label = interaction.options.getString("label")

        await db.query(
            `INSERT INTO label (address, label)
             VALUES ($1, $2)
             ON CONFLICT (address) DO
             UPDATE SET label = $2`,
            [address, label]
        )
        await interaction.editReply(`LABELLED ${getFinderLink(address, "address", address)} AS ${label}`)
        LABELS.set(address, label)
    },
    unlabel: async (interaction) => {
        const address = interaction.options.getString("address")

        await db.query(
            `DELETE FROM label
             WHERE address = $1`,
            [address]
        )
        LABELS.delete(address)
        await interaction.editReply(`REMOVED LABEL FROM ${getFinderLink(address, "address", address)}`)
    },
    labels: async (interaction) => {
        const { rows: labels } = await db.query(
            `SELECT address, label
             FROM label`
        )
        const reply = labels
            .map(({ address, label }) => `${getFinderLink(address, "address", address)} - ${label}`)
            .join("\n")
        await interaction.editReply(reply || "None")
    }
}

await commands()