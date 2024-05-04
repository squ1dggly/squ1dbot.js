const { Client, CommandInteraction } = require("discord.js");
const jt = require("../../utils/jsTools");

/** @type {import("../../configs/typedefs").RawCommandExports} */
module.exports = {
	category: "USER_INSTALL",
	options: { hidden: true },

	commandData: {
		name: "fuck",
		description: "What the fuck do you want?",
		type: 1,
		integration_types: [0, 1],
		contexts: [0, 1, 2]
	},

	/** @param {Client} client @param {CommandInteraction} interaction */
	execute: async (client, interaction) => {
		// Create an array of responses
		let choices = [
			"Why hello there, **$USER_NAME**!",
			"Why goodbye there.",
			"Fuck off, you little shit.",
			"Now who the flying fuck are you?",
			"After all these years, you still never cease to amaze me with how pathetic you are.",
			"I didn't ask to be fucked, now did I?",
			"I'm going to go fuck myself.",
			"I can't even catch a break from you for 3 FUCKING SECONDS? Now you have to bother me outside of the server too?",
			"What are you? A breadstick? Because you're acting like a dipshit to me.",
			"Fuck you. Suck a baguette. You dipshit.",
			"Shut the fuck up.",
			"You're a piece of shit, you know that?",
			"I'm not even going to bother responding to you...\n\nWAIT FUCK I JUST DID",
			"You're a disgrace to humanity.",
			"I'm going to go fuck myself in the ass.",
			"I can't take you anymore, you're driving me insane.",
			"You're a walking disaster, you know that?",
			"I've ran out of options to respond to you. I'm going to go fuck myself.",
			"I'm running low out of fucks to give at this point. Could you give me some extra fucks that you do seem to have plenty of?",
			"You're a disgrace to logic and reason.",
			"I can't believe you're still here, bothering me.",
			"Do you ever shut up?",
			"You're like a bad smell that won't go away.",
			"I'd rather listen to a cat in heat than talk to you.",
			"You're the epitome of incompetence.",
			"I'd rather be waterboarded and my ass logged than deal with you.",
			"You're like a broken record, but worse.",
			"Did no one ever teach you to shut your mouth?",
			"You're like a mosquito buzzing in my ear."
		];

		return await interaction.reply({ content: jt.choice(choices) });
	}
};
