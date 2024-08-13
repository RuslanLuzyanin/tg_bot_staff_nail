const User = require('../../models/User');
const moment = require('moment');

class UserCallback {
    /**
     * Создает экземпляр класса UserCallback.
     * @param {object} ctx - Контекст телеграф.
     * @param {object} logger - Объект логгера.
     */
    constructor(ctx, logger) {
        this.ctx = ctx;
        this.logger = logger;
    }

    /**
     * Обрабатывает колбэк верификации пользователя.
     * Сохраняет или обновляет информацию о пользователе в базе данных.
     * @param {object} ctx - Контекст телеграф.
     */
    handleVerification = async () => {
        const { id: userId, first_name: userName } = this.ctx.from;
        const { id: chatId } = this.ctx.chat;

        let user = await User.findOne({ id: userId });

        if (!user) {
            user = new User({ id: userId, name: userName, chatId: chatId });
            await user.save();
        } else {
            user.name = userName;
            user.chatId = chatId;
            await user.save();
        }

        this.logger.info(
            'Информация о пользователе успешно сохранена в базу данных'
        );
    };
}

module.exports = UserCallback;
