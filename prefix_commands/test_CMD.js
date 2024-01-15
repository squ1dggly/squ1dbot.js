const { Client, PermissionFlagsBits, Message } = require("discord.js");
const { BetterEmbed } = require("../modules/discordTools");
const jt = require("../modules/jsTools");

/** @type {import("../configs/typedefs").PrefixCommandExports} */
module.exports = {
    name: "test",
    description: "A command for testing",

    options: { userPermissions: PermissionFlagsBits.KickMembers },

    /** @param {Client} client @param {Message} message @param {import("../configs/typedefs").PrefixCommandExtra} extra */
    execute: async (client, message) => {
        // Create the embed :: { COOKIE }
        let embed_test = new BetterEmbed({
            author: { user: message.author },
            description: "test as been tested"
        });

        // Reply to the user with the embed
        return await embed_test.reply(message, { allowedMentions: { repliedUser: false } });
    }
};
