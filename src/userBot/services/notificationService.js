const Notification = require('../../database/models/notification');
const User = require('../../database/models/user');

/**
 * Сервис для отправки уведомлений пользователям.
 */
class NotificationService {
    /**
     * Отправляет уведомления всем пользователям.
     *
     * @param {Telegraf} bot - Экземпляр бота Telegraf.
     */
    static async sendNotifications(bot) {
        const notification = await Notification.findOneAndDelete();

        if (!notification) return;

        const users = await User.find({}, { chatId: 1 });
        const mediaGroup = [
            {
                type: 'photo',
                media: { source: notification.photoNotification },
                caption: notification.messageNotification,
            },
        ];

        const messagePromises = users.map((user) => bot.telegram.sendMediaGroup(user.chatId, mediaGroup));
        await Promise.all(messagePromises);
    }
}

module.exports = NotificationService;
