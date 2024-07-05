const { token } = require('./config');
const { Telegraf, session } = require('telegraf');
const { setupStartCommand } = require('./handlers/start');
const { setupActions } = require('./handlers/actions');

const bot = new Telegraf(token);
bot.use(session());

setupStartCommand(bot);
setupActions(bot);

bot.launch();

module.exports = bot;
