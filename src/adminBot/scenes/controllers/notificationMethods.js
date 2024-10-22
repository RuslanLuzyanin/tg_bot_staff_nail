const { Notification } = require('../../../database/models/index');

const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

class NotificationMethods {
    /**
     * Создание нового оповещения - шаг 1.
     * Запрос текста оповещения.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterNotificationText(ctx) {
        const { session } = ctx;
        session.tempMessage = await ctx.reply('Введите текст оповещения:');
        return ctx.wizard.next();
    }

    /**
     * Создание нового оповещения - шаг 2.
     * Запрос фотографии для оповещения.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterNotificationPhoto(ctx) {
        const { session, message } = ctx;
        session.lastMessage = message.text;
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        session.tempMessage = await ctx.reply('Отправьте фотографию для оповещения:');
        return ctx.wizard.next();
    }

    /**
     * Создание нового оповещения - шаг 3.
     * Сохранение оповещения в базе данных.
     * @param {object} ctx - Контекст Telegram.
     */

    static async saveNotification(ctx) {
        const { session, message } = ctx;
        const largestPhoto = message.photo[message.photo.length - 1];
        const photoUrl = await ctx.telegram.getFileLink(largestPhoto.file_id);

        const fileName = 'notificationPhoto.jpg';
        const dirPath = path.join(process.cwd(), 'data', 'photo', 'notification');

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const filePath = path.join(dirPath, fileName);

        const response = await fetch(photoUrl);
        const webStream = response.body;
        const nodeStream = Readable.fromWeb(webStream);
        const fileStream = fs.createWriteStream(filePath);
        await new Promise((resolve, reject) => {
            nodeStream.pipe(fileStream);
            nodeStream.on('error', reject);
            fileStream.on('finish', resolve);
        });

        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        const fileUrl = `/data/photo/notification/${fileName}`;
        await Notification.findOneAndUpdate(
            {},
            { messageNotification: session.lastMessage, photoNotification: fileUrl },
            { upsert: true }
        );

        session.tempMessage = await ctx.reply('Оповещение успешно создано.');
        setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);

        return ctx.scene.leave();
    }
}

module.exports = NotificationMethods;
