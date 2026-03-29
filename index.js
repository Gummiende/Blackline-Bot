require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    Events,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    UserSelectMenuBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField
} = require("discord.js");

const config = require("./config");

// 🔥 RANK ROLLEN
const rankRoles = [
    { id: "1376207536579022959", label: "Praktikant/in │01│" },
    { id: "1376207535408681033", label: "Azubi │02│" },
    { id: "1376207535022800926", label: "Tuner/in │03│" },
    { id: "1376211037346594866", label: "Geselle │04│" },
    { id: "1376207534075150427", label: "Meister/in │05│" },
    { id: "1376207533630423169", label: "Ausbilder/in │06│" },
    { id: "1376217874565431530", label: "Stv. Werkstattleiter/in │07│" },
    { id: "1376217871792734340", label: "Werkstattleiter/in │08│" },
    { id: "1376217876838481961", label: "Personalverwaltung │09│" },
    { id: "1376207530308403340", label: "Manager/in │10│" },
    { id: "1376207529650159687", label: "Stv. Inhaber/in │11│" },
    { id: "1376207522347614320", label: "Inhaber/in │12│" }
];

// Rollen, die immer behalten werden
const keepRoles = [...config.keepRolesAlways, ...config.keepRolesIfPresent];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 🔥 Embed Template
function createEmbedAbmeldung({ title, member, executor, grund, zeitraum }) {
    const embed = new EmbedBuilder()
        .setColor("#660909")
        .setTitle(title || "Abmeldung")
        .setThumbnail("https://cdn.discordapp.com/attachments/1486411922084724889/1486418576805072916/BLP_Flagge.png")
        .addFields(
            { name: "Wer:", value: zeitraum, inline: true },
            { name: "Von:", value: zeitraum, inline: true },
            { name: "Grund:", value: grund || "Kein Grund angegeben" }
        )
        .setFooter({
            text: `Blackline Bot • ausgeführt von ${executor.username}`,
            iconURL: "https://cdn.discordapp.com/attachments/1486411922084724889/1486418577463705831/BLP_Logo_2.png"
        })
        .setTimestamp();

    return embed;
}

// ✅ READY
client.once("ready", () => {
    console.log("✅ Blackline Bot online!");
});

// =====================
// INTERACTIONS
// =====================
client.on(Events.InteractionCreate, async interaction => {
    try {
        // -------------------
        // SLASH COMMANDS
        // -------------------
        if (interaction.isChatInputCommand()) {

            // 🔹 PANEL
            if (interaction.commandName === "panel") {
                if (!interaction.member.roles.cache.has(config.modRoleId)) {
                    return interaction.reply({ content: "❌ Keine Berechtigung!", ephemeral: true });
                }

                const menu = new StringSelectMenuBuilder()
                    .setCustomId("aktion_auswahl")
                    .setPlaceholder("Wähle eine Aktion")
                    .addOptions([
                        { label: "Einstellung", value: "einstellung" },
                        { label: "Kündigung", value: "kuendigung" },
                        { label: "Up/Down Rank", value: "updownrank" },
                        { label: "Sanktion", value: "sanktion" }
                    ]);

                return interaction.reply({
                    content: "📋 **Blackline Verwaltung**",
                    components: [new ActionRowBuilder().addComponents(menu)],
                    ephemeral: true
                });
            }

            // 🔹 ABMELDEN
            if (interaction.commandName === "abmelden") {
                const zeitraum = interaction.options.getString("zeitraum");
                const grund = interaction.options.getString("grund");

                const embed = new EmbedBuilder()
                    .setColor("#660909")
                    .setTitle("Neue Abmeldung")
                    .setThumbnail("https://cdn.discordapp.com/attachments/1486411922084724889/1486418576805072916/BLP_Flagge.png")
                    .addFields(
                        { name: "Benutzer", value: `<@${interaction.user.id}>`, inline: true },
                        { name: "Zeitraum", value: zeitraum, inline: true },
                        { name: "Grund", value: grund }
                    )
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`abmelden_accept_${interaction.user.id}_${zeitraum}_${grund}`)
                        .setLabel("✅ Akzeptieren")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`abmelden_reject_${interaction.user.id}_${zeitraum}_${grund}`)
                        .setLabel("❌ Ablehnen")
                        .setStyle(ButtonStyle.Danger)
                );

                const channel = interaction.guild.channels.cache.get(config.abmeldungModerationChannelId);
                await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });

                return interaction.reply({ content: "✅ Abmeldung eingereicht!", ephemeral: true });
            }

            // 🔹 CLEAR
            if (interaction.commandName === "clear") {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                    return interaction.reply({ content: "❌ Du hast keine Berechtigung!", ephemeral: true });
                }

                const amount = interaction.options.getInteger("anzahl");
                const messages = await interaction.channel.messages.fetch({ limit: amount + 1 });
                await interaction.channel.bulkDelete(messages.filter(m => (Date.now() - m.createdTimestamp) < 14*24*60*60*1000), true);
                return interaction.reply({ content: `✅ ${amount} Nachrichten gelöscht!`, ephemeral: true });
            }
        }

        // -------------------
        // BUTTONS (ABMELDUNG)
        // -------------------
        if (interaction.isButton()) {
            const parts = interaction.customId.split("_");
            const action = parts[1];
            const userId = parts[2];
            const zeitraum = parts[3];
            const grund = parts.slice(4).join("_"); // Falls Leerzeichen oder _ im Grund

            const member = await interaction.guild.members.fetch(userId);

            if (interaction.user.id !== userId) {
                return interaction.reply({ content: "❌ Du darfst diesen Button nicht benutzen!", ephemeral: true });
            }

            // Embed erstellen
            const embed = createEmbedAbmeldung({
                title: action === "accept" ? "Abmeldung akzeptiert" : "Abmeldung abgelehnt",
                member,
                executor: interaction.user,
                grund,
                zeitraum
            });

            // DM an Nutzer
            await member.send({ embeds: [embed] }).catch(() => {});

            if (action === "accept") {
                // In Public Channel posten
                const publicChannel = interaction.guild.channels.cache.get(config.abmeldungPublicChannelId);
                await publicChannel.send({ embeds: [embed] });
                await interaction.update({ content: "✅ Abmeldung akzeptiert und gepostet!", components: [] });
            } else if (action === "reject") {
                await interaction.update({ content: "❌ Abmeldung abgelehnt!", components: [] });
            }
        }

        // -------------------
        // Andere Interactions (Rank, Modal etc.)
        // -------------------
        // Hier kann der restliche Code für SelectMenus und Modals bleiben wie vorher
        // ...

    } catch (err) {
        console.error("Fehler bei Interaction:", err);
    }
});

client.login(process.env.TOKEN);
