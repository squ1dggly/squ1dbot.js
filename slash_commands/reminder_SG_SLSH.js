const {
	Client,
	CommandInteraction,
	SlashCommandBuilder,
	PermissionFlagsBits,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	Message
} = require("discord.js");

const { BetterEmbed, EmbedNavigator, awaitConfirm, messageContentToArray } = require("../modules/discordTools");
const { reminderManager } = require("../modules/mongo");
const jt = require("../modules/jsTools");

/** @param {CommandInteraction} interaction @param {Reminder} reminder @param {Message} syncMessage */
async function enableReminderSync(interaction, reminderID, syncMessage) {
	if (!syncMessage) return;

	let isSlashCommand = syncMessage?.interaction !== null;

	let sync_type = isSlashCommand ? reminderManager.SyncType.SLASH_COMMAND : reminderManager.SyncType.PREFIX_COMMAND;

	let sync_bot_id = syncMessage.author.id;

	let sync_command_name = isSlashCommand ? syncMessage.interaction.commandName : null;

	let sync_message_content = isSlashCommand ? [] : messageContentToArray(syncMessage, 1);

	let sync_message_content_includes_name =
		sync_message_content.includes(interaction.user.username.toLowerCase()) ||
		sync_message_content.includes(interaction.member.displayName.toLowerCase());

	let prefixCommandReference = isSlashCommand ? null : (await syncMessage.fetchReference().catch(() => null)) || null;

	// prettier-ignore
	let slashCommandReference = isSlashCommand
		? interaction.guild.commands.cache.find(slsh => slsh.name === sync_command_name && slsh.client.user.id === syncMessage.author.user.id) || null
		: null;

	await reminderManager.edit(reminderID, {
		sync_type,
		sync_bot_id,
		sync_command_name,
		sync_message_content: sync_message_content.length ? sync_message_content : null,
		sync_message_content_includes_name
	});

	// prettier-ignore
	// Create the embed :: { REMINDER SYNC ENABLED }
	let embed_syncEnabled = new BetterEmbed({
		interaction,
		title: "Sync Enabled",
		description: isSlashCommand
			? `I'll sync your reminder whenever you use ${slashCommandReference ? slashCommandReference : `${syncMessage.author}'s \`/${syncMessage.interaction.commandName}\` command`}.`
			: `I'll sync your reminder whenever you use ${prefixCommandReference ? `the \`${prefixCommandReference.content}\` command` : "that command"}.`,
		footer: `id: ${reminderID}`
	});

	// Let the user know sync was enabled
	return await embed_syncEnabled.send({ sendMethod: "followUp", ephemeral: true });
}

async function awaitSyncMessage(interaction, message, reminderID) {
	let timeouts = {
		syncButton: jt.parseTime("30s"),
		reactionCollect: jt.parseTime("45s")
	};

	let syncMessage = null;

	let filter = async i => {
		await i.deferUpdate().catch(() => null);
		return i.user.id === interaction.user.id && i.customId === "btn_enableSync";
	};

	await message
		.awaitMessageComponent({ filter, componentType: ComponentType.Button, time: timeouts.syncButton })
		.then(async i => {
			// Remove the button
			if (message.editable) message.edit({ components: [] }).catch(() => null);

			// prettier-ignore
			// Let the user know what they have to do
			await i.followUp({
				content: "## Instructions:\nReact with ⏰ to any ***new*** message sent by a bot within the next 45 seconds.\nIf it's a slash command, make sure that it was used by you.",
				ephemeral: true
			});

			// prettier-ignore
			// Create a message collector in the current channel
			let filter_channel = m => m.author.bot;
			let collector_channel = message.channel.createMessageCollector({
				filter: filter_channel,
				time: jt.parseTime("45s")
			});

			let _reactionCollectors = [];

			collector_channel.on("collect", async _message => {
				let filter_reaction = (reaction, user) =>
					!user.bot &&
					reaction.message.author.bot &&
					user.id === interaction.user.id &&
					reaction.emoji.name === "⏰";

				// Add a reaction collector to the message
				let collector_reaction = _message
					.awaitReactions({ filter: filter_reaction, time: timeouts.reactionCollect, max: 1, errors: ["time"] })
					.then(async collected => {
						let _collectedReaction = collected.first();

						// prettier-ignore
						// Check if the message is a slash command that was used by the user
						if (_collectedReaction.message?.interaction && _collectedReaction.message.interaction.user.id !== interaction.user.id)
							return await _collectedReaction.message.reply({
								content: `${interaction.user} you can't just jack someone else's command, bro. I'm only syncing slash commands used by you.`
							}).catch(() => null);

						// Set the assist message to this one
						syncMessage = _collectedReaction.message;

						// Enable syncing for the selected message
						enableReminderSync(interaction, reminderID, syncMessage);

						// Stop the channel collector
						collector_channel.stop();
					})
					.catch(() => null);

				// Push the newly made reaction collector to the list
				_reactionCollectors.push(collector_reaction);
			});

			// Stop all reaction collectors
			collector_channel.on("end", () => {
				try {
					_reactionCollectors.forEach(c => c.stop());
				} catch {}
			});
		})
		.catch(async () => {
			if (!message.editable) return;

			// Remove the button
			return await message.edit({ components: [] }).catch(() => null);
		});
}

