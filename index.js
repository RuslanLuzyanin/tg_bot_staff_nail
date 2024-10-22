// Импортируем и запускаем бота userBot
const UserBot = require('./src/userBot/bot');
const userBot = new UserBot();
userBot.start();

// Импортируем и запускаем бота adminBot
const AdminBot = require('./src/adminBot/bot');
const adminBot = new AdminBot();
adminBot.start();

let isShuttingDown = false;

process.on('SIGINT', async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    await userBot.stop();
    process.exit(0);
});
