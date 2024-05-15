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

// prettier-ignore
const { CommandInteraction, TextChannel, GuildMember, User, Message, InteractionCollector, ReactionCollector, ComponentType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const deleteMesssageAfter = require("./dT_deleteMessageAfter");
const BetterEmbed = require("./dT_betterEmbed");
const dynaSend = require("./dT_dynaSend");

const logger = require("../logger");
const jt = require("../jsTools");

const config = require("./dT_config.json");

// Get the name of each pagination reaction
// this will be used as a filter when getting the current reactions from the message
const reactionNames = Object.values(config.navigator.buttons).map(btnData => btnData.emoji.NAME);

function createButton(data, id) {
	let button = new ButtonBuilder({ style: ButtonStyle.Secondary, custom_id: id });

	if (data.TEXT) button.setLabel(data.TEXT);
	else if (data.emoji.ID) button.setEmoji(data.emoji.ID);
	else
		throw new Error(
			"[EmbedNavigator>createButton] You must provide text or an emoji ID for this navigator button in '_dT_config.json'."
		);

	return button;
}

class EmbedNavigator {
	/** A utility to create pagination between multiple embeds using `Reactions`, `Buttons`, and or `SelectMenus`.
	 * @param {CommandInteraction|import("discord.js").Channel|Message} handler ***REQUIRED*** to send the message.
	 *
	 * The type of handler depends on the `SendMethod` you choose to use.
	 *
	 * **1.** `CommandInteraction` is required for `Interaction` based `SendMethods`.
	 *
	 * **2.** `Channel` is required for the "sendToChannel" `SendMethod`.
	 *
	 * **3.** `Message` is required for `Message` based `SendMethods`.
	 * @param {eN_options} options */
	constructor(handler, options) {
		this.options = {
			userAccess: [],
			embeds: [],
			selectMenuEnabled: false,
			pagination: { type: "", useReactions: false, dynamic: false },
			...options
		};

		/* - - - - - { Error Checking } - - - - - */
		if (this.options?.pagination?.useReactions)
			// prettier-ignore
			for (let [key, val] of Object.entries(config.navigator.buttons)) {
				if (!val.emoji.ID) throw new Error(`[EmbedNavigator]: \`${key}.ID\` is an empty value; This is required to be able to add it as a reaction. Fix this in \'_dT_config.json\'.`);
				if (!val.emoji.NAME) throw new Error(`[EmbedNavigator]: \`${key}.NAME\` is an empty value; This is required to determine which reaction a user reacted to. Fix this in \'_dT_config.json\'.`);
            }

		if (!this.options.embeds || (Array.isArray(this.options.embeds) && !this.options.embeds.length))
			throw new Error("[EmbedNavigator]: You must provide at least 1 embed");

		/* - - - - - { Parse Options } - - - - - */
		this.options.userAccess = jt.forceArray(this.options.userAccess);
		this.options.embeds = jt.forceArray(this.options.embeds);

		this.data = {
			pages: {
				/** @type {EmbedBuilder|BetterEmbed} */
				current: null,
				nestedLength: 0,
				idx: { current: 0, nested: 0 }
			},

			selectMenu: { optionValues: [] },

			pagination: {
				/** @type {{NAME:string, ID:string}[]} */
				reactions: [],
				required: false,
				canUseLong: false,
				canJump: false
			},

			collectors: {
				/** @type {InteractionCollector} */
				component: null,
				/** @type {ReactionCollector} */
				reaction: null
			},

			actionRows: {
				selectMenu: new ActionRowBuilder(),
				pagination: new ActionRowBuilder()
			},

			components: {
				selectMenu: new StringSelectMenuBuilder()
					.setCustomId("ssm_pageSelect")
					.setPlaceholder(config.navigator.DEFAULT_SELECT_MENU_PLACEHOLDER),

				pagination: {
					to_first: createButton(config.navigator.buttons.to_first, "btn_to_first"),
					back: createButton(config.navigator.buttons.back, "btn_back"),
					jump: createButton(config.navigator.buttons.jump, "btn_jump"),
					next: createButton(config.navigator.buttons.next, "btn_next"),
					to_last: createButton(config.navigator.buttons.to_last, "btn_to_last")
				}
			},

			/** @type {Message} */
			message: null,
			messageComponents: []
		};

		// Add the StringSelectMenuBuilder component to the select menu action row
		this.data.actionRows.selectMenu.setComponents(this.data.components.selectMenu);
	}

	/** Add new options to the select menu.
     * @param {...eN_selectMenuOptionData} options */
	addSelectMenuOptions(...options) {
		for (let data of options) {
			/* - - - - - { Error Checking } - - - - - */
			if (Array.isArray(data))
				throw new TypeError("[EmbedNavigator>addSelectMenuOptions]: You can't pass an array as an argument.");

			if (!data.emoji && !data.label)
				throw new Error("[EmbedNavigator>addSelectMenuOptions]: You must provide either an emoji or label.");

			/* - - - - - { Configure and Add Option } - - - - - */
			let idx_current = this.data.selectMenu.optionValues.length;
			let idx_new = this.data.selectMenu.optionValues.length + 1;

			data = {
				emoji: "",
				label: `page ${idx_new}`,
				description: "",
				value: `ssm_o_${idx_new}`,
				isDefault: idx_current === 0 ? true : false,
				...data
			};

			// Add the new option ID (value) to our selectMenuOptionValues array
			this.data.selectMenu.optionValues.push(data.value);

			// Create a new StringSelectMenuOption
			let ssm_option = new StringSelectMenuOptionBuilder();

			// Configure options
			if (data.emoji) ssm_option.setEmoji(data.emoji);
			if (data.label) ssm_option.setLabel(data.label);
			if (data.description) ssm_option.setDescription(data.description);
			if (data.value) ssm_option.setValue(data.value);
			if (data.isDefault) ssm_option.setDefault(data.isDefault);

			// Add the new StringSelectMenuOption to the SelectMenu
			this.data.components.selectMenu.addOptions(ssm_option);
		}
	}
}

module.exports = EmbedNavigator;
