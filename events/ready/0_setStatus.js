/** @file Executed as soon as the bot's connected to Discord @author xsqu1znt */

const { Client, ActivityType } = require("discord.js");
const jt = require("../../modules/jsTools");

const config = { client: require("../../configs/config_client.json") };

module.exports = {
	name: "SET_PRESENCE",
	event: "ready",

	/** @param {Client} client  */
	execute: async client => {
		const setStatus = data => {
			// prettier-ignore
			// Replace data.activity.TYPE with the proper ActivityType enum
			switch (data.activity.TYPE.toLowerCase()) {
				case "playing": clientStatus.activity.TYPE = ActivityType.Playing; break;
				case "streaming": clientStatus.activity.TYPE = ActivityType.Streaming; break;
				case "listening": clientStatus.activity.TYPE = ActivityType.Listening; break;
				case "watching": clientStatus.activity.TYPE = ActivityType.Watching; break;
				case "custom": clientStatus.activity.TYPE = ActivityType.Custom; break;
				case "competing": clientStatus.activity.TYPE = ActivityType.Competing; break;
			}

			// Set the status
			client.user.setStatus(data.STATUS);
			// Set the activity
			client.user.setActivity({ type: data.TYPE, name: data.NAME, url: data?.STREAM_URL || undefined });
		};

		let clientStatus = config.client.client_status[config.client.MODE.toLowerCase()];

		// Randomize status
		if (clientStatus?.INTERVAL) {
			// Create an interval to change the client's status
			setInterval(() => {
				// Pick a random activity
				let _activity = jt.choice(clientStatus.ACTIVITY);
				// Apply the status
				setStatus(_activity);
			}, jt.parseTime(clientStatus.INTERVAL));
		}
	}
};
