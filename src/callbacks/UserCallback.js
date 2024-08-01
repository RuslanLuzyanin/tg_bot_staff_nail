const User = require('../../models/User');

class UserCallback {
    constructor(ctx) {
        this.ctx = ctx;
    }
    /**
     * Обрабатывает колбек "Записаться на приём".
     *
     * Получает ID пользователя из контекста, сохраняет его в сессию и добавляет/обновляет
     * информацию о пользователе в БД.
     *
     * @param {object} ctx - Контекст телеграф.
     */
    async handleRecordUser(ctx) {
        const userId = ctx.update.callback_query.from.id;
        ctx.session.userId = userId;

        try {
            const existingUser = await User.findOne({ id: userId });
            if (!existingUser) {
                const newUser = new User({
                    id: userId,
                    name: ctx.update.callback_query.from.first_name,
                    phone: '456',
                });
                await newUser.save();
            }
        } catch (error) {
            throw new Error('Ошибка  при  сохранении  пользователя  в  БД:', error);
        }
    }

    /**
     * Очищает значение ID пользователя в сессии.
     *
     * @param {object} ctx - Контекст телеграф.
     */
    async clearIdUser(ctx) {
        ctx.session.userId = null;
    }
}

module.exports = UserCallback;
