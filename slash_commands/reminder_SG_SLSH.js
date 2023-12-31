const { Client, CommandInteraction, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const { BetterEmbed, EmbedNavigator, awaitConfirm } = require("../modules/discordTools");
const { reminderManager } = require("../modules/mongo");
const jt = require("../modules/jsTools");

/** @param {CommandInteraction} interaction */
async function subcommand_add(interaction) {
	// Get interaction options
	let name = interaction.options.getString("name").trim();
	let time = interaction.options.getString("time").trim();
	let channel = interaction.options.getChannel("channel") || null;
	let repeat = interaction.options.getBoolean("repeat") || false;
	let limit = interaction.options.getInteger("limit") || 0;
	let assist = interaction.options.getBoolean("assist") || false;

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

	// Check if the user provided a valid message ID
	if (assistMessageID) {
		assistMessage = await interaction.channel.messages.fetch(assistMessageID).catch(() => null);

		// prettier-ignore
		// Let the user know it was invalid
		if (!assistMessage) return await interaction.editReply({
			content: "I couldn't find the message you wanted assistance with!\nMake sure it's a slash command that's in the same channel you're in right now."
		});

		// prettier-ignore
		// Check if the message is a slash command
		if (!assistMessage?.interaction) return await interaction.editReply({
			content: "Woah there, I can only assist you with slash commands at this time."
		});

		// prettier-ignore
		// Check if the message was sent by the same user
		if (assistMessage.interaction.user.id !== interaction.user.id) return await interaction.editReply({
			content: "You can't just jack someone else's command! I can only assist you with slash commands sent by you."
		});

		// Check if the user enabled repeat
		if (!repeat)
			return await interaction.editReply({
				content: "Repeat must be enabled to take advantage of the assist feature."
			});
	}

	// prettier-ignore
	// Create and add the reminder to the database
	let reminder = await reminderManager.add(
		interaction.user.id, interaction.guild.id, channel?.id || null,
		name, repeat, limit, time, assistMessage
	);

	/* - - - - - { Send the Result } - - - - - */
	let embed_reminderAdd = new BetterEmbed({
		interaction,
		title: "Added reminder",
		description: `You will be reminded about \"${reminder.name}\" ${reminder.repeat ? "every" : "in"} ${jt.eta(
			reminder.timestamp
		)}.${
			assistMessage
				? `\n> Assistance enabled for ${assistMessage.author}'s \`/${assistMessage.interaction.commandName}\`.`
				: ""
		}${
			reminder.repeat
				? reminder.limit !== null
					? `\n> Repeating: ${reminder.limit} ${reminder.limit === 1 ? "time" : "times"}`
					: "\n> Repeat: ✅"
				: ""
		}`
	});

	return await embed_reminderAdd.send();
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
	await reminderManager.trigger.add({
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
		title: "Added reminder trigger",
		description: `I'll be sure to set a reminder about "${name}" whenever you say \`${message_trigger}\` in chat.`
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
			
			.addStringOption(option => option.setName("assist")
                .setDescription("Reset the timer whenever you use a certain slash command. Requires the message ID of the command."))
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
