const { Schema, model } = require("mongoose");

const schema_reminder = new Schema(
	{
		_id: { type: String, require: true },

		message_trigger: { type: String, require: true },
		user_id: { type: String, require: true },
		guild_id: { type: String, require: true },

		created: { type: Number, default: Date.now() },

		reminder_data: {
			user_id: { type: String, require: true },
			guild_id: { type: String, require: true },
			channel_id: { type: String, require: true },

			enabled: { type: Boolean, default: true },

			name: { type: String, require: true },
			repeat: { type: Boolean, default: false },
			limit: { type: Number, default: null },
			raw_time: { type: String, default: null }
		}
	},
	{ collection: "reminder_triggers" }
);

module.exports = {
	schema: schema_reminder,
	model: model("reminder_triggers", schema_reminder)
};
