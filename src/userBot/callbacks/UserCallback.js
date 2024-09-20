const User = require('../../database/models/user');

class UserCallback {
    /**
     * Обрабатывает колбэк верификации пользователя.
     * Сохраняет или обновляет информацию о пользователе в базе данных.
     * @param {object} ctx - Контекст телеграф.
     */
    static async handleVerification(ctx) {
        const { id: userId, username, first_name, last_name } = ctx.from;
        const { id: chatId } = ctx.chat;

        let user = await User.findOne({ id: userId });

        if (user && user.isBanned) {
            throw new Error('userIsBannedError');
        }

        if (!user) {
            user = new User({
                id: userId,
                name: username,
                first_name: first_name,
                last_name: last_name,
                chatId: chatId,
            });
        } else {
            user.name = username;
            user.first_name = first_name;
            user.last_name = last_name;
            user.chatId = chatId;
        }
        await user.save();
    }
}

module.exports = UserCallback;
