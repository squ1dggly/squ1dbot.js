const { Schema, model } = require("mongoose");

const schema_guild = new Schema(
	{
		_id: { type: String, require: true },

		prefix: { type: String, default: "" },

		timestamp_joined: { type: Number, default: Date.now() }
	},
	{ collection: "guilds" }
);

module.exports = {
	schema: schema_guild,
	model: model("guilds", schema_guild)
};
