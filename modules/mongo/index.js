/*** @file Connects us to our Mongo database so we can save and retrieve data. */

const mongoose = require("mongoose");
const logger = require("../logger");

const models = {
	reminder: require("../../models/reminderModel").model
};

const MONGO_URI = process.env.MONGO_URI || require("../../configs/config_client.json").MONGO_URI;

module.exports = {
	models,

	guildManager: require("./guildManager"),
	reminderManager: require("./reminderManager"),

	/** Connect to MongoDB */
	connect: async (uri = MONGO_URI) => {
		// Try to connect to MongoDB
		let connection = await new Promise((resolve, reject) => {
			return mongoose
				.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
				.then(() => resolve(true))
				.catch(err => reject(err));
		});

		// Log the success if connected
		if (connection) return logger.success("Successfully connected to MongoDB");

		// Log the error if the connection failed
		logger.error("Failed to connect to MongoDB", null, connection);
	},

	/** Ping MongoDB */
	ping: async () => {
		if (!mongoose.connection) return "n/a";

		let before = Date.now();
		await mongoose.connection.db.admin().ping();
		let after = Date.now();

		return after - before;
	}
};
