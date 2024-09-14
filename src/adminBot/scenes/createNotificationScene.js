const { Scenes } = require('telegraf');
const Notification = require('../../database/models/notification');

const createNotificationScene = new Scenes.WizardScene(
    'create_notification',
    async (ctx) => {
        const { session } = ctx;
        session.tempMessage = await ctx.reply('Введите текст оповещения:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const { session, message } = ctx;
        session.lastMessage = message.text;
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        session.tempMessage = await ctx.reply('Отправьте фотографию для оповещения:');
        return ctx.wizard.next();
    },
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