/** @param {CommandInteraction} interaction */
async function subcommand_add(interaction) {
	// Get interaction options
	let name = interaction.options.getString("name").trim();
	let time = interaction.options.getString("time").trim();
	let channel = interaction.options.getChannel("channel") || null;
	let limit = interaction.options.getInteger("limit") || null;
	let repeat = interaction.options.getBoolean("repeat") || limit ? true : false;

	/* - - - - - { Error Checking } - - - - - */
	try {
		let parsedTime = jt.parseTime(time);
		// prettier-ignore
		if (parsedTime < 5000) return await interaction.reply({
			content: "You can't set a reminder that's less than 5 seconds.", ephemeral: true
		});
	} catch {
		return await interaction.reply({ content: `\`${time}\` is not a valid time you can use.`, ephemeral: true });
	}

	// Check if the user's a dumbass and set the limit to less than 1
	if (limit !== null && limit < 1)
		return await interaction.reply({
			content: "You can't set the repeat limit to less than 1... That doesn't make any sense.",
			ephemeral: true
		});

	// Check if the user has permission to send messsages in the selected channel
	if (channel && !channel.permissionsFor(interaction.user).has(PermissionFlagsBits.SendMessages))
		return await interaction.reply({
			content: `I can't send a reminder to ${channel} when you don't even have permission to send messages there, peasant.`,
			ephemeral: true
		});

	// Check if the user has permission to send messsages in the selected channel
	if (channel && !channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages))
		return await interaction.reply({
			content: `I can't send a reminder to ${channel} when I don't have permission to send messages there.`,
			ephemeral: true
		});

	await interaction.deferReply().catch(() => null);

	// prettier-ignore
	// Create and add the reminder to the database
	let reminder = await reminderManager.add({
		user_id: interaction.user.id,
		guild_id: interaction.guild.id,
		channel_id: channel?.id || null,

		name, repeat, limit, raw_time: time
	});

	/* - - - - - { Send the Result } - - - - - */
	let _options_f = [];

	if (channel) _options_f.push(`> Channel: ${channel}`);
	// prettier-ignore
	if (repeat) _options_f.push(limit
		? `> Repeat: ${limit} ${limit === 1 ? "time" : "times"}`
		: "> Repeat: ✅"
	);

	// Create the embed :: { REMINDER ADD }
	let embed_reminderAdd = new BetterEmbed({
		interaction,
		title: "Reminder Added",
		description: 'You will be reminded about "$NAME" $DYNAMIC $ETA.\n$OPTIONS'
			.replace("$NAME", name)
			.replace("$DYNAMIC", repeat ? "every" : "in")
			.replace("$ETA", jt.eta(reminder.timestamp))
			.replace("$OPTIONS", _options_f.length ? _options_f.join("\n") : ""),
		footer: `id: ${reminder._id}`
	});

	if (repeat) {
		// Create a button to enable sync
		let button_enableSync = new ButtonBuilder()
			.setCustomId("btn_enableSync")
			.setStyle(ButtonStyle.Primary)
			.setLabel("Enable Sync");

		// Create the action row
		let actionRow = new ActionRowBuilder().setComponents(button_enableSync);

		// Send the embed with components
		let message = await embed_reminderAdd.send({ components: actionRow });

		// Await components and reactions
		awaitSyncMessage(interaction, message, reminder._id);

		return message;
	} else return await embed_reminderAdd.send();
}

