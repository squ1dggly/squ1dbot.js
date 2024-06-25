const { Client, CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { BetterEmbed } = require("../../utils/discordTools");
const jt = require("../../utils/jsTools");
const fetch = require("node-fetch");

const games = [findTheEggplant, truthOrDare];

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
	rows[jt.randomNumber(0, row_length_multiplier)][jt.randomNumber(0, row_length_multiplier)] = "||🍆||";

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
		dare: new ButtonBuilder({ custom_id: "btn_dare", label: "Dare", style: ButtonStyle.Secondary })
	};

	// Create the action row
	let ar = new ActionRowBuilder().addComponents(buttons.truth, buttons.dare);

	// Send the message
	let message = await interaction.reply({ components: [ar], fetchReply: true });

	// https://api.truthordarebot.xyz/v1/truth
	// https://api.truthordarebot.xyz/v1/dare
	// https://api.truthordarebot.xyz/v1/wyr
	// https://api.truthordarebot.xyz/v1/nhie
	// https://api.truthordarebot.xyz/v1/paranoia

	/* - - - - - { Collect Interactions } - - - - - */
	let collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		idle: jt.parseTime("30s")
	});

	collector.on("collect", async i => {
		await i.deferUpdate().catch(() => null);

		switch (i.customId) {
			case "btn_truth":
				// Fetch a random truth
				let res_truth = await fetch("https://api.truthordarebot.xyz/v1/truth").then(res => res.json());
				// Send the message
				return await i.reply({ content: res_truth.question });

			case "btn_dare":
				// Fetch a random dare
				let res_dare = await fetch("https://api.truthordarebot.xyz/v1/dare").then(res => res.json());
				// Send the message
				return await i.reply({ content: res_dare.question });
		}
	});

	collector.on("end", async () => {
		if (!message.editable) return;

		// Disable the buttons
		for (i = 0; i < message.components[0].components.length; i++) {
			message.components[0].components[i].data.disabled = true;
		}

		// Edit the message
		return await message.edit({ components: message.components });
	});
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
