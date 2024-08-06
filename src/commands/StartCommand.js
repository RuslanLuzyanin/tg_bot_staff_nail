const { Markup } = require('telegraf');

class StartCommand {
    static name = 'start';

    constructor(ctx) {
        this.ctx = ctx;
    }

    async handle() {
        const message = 'Приветствую! Для работы с ботом нажмите кнопку "Начать".';
        const keyboard = Markup.inlineKeyboard([Markup.button.callback('Начать', 'user_verification')]);
        await this.ctx.reply(message, keyboard);
    }
}

module.exports = StartCommand;
