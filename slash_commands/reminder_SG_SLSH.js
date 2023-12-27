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

	// Check if the user provided a valid time
	try {
		let parsedTime = jt.parseTime(time);
		// prettier-ignore
		if (parsedTime < 5000) return await interaction.reply({
			content: "You cannot set a reminder that's less than 5 seconds.", ephemeral: true
		});
	} catch {
		return await interaction.reply({ content: `\`${time}\` is not a valid time you can use.`, ephemeral: true });
	}

	// Check if the user has permission to send messsages in the selected channel
	if (channel && !channel.permissionsFor(interaction.user).has(PermissionFlagsBits.SendMessages))
		return await interaction.reply({
			content: `This reminder can't be added because you don't have permission to send messages in ${channel}.`,
			ephemeral: true
		});

	// Check if the user has permission to send messsages in the selected channel
	if (channel && !channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages))
		return await interaction.reply({
			content: `This reminder can't be added because I don't have permission to send messages in ${channel}.`,
			ephemeral: true
		});

	await interaction.deferReply().catch(() => null);

	// prettier-ignore
	// Create and add the reminder to the database
	let reminder = await reminderManager.add(
		interaction.user.id, interaction.guild.id, channel?.id || null,
		name, repeat, limit, time
	);

	/* - - - - - { Send the Result } - - - - - */
	let embed_reminderAdd = new BetterEmbed({
		interaction,
		title: "Added reminder",
		description: `You will be reminded about \"${reminder.name}\" in ${jt.eta(reminder.timestamp)}.`
	});

	return await embed_reminderAdd.send();
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

		// Await the user's confirmation
		let confirmation = await awaitConfirm({
			interaction,
			description: `Are you sure you want to delete \`${reminderCount}\` ${reminderCount === 1 ? "reminder" : "reminders"}?`
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

	/* - - - - - { Send the Result } - - - - - */
	let embed_reminderDelete = new BetterEmbed({
		interaction,
		description: reminderCount ? `You deleted \`${reminderCount}\` reminders.` : "Reminder deleted."
	});

	return await embed_reminderDelete.send();
}

/** @param {CommandInteraction} interaction */
async function subcommand_list(interaction) {
	await interaction.deferReply().catch(() => null);

	let reminders = await reminderManager.fetchAll(interaction.user.id, interaction.guild.id);

	// prettier-ignore
	// Check if the user has any active reminders
	if (!reminders.length) return await interaction.editReply({
		content: "You don't have any active reminders!"
	});

	/* - - - - - { Create the Pages } - - - - - */
	let reminders_f = await Promise.all(
		reminders.map(async r => {
			// Fetch the notification channel from the guild
			let _channel = r.channel_id
				? interaction.guild.channels.cache.get(r.channel_id) ||
				  (await interaction.guild.channels.fetch(r.channel_id))
				: null;

			return "`$ID` **$NAME** | $TIMESTAMP | Repeat: $REPEAT$CHANNEL"
				.replace("$ID", r._id)
				.replace("$NAME", r.name)
				.replace("$TIMESTAMP", `<t:${jt.msToSec(r.timestamp)}:R>`)
				.replace("$REPEAT", r.repeat ? "`✅`" : "`⛔`")
				.replace("$LIMIT", r.limit)
				.replace("$CHANNEL", _channel ? ` | ${_channel}` : "");
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
                .setDescription("When am I reminding you about?")
                .setRequired(true))

            .addStringOption(option => option.setName("time")
                .setDescription("When should I remind you? | ex. \"30m\", \"1h\", \"1d\"")
                .setRequired(true))

            .addChannelOption(option => option.setName("channel")
                .setDescription("What channel do you want to be pinged in? Leave blank to be DM'd (optional)"))
            
            .addBooleanOption(option => option.setName("repeat")
                .setDescription("Do you wish to keep being reminded about this? (optional)"))
            
            .addIntegerOption(option => option.setName("limit")
                .setDescription("How many times do you wish to repeat this reminder? (optional)"))
        )
    
        .addSubcommand(option => option.setName("delete").setDescription("Delete an existing reminder")
            .addStringOption(option => option.setName("id")
				.setDescription("The ID of the reminder you wish to delete. Use \"all\" to clear all reminders in the server.")
                .setRequired(true))
        )
    
        .addSubcommand(option => option.setName("list").setDescription("View your list of active reminders")),

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
