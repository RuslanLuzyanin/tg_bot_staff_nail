const { Markup } = require('telegraf');

/**
 * Константа, содержащая приветственное сообщение для пользователя.
 * @type {string}
 */
const START_MESSAGE = 'Приветик 👋 Для работы с ботом нажми кнопку «Начать»';

/**
 * Константа, содержащая клавиатуру с кнопкой "Начать".
 * @type {Markup.InlineKeyboardMarkup}
 */
const START_KEYBOARD = Markup.inlineKeyboard([Markup.button.callback('Начать', 'user_verification')]);

/**
 * Класс, обрабатывающий команду /start.
 */
class StartCommand {
    static name = 'start';

    /**
     * Создает экземпляр класса StartCommand.
     * @param {object} ctx - Контекст телеграф.
     */
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * Обрабатывает команду /start.
     * Отправляет приветственное сообщение с кнопкой "Начать" пользователю.
     */
    async handle() {
        await this.ctx.reply(START_MESSAGE, START_KEYBOARD);
    }
}

module.exports = StartCommand;
