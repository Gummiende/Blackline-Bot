
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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
// Rang-Anfrage Embed Command (z.B. beim Bot-Start einmalig ausführen oder als Admin-Command)
client.once("clientReady", async () => {
    const channelId = config.rangAnfrageChannelId;
    const fuehrungsebeneRoleId = config.fuehrungsebeneRoleId;
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;
    // Sende Embed mit Button
    const embed = new EmbedBuilder()
        .setColor("#660909")
        .setTitle("<:BLP_Flagge:1487925256806207598> Vorlage")
        .setDescription(
            "Bitte haltet folgende Vorlage für die Rang Anfrage ein:\n\n" +
            "> Name: Name | ggf. Dienstnummer & IC Name\n" +
            "> Rang: Rang Name (nicht pingen)\n" +
            "> Grund: Grund der Rang Anfrage\n\n" +
            "-# Blackline Performance Rollen werden in der Regel automatisch von unserem Self-Made Bot synchronisiert, können bei Fehlern des Bots trotzdem angefragt werden."
        );

    const button = new ButtonBuilder()
        .setCustomId("rang_anfrage_modal")
        .setLabel("Rang-anfrage")
        .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    await channel.send({
        embeds: [embed],
        components: [row]
    });

    // Ticket-Panel automatisch senden
    const ticketPanelChannelId = "1376197567137972284";
    const ticketPanelChannel = await client.channels.fetch(ticketPanelChannelId).catch(() => null);
    if (ticketPanelChannel) {
        const ticketEmbed = new EmbedBuilder()
            .setColor("#660909")
            .setTitle("**Blackline Performance Support**")
            .setDescription(":BLP_Flagge: Drücke auf das Dropdown Menü um eine Kategorie auszuwählen :BLP_Flagge:");

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("ticket_select")
            .setPlaceholder("Kategorie auswählen...")
            .addOptions([
                {
                    label: "Bewerbung",
                    value: "bewerbung",
                    description: "Hier kannst du dich als Mechaniker bewerben",
                    emoji: "📋"
                },
                {
                    label: "Leitungsebene",
                    value: "leitungsebene",
                    description: "Hier kommst du ins Gespräch mit der Leitungsebene",
                    emoji: "🧪"
                },
                {
                    label: "Führungsebene",
                    value: "fuehrungsebene",
                    description: "Hier kommst du ins Gespräch mit der Führungsebene",
                    emoji: "👑"
                }
            ]);

        const ticketRow = new ActionRowBuilder().addComponents(selectMenu);
        await ticketPanelChannel.send({
            embeds: [ticketEmbed],
            components: [ticketRow]
        });
    }
});


// Button-Handler für Rang-Anfrage ist jetzt im großen InteractionCreate-Handler integriert

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
client.once("clientReady", () => {
    console.log("✅ Blackline Bot online!");
});

