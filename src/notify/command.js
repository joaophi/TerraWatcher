import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import format from "./format.js";
import getFinderLink, { LABELS } from "./format/finderLink.js";

export const commands = async (db, discord) => {
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
                option.setName("minimum")
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
            .setName("min")
            .setDescription("Change minimum amount of all watches in this channel")
            .addNumberOption(option =>
                option.setName("minimum")
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
            )
    ].map(command => command.toJSON());

    const rest = new REST({ version: '9' }).setToken(process.env["DISCORD_TOKEN"]);

    rest.put(Routes.applicationGuildCommands("960307902453784606", "959199128259285093"), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error)

    discord.on("interactionCreate", async (interaction) => {
        if (!interaction.isCommand())
            return

        await interaction.deferReply()
        await myCommands[interaction.commandName](db, interaction)
    })
}

const myCommands = {
    watch: async (db, interaction) => {
        const address = interaction.options.getString("address")
        const minimum = interaction.options.getNumber("minimum")
        await db.run(
            `INSERT OR REPLACE INTO watch (address, channel, minimum, type)
             VALUES ($address, $channel, $minimum, 'swap')`,
            {
                $address: address,
                $channel: interaction.channelId,
                $minimum: minimum
            }
        )
        await interaction.editReply(`ADDED ${getFinderLink(address, "address", address)} - ${format.amount(minimum, 0)} UST`)
    },
    unwatch: async (db, interaction) => {
        const address = interaction.options.getString("address")
        await db.run(
            `DELETE FROM watch
             WHERE address = $address
               AND channel = $channel`,
            {
                $address: address,
                $channel: interaction.channelId,
            }
        )
        await interaction.editReply(`REMOVED ${address}`)
    },
    watchlist: async (db, interaction) => {
        const watches = await db.all(
            `SELECT address, minimum
             FROM watch
             WHERE channel = $channel`,
            {
                $channel: interaction.channelId,
            }
        )
        const reply = watches
            .map(({ address, minimum }) => `${getFinderLink(address, "address", address)} - ${format.amount(minimum, 0)} UST`)
            .join("\n")
        await interaction.editReply(reply || "None")
    },
    min: async (db, interaction) => {
        const minimum = interaction.options.getNumber("minimum")
        await db.all(
            `UPDATE watch
             SET minimum = $minimum
             WHERE channel = $channel`,
            {
                $minimum: minimum,
                $channel: interaction.channelId,
            }
        )
        await interaction.editReply(`CHANGED ALL WATCHES TO ${format.amount(minimum, 0)} UST MINIMUM`)
    },
    label: async (db, interaction) => {
        const address = interaction.options.getString("address")
        const label = interaction.options.getString("label")

        await db.all(
            `INSERT OR REPLACE INTO label (address, label)
             VALUES ($address, $label)`,
            {
                $address: address,
                $label: label
            }
        )
        LABELS.set(address, label)
        await interaction.editReply(`LABELLED ${address} TO ${label}`)
    },
    unlabel: async (db, interaction) => {
        const address = interaction.options.getString("address")

        await db.all(
            `DELETE FROM label
             WHERE address = $address`,
            {
                $address: address,
            }
        )
        LABELS.delete(address)
        await interaction.editReply(`REMOVED LABEL FROM ${address}`)
    }
}
