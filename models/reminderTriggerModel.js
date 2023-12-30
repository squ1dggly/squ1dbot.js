const { Schema, model } = require("mongoose");

const schema_reminder = new Schema(
	{
		_id: { type: String, require: true },

		message_trigger: { type: String, require: true },
		user_id: { type: String, require: true },
		guild_id: { type: String, require: true },

		reminder_data: {
			user_id: String,
			guild_id: String,
			channel_id: String,

			enabled: Boolean,

			name: String,
			repeat: Boolean,
			limit: Number,
			timestamp: Number,
			raw_time: String,

			assist_type: Number,
			assist_bot_id: String,
			assist_command_name: String,
			assist_message_content: Array,
			assist_message_content_includes_name: Boolean,

			created: Number
		}
	},
	{ collection: "reminder_triggers" }
);

module.exports = {
	schema: schema_reminder,
	model: model("reminder_triggers", schema_reminder)
};
