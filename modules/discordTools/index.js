const config = require("./dT_config.json");

const { Message } = require("discord.js");

const BetterEmbed = require("./dT_betterEmbed");
const EmbedNavigator = require("./dT_embedNavigator");

const deleteMessageAfter = require("./dT_deleteMessageAfter");
const awaitConfirm = require("./dT_awaitConfirm");
const dynaSend = require("./dT_dynaSend");
const ansi = require("./dT_ansi");

const jt = require("../jsTools");

/* Check config file for errors */
// prettier-ignore
if (isNaN(jt.parseTime(config.timeouts.PAGINATION)))
	throw new Error("You must provide a valid time string/number for \`timeouts.PAGINATION\`. Fix this in '_dT_config.json'");
// prettier-ignore
if (!config.timeouts.CONFIRMATION)
	throw new Error("You must provide a valid time string/number for \`timeouts.CONFIRMATION\`. Fix this in '_dT_config.json'");
// prettier-ignore
if (!config.timeouts.ERROR_MESSAGE)
	throw new Error("You must provide a valid time string/number for \`timeouts.ERROR_MESSAGE\`. Fix this in '_dT_config.json'");

// prettier-ignore
for (let [key, val] of Object.entries(config.navigator.buttons)) if (!val.TEXT) throw new Error(
	`\`${key}.TEXT\` is an empty value; This is required to be able to use EmbedNavigator. Fix this in \'_dT_config.json\'`
);

/** Returns an array of the entire content of the provided message split by each word
 * @param {Message} message `message`
 * @param {Number|null} embedDepth amount of `embeds` to parse in the `message` | `null` (unlimited) is default */
function messageContentToArray(message, embedDepth = null) {
	let content = [];

	if (message.content) content.push(...message.content.toLowerCase().split(" "));

	if (message?.embeds?.length) {
		// Go through the embeds
		for (let embed of message.embeds.slice(0, embedDepth ? embedDepth : message.embeds.length)) {
			if (embed?.title) content.push(...embed.title.split(" "));
			if (embed?.author?.name) content.push(...embed.author.name.split(" "));

			if (embed?.description) content.push(...embed.description.split(" "));

			if (embed?.fields?.length) {
				for (let field of embed.fields) {
					if (field?.name) content.push(...field.name.split(" "));
					if (field?.value) content.push(...field.value.split(" "));
				}
			}

			if (embed?.footer?.text) content.push(...embed.footer.text.split(" "));
		}
	}

	// Parse and return content
	return content.map(str => str.trim().toLowerCase()).filter(str => str);
}

module.exports = {
	BetterEmbed,
	EmbedNavigator,

	messageContentToArray,
	deleteMessageAfter,
	awaitConfirm,
	dynaSend,

	markdown: {
		ansi,
		link: (label, url, tooltip = "") => `[${label}](${url}${tooltip ? ` "${tooltip}"` : ""})`
	}
};
