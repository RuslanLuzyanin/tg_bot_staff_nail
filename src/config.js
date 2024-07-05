require('dotenv').config();

module.exports = {
	token: process.env.TELEGRAM_TOKEN,
	adminChatId: process.env.USER_ID,
};
