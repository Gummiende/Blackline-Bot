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
const keepRoles = [...config.keepRolesAlways, ...config.keepRolesIfPresent];

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// 🔥 Embed Template
function createEmbed({ title, member, executor, reason, extraFields, fromText, zeitraum }) {
    const embed = new EmbedBuilder()
        .setColor("#660909")
        .setTitle(title || "Aktion")
        .setThumbnail("https://cdn.discordapp.com/attachments/1486411922084724889/1486418576805072916/BLP_Flagge.png");

    const fields = [
        { name: "Wer:", value: `<@${member.id}>`, inline: true },
        { name: "Von:", value: fromText || `<@${executor.id}>`, inline: true }
    ];

    if (zeitraum) {
        fields.push({ name: "Zeitraum:", value: zeitraum, inline: true });
    }

    if (reason) {
        fields.push({ name: "Grund:", value: reason });
    }

    if (extraFields) fields.push(...extraFields);

    fields.push({ name: "📅 Datum:", value: `<t:${Math.floor(Date.now() / 1000)}:f>` });

    embed.addFields(fields);

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

client.on(Events.InteractionCreate, async interaction => {
    try {

        // =====================
        // SLASH COMMANDS
        // =====================
        if (interaction.isChatInputCommand()) {

            // 🔹 PANEL
            if (interaction.commandName === "panel") {
                const hasPermission = config.panelRoles.some(roleId => interaction.member.roles.cache.has(roleId));
                if (!hasPermission) return interaction.reply({ content: "❌ Keine Berechtigung!", flags: 64 });

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
                    flags: 64
                });
            }

            // 🔹 ABMELDEN
            if (interaction.commandName === "abmelden") {
                const hasPermission = config.abmeldenRoles.some(roleId => interaction.member.roles.cache.has(roleId));
                if (!hasPermission) return interaction.reply({ content: "❌ Keine Berechtigung!", flags: 64 });

                const zeitraum = interaction.options.getString("zeitraum");
                const grund = interaction.options.getString("grund");

                const embed = createEmbed({
                    title: "Neue Abmeldung",
                    member: interaction.user,
                    executor: interaction.user,
                    reason: grund,
                    zeitraum
                });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`abmelden_accept_${interaction.user.id}_${zeitraum}`)
                        .setLabel("✅ Akzeptieren")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`abmelden_reject_${interaction.user.id}`)
                        .setLabel("❌ Ablehnen")
                        .setStyle(ButtonStyle.Danger)
                );

                const channel = interaction.guild.channels.cache.get(config.abmeldungModerationChannelId);
                await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });

                return interaction.reply({ content: "✅ Abmeldung eingereicht!", flags: 64 });
            }

            // 🔹 CLEAR
            if (interaction.commandName === "clear") {
                const hasPermission = config.clearRoles.some(roleId => interaction.member.roles.cache.has(roleId));
                if (!hasPermission) return interaction.reply({ content: "❌ Keine Berechtigung!", flags: 64 });

                const amount = interaction.options.getInteger("anzahl");
                const messages = await interaction.channel.messages.fetch({ limit: amount + 1 });
                await interaction.channel.bulkDelete(messages, true);
                return interaction.reply({ content: `✅ ${amount} Nachrichten gelöscht!`, flags: 64 });
            }
        }

        // =====================
        // TODO: Select Menu, User Select, Modals, Abmeldung Accept/Reject Handling
        // Diese Logik kann ähnlich zu vorher implementiert werden, inklusive DM + Public Channel
        // =====================

    } catch (err) {
        console.error(err);
    }
});

client.login(process.env.TOKEN);
