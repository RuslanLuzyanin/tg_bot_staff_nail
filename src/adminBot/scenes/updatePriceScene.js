const { Scenes } = require('telegraf');
const Price = require('../../database/models/price');

const updatePriceScene = new Scenes.WizardScene(
    'update_price',
    async (ctx) => {
        const { callbackQuery, session } = ctx;
        session.selectedIndex = callbackQuery.data.split('_')[3];
        session.tempMessage = await ctx.reply(
            `Отправьте новую фотографию для цены ${session.selectedIndex}:`
        );
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

        const existingPrice = await Price.findOne({ key: session.selectedIndex });

        if (existingPrice) {
            existingPrice.image = session.lastPhoto;
            await existingPrice.save();
        } else {
            const price = new Price({
                image: session.lastPhoto,
                key: session.selectedIndex,
            });
            await price.save();
        }

        session.tempMessage = await ctx.reply(`Фотография ${session.selectedIndex} успешно обновлена.`);
        setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);
        return ctx.scene.leave();
    }
);

module.exports = updatePriceScene;
