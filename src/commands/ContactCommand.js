const { Markup } = require('telegraf');
const MenuService = require('../services/MenuService');

class ContactCommand {
    static name = 'contact';
    constructor(ctx) {
        this.ctx = ctx;
    }

    async handle() {
        const menuData = [
            { text: 'Telegram', url: 'https://t.me/staff_nail' },
            { text: 'Instagram', url: 'https://www.instagram.com/staff_nail' },
            { text: 'YouTube', url: 'https://www.youtube.com/@staff_nail' },
            { text: 'WhatsApp', url: 'https://wa.me/79523825280' },
        ];

        const keyboard = Markup.inlineKeyboard(MenuService.createMenu(menuData, 2, 'url'));

        await this.ctx.reply('Связаться со мной можно по этим ссылкам:', keyboard);
    }
}

module.exports = ContactCommand;
