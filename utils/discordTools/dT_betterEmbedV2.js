/** @typedef bE_author
 * @property {GuildMember|User|null} context The `GuildMember` or `User` that will be used for automatic context formatting.
 *
 * *NOTE:* There is no reason to provide this unless:
 *
 * **1.** Context was not provided during initialization.
 *
 * **2.** The provided context was a `Channel`.
 *
 * **3.** The author of the provided context is different from the author of the `Embed`.
 * @property {string|null} text The text to be displayed.
 * @property {string|boolean|null} icon The icon to be displayed on the top left of the `Embed`.
 *
 * If set to `true`, will use the provided `context` user's avatar.
 * @property {string|null} hyperlink If provided, will turn the `Embed`'s AUTHOR text into a hyperlink. */
/** @typedef {bE_author|string|null} bE_author */

/** @typedef bE_title
 * @property {string|null} text The text to be displayed.
 * @property {string|null} hyperlink If provided, will turn the `Embed`'s TITLE text into a hyperlink. */
/** @typedef {bE_title|string|null} bE_title */

/** @typedef bE_footer
 * @property {string|null} text The text to be displayed.
 * @property {string|null} iconURL The icon to be displayed on the bottom left of the `Embed`. */
/** @typedef {bE_footer|string|null} bE_footer */

/** @typedef bE_options
 * @property {{interaction:CommandInteraction, channel:TextChannel, message:Message}} context Can be provided for automated context formatting.
 * @property {bE_author} author The AUTHOR of the `Embed`.
 * @property {bE_title} title The TITLE of the `Embed`.
 * @property {string|null} thumbnailURL The thumbnail to be displayed on the top right of the `Embed`.
 * @property {string|null} description The text to be displayed inside of the `Embed`.
 * @property {string|null} imageURL The image to be displayed inside of the `Embed`.
 * @property {bE_footer} footer The footer to be displayed at the bottom of the `Embed`.
 * @property {string|string[]|null} color The color of the `Embed`.
 * @property {bE_timestamp} timestamp The timestamp to be displayed to the right of the `Embed`'s footer.
 *
 * If set to `true`, will use the current time.
 * @property {import("discord.js").APIEmbedField|import("discord.js").APIEmbedField[]} fields The FIELDS of the `Embed`.
 * @property {boolean} disableAutomaticContext If `true`, will disable automatic context formatting for this `Embed`. */

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
 * @property {bE_title} title Preforms a non-mutative change to the `Embed`'s TITLE.
 * @property {string} thumbnailURL Preforms a non-mutative change to the `Embed`'s THUMBNAIL.
 * @property {string} description Preforms a non-mutative change to the `Embed`'s DESCRIPTION.
 * @property {string} imageURL Preforms a non-mutative change to the `Embed`'s IMAGE.
 * @property {bE_footer} footer Preforms a non-mutative change to the `Embed`'s FOOTER.
 * @property {string|string[]} color Preforms a non-mutative change to the `Embed`'s COLOR.
 *
 * @property {ActionRowBuilder|ActionRowBuilder[]} components The components to send with the embed
 * @property {import("discord.js").MessageMentionOptions} allowedMentions The allowed mentions of the message.
 * @property {import("./dT_dynaSendV2").SendMethod} sendMethod The method to send the embed.
 *
 * **1.** By default, "reply" is used if a `CommandInteraction` is provided as the handler. If "reply" fails, "editReply" is used.
 *
 * **2.** By default, "sendToChannel" is used if a `Channel` is provided as the handler.
 *
 * **3.** By default, "messageReply" is used if a `Message` is provided as the handler.
 * @property {boolean} ephemeral If the message should be ephemeral. This only works for the "reply" `SendMethod`.
 * @property {number|string} deleteAfter The amount of time to wait in **MILLISECONDS** before deleting the message.
 *
 * This utilizes `jsTools.parseTime()`, letting you also use "10s", "1m", or "1m 30s" for example.
 * @property {boolean} fetchReply Whether to return the `Message` object after sending. `true` by default. */

// prettier-ignore
const { CommandInteraction, GuildMember, User, Message, EmbedBuilder, ActionRowBuilder } = require("discord.js");
const dynaSend = require("./dT_dynaSendV2");
const logger = require("../logger");
const jt = require("../jsTools");

const config = require("./dT_config.json");

class BetterEmbed {
	#embed = new EmbedBuilder();

