const { Markup } = require('telegraf');
const MenuService = require('../services/MenuService');

class StartCommand {
    static name = 'start';
    constructor(ctx) {
        this.ctx = ctx;
        this.menuService = new MenuService();
    }

    async handle() {
        try {
            const menuData = [
                { text: 'Записаться на приём', callback: 'menu_book_appointment' },
                { text: 'Отменить запись', callback: 'menu_cancel_appointment' },
                { text: 'Проверить запись', callback: 'menu_check_appointment' },
            ];

            const keyboard = Markup.inlineKeyboard(this.menuService.createMenu(menuData));

            await this.ctx.reply('Добро пожаловать!', keyboard);
        } catch (error) {
            console.error('Ошибка при обработке команды "Start":', error);
        }
    }
}

module.exports = StartCommand;
