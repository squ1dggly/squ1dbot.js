/** @typedef {"short"|"shortJump"|"long"|"longJump"} PaginationType */

/** @typedef eN_paginationOptions
 * @property {PaginationType} type The type of navigation.
 * @property {boolean} useReactions Whether to use reactions instead of buttons.
 * @property {boolean} dynamic Whether to dynamically add the `Page Jump` button only when needed. */

/** @typedef eN_selectMenuOptionData
 * @property {string} emoji The emoji to be displayed to the left of the option.
 * @property {string} label The main text to be displayed.
 * @property {string} description The description to be displayed.
 * @property {string} value The index of the option.
 * @property {string} isDefault Whether this is the default option. */

/** @typedef eN_options
 * @property {CommandInteraction|import("discord.js").Channel|Message} handler ***REQUIRED*** to send the navigator.
 * @property {GuildMember|User|Array<GuildMember|User>} userAccess Other users that are allowed to use the navigator. ***(optional)***
 * @property {EmbedBuilder|BetterEmbed} embeds The embeds to paginate through.
 * @property {boolean} selectMenuEnabled Enables the select menu.
 *
 * *Only visible if options are added.*
 * @property {eN_paginationOptions} pagination Pagination configuration options.
 * @property {number|string|null} timeout How long to wait before timing out. Use `null` to never timeout.
 *
 * This utilizes `jsTools.parseTime()`, letting you also use "10s", "1m", or "1m 30s" for example. */

/** @typedef eN_sendOptions
 * @property {ActionRowBuilder|ActionRowBuilder[]} components The components to send with the embed
 * @property {import("discord.js").MessageMentionOptions} allowedMentions The allowed mentions of the message.
 * @property {import("./dT_dynaSend").SendMethod} sendMethod The method to send the embed.
 *
 * **1.** By default, "reply" is used if a `CommandInteraction` is provided as the handler. If "reply" fails, "editReply" is used.
 *
 * **2.** By default, "sendToChannel" is used if a `Channel` is provided as the handler.
 *
 * **3.** By default, "messageReply" is used if a `Message` is provided as the handler.
 * @property {boolean} ephemeral If the message should be ephemeral. This only works for the "reply" `SendMethod`.
 * @property {number|string} deleteAfter The amount of time to wait in **MILLISECONDS** before deleting the message. */
