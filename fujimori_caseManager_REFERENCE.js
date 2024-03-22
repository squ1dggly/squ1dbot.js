const {
	Client,
	CommandInteraction,
	SlashCommandBuilder,
	ChannelType,
	TextChannel,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType
} = require("discord.js");

const { BetterEmbed } = require("../utils/discordTools");
const caseManager = require("../utils/mongo");
const jt = require("../utils/jsTools");

let collectors = {
	dms: null
};

/** @param {Client} client @param {CommandInteraction} interaction */
async function cmd_create(client, interaction) {
	let case_message = interaction.options.getString("message");

	// Check if the user's already in a modmail session

	/// Create a new modmail session
	// Create a new mailData object
	let modMailCaseData = {
		id: jt
			.alphaNumericString(9)
			.match(/.{1,3}/g)
			.join("-"),
		userID: interaction.user.id,
		ticketChannelID: "",
		replied: false
	};

	try {
		// Create a new modmail ticket channel in the guild
		let guild = client.guilds.cache.get("977892336967221268");
		let channel_modMailCase = await guild.channels.create({
			name: `modmail-${modMailCaseData.id}`,
			type: ChannelType.GuildText
		});

		// Move the new channel to the proper category
		await channel_modMailCase.setParent("1073148648600379402");
		// Set the description of the new channel
		await channel_modMailCase.setTopic(
			`channel for ${interaction.user.username} to ask for help!`
		);

		// Set ModMailData's channel ID
		modMailCaseData.ticketChannelID = channel_modMailCase.id;

		// Save the case to Mongo
		let case_number = await caseManager.add(modMailCaseData);

		/// Create the embeds
		let embed_reply = new BetterEmbed({
			interaction,
			description: `your message has been sent to <#${channel_modMailCase.id}>`
		});

		let embed_modMail = new BetterEmbed({
			title: `${interaction.user.username} has created a ticket!`,
			description: `a new ticket has been created in <#${channel_modMailCase.id}>\n${case_message}`,
			footer: {
				text: `${modMailCaseData.id} (Case ${case_number}) | ${interaction.user.id}`
			},
			showTimestamp: true
		});

		// prettier-ignore
		// Create the button
		let button_reply = new ButtonBuilder({ label: "reply", style: ButtonStyle.Success, customId: "btn_reply" });
		// prettier-ignore
		let button_close = new ButtonBuilder({ label: "close", style: ButtonStyle.Danger, customId: "btn_close" });

		// Create the action row
		let actionRow_main = new ActionRowBuilder().addComponents(button_reply, button_close);
		let actionRow_dms = new ActionRowBuilder().addComponents(button_close);

		// Respond to the user
		let message_dms = await embed_reply.send({ components: [actionRow_dms] });
		collectButtonInteractions(client, message_dms, modMailCaseData, channel_modMailCase);

		// prettier-ignore
		// Send the embed to the new channel
		let message_admin = await channel_modMailCase.send({ embeds: [embed_modMail], components: [actionRow_main] });
		collectButtonInteractions(client, message_admin, modMailCaseData, channel_modMailCase);

		startReply_dms(
			client,
			interaction.user,
			message_dms.channel,
			channel_modMailCase,
			modMailCaseData
		);
	} catch (err) {
		console.error(err);
	}
}

async function collectButtonInteractions(client, message, modMailCaseData, channel) {
	let collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button
	});

	collector.on("collect", async i => {
		await i.deferUpdate();

		// prettier-ignore
		switch (i.customId) {
			case "btn_reply": return await startReply_admin(client, i, modMailCaseData.id);

			case "btn_close":
				try {
					await i.channel.send({ content: "case has been closed!" });
				} catch {}

				collector.stop();	
				return await case_close(modMailCaseData.id, channel);
		}
	});

	collector.on("end", async () => {
		// return await case_close(modMailCaseData.id, channel);
	});
}

