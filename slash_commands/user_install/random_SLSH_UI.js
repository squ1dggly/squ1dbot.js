const { Client, CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { BetterEmbed } = require("../../utils/discordTools");
const jt = require("../../utils/jsTools");
const fetch = require("node-fetch");

const games = [findTheEggplant, truthOrDare, redditMeme];

/** @param {Client} client @param {CommandInteraction} interaction */
async function findTheEggplant(client, interaction) {
	// Determine the row length
	const row_length_multiplier = jt.randomNumber(3, 6);

	// Generate spoiler rows
	let rows = [];
	for (let i = 0; i < row_length_multiplier; i++) {
		rows.push(Array(row_length_multiplier).fill("||⬛||"));
	}

	// Add the eggplant to a random X and Y position
	rows[jt.randomNumber(0, row_length_multiplier - 1)][jt.randomNumber(0, row_length_multiplier - 1)] = "||🍆||";

	// Create the embed :: { EGGPLANT }
	let embed_eggplant = new BetterEmbed({
		title: "Find the 🍆",
		description: rows.map(r => r.join(" ")).join("\n")
	});

	// Send the message
	return await embed_eggplant.send(interaction);
}

/** @param {Client} client @param {CommandInteraction} interaction */
async function truthOrDare(client, interaction) {
	// Create the buttons
	let buttons = {
		truth: new ButtonBuilder({ custom_id: "btn_truth", label: "Truth", style: ButtonStyle.Secondary }),
		dare: new ButtonBuilder({ custom_id: "btn_dare", label: "Dare", style: ButtonStyle.Secondary }),
		wyr: new ButtonBuilder({ custom_id: "btn_wyr", label: "Would You Rather", style: ButtonStyle.Secondary }),
		nhie: new ButtonBuilder({ custom_id: "btn_nhie", label: "Never Have I Ever", style: ButtonStyle.Secondary }),
		paranoia: new ButtonBuilder({ custom_id: "btn_paranoia", label: "Paranoia", style: ButtonStyle.Secondary })
	};

	// Create the action row
	let ar = new ActionRowBuilder().addComponents(...Object.values(buttons));

	// Send the message
	let message = await interaction.reply({ components: [ar], fetchReply: true });

	/* - - - - - { Collect Interactions } - - - - - */
	let collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		idle: jt.parseTime("30s")
	});

	collector.on("collect", async i => {
		await i.deferUpdate().catch(() => null);

		let operation = i.customId.split("_")[1];

		// Send a GET request to the API
		return await fetch(`https://api.truthordarebot.xyz/v1/${operation}`)
			.then(async res => {
				res = await res.json();

				let operation_type = "";

				// prettier-ignore
				// Format the operation type into a readable string
				switch (operation) {
					case "truth": operation_type = "Truth"; break;
					case "dare": operation_type = "Dare"; break;
					case "wyr": operation_type = "Would You Rather?"; break;
					case "nhie": operation_type = "Never Have I Ever..."; break;
					case "paranoia": operation_type = "Paranoia"; break;
				}

				// Create the embed :: { TRUTH OR DARE }
				let embed_truthOrDare = new BetterEmbed({
					context: { interaction: i },
					author: { text: operation_type, icon: true },
					description: res.question
				});

				// Send the message
				return await embed_truthOrDare.send(i, { sendMethod: "followUp" });
			})
			.catch(async () => {
				// Send an error message
				return await i
					.followUp({ content: "An error has occurred. Please try again later.", ephemeral: true })
					.catch(() => null);
			});
	});

	collector.on("end", async () => {
		if (!message.editable) return;

		buttons.truth.setDisabled(false);
		buttons.dare.setDisabled(false);
		buttons.wyr.setDisabled(false);
		buttons.nhie.setDisabled(false);
		buttons.paranoia.setDisabled(false);

		// Edit the message
		return await message.edit({ components: [ar] }).catch(() => null);
	});
}

/** @param {Client} client @param {CommandInteraction} interaction */
async function redditMeme(client, interaction) {
	// Defer the interaction
	await interaction.deferReply().catch(() => null);

	// Send a GET request to the API
	let res = await fetch("https://meme-api.com/gimme").then(res => res.json());

	// Create the embed :: { MEME }
	let embed_meme = new BetterEmbed({
		title: { text: res.title, hyperlink: res.postLink },
		imageURL: res.url,
		footer: `r/${res.subreddit} | 👍 ${res.ups}`
	});

	// Send the message
	return await embed_meme.send(interaction);
}

/** @type {import("../../configs/typedefs").RawCommandExports} */
module.exports = {
	category: "USER_INSTALL",
	options: { hidden: true },

	commandData: {
		name: "random",
		description: "Random fun things I guess",
		type: 1,
		integration_types: [0, 1],
		contexts: [0, 1, 2]
	},

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		return await jt.choice(games)(client, interaction);
	}
};