/** @param {CommandInteraction} interaction */
async function subcommand_addTrigger() {
	// Get interaction options
	let message_trigger = interaction.options.getString("trigger").trim();
	let name = interaction.options.getString("name").trim();
	let time = interaction.options.getString("time").trim();
	let channel = interaction.options.getChannel("channel") || null;

	/* - - - - - { Error Checking } - - - - - */
	try {
		let parsedTime = jt.parseTime(time);
		// prettier-ignore
		if (parsedTime < 5000) return await interaction.reply({
			content: "You can't set a reminder that's less than 5 seconds.", ephemeral: true
		});
	} catch {
		return await interaction.reply({ content: `\`${time}\` is not a valid time you can use.`, ephemeral: true });
	}

	// Check if the user has permission to send messsages in the selected channel
	if (channel && !channel.permissionsFor(interaction.user).has(PermissionFlagsBits.SendMessages))
		return await interaction.reply({
			content: `I can't send a reminder to ${channel} when you don't even have permission to send messages there, peasant.`,
			ephemeral: true
		});

	// Check if the user has permission to send messsages in the selected channel
	if (channel && !channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages))
		return await interaction.reply({
			content: `I can't send a reminder to ${channel} when I don't have permission to send messages there.`,
			ephemeral: true
		});

	await interaction.deferReply().catch(() => null);

	// Create and add the trigger to the database
	let reminderTrigger = await reminderManager.trigger.add({
		user_id: interaction.user.id,
		guild_id: interaction.guild.id,
		message_trigger,

		reminder_data: {
			user_id: interaction.user.id,
			guild_id: interaction.guild.id,
			name,
			channel_id: channel?.id || null,
			raw_time: time
		}
	});

	/* - - - - - { Send the Result } - - - - - */
	let embed_reminderTriggerAdd = new BetterEmbed({
		interaction,
		title: "+ Reminder Trigger",
		description: `I'll be sure to set a reminder about "${name}" whenever you say \`${message_trigger}\` in chat.`,
		footer: `id: ${reminderTrigger._id}`
	});

	return await embed_reminderTriggerAdd.send();
}

/** @param {CommandInteraction} interaction */
async function subcommand_delete(interaction) {
	await interaction.deferReply().catch(() => null);

	// Get interaction options
	let id = interaction.options.getString("id").toLowerCase().trim();

	let reminderCount = 0;

	if (id === "all") {
		// Count existing reminders before deleting
		reminderCount = await reminderManager.count(interaction.user.id, interaction.guild.id);

		// prettier-ignore
		if (!reminderCount) return await new BetterEmbed({
			interaction, description: "You don't have any active reminders!"
		}).send();

		// prettier-ignore
		// Await the user's confirmation
		let confirmation = await awaitConfirm({
			interaction,
			messageContent: `Are you sure you want to delete \`${reminderCount}\` ${reminderCount === 1 ? "reminder" : "reminders"}?`,
			dontEmbed: true
		});

		if (!confirmation) return;

		// Delete all reminders for the user in the current guild
		await reminderManager.deleteAll(interaction.user.id, interaction.guild.id);
	} else {
		// prettier-ignore
		if (!await reminderManager.exists(id)) return await interaction.editReply({
			content: `I couldn't find a reminder with the ID of \`${id}\`. Are you sure you got that right?`
		});

		// Delete the reminder
		await reminderManager.delete(id);
	}

	// Send the result
	return await interaction.editReply({
		content: reminderCount
			? `You deleted \`${reminderCount}\` ${reminderCount === 1 ? "reminder" : "reminders"}.`
			: "Reminder deleted.",
		embeds: [],
		components: []
	});
}

