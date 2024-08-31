const User = require('../../db/models/user');
const DataBaseError = require('../../errors/dataBaseError');

class UserCallback {
    /**
     * Обрабатывает колбэк верификации пользователя.
     * Сохраняет или обновляет информацию о пользователе в базе данных.
     * @param {object} ctx - Контекст телеграф.
     */
    static async handleVerification(ctx, logger) {
        const { id: userId, first_name: userName } = ctx.from;
        const { id: chatId } = ctx.chat;

        let user = await User.findOne({ id: userId }).catch((error) => {
            throw new DataBaseError('findUserError', error);
        });

        if (!user) {
            user = new User({ id: userId, name: userName, chatId: chatId });
        } else {
            user.name = userName;
            user.chatId = chatId;
        }
        await user.save().catch((error) => {
            throw new DataBaseError('saveUserError', error);
        });
        logger.debug(
            'Информация о пользователе успешно сохранена в базу данных'
        );
    }
}

module.exports = UserCallback;
