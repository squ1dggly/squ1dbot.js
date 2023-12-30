const { Schema, model } = require("mongoose");

const schema_reminder = new Schema(
	{
		_id: { type: String, require: true },

		message_trigger: { type: String, require: true },
		user_id: { type: String, require: true },
		guild_id: { type: String, require: true },

		reminder_data: {
			user_id: "",
			guild_id: "",
			channel_id: "",

			enabled: true,

			name: "",
			repeat: false,
			limit: null,
			timestamp: null,
			time: "",

			assist_type: 0,
			assist_bot_id: "",
			assist_command_name: "",
			assist_message_content: [],
			assist_message_content_includes_name: false,

			created: Date.now()
		}
	},
	{ collection: "reminder_triggers" }
);

module.exports = {
	schema: schema_reminder,
	model: model("reminder_triggers", schema_reminder)
};