/** @param {CommandInteraction} interaction */
async function subcommand_list(interaction) {
	await interaction.deferReply().catch(() => null);

	let reminders = await reminderManager.fetchAll(interaction.user.id, interaction.guild.id);

	// prettier-ignore
	// Check if the user has any active reminders
	if (!reminders.length) return await interaction.editReply({
		content: "You don't have any reminders!"
	});

	/* - - - - - { Create the Pages } - - - - - */
	let reminders_f = await Promise.all(
		reminders.map(async r => {
			// Fetch the notification channel from the guild
			let _channel = r.channel_id
				? interaction.guild.channels.cache.get(r.channel_id) ||
				  (await interaction.guild.channels.fetch(r.channel_id))
				: null;

			// prettier-ignore
			return "`$ID` **$NAME** | $TIMESTAMP | Repeat: $REPEAT\n> $CHANNEL$ASSISTANCE"
				.replace("$ID", r._id)
				.replace("$NAME", r.name)
				.replace("$TIMESTAMP", `<t:${jt.msToSec(r.timestamp)}:R>`)
				.replace("$REPEAT", r.repeat ? "`✅`" : "`⛔`")
				.replace("$LIMIT", r.limit)
				.replace("$CHANNEL", _channel ? `${_channel}` : "")
				.replace("$ASSISTANCE", r.assisted_command_name ? `${_channel ? " | " : ""}Assist: \`/${r.assisted_command_name}\`` : "");
		})
	);

	let reminders_f_chunk = jt.chunk(reminders_f, 5);
	let embeds_reminderList = [];

	for (let i = 0; i < reminders_f_chunk.length; i++) {
		// Create the embed :: { REMINDER LIST }
		let embed = new BetterEmbed({
			interaction,
			title: "Reminder List",
			description: reminders_f_chunk[i].join("\n"),
			footer: `Page ${i + 1} of ${reminders_f_chunk.length}`
		});

		// Push the embed to the array
		embeds_reminderList.push(embed);
	}

	// Setup pagination
	let pagination = new EmbedNavigator({
		interaction,
		embeds: [embeds_reminderList],
		pagination: { type: "short" }
	});

	return await pagination.send();
}

module.exports = {
	options: { icon: "⏰", deferReply: false },

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("reminder")
        .setDescription("Configure your reminders")

        .addSubcommand(option => option.setName("add").setDescription("Add a new reminder")
            .addStringOption(option => option.setName("name")
                .setDescription("What am I reminding you about?")
                .setRequired(true))

            .addStringOption(option => option.setName("time")
                .setDescription("When should I remind you? | ex. \"30m\", \"1h\", \"1d\"")
                .setRequired(true))

            .addChannelOption(option => option.setName("channel")
                .setDescription("What channel do you want to be pinged in? Leave blank to be DM'd. (optional)"))
            
            .addBooleanOption(option => option.setName("repeat")
                .setDescription("Do you wish to keep being reminded about this? (optional)"))
            
            .addIntegerOption(option => option.setName("limit")
				.setDescription("How many times do you want the reminder to repeat? (optional)"))
			
			/* .addStringOption(option => option.setName("assist")
                .setDescription("Reset the timer whenever you use a certain slash command. Requires the message ID of the command.")) */
		)

        .addSubcommand(option => option.setName("delete").setDescription("Delete an existing reminder")
            .addStringOption(option => option.setName("id")
				.setDescription("The ID of the reminder you wish to delete. Use \"all\" to clear all reminders in the server.")
                .setRequired(true))
        )

		.addSubcommand(option => option.setName("list").setDescription("View a list of your reminders"))

		.addSubcommandGroup(group => group.setName("trigger")
			.setDescription("Configure your reminder triggers")

			.addSubcommand(option => option.setName("add").setDescription("Add a new reminder trigger")
				.addStringOption(option => option.setName("trigger")
					.setDescription("What will trigger this reminder?")
					.setRequired(true))

				.addStringOption(option => option.setName("name")
					.setDescription("What will I remind you about?")
					.setRequired(true))

				.addStringOption(option => option.setName("time")
					.setDescription("How long will the reminder be? | ex. \"30m\", \"1h\", \"1d\"")
					.setRequired(true))

				.addChannelOption(option => option.setName("channel")
					.setDescription("What channel do you want to be pinged in? Leave blank to be DM'd. (optional)"))
			)

			.addSubcommand(option => option.setName("delete").setDescription("Delete an existing reminder trigger")
				.addStringOption(option => option.setName("id")
				.setDescription("The ID of the trigger you wish to delete. Use \"all\" to clear all triggers in the server.")
				.setRequired(true))
			)

			.addSubcommand(option => option.setName("list").setDescription("View a list of your reminder triggers"))
		),

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		// prettier-ignore
		// Determine the operation
		switch (interaction.options.getSubcommand()) {
            case "add": return await subcommand_add(interaction);

            case "delete": return await subcommand_delete(interaction);

            case "list": return await subcommand_list(interaction);

            default: return;
        }
	}
};
