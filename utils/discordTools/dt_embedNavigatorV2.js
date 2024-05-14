/** @typedef {"short"|"shortJump"|"long"|"longJump"} PaginationType */

/** @typedef eN_paginationOptions
 * @property {PaginationType} type The type of navigation.
 * @property {boolean} useReactions Whether to use reactions instead of buttons.
 * @property {boolean} dynamic Whether to dynamically add the `Page Jump` button only when needed. */

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