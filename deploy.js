require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
    new SlashCommandBuilder()
        .setName("panel")
        .setDescription("Öffnet das Moderator Panel"),

    new SlashCommandBuilder()
        .setName("abmelden")
        .setDescription("Reiche eine Abmeldung ein")
        .addStringOption(option =>
            option.setName("zeitraum")
                .setDescription("Zeitraum")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("grund")
                .setDescription("Grund")
                .setRequired(true)
        )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log("✅ Commands registriert!");
    } catch (err) {
        console.error(err);
    }
})();