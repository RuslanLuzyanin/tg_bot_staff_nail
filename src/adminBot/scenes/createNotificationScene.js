const { Scenes } = require('telegraf');
const Notification = require('../../database/models/notification');
/**
 * Сцена для создания нового оповещения.
 * @type {Scenes.WizardScene}
 */
const createNotificationScene = new Scenes.WizardScene(
    'create_notification',
    /**
     * Первый шаг сцены - запрос текста оповещения.
     * @param {Telegraf.Context} ctx - Контекст Telegram бота.
     * @returns {Promise<number>} - Следующий шаг сцены.
     */
    async (ctx) => {
        const { session } = ctx;
        session.tempMessage = await ctx.reply('Введите текст оповещения:');
        return ctx.wizard.next();
    },
    /**
     * Второй шаг сцены - запрос фотографии для оповещения.
     * @param {Telegraf.Context} ctx - Контекст Telegram бота.
     * @returns {Promise<number>} - Следующий шаг сцены.
     */
    async (ctx) => {
        const { session, message } = ctx;
        session.lastMessage = message.text;
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        session.tempMessage = await ctx.reply('Отправьте фотографию для оповещения:');
        return ctx.wizard.next();
    },
    /**
     * Третий шаг сцены - сохранение оповещения в базе данных.
     * @param {Telegraf.Context} ctx - Контекст Telegram бота.
     * @returns {Promise<void>} - Выход из сцены.
     */
    async (ctx) => {
        const { session, message } = ctx;
        const largestPhoto = message.photo[message.photo.length - 1];
        const photoUrl = await ctx.telegram.getFileLink(largestPhoto.file_id);
        const response = await fetch(photoUrl);
        const arrayBuffer = await response.arrayBuffer();
        session.lastPhoto = Buffer.from(arrayBuffer);

        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        await Notification.findOneAndUpdate(
            {},
            {
                messageNotification: session.lastMessage,
                photoNotification: session.lastPhoto,
            },
            { upsert: true }
        );

        session.tempMessage = await ctx.reply('Оповещение успешно создано.');
        setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);

        return ctx.scene.leave();
    }
);

module.exports = createNotificationScene;
