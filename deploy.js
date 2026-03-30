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
        ),

    new SlashCommandBuilder()
        .setName("set-rang-anfrage")
        .setDescription("Postet das Rang-Anfrage Panel (nur Führungsebene)")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("CLIENT_ID:", process.env.CLIENT_ID);
        console.log("GUILD_ID:", process.env.GUILD_ID);
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), // Guild Commands
            { body: commands }
        );

        console.log("✅ Commands registriert!");
    } catch (err) {
        console.error(err);
    }
})();
