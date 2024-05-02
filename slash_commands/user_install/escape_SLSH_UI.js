const { Client, CommandInteraction } = require("discord.js");
const { BetterEmbed } = require("../../utils/discordTools");
const jt = require("../../utils/jsTools");

/** @type {import("../../configs/typedefs").RawCommandExports} */
module.exports = {
    category: "Fun",
    options: { icon: "🍪" },

    commandData: {
        name: "escape",
        description: "An escape for when Med's tired of our bullshit",
        type: 1,
        integration_types: [0, 1],
        context: [0, 1, 2],
    },

    /** @param {Client} client @param {CommandInteraction} interaction */
    execute: async (client, interaction) => {
        // Create an array of responses
        let choices = [
            "What's up, **$USER_NAME**! Have a cookie! :cookie:",
            "Hey, **$USER_NAME**! Have a glass of milk! :milk:"
        ];

        // Create the embed :: { COOKIE }
        let embed_escape = new BetterEmbed({
            context: { interaction },
            description: jt.choice(choices)
        });

        // Reply to the interaction with the embed
        return await embed_escape.send(interaction);
    }
};
