const config = require('../../config/config');

class UserCallback {
    /**
     * Обрабатывает колбэк верификации пользователя.
     * Проверяет пользователя - Администратор он или нет.
     * @param {object} ctx - Контекст телеграф.
     */
    static async handleVerification(ctx) {
        const { id: userId } = ctx.from;
        const adminId = config.adminId;
        if (userId != adminId) {
            throw new Error('userIsNotAdminError');
        }
    }
}

module.exports = UserCallback;
