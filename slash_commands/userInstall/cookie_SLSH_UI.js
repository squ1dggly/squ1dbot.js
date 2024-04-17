const { Client, CommandInteraction } = require("discord.js");
const { BetterEmbedV2 } = require("../../utils/discordTools");
const jt = require("../../utils/jsTools");

/** @type {import("../configs/typedefs").SlashCommandExports} */
module.exports = {
	category: "USER_INSTALL",
	options: { hidden: true },

	// prettier-ignore
	data: {
        name: "fuck",
        description: "What the fuck do you want?",
        integration_types: [1],
        contexts: [0, 1, 2]
    },

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		// Create an array of responses
		let choices = [
			"Why hello there, **$USERNAME**!",
			"Why goodbye there.",
			"Fuck off, you little shit.",
			"Now who the flying fuck are you?",
			"After all these years, you still never cease to amaze me with how pathetic you are.",
			"I didn't ask to be fucked, now did I?",
			"I'm going to go fuck myself.",
			"I can't even catch a break from you for 3 FUCKING SECONDS? Now you have to bother me outside of the server too?",
			"What are you? A breadstick? Because you're acting like a dipshit to me.",
			"Fuck you. Suck a baguette. You dipshit.",
			"Shut the fuck up."
		];

		// Create the embed :: { COOKIE }
		let embed_cookie = new BetterEmbedV2({
			context: { interaction },
			description: jt.choice(choices)
		});

		// Reply to the interaction with the embed
		return await embed_cookie.send(interaction);
	}
};
