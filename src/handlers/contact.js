const { Markup } = require('telegraf');

function setupContactCommand(bot) {
    bot.command('contact', (ctx) => {
        const message = `Связаться со мной можно по этим ссылкам:`;
        const keyboard = Markup.inlineKeyboard([
            [
                Markup.button.url('Telegram', `https://t.me/staff_nail`),
                Markup.button.url('Instagram', 'https://www.instagram.com/staff_nail'),
            ],
            [
                Markup.button.url('YouTube', 'https://www.youtube.com/@staff_nail'),
                Markup.button.url('WhatsApp', 'https://wa.me/79523825280'),
            ],
        ]);

        ctx.reply(message, keyboard);
    });
}

module.exports = { setupContactCommand };
