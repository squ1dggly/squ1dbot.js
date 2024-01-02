const { Schema, model } = require("mongoose");

const schema_reminder = new Schema(
	{
		_id: { type: String, require: true },

		user_id: { type: String, require: true },
		guild_id: { type: String, require: true },
		channel_id: { type: String, require: true },

		enabled: { type: Boolean, default: true },

		name: { type: String, require: true },
		repeat: { type: Boolean, default: false },
		limit: { type: Number, default: null },
		timestamp: { type: Number, require: true },
		raw_time: { type: String, require: true },

		sync_type: { type: Number, default: 0 },
		sync_bot_id: { type: String, default: null },
		sync_command_name: { type: String, default: null },
		sync_message_content: { type: Array, default: [] },
		sync_message_content_includes_name: { type: Boolean, default: false },

		created: { type: Number, default: Date.now() }
	},
	{ collection: "reminders" }
);

module.exports = {
	schema: schema_reminder,
	model: model("reminders", schema_reminder)
};
