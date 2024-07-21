function setupInfoCommand(bot) {
    const message =
        'Доступные команды:\n' +
        '/start - Главное меню\n' +
        '/contact - Контакты для связи\n' +
        '/mywork - Мои работы\n\n' +
        'Попробуйте найти нужную команду';

    bot.command('info', (ctx) => {
        ctx.reply(message);
    });
    bot.on('message', (ctx) => {
        if (!ctx.message.text.startsWith('/')) {
            ctx.reply(message);
        }
    });
}

module.exports = { setupInfoCommand };
