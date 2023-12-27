/** @file Executed as soon as the bot's connected to Discord @author xsqu1znt */

const { Client } = require("discord.js");
const { reminderManager } = require("../../modules/mongo");
const logger = require("../../modules/logger");
const jt = require("../../modules/jsTools");

module.exports = {
	name: "reminderInterval",
	event: "ready",

	/** @param {Client} client  */
	execute: async client => {
		const checkRemindersInGuild = async guildID => {
			// Fetch the active reminders in the guild
			let reminders = await reminderManager.fetchAllActiveInGuild(guildID);
			if (!reminders.length) return;

			for (let reminder of reminders) {
				// Check if the reminder is repeating
				if (reminder.repeat) {
					// Check if repeat is set to a limit
					if (reminders.repeat_count > 0)
						// Subtract the repeat count
						reminderManager.update(reminder._id, { $increment: { repeat_count: -1 } });
					// Delete the reminder
					else reminderManager.delete(reminder._id);
				}
				// Delete the reminder
				else reminderManager.delete(reminder._id);
			}
		};
	}
};
