const { Client, CommandInteraction, SlashCommandBuilder } = require("discord.js");

const { BetterEmbed, awaitConfirm } = require("../modules/discordTools");
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

	// Create and add the reminder to the database
	let reminder = await reminderManager.add(
		interaction.user.id,
		interaction.guild.id,
		channel.id,
		name,
		repeat,
		repeat_count,
		jt.parseTime(time, { fromNow: true })
	);

	/* - - - - - { Send the Result } - - - - - */
	// prettier-ignore
	let embed_newReminder = new BetterEmbed({
		interaction, title: "Reminder Add",
		description: `Your next reminder will be <t:${reminder.timestamp}:R>.`
    });

	return await embed_newReminder.send();
}

/** @param {CommandInteraction} interaction */
async function subcommand_delete(interaction) {
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

		// Delete all reminders for the user in the current guild
		await reminderManager.delete(interaction.user.id, interaction.guild.id);
	} else await reminderManager.delete(id);

	/* - - - - - { Send the Result } - - - - - */
	// prettier-ignore
	let embed_newReminder = new BetterEmbed({
		interaction, title: "Reminder Delete",
		description: reminderCount ? `You deleted \`${reminderCount}\` reminders.` : "Reminder deleted."
    });

	return await embed_newReminder.send();
}

/** @param {CommandInteraction} interaction */
async function subcommand_list(interaction) {}

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
