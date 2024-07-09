const config = require('./config');
const { Telegraf, session } = require('telegraf');
const { setupStartCommand } = require('./handlers/start');
const { setupActions } = require('./handlers/actions');

const bot = new Telegraf(config.telegramToken);
bot.use(session());

setupStartCommand(bot);
setupActions(bot);

bot.launch();

module.exports = bot;
