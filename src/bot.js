require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const config = require('./config');
const { setupStartCommand } = require('./handlers/start');
const { setupContactCommand } = require('./handlers/contact');
const { setupMyWorkCommand } = require('./handlers/mywork');
const { setupInfoCommand } = require('./handlers/info');
const BookAppointment = require('./handlers/bookAppointment');

const bot = new Telegraf(config.telegramToken);

setupStartCommand(bot);
setupContactCommand(bot);
setupMyWorkCommand(bot);
setupInfoCommand(bot);

const bookAppointment = new BookAppointment();

bot.start((ctx) => {
    ctx.reply('Главное меню:', {
        reply_markup: {
            inline_keyboard: [[{ text: 'Записаться на приём', callback_data: 'book_appointment' }]],
        },
    });
});

bot.on('callback_query', (ctx) => {
    const callbackData = ctx.callbackQuery.data;

    if (callbackData === 'book_appointment') {
        bookAppointment.startBooking(ctx);
    } else {
        bookAppointment.handleCallback(ctx);
    }
});

bot.launch();

module.exports = bot;
