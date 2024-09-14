// Импортируем и запускаем бота userBot
const UserBot = require('./src/userBot/bot');
const userBot = new UserBot();
userBot.start();

// Импортируем и запускаем бота adminBot
const AdminBot = require('./src/adminBot/bot');
const adminBot = new AdminBot();
adminBot.start();

let isShuttingDown = false;

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