	#init_data = {
		context: { interaction: null, channel: null, message: null },
		author: { user: null, text: null, icon: null, hyperlink: null },
		title: { text: null, hyperlink: null },
		thumbnailURL: null,
		imageURL: null,
		description: null,
		footer: { text: null, iconURL: null },
		color: config.EMBED_COLOR || null,
		timestamp: null,
		fields: null,
		disableAutomaticContext: false
	};

	/** @param {string} str */
	#_applyContextFormatting(str) {
		if (!str) return null;

		return str
			.replace(/(?<!\\)\$USER\b/g, this.data.author.context)
			.replace(/(?<!\\)\$USERNAME\b/g, this.data.author.context?.user?.username || this.data.author.context.username);
	}

	#_parseData() {
		/* - - - - - { Cleanup Shorthand Configurations } - - - - - */
		if (this.data.fields) this.data.fields = jt.forceArray(this.data.fields);

		// prettier-ignore
		if (typeof this.data.author === "string")
			this.data.author = { user: null, text: this.data.author, icon: null, hyperlink: null };
		else if (!this.data.author)
			this.data.author = { user: null, text: null, icon: null, hyperlink: null };

		// prettier-ignore
		if (typeof this.data.title === "string")
			this.data.title = { text: this.data.title, hyperlink: null };
		else if (!this.data.title)
			this.data.title = { text: null, hyperlink: null };

		// prettier-ignore
		if (typeof this.data.footer === "string")
			this.data.footer = { text: this.data.footer, iconURL: null };
		else if (!this.data.footer)
            this.data.footer = { text: null, iconURL: null };

		/* - - - - - { Context } - - - - - */
		// If no author context was provided, use the interaction's author
		if (!this.data.author.context && this.data.context.interaction)
			this.data.author.context = this.data.context.interaction.member;

		// If no author context was provided, use the message's author
		if (!this.data.author.context && this.data.context.message)
			this.data.author.context = this.data.context.message?.member || this.data.context.message?.author;

		/* - - - - - { Formatting } - - - - - */
		if (!this.data.disableAutomaticContext) {
			this.data.author.text = this.#_applyContextFormatting(this.data.author.text);
			this.data.title.text = this.#_applyContextFormatting(this.data.title.text);
			this.data.description = this.#_applyContextFormatting(this.data.description);
			this.data.footer.text = this.#_applyContextFormatting(this.data.footer.text);
		}
	}

	/** @param {{}} options Configure with temporary data. */
	#_configure(options) {
		const execute = () => {
			// this.#_setAuthor();
			// this.#_setTitle();
			// this.#_setThumbnail();
			// this.#_setDescription();
			// this.#_setImage();
			// this.#_setFooter();
			// this.#_setColor();
			// this.#_setTimestamp();
		};

		if (options) {
			let _prev = structuredClone(this.data);

			this.data = { ...this.data, ...data };
			this.#_parseData();
			execute();
			this.data = _prev;
			return;
		}

		this.#_parseData();
		execute();
	}

	/** A better version of the classic `EmbedBuilder`.
	 * - **`$USER`**: *author's mention (@xsqu1znt)*
	 *
	 * - **`$USERNAME`**: *author's display name or username*
	 * @param {bE_options} options */
	constructor(options) {
		this.data = { ...this.#init_data, ...options };
		this.#_configure();
	}

	/** Returns a new `BetterEmbed` with the same configuration.
	 * - **`$USER`**: *author's mention (@xsqu1znt)*
	 *
	 * - **`$USERNAME`**: *author's display name or username*
	 * @param {bE_options} options */
	clone(options) {
		return new BetterEmbed({ ...this.options, ...options });
	}

	/** Serializes this builder to API-compatible JSON data.
	 *
	 * @remarks
	 * This method runs validations on the data before serializing it. As such, it may throw an error if the data is invalid.
	 */
	toJSON() {
		return this.#embed.toJSON();
	}

	/** Set the embed's description.
	 * @param {string|null} description The text to be displayed inside of the `Embed`. */
	setDescription(description = this.data.description) {
		if (!this.data.disableAutomaticContext) description = this.#_applyContextFormatting(description);

		this.#embed.setDescription(description);
		this.data.description = description;

		return this;
	}

	/** Set the embed's image.
	 * @param {string|null} url The image to be displayed inside of the `Embed`. */
	setImage(url = this.data.imageURL) {
		url = url.toLowerCase().trim();

		// wrapping in a try-catch checks if the URL is valid
		try {
			this.#embed.setImage(url);
		} catch {
			logger.error("[BetterEmbed]: Failed to configure", `INVALID_IMAGEURL | '${this.options.imageURL}'`);
			return this;
		}

		this.data.imageURL = url;
		return this;
	}
}

module.exports = BetterEmbed;