// =====================
// INTERACTIONS
// =====================
client.on(Events.InteractionCreate, async interaction => {
    try {
        // -------------------
        // BUTTON: Rang-Anfrage öffnen
        // -------------------
        if (interaction.isButton() && interaction.customId === "rang_anfrage_modal") {
            // Modal für Rang-Anfrage anzeigen
            const modal = new ModalBuilder()
                .setCustomId("rang_anfrage_modal_submit")
                .setTitle("Rang-Anfrage stellen");

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("name")
                        .setLabel("Name (Discord/IC)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("rang")
                        .setLabel("Rang")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("grund")
                        .setLabel("Grund")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                )
            );
            await interaction.showModal(modal);
            return; // WICHTIG: Nur einmal antworten!
        }

        // -------------------
        // MODAL: Rang-Anfrage abschicken
        // -------------------
        if (interaction.isModalSubmit() && interaction.customId === "rang_anfrage_modal_submit") {
            // Werte aus dem Modal holen
            const name = interaction.fields.getTextInputValue("name");
            const rang = interaction.fields.getTextInputValue("rang");
            const grund = interaction.fields.getTextInputValue("grund");
            const fuehrungsebeneRoleId = config.fuehrungsebeneRoleId;
            const channelId = config.rangAnfrageChannelId;
            const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);

            // Embed für die eingereichte Anfrage
            const requestEmbed = new EmbedBuilder()
                .setColor("#660909")
                .setTitle("Neue Rang-Anfrage")
                .addFields(
                    { name: "Name", value: `${name} (<@${interaction.user.id}>)`, inline: false },
                    { name: "Rang", value: rang, inline: false },
                    { name: "Grund", value: grund, inline: false }
                )
                .setThumbnail("https://cdn.discordapp.com/attachments/1486411922084724889/1486418576805072916/BLP_Flagge.png")
                .setFooter({
                    text: "Blackline Bot • Rang-Anfrage",
                    iconURL: "https://cdn.discordapp.com/attachments/1486411922084724889/1486418577463705831/BLP_Logo_2.png"
                })
                .setTimestamp();

            if (channel) {
                await channel.send({
                    content: `<@&${fuehrungsebeneRoleId}>`,
                    embeds: [requestEmbed]
                });
            }
            await interaction.reply({ content: `✅ Deine Rang-Anfrage wurde eingereicht!`, ephemeral: true });
            return; // WICHTIG: Nur einmal antworten!
        }

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
                        { name: "Wer:", value: `<@${interaction.user.id}>`, inline: true },
                        { name: "Zeitraum:", value: zeitraum },
                        { name: "Grund:", value: grund || "Kein Grund angegeben" },
                        { name: "📅 Datum:", value: `<t:${Math.floor(Date.now() / 1000)}:f>` }
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
        // SELECT MENU
        // -------------------
        if (interaction.isStringSelectMenu()) {
                // Ticket-Panel Dropdown
                if (interaction.customId === "ticket_select") {
                    const ticketType = interaction.values[0];
                    const ticketConfig = config.ticketSystem[ticketType];
                    if (!ticketConfig) return interaction.reply({ content: "❌ Ticket-Konfiguration fehlt!", ephemeral: true });

                    // Channel-Name je nach Typ
                    let channelName = "ticket-" + interaction.user.username;
                    if (ticketType === "bewerbung") channelName = `bewerbung-${interaction.user.username}`;
                    if (ticketType === "leitungsebene") channelName = `le-${interaction.user.username}`;
                    if (ticketType === "fuehrungsebene") channelName = `fe-${interaction.user.username}`;

                    // Channel erstellen
                    const channel = await interaction.guild.channels.create({
                        name: channelName,
                        type: 0, // 0 = GUILD_TEXT
                        parent: ticketConfig.categoryId || null,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.roles.everyone,
                                deny: [PermissionsBitField.Flags.ViewChannel]
                            },
                            {
                                id: interaction.user.id,
                                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
                            },
                            // Erlaubte Rollen
                            ...((ticketConfig.allowedRoleIds || []).map(rid => ({
                                id: rid,
                                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
                            }))),
                            // Moderatorenrollen
                            ...((ticketConfig.moderatorRoleIds || []).map(rid => ({
                                id: rid,
                                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageChannels]
                            })))
                        ]
                    });

                    // Willkommensnachricht und Embed
                    await channel.send({
                        content: `<@${interaction.user.id}> Herzlich Willkommen in ihrem Ticket! Ein Mitglied unseres Teams wird in kürze bei ihnen sein.`
                    });
                    const ticketEmbed = new EmbedBuilder()
                        .setColor("#660909")
                        .setTitle("Support Ticket Verwaltung")
                        .setDescription(
                            'Um das Ticket zu schließen, drücken sie auf "🔒 Schließen"\n\n:w_arrow: Bitte beachten sie das vorgegebene Format falls vorhanden.'
                        );
                    const closeButton = new ButtonBuilder()
                        .setCustomId("ticket_close")
                        .setLabel("🔒 Schließen")
                        .setStyle(ButtonStyle.Danger);
                    const row = new ActionRowBuilder().addComponents(closeButton);
                    await channel.send({ embeds: [ticketEmbed], components: [row] });

                    await interaction.reply({ content: `✅ Ticket erstellt: <#${channel.id}>`, ephemeral: true });
                    return;
                }
            if (interaction.customId === "aktion_auswahl") {
                const aktion = interaction.values[0];
                const userMenu = new UserSelectMenuBuilder()
                    .setCustomId(`select_user_${aktion}`)
                    .setPlaceholder("Wähle Benutzer");

                return interaction.reply({
                    content: `Wähle Benutzer für **${aktion}**`,
                    components: [new ActionRowBuilder().addComponents(userMenu)],
                    ephemeral: true
                });
            }

            if (interaction.customId.startsWith("role_select_")) {
                const userId = interaction.customId.split("_")[2];
                const newRoleId = interaction.values[0];
                // Validate userId is a Discord snowflake (only digits, length 17-20)
                const snowflakeRegex = /^\d{17,20}$/;
                if (!snowflakeRegex.test(userId)) {
                    return interaction.reply({ content: `❌ Ungültige Benutzer-ID: ${userId}`, ephemeral: true });
                }
                const member = await interaction.guild.members.fetch(userId);

                const oldRoles = member.roles.cache.filter(r =>
                    rankRoles.some(rr => rr.id === r.id) && !keepRoles.includes(r.id)
                );
                const oldRole = oldRoles.first();
                for (const role of oldRoles.values()) {

                                // Ticket schließen: Modal für Grund anzeigen
                                if (interaction.customId === "ticket_close") {
                                    const modal = new ModalBuilder()
                                        .setCustomId("ticket_close_modal")
                                        .setTitle("Ticket schließen");
                                    modal.addComponents(
                                        new ActionRowBuilder().addComponents(
                                            new TextInputBuilder()
                                                .setCustomId("close_reason")
                                                .setLabel("Grund für das Schließen")
                                                .setStyle(TextInputStyle.Paragraph)
                                                .setRequired(true)
                                        )
                                    );
                                    await interaction.showModal(modal);
                                    return;
                                }
                    await member.roles.remove(role.id).catch(console.error);
                        // Ticket schließen: Modal-Submit
                        if (interaction.isModalSubmit() && interaction.customId === "ticket_close_modal") {
                            const reason = interaction.fields.getTextInputValue("close_reason");
                            const channel = interaction.channel;
                            // Ticket-Typ anhand Channel-Name bestimmen
                            let ticketType = null;
                            if (channel.name.startsWith("bewerbung-")) ticketType = "bewerbung";
                            if (channel.name.startsWith("le-")) ticketType = "leitungsebene";
                            if (channel.name.startsWith("fe-")) ticketType = "fuehrungsebene";
                            const ticketConfig = config.ticketSystem[ticketType] || {};
                            // Channel in geschlossene Kategorie verschieben
                            if (config.closedTicketsCategoryId) {
                                await channel.setParent(config.closedTicketsCategoryId).catch(() => {});
                            }
                            // Verwaltungsembed mit Buttons
                            const manageEmbed = new EmbedBuilder()
                                .setColor("#660909")
                                .setTitle("Support Ticket Verwaltung")
                                .setDescription(`Das Ticket wurde geschlossen.\n\n**Grund:** ${reason}\n**Geschlossen von:** <@${interaction.user.id}>`);
                            const transcriptBtn = new ButtonBuilder()
                                .setCustomId("ticket_transcript")
                                .setLabel("Transcript senden")
                                .setStyle(ButtonStyle.Primary);
                            const reopenBtn = new ButtonBuilder()
                                .setCustomId("ticket_reopen")
                                .setLabel("Öffnen")
                                .setStyle(ButtonStyle.Success);
                            const deleteBtn = new ButtonBuilder()
                                .setCustomId("ticket_delete")
                                .setLabel("Löschen")
                                .setStyle(ButtonStyle.Danger);
                            const row = new ActionRowBuilder().addComponents(transcriptBtn, reopenBtn, deleteBtn);
                            await channel.send({ embeds: [manageEmbed], components: [row] });
                            // Channel für alle außer Mod/Ersteller schließen
                            await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { ViewChannel: false });
                            await channel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: false });
                            await interaction.reply({ content: "✅ Ticket geschlossen!", ephemeral: true });
                            // Speichere Grund/Schließenden ggf. in channel.topic oder DB für reopen/transcript
                            channel.topic = JSON.stringify({
                                closedBy: interaction.user.id,
                                closeReason: reason,
                                ticketType: ticketType
                            });
                            return;
                        }

                        // Ticket Transcript senden
                        if (interaction.isButton() && interaction.customId === "ticket_transcript") {
                            const channel = interaction.channel;
                            let ticketType = null;
                            if (channel.name.startsWith("bewerbung-")) ticketType = "bewerbung";
                            if (channel.name.startsWith("le-")) ticketType = "leitungsebene";
                            if (channel.name.startsWith("fe-")) ticketType = "fuehrungsebene";
                            const ticketConfig = config.ticketSystem[ticketType] || {};
                            // Nachrichten abrufen
                            const messages = await channel.messages.fetch({ limit: 100 });
                            const sorted = Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);
                            let transcript = `Transcript von #${channel.name}\n`;
                            for (const msg of sorted) {
                                transcript += `[${new Date(msg.createdTimestamp).toLocaleString()}] ${msg.author.tag}: ${msg.content}\n`;
                            }
                            // Grund und Schließenden aus topic
                            let meta = {};
                            try { meta = JSON.parse(channel.topic); } catch {}
                            transcript += `\n---\nGrund: ${meta.closeReason || "-"}\nGeschlossen von: <@${meta.closedBy || "-"}>`;
                            // Transcript senden
                            if (ticketConfig.transcriptChannelId) {
                                const transcriptChannel = await channel.guild.channels.fetch(ticketConfig.transcriptChannelId).catch(() => null);
                                if (transcriptChannel) {
                                    await transcriptChannel.send({
                                        content: `Transcript von <#${channel.id}>`,
                                        files: [{ attachment: Buffer.from(transcript, "utf-8"), name: `${channel.name}-transcript.txt` }]
                                    });
                                    await interaction.reply({ content: "📄 Transcript gesendet!", ephemeral: true });
                                } else {
                                    await interaction.reply({ content: "❌ Transcript-Channel nicht gefunden!", ephemeral: true });
                                }
                            } else {
                                await interaction.reply({ content: "❌ Kein Transcript-Channel konfiguriert!", ephemeral: true });
                            }
                            return;
                        }

                        // Ticket wieder öffnen
                        if (interaction.isButton() && interaction.customId === "ticket_reopen") {
                            const channel = interaction.channel;
                            let ticketType = null;
                            if (channel.name.startsWith("bewerbung-")) ticketType = "bewerbung";
                            if (channel.name.startsWith("le-")) ticketType = "leitungsebene";
                            if (channel.name.startsWith("fe-")) ticketType = "fuehrungsebene";
                            // Ersteller aus topic holen
                            let meta = {};
                            try { meta = JSON.parse(channel.topic); } catch {}
                            if (meta.closedBy) {
                                await channel.permissionOverwrites.edit(meta.closedBy, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
                            }
                            // Channel wieder in Ursprungs-Kategorie verschieben
                            const ticketConfig = config.ticketSystem[ticketType] || {};
                            if (ticketConfig.categoryId) {
                                await channel.setParent(ticketConfig.categoryId).catch(() => {});
                            }
                            await interaction.reply({ content: "🔓 Ticket wieder geöffnet!", ephemeral: true });
                            return;
                        }

                        // Ticket löschen
                        if (interaction.isButton() && interaction.customId === "ticket_delete") {
                            const channel = interaction.channel;
                            await interaction.reply({ content: "⏳ Ticket wird gelöscht...", ephemeral: true });
                            setTimeout(() => channel.delete().catch(() => {}), 2000);
                            return;
                        }
                }

                await member.roles.add(newRoleId);

                const modal = new ModalBuilder()
                    .setCustomId(`modal_rank_${userId}_${newRoleId}_${oldRole ? oldRole.id : "none"}`)
                    .setTitle("Rank Änderung");

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("reason")
                            .setLabel("Grund")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("fromText")
                            .setLabel("Von (optional)")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                    )
                );

                return interaction.showModal(modal);
            }
        }

        // -------------------
        // USER SELECT
        // -------------------
        if (interaction.isUserSelectMenu()) {
            const aktion = interaction.customId.split("_")[2];
            const user = interaction.users.first();

            if (aktion === "updownrank") {
                const roleMenu = new StringSelectMenuBuilder()
                    .setCustomId(`role_select_${user.id}`)
                    .setPlaceholder("Wähle neuen Rank")
                    .addOptions(rankRoles.map(r => ({ label: r.label, value: r.id })));

                return interaction.reply({
                    content: `Wähle neuen Rank für <@${user.id}>`,
                    components: [new ActionRowBuilder().addComponents(roleMenu)],
                    ephemeral: true
                });
            }

            const modal = new ModalBuilder()
                .setCustomId(`modal_${aktion}_${user.id}`)
                .setTitle(`Aktion: ${aktion}`);

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("reason")
                        .setLabel("Grund")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("fromText")
                        .setLabel("Von (optional)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                )
            );

            return interaction.showModal(modal);
        }

        // -------------------
        // MODALS
        // -------------------
        if (interaction.isModalSubmit()) {
            const split = interaction.customId.split("_");
            const type = split[1];
            const userId = split[2];
            // Validate userId is a Discord snowflake (only digits, length 17-20)
            const snowflakeRegex = /^\d{17,20}$/;
            if (!snowflakeRegex.test(userId)) {
                return interaction.reply({ content: `❌ Ungültige Benutzer-ID: ${userId}`, ephemeral: true });
            }
            const member = await interaction.guild.members.fetch(userId);

            const reason = interaction.fields.getTextInputValue("reason");
            const fromText = interaction.fields.getTextInputValue("fromText");

            let title = "";
            let channelId = config.defaultLogChannelId;
            let extraFields = [];

            if (type === "rank") {
                const newRoleId = split[3];
                const oldRoleId = split[4] === "none" ? null : split[4];
                title = "Rank Änderung";
                channelId = config.rankLogChannelId;

                extraFields.push(
                    { name: "Alter Rang:", value: oldRoleId ? `<@&${oldRoleId}>` : "Kein Rang", inline: true },
                    { name: "Neuer Rang:", value: `<@&${newRoleId}>`, inline: true }
                );
            }

            if (type === "einstellung") {
                title = "Einstellung";
                channelId = config.einstellungLogChannelId;
                for (const roleId of config.einstellungRoles) await member.roles.add(roleId).catch(console.error);
            }

            if (type === "kuendigung") {
                title = "Kündigung";
                channelId = config.kuendigungLogChannelId;

                const rolesToRemove = member.roles.cache.filter(r => r.id !== interaction.guild.id && !keepRoles.includes(r.id));
                for (const role of rolesToRemove.values()) {
                    await member.roles.remove(role.id).catch(console.error);
                }

                await member.roles.add("1487266947178696774"); // Kündigungsrolle
            }

            if (type === "sanktion") {
                title = "Sanktion";
                channelId = config.sanktionLogChannelId;
            }

            const embed = createEmbed({
                title,
                member,
                executor: interaction.user,
                reason,
                extraFields,
                fromText
            });

            const channel = interaction.guild.channels.cache.get(channelId);
            await channel.send({ content: `<@${member.id}>`, embeds: [embed] });
            return interaction.reply({ content: "✅ Aktion ausgeführt!", ephemeral: true });
        }

        // -------------------
        // BUTTONS (ABMELDUNG)
        // -------------------
        if (interaction.isButton()) {
            const [_, action, userId, zeitraum, ...grundParts] = interaction.customId.split("_");
            const grund = grundParts.join("_");
            // Validate userId is a Discord snowflake (only digits, length 17-20)
            const snowflakeRegex = /^\d{17,20}$/;
            if (!snowflakeRegex.test(userId)) {
                return interaction.reply({ content: `❌ Ungültige Benutzer-ID: ${userId}`, ephemeral: true });
            }
            const member = await interaction.guild.members.fetch(userId);

            if (!interaction.member.roles.cache.has(config.modRoleId)) {
                return interaction.reply({ content: "❌ Keine Berechtigung!", ephemeral: true });
            }

            const abmeldungEmbed = new EmbedBuilder()
                .setColor(action === "accept" ? "#660909" : "#660909")
                .setTitle(action === "accept" ? "Abmeldung akzeptiert" : "Abmeldung abgelehnt")
                .setThumbnail("https://cdn.discordapp.com/attachments/1486411922084724889/1486418576805072916/BLP_Flagge.png")
                .addFields(
                    { name: "Wer:", value: `<@${member.id}>`, inline: true },
                    { name: "Von:", value: `<@${interaction.user.id}>`, inline: true },
                    { name: "Zeitraum:", value: zeitraum },
                    { name: "Grund:", value: grund || "Kein Grund angegeben" },
                    { name: "📅 Datum:", value: `<t:${Math.floor(Date.now() / 1000)}:f>` }
                )
                .setFooter({
                    text: `Blackline Bot • ausgeführt von ${interaction.user.username}`,
                    iconURL: "https://cdn.discordapp.com/attachments/1486411922084724889/1486418577463705831/BLP_Logo_2.png"
                })
                .setTimestamp();

            // DM an Nutzer
            await member.send({ embeds: [abmeldungEmbed] }).catch(() => {});

            if (action === "accept") {
                const publicChannel = interaction.guild.channels.cache.get(config.abmeldungPublicChannelId);
                await publicChannel.send({ content: `<@${member.id}>`, embeds: [abmeldungEmbed] });
                await interaction.update({ content: "✅ Abmeldung akzeptiert und gepostet!", components: [] });
            } else if (action === "reject") {
                await interaction.update({ content: "❌ Abmeldung abgelehnt!", components: [] });
            }
        }

    } catch (err) {
        console.error("Fehler bei Interaction:", err);
    }
});