/** @param {Client} client * @param {CommandInteraction} interaction */
async function startReply_admin(client, interaction, caseID) {
	// Create embed :: { ERROR }
	let embed_error = new BetterEmbed({
		interaction,
		description: "Your case ID is not a valid case ID!!"
	});

	// Check if this is a valid case ID
	let modMailCaseData = await caseManager.get(caseID);
	if (!modMailCaseData) return embed_error.send({ ephemeral: true });

	// Fetch the user
	let case_user = await client.users.fetch(modMailCaseData.userID);

	// prettier-ignore
	if (!case_user) return embed_error.send({
		description: "this user doesn't exist in the database!", ephemeral: true
	});

	try {
		// Respond to the interaction
		await interaction.channel.send({ content: "response time has started" });
	} catch {}

	// Start a message collector
	let filter = msg => msg.author.id === interaction.user.id;
	let collector = interaction.channel.createMessageCollector({ filter, time: 30000 });

	// When the collector ends
	collector.on("collect", async message => {
		collector.resetTimer();

		// Check if the user closed the ticket
		if (message.content.trim().toLowerCase() === "!!close") {
			// Get the case's channel
			let _channel = await message.guild.channels.fetch(modMailCaseData.ticketChannelID);

			// Close the case ticket
			await case_close(modMailCaseData.id, _channel);
		}

		// Create an embed :: { REPLY }
		let embed_response = new BetterEmbed({
			title: { text: `message from ${message.author.username}` },
			description: `${message.content}`,
			showTimestamp: true
		});

		embed_response.setThumbnail(interaction.user.avatarURL());

		try {
			// Send the embed to the user's DMs
			await case_user.send({ embeds: [embed_response] });
			// Add a reaction to the message saying it was sent
			await message.react("👍");
		} catch (err) {
			console.error(err);
			collector.stop();
		}
	});

	// When the collector ends
	collector.on("end", async collected => {
		// do whatever when the collector ends
		try {
			await interaction.channel.send({ content: "response time has ended" });
		} catch {}
	});
}

async function startReply_dms(client, user, channel_dms, channel_modmail, modMailCaseData) {
	let filter = msg => msg.author.id === user.id;
	let collector = channel_dms.createMessageCollector({ filter });
	collectors.dms = collector;

	// When the collector ends
	collector.on("collect", async message => {
		collector.resetTimer();

		if (message.author.id === channel_modmail.guild.members.me.id) return;

		// Check if the user closed the ticket
		if (message.content.trim().toLowerCase() === "!!close") {
			// Close the case ticket
			await case_close(modMailCaseData.id, channel_modmail);
		}

		// Create an embed :: { REPLY }
		let embed_reply = new BetterEmbed({
			channel: channel_modmail,
			title: { text: `message from ${message.author.username}` },
			description: `${message.content}`,
			showTimestamp: true
		});

		embed_reply.setThumbnail(user.avatarURL());

		try {
			// Send the embed to the user's DMs
			await embed_reply.send({ sendMethod: "channel" });
			// Add a reaction to the message saying it was sent
			await message.react("👍");
		} catch (err) {
			console.error(err);
			collector.stop();
		}
	});
}

/** @param {TextChannel} channel */
async function case_close(caseID, channel = null) {
	collectors.dms.stop();
	collectors.dms = null;

	// Remove the case from Mongo
	await caseManager.remove(caseID);

	// Delete the channel
	try {
		await channel.delete();
	} catch (err) {
		// Log error message
		console.error(err);
	}
}

/**
 * @param {Client} client
 * @param {CommandInteraction} interaction */
async function cmd_reply(client, interaction) {}

module.exports = {
	builder: new SlashCommandBuilder()
		.setName("modmail")
		.setDescription("Modmail commands")

		// prettier-ignore
		.addSubcommand(subcommand =>
			subcommand
				.setName("create")
				.setDescription("Create a ticket for the modmail system")

				.addStringOption(option =>
					option
						.setName("message")
						.setDescription("Enter a message to mail the staff")
						.setRequired(true)
				)
		)

		// prettier-ignore
		.addSubcommand(subcommand =>
			subcommand
				.setName("reply")
				.setDescription("Discuss a topic about your issue with the staff members")

				.addStringOption(option =>
					option
						.setName("message")
						.setDescription("Enter a message to be sent")
						.setRequired(true)
				)
		)

		// prettier-ignore
		.addSubcommand(subcommand =>
			subcommand
				.setName("mail")
				.setDescription("Mail the user with a reply")

				.addStringOption(option =>
					option
						.setName("caseid")
						.setDescription("Search for a specific case")
						.setRequired(true)
				)
		),

	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		// prettier-ignore
		switch (interaction.options.getSubcommand()) {
			case "create": return await cmd_create(client, interaction);
			case "mail": return await startReply_admin(client, interaction);
			default: return;
		}
	}
};