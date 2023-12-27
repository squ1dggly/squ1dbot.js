const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");

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
	let repeat_count = interaction.options.getInteger("repeat-count") || 0;

	// prettier-ignore
	// Check if the user provided a valid time
	try {
		let parsedTime = jt.parseTime(time);
		if (parsedTime < 5000) return await interaction.reply({
			content: "You cannot set a reminder that's less than 5 seconds.", ephemeral: true
		});
	} catch {
		return await interaction.reply({content: `\`${time}\` is not a valid time you can use.`, ephemeral: true});
	}

	await interaction.deferReply().catch(() => null);

	// prettier-ignore
	// Create and add the reminder to the database
	let reminder = await reminderManager.add(
		interaction.user.id, interaction.guild.id, channel.id,
		name, repeat, repeat_count, time
	);

	/* - - - - - { Send the Result } - - - - - */
	// prettier-ignore
	let embed_reminderAdd = new BetterEmbed({
		interaction, title: "Reminder Add",
		description: `Your next reminder will be <t:${reminder.timestamp}:R>.`
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
			interaction, title: "Reminder Delete",
			description: "You don't have any active reminders!"
		}).send();

		// Await the user's confirmation
		let confirmation = await awaitConfirm({
			interaction,
			description: `Are you sure you want to delete \`${reminderCount}\` reminders?`
		});

		if (!confirmation) return;

		// Delete all reminders for the user in the current guild
		await reminderManager.deleteAll(interaction.user.id, interaction.guild.id);
	} else {
		// prettier-ignore
		if (!await reminderManager.exists(id)) return await interaction.reply({
			content: `I couldn't find a reminder with the ID of \`${id}\`. Are you sure you got that right?`
		});

		// Delete the reminder
		await reminderManager.delete(id);
	}

	/* - - - - - { Send the Result } - - - - - */
	// prettier-ignore
	let embed_reminderDelete = new BetterEmbed({
		interaction, title: "Reminder Delete",
		description: reminderCount ? `You deleted \`${reminderCount}\` reminders.` : "Reminder deleted."
    });

	return await embed_reminderDelete.send();
}

/** @param {CommandInteraction} interaction */
async function subcommand_list(interaction) {
	let reminders = await reminderManager.fetchAll(interaction.user.id, interaction.guild.id);

	// prettier-ignore
	// Check if the user has any active reminders
	if (!reminders.length) return await new BetterEmbed({
		interaction, description: "You don't have any active reminders!"
	}).send();

	/* - - - - - { Create the Pages } - - - - - */
	let reminders_f = await Promise.all(
		chunk.map(async r => {
			// Fetch the notification channel from the guild
			let _channel = r.channel_id
				? interaction.guild.channels.cache.get(r.channel_id) ||
				  (await interaction.guild.channels.fetch(r.channel_id))
				: null;

			return "`$ID` **$NAME** $TIMESTAMP $REPEAT $CHANNEL"
				.replace("$NAME", r.name)
				.replace("$TIMESTAMP", `<t:${jt.msToSec(r.timestamp)}:R>`)
				.replace("$REPEAT", r.repeat ? "✅" : "⛔")
				.replace("$REPEAT_COUNT", r.repeat_count)
				.replace("$CHANNEL", _channel);
		})
	);

	let reminders_f_chunk = jt.chunk(reminders_f, 5);
	let embeds_reminderList = [];

	for (let i = 0; i < reminders_f_chunk.length; i++) {
		// Create the embed :: { REMINDER LIST }
		let embed = new BetterEmbed({
			interaction,
			title: "Reminder List",
			description: reminders_f_chunk[i].join("\n\n"),
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
	options: { icon: "⏰", deferReply: true },

	// prettier-ignore
	builder: new SlashCommandBuilder().setName("reminder")
        .setDescription("Configure your reminders")
    
        .addSubcommand(option => option.setName("add").setDescription("Add a new reminder")
            .addStringOption(option => option.setName("name")
                .setDescription("When am I reminding you about?")
                .setRequired(true))

            .addStringOption(option => option.setName("time")
                .setDescription("When should I remind you? | ex. \"1h\", \"30m\", \"1d\"")
                .setRequired(true))

            .addChannelOption(option => option.setName("channel")
                .setDescription("What channel do you want to be pinged in? Leave blank to be DM'd (optional)"))
            
            .addBooleanOption(option => option.setName("repeat")
                .setDescription("Do you wish to keep being reminded about this? (optional)"))
            
            .addIntegerOption(option => option.setName("repeat-count")
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
