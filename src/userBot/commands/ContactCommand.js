const { Markup } = require('telegraf');
const MenuService = require('../../shared/services/menuService');

/**
 * Сообщение, которое будет отправлено пользователю при вызове команды /contact.
 */
const CONTACT_MESSAGE = 'Связаться со мной можно по этим ссылкам:';

/**
 * Данные для меню контактов.
 * Каждый элемент содержит текст кнопки и URL-адрес.
 */
const CONTACT_MENU_DATA = [
    { text: 'Telegram', url: 'https://t.me/staff_nail' },
    { text: 'Instagram', url: 'https://www.instagram.com/staff_nail' },
    { text: 'YouTube', url: 'https://www.youtube.com/@staff_nail' },
    { text: 'WhatsApp', url: 'https://wa.me/79523825280' },
];

/**
 * Клавиатура для меню контактов, созданная с помощью MenuService.
 */
const CONTACT_KEYBOARD = Markup.inlineKeyboard(
    MenuService.createMenu(CONTACT_MENU_DATA, 2, 'url')
);

/**
 * Класс, обрабатывающий команду /contact.
 */
class ContactCommand {
    static name = 'contact';

    /**
     * Создает экземпляр класса ContactCommand.
     * @param {object} ctx - Контекст телеграф.
     */
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * Обрабатывает команду /contact.
     * Отправляет сообщение с клавиатурой контактов.
     */
    async handle() {
        await this.ctx.reply(CONTACT_MESSAGE, CONTACT_KEYBOARD);
    }
}

module.exports = ContactCommand;
