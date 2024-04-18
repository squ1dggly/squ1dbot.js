const { Client, CommandInteraction } = require("discord.js");
const jt = require("../../utils/jsTools");

/** @type {import("../configs/typedefs").SlashCommandExports} */
module.exports = {
	category: "USER_INSTALL",
	options: { hidden: true },

	// prettier-ignore
	commandData: {
        name: "fuck",
        type: 1,
        description: "What the fuck do you want?",
        integration_types: [0, 1],
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

		return await interaction.reply({ content: jt.choice(choices) });
	}
};
