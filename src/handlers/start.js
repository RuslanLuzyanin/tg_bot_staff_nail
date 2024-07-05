const { getMainMenu } = require('../utils/menu');

function setupStartCommand(bot) {
	bot.command('start', (ctx) => {
		ctx.reply('Выберите опцию:', getMainMenu());
	});
}

module.exports = { setupStartCommand };
