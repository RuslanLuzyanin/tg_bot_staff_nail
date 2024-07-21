const createMenu = require('../utils/createMenu');

const menuItems = {
    bookAppointment: { text: 'Записаться на приём', callback: 'book_appointment' },
    cancelAppointment: { text: 'Отменить запись', callback: 'cancel_appointment' },
    checkAppointment: { text: 'Проверить запись', callback: 'check_appointment' },
};

const menu = createMenu(menuItems, 2);

function showMainMenu(ctx) {
    if (ctx.updateType === 'callback_query') {
        ctx.editMessageText('Главное меню:', menu);
    } else {
        ctx.reply('Главное меню:', menu);
    }
}

function setupStartCommand(bot) {
    bot.command('start', (ctx) => {
        ctx.reply('Главное меню:', menu);
    });
}

module.exports = { setupStartCommand, showMainMenu };
