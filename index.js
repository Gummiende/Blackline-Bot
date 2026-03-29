require("dotenv").config(); // Lädt .env, falls du lokal testest
console.log("TOKEN:", process.env.TOKEN);
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
    ButtonStyle
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
const keepRoles = [
    "1485722559034032168",
    "1376207540064489644",
    "1376953555164074104",
    "1376207537849766009",
    "1376207540479725619",
    "1376953107606405190",
    "1376953244097577081",
    "1376953292688588870"
];

// 🚀 Client erstellen
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// 🔥 Embed Template
function createEmbed({ title, member, executor, reason, extraFields, fromText }) {
    const embed = new EmbedBuilder()
        .setColor("#660909")
        .setTitle(title || "Aktion")
        .setThumbnail("https://cdn.discordapp.com/attachments/1486411922084724889/1486418576805072916/BLP_Flagge.png")
        .addFields(
            { name: "Wer:", value: `<@${member.id}>`, inline: true },
            { name: "Von:", value: fromText || `<@${executor.id}>`, inline: true },
            { name: "Grund:", value: reason || "Kein Grund angegeben" }
        );

    if (extraFields) embed.addFields(extraFields);

    embed.addFields({
        name: "📅 Datum:",
        value: `<t:${Math.floor(Date.now() / 1000)}:f>`
    });

    embed.setFooter({
        text: `Blackline Bot • ausgeführt von ${executor.username}`,
        iconURL: "https://cdn.discordapp.com/attachments/1486411922084724889/1486418577463705831/BLP_Logo_2.png"
    }).setTimestamp();

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

        // =====================
        // SLASH COMMANDS
        // =====================
        if (interaction.isChatInputCommand()) {

            // 🔹 CLEAR
            if (interaction.commandName === "clear") {
                if (!interaction.member.permissions.has("ManageMessages")) {
                    return interaction.reply({ content: "❌ Du hast keine Berechtigung!", flags: 64 });
                }

                const amount = interaction.options.getInteger("anzahl");
                const messages = await interaction.channel.messages.fetch({ limit: amount + 1 });
                await interaction.channel.bulkDelete(messages, true);
                return interaction.reply({ content: `✅ ${amount} Nachrichten gelöscht!`, flags: 64 });
            }

            // 🔹 ABMELDEN
            if (interaction.commandName === "abmelden") {
                const zeitraum = interaction.options.getString("zeitraum");
                const grund = interaction.options.getString("grund");

                const embed = new EmbedBuilder()
                    .setColor("#660909")
                    .setTitle("Deine Abmeldung")
                    .setThumbnail("https://cdn.discordapp.com/attachments/1486411922084724889/1486418576805072916/BLP_Flagge.png")
                    .addFields(
                        { name: "Wer:", value: `<@${interaction.user.id}>`, inline: true },
                        { name: "Zeitraum:", value: zeitraum, inline: true },
                        { name: "Grund:", value: grund, inline: true }
                    )
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`abmelden_accept_${interaction.user.id}_${zeitraum}`)
                        .setLabel("✅ Akzeptieren")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`abmelden_reject_${interaction.user.id}_${zeitraum}`)
                        .setLabel("❌ Ablehnen")
                        .setStyle(ButtonStyle.Danger)
                );

                const channel = interaction.guild.channels.cache.get(config.abmeldungModerationChannelId);
                await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });

                return interaction.reply({ content: "✅ Abmeldung eingereicht!", flags: 64 });
            }
        }

        // =====================
        // BUTTONS
        // =====================
        if (interaction.isButton()) {
            const [action, type, userId, zeitraum] = interaction.customId.split("_");
            const member = await interaction.guild.members.fetch(userId);

            if (type === "accept") {
                const embed = createEmbed({
                    title: "Abmeldung angenommen ✅",
                    member,
                    executor: interaction.user,
                    reason: "Abmeldung akzeptiert",
                    extraFields: [
                        { name: "Zeitraum:", value: zeitraum, inline: true }
                    ],
                    fromText: interaction.user.username
                });

                try {
                    await member.send({ embeds: [embed] });
                } catch {}
                await interaction.reply({ content: "✅ Abmeldung angenommen!", ephemeral: true });
                return interaction.message.edit({ components: [] });
            }

            if (type === "reject") {
                // Modal für Grund
                const modal = new ModalBuilder()
                    .setCustomId(`reject_modal_${userId}_${zeitraum}`)
                    .setTitle("Abmeldung ablehnen");

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("reason")
                            .setLabel("Grund der Ablehnung")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    )
                );

                return interaction.showModal(modal);
            }
        }

        // =====================
        // MODAL SUBMIT
        // =====================
        if (interaction.isModalSubmit()) {
            const split = interaction.customId.split("_");
            if (split[0] === "reject" && split[1] === "modal") {
                const userId = split[2];
                const zeitraum = split[3];
                const member = await interaction.guild.members.fetch(userId);
                const reason = interaction.fields.getTextInputValue("reason");

                const embed = createEmbed({
                    title: "Abmeldung abgelehnt ❌",
                    member,
                    executor: interaction.user,
                    reason,
                    extraFields: [
                        { name: "Zeitraum:", value: zeitraum, inline: true }
                    ],
                    fromText: interaction.user.username
                });

                try {
                    await member.send({ embeds: [embed] });
                } catch {}
                await interaction.reply({ content: "❌ Abmeldung abgelehnt!", ephemeral: true });
                return interaction.message.edit({ components: [] });
            }
        }

    } catch (err) {
        console.error(err);
    }
});

// 🔑 LOGIN
client.login(process.env.TOKEN);
