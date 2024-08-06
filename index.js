const TelegramBot = require('./src/bot');

const bot = new TelegramBot();

let isShuttingDown = false;

bot.start();
/* Выключил чтобы не заебывало

process.on('SIGINT', async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log('Получен сигнал SIGINT. Остановка бота...');
    await bot.stop();
    console.log('Бот остановлен.');
    process.exit(0);
});
*/
