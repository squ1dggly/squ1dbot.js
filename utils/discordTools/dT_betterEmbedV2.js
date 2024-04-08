/** @typedef bE_author
 * @property {GuildMember|User|null} user The `User` or `GuildMember` that will be used for contextual information.
 * @property {string|null} text The text to be displayed.
 * @property {string|boolean|null} iconURL The icon to be displayed on the top left of the `Embed`.
 * @property {string|null} linkURL If provided, will turn the `Embed`'s AUTHOR text into a hyperlink. */
/** @typedef {bE_author|string|null} bE_author */

/** @typedef bE_title
 * @property {string|null} text The text to be displayed.
 * @property {string|null} linkURL If provided, will turn the `Embed`'s TITLE text into a hyperlink. */
/** @typedef {bE_title|string|null} bE_title */

/** @typedef bE_footer
 * @property {string|null} text The text to be displayed.
 * @property {string|null} iconURL The icon to be displayed on the bottom left of the `Embed`. */
/** @typedef {bE_footer|string|null} bE_footer */

/** @typedef {string|null} bE_thumbnailURL The thumbnail to be displayed on the top right of the `Embed`. */
/** @typedef {string|null} bE_description The text to be displayed inside of the `Embed`. */
/** @typedef {string|null} bE_imageURL The image to be displayed inside of the `Embed`. */
/** @typedef {string|string[]|null} bE_color The color of the `Embed`. */
/** @typedef {number|boolean|Date|null} bE_timestamp The timestamp to be displayed to the right of the `Embed`'s footer. */

/** @typedef bE_options
 * @property {CommandInteraction} interaction Must be provided if using `Interaction` based `SendMethods`.
 * @property {bE_author} author The AUTHOR of the `Embed`.
 * @property {bE_title} title The TITLE of the `Embed`.
 * @property {bE_thumbnailURL} thumbnailURL The THUMBNAIL of the `Embed`.
 * @property {bE_description} description The DESCRIPTION of the `Embed`.
 * @property {string} imageURL The IMAGE of the `Embed`.
 * @property {bE_footer} footer The FOOTER of the `Embed`.
 * @property {bE_color} color The COLOR of the `Embed`.
 * @property {bE_timestamp} timestamp The TIMESTAMP of the `Embed`.
 * @property {import("discord.js").APIEmbedField|import("discord.js").APIEmbedField[]} fields The FIELDS of the `Embed`.
 * @property {boolean} disableFormatting If `true`, will disable automatic contextual formatting for this `Embed`. */

/** @typedef bE_sendOptions
 * @property {CommandInteraction|import("discord.js").Channel|Message} handler ***REQUIRED*** to send the embed.
 *
 * The type of handler depends on the `SendMethod` you choose to use.
 *
 * **1.** `CommandInteraction` is required for `Interaction` based `SendMethods`.
 *
 * **2.** `Channel` is required for the "sendToChannel" `SendMethod`.
 *
 * **3.** `Message` is required for `Message` based `SendMethods`.
 * @property {string} content The text content to send with the embed.
 *
 * @property {bE_author} author Preforms a non-mutative change to the `Embed`'s AUTHOR.
 * @property {string|{text:string, linkURL:string}} title Preforms a non-mutative change to the `Embed`'s TITLE.
 * @property {string} thumbnailURL Preforms a non-mutative change to the `Embed`'s THUMBNAIL.
 * @property {string} description Preforms a non-mutative change to the `Embed`'s DESCRIPTION.
 * @property {string} imageURL Preforms a non-mutative change to the `Embed`'s IMAGE.
 * @property {string|{text:string, iconURL:string}} footer Preforms a non-mutative change to the `Embed`'s FOOTER.
 * @property {string|string[]} color Preforms a non-mutative change to the `Embed`'s COLOR.
 * 
 * @property {ActionRowBuilder|ActionRowBuilder[]} components The components to send with the embed
 * @property {import("discord.js").MessageMentionOptions} allowedMentions The allowed mentions of the message.
 * @property {import("./dT_dynaSend").SendMethod} sendMethod The method to send the embed.
 *
 * **1.** By default, "reply" is used if a `CommandInteraction` is provided as the handler. If "reply" fails, "editReply" will be used.
 * 
 * **2.** By default, "sendToChannel" is used if a `Channel` is provided as the handler.
 * 
 * **3.** By default, "messageReply" is used if a `Message` is provided as the handler.
 * @property {boolean} ephemeral If the message should be ephemeral. This only works for the "reply" `SendMethod`.
 * @property {number|string} deleteAfter The amount of time to wait in **MILLISECONDS** before deleting the message.
 *
 * This utilizes `jsTools.parseTime()`, letting you also use "10s", "1m", or "1m 30s" for example.
 * @property {boolean} fetchReply Whether to return the `Message` object after sending. */

// * @property {import("./dT_dynaSend").SendMethod} sendMethod if `reply` fails, `editReply` will be used **|** `reply` is default
// prettier-ignore
const { CommandInteraction, GuildMember, User, Message, EmbedBuilder, ActionRowBuilder } = require("discord.js");

const config = require("./dT_config.json");
