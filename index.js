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
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
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
    { id: "1376207522347614320", label: "Inhaber/in │12│" },
];

const keepRoles = [...config.keepRolesAlways, ...config.keepRolesIfPresent];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// 🔥 Embed Builder
function createEmbed({ title, member, executor, reason, extraFields, fromText, zeitraum }) {
    const embed = new EmbedBuilder()
        .setColor(0x660909)
        .setTitle(title || "Aktion")
        .setThumbnail("https://cdn.discordapp.com/attachments/1486411922084724889/1486418576805072916/BLP_Flagge.png");

    const fields = [
        { name: "Wer:", value: `<@${member.id}>`, inline: true },
        { name: "Von:", value: fromText || `<@${executor.id}>`, inline: true },
    ];

    if (zeitraum) fields.push({ name: "Zeitraum:", value: zeitraum, inline: true });
    if (reason) fields.push({ name: "Grund:", value: reason });
    if (extraFields) fields.push(...extraFields);

    fields.push({ name: "📅 Datum:", value: `<t:${Math.floor(Date.now() / 1000)}:f>` });

    embed.addFields(fields);

    embed.setFooter({
        text: `Blackline Bot • ausgeführt von ${executor.username}`,
        iconURL: "https://cdn.discordapp.com/attachments/1486411922084724889/1486418577463705831/BLP_Logo_2.png",
    });

    return embed;
}

// READY
client.once(Events.ClientReady, () => {
    console.log("✅ Bot online!");
});

// JOIN ROLLEN
client.on("guildMemberAdd", async (member) => {
    for (const roleId of config.joinRoles) {
        await member.roles.add(roleId).catch(() => {});
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    try {

        // =====================
        // SLASH COMMANDS
        // =====================
        if (interaction.isChatInputCommand()) {

            if (interaction.commandName === "panel") {
                const hasPermission = config.panelRoles.some(roleId =>
                    interaction.member.roles.cache.has(roleId)
                );

                if (!hasPermission) {
                    return interaction.reply({ content: "❌ Keine Berechtigung!", flags: 64 });
                }

                const menu = new StringSelectMenuBuilder()
                    .setCustomId("aktion_auswahl")
                    .setPlaceholder("Wähle eine Aktion")
                    .addOptions([
                        { label: "Einstellung", value: "einstellung" },
                        { label: "Kündigung", value: "kuendigung" },
                        { label: "Up/Down Rank", value: "updownrank" },
                        { label: "Sanktion", value: "sanktion" },
                    ]);

                return interaction.reply({
                    content: "📋 **Blackline Verwaltung**",
                    components: [new ActionRowBuilder().addComponents(menu)],
                    flags: 64,
                });
            }

            if (interaction.commandName === "abmelden") {
                const hasPermission = config.abmeldenRoles.some(roleId =>
                    interaction.member.roles.cache.has(roleId)
                );

                if (!hasPermission) {
                    return interaction.reply({ content: "❌ Keine Berechtigung!", flags: 64 });
                }

                const zeitraum = interaction.options.getString("zeitraum");
                const grund = interaction.options.getString("grund");

                const embed = createEmbed({
                    title: "Neue Abmeldung",
                    member: interaction.user,
                    executor: interaction.user,
                    reason: grund,
                    zeitraum,
                });

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

            if (interaction.commandName === "clear") {
                const hasPermission = config.clearRoles.some(roleId =>
                    interaction.member.roles.cache.has(roleId)
                );

                if (!hasPermission) {
                    return interaction.reply({ content: "❌ Keine Berechtigung!", flags: 64 });
                }

                const amount = interaction.options.getInteger("anzahl");
                const messages = await interaction.channel.messages.fetch({ limit: amount + 1 });
                await interaction.channel.bulkDelete(messages, true);

                return interaction.reply({ content: `✅ ${amount} Nachrichten gelöscht!`, flags: 64 });
            }
        }

        // =====================
        // SELECT MENU (🔥 FIX)
        // =====================
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === "aktion_auswahl") {

                const value = interaction.values[0];

                if (value === "einstellung") {
                    return interaction.reply({ content: "📥 Einstellung gewählt", flags: 64 });
                }

                if (value === "kuendigung") {
                    return interaction.reply({ content: "📤 Kündigung gewählt", flags: 64 });
                }

                if (value === "updownrank") {
                    return interaction.reply({ content: "📊 Rank System gewählt", flags: 64 });
                }

                if (value === "sanktion") {
                    return interaction.reply({ content: "⚠️ Sanktion gewählt", flags: 64 });
                }
            }
        }

        // =====================
        // BUTTONS (🔥 FIXED)
        // =====================
        if (interaction.isButton()) {

            const hasPermission = interaction.member.roles.cache.has(config.modRoleId);
            if (!hasPermission) {
                return interaction.reply({ content: "❌ Keine Berechtigung!", flags: 64 });
            }

            const parts = interaction.customId.split("_");
            const action = parts[0];
            const type = parts[1];
            const userId = parts[2];
            const zeitraum = parts.slice(3).join("_");

            const member = await interaction.guild.members.fetch(userId);

            if (action === "abmelden") {

                if (type === "accept") {
                    const embed = createEmbed({
                        title: "Abmeldung akzeptiert",
                        member,
                        executor: interaction.user,
                        zeitraum,
                    });

                    await member.send({ embeds: [embed] }).catch(() => {});

                    const publicChannel = interaction.guild.channels.cache.get(config.abmeldungPublicChannelId);
                    if (publicChannel) {
                        await publicChannel.send({ content: `<@${member.id}>`, embeds: [embed] });
                    }

                    return interaction.update({ content: "✅ Akzeptiert!", components: [], embeds: [] });
                }

                if (type === "reject") {
                    const modal = new ModalBuilder()
                        .setCustomId(`abmelden_reject_modal_${userId}_${zeitraum}`)
                        .setTitle("Ablehnung");

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId("reason")
                                .setLabel("Grund")
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                        )
                    );

                    return interaction.showModal(modal);
                }
            }
        }

        // =====================
        // MODAL
        // =====================
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith("abmelden_reject_modal_")) {

                const parts = interaction.customId.split("_");
                const userId = parts[4];
                const zeitraum = parts.slice(5).join("_");

                const member = await interaction.guild.members.fetch(userId);
                const reason = interaction.fields.getTextInputValue("reason");

                const embed = createEmbed({
                    title: "Abmeldung abgelehnt",
                    member,
                    executor: interaction.user,
                    reason,
                    zeitraum,
                });

                await member.send({ embeds: [embed] }).catch(() => {});

                return interaction.reply({ content: "❌ Abgelehnt!", flags: 64 });
            }
        }

    } catch (err) {
        console.error("INTERACTION ERROR:", err);

        if (interaction.replied || interaction.deferred) return;
        interaction.reply({ content: "❌ Fehler aufgetreten", flags: 64 }).catch(() => {});
    }
});

client.login(process.env.TOKEN);
