const { Client, Message } = require("discord.js");
const { BetterEmbed } = require("../modules/discordTools");
const jt = require("../modules/jsTools");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
    name: "prefix",
    description: "View/set the prefix",
    category: "Fun",

    options: { icon: "🍪" },

    /** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
    execute: async (client, message) => {
        // Create an array of responses
        let choices = [
            "What's up, **$USERNAME**! Have a cookie! :cookie:",
            "Hey, **$USERNAME**! Have a glass of milk! :milk:"
        ];

        // Create the embed :: { COOKIE }
        let embed_prefix = new BetterEmbed({
            author: { user: message.author },
            description: jt.choice(choices)
        });

        // Reply to the user with the embed
        return await embed_prefix.reply(message, { allowedMentions: { repliedUser: false } });
    }
};
