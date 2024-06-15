const { Client, CommandInteraction } = require("discord.js");
const { BetterEmbed } = require("../../utils/discordTools");
const { userManager } = require("../../utils/mongo");
const jt = require("../../utils/jsTools");

const config = { fuck: require("../../configs/config_fuck.json") };

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
		let customReply_used = false;
		let customReply_idx = null;
		let customReply_count = 0;
		let customReply_totalFound = 0;

		let reply = "";

		// Check if the user has custom replies
		for (let custom of config.fuck.replies_custom)
			if (interaction.user.id === custom.USER_ID) {
				// Check 5% chance of using a custom reply
				if (!jt.chance(5)) break;

				// Pick a random custom reply for the user
				customReply_idx = jt.choiceIndex(custom.REPLIES);
				customReply_count = custom.REPLIES.length;
				customReply_used = true;

				// Get the custom reply
				let _customReply = custom.REPLIES[customReply_idx];
				reply = _customReply.text;

				// Fetch the custom replies the current user has found, if any
				let _userData = await userManager._fetch(interaction.user.id, { custom_replies_found: 1 });

				if (_userData?.custom_replies_found) {
					customReply_totalFound = _userData.custom_replies_found.length;

					// Add the custom reply to the user's array if they haven't found it yet
					if (!(_userData.custom_replies_found || []).find(crf => crf.id === _customReply.id)) {
						// Add the reply to the user's custom replies found
						await userManager._update(
							interaction.user.id,
							{ $push: { custom_replies_found: _customReply } },
							true
						);

						// Increment local variable
						customReply_totalFound++;
					}
				} else {
					// Add the reply to the user's custom replies found
					await userManager._update(interaction.user.id, { $push: { custom_replies_found: _customReply } }, true);

					// Increment local variable
					customReply_totalFound++;
				}

				// End loop
				break;
			}

		// Pick a random reply if no custom reply was used
		reply ||= jt.choice(config.fuck.REPLIES_GENERAL);

		// Create the embed :: { FUCK }
		let embed_fuck = new BetterEmbed({
			context: { interaction },
			description: reply,
			author: customReply_used
				? {
						text: `Custom Reply #${customReply_idx}`,
						hyperlink: jt.choice(config.fuck.CUSTOM_REPLY_LINKS)
				  }
				: "FUCK",

			footer: customReply_used ? `found ${customReply_totalFound}/${customReply_count}` : "",

			color: customReply_used
				? "#FFCB47"
				: ["DarkRed", "Orange", "Greyple", "Aqua", "Navy", "White", "DarkButNotBlack", "LuminousVividPink"]
		});

		// Reply to the interaction with the embed
		return await embed_fuck.send(interaction);
	}
};