client.login(process.env.TOKEN);
// Willkommensnachricht bei neuem Mitglied
client.on(Events.GuildMemberAdd, async member => {
    const config = require("./config");
    // IDs aus config.js (bitte dort eintragen)
    const hausordnungChannelId = config.hausordnungChannelId;
    const ticketChannelId = config.ticketChannelId;
    const newsChannelId = config.newsChannelId;
    const willkommenRoleId = config.willkommenRoleId;

    // joinRoles automatisch vergeben
    if (config.joinRoles && Array.isArray(config.joinRoles)) {
        for (const roleId of config.joinRoles) {
            await member.roles.add(roleId).catch(() => {});
        }
    }

    // Embed-Nachricht
    const welcomeEmbed = new EmbedBuilder()
        .setColor("#660909")
        .setTitle("🎉 **Herzlich Willkommen bei Blackline Performance!** 🎉")
        .setDescription(
            "Schön, dass du hier bist! 🙌\n\n" +
            `Bevor du loslegst, nimm dir bitte kurz Zeit für unsere (<#${hausordnungChannelId}>). So sorgen wir gemeinsam für eine entspannte und respektvolle Community.\n\n` +
            "❗ **Wichtig für dich:**\n" +
            `• Bei Fragen oder Problemen kannst du jederzeit ein Ticket im (<#${ticketChannelId}>) erstellen – unser Team hilft dir schnell weiter!\n` +
            `• Verpasse keine News, Aktionen oder **Rabatte** 💸 – behalte unbedingt den (<#${newsChannelId}>) im Auge!\n` +
            "• Bleib freundlich und respektvoll – wir wollen, dass sich hier jeder wohlfühlt 🤝\n\n" +
            "Mit freundlichen Grüßen,\n" +
            `<@&${willkommenRoleId}>`
        )
        .setThumbnail("https://cdn.discordapp.com/attachments/1486411922084724889/1486418576805072916/BLP_Flagge.png")
        .setFooter({
            text: "Blackline Bot • Willkommen",
            iconURL: "https://cdn.discordapp.com/attachments/1486411922084724889/1486418577463705831/BLP_Logo_2.png"
        })
        .setTimestamp();

    // Channel für Willkommensnachricht (z.B. der gleiche wie Hausordnung oder ein dedizierter Channel)
    const welcomeChannelId = config.welcomeChannelId || hausordnungChannelId;
    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (channel) {
        await channel.send({
            content: `<@${member.id}>`,
            embeds: [welcomeEmbed]
        });
    }
});
