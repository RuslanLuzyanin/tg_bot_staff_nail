const { Price } = require('../../../database/models/index');

const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

class PriceMethods {
    /**
     * Обновление прайс-листа - шаг 1.
     * Запрашивает новую фотографию для прайс-листа.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterPricePhoto(ctx) {
        const { callbackQuery, session } = ctx;
        session.selectedIndex = callbackQuery.data.split('_')[3];
        session.tempMessage = await ctx.reply(
            `Отправьте новую фотографию для цены ${session.selectedIndex}:`
        );
        return ctx.wizard.next();
    }

    /**
     * Обновление прайс-листа - шаг 2.
     * Обновляет фотографию в прайс-листа.
     * @param {object} ctx - Контекст Telegram.
     */

    static async savePricePhoto(ctx) {
        const { session, message } = ctx;

        if (!message.photo || message.photo.length === 0) {
            await ctx.reply('Ошибка: фотография не найдена. Пожалуйста, отправьте фотографию снова.');
            return ctx.wizard.selectStep(ctx.wizard.cursor - 1);
        }

        const largestPhoto = message.photo[message.photo.length - 1];
        const photoUrl = await ctx.telegram.getFileLink(largestPhoto.file_id);

        const fileIndex = session.selectedIndex;
        const fileName = `photoPrice_${fileIndex}.jpg`;
        const dirPath = path.join(process.cwd(), 'data', 'photo', 'price');

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

        const fileUrl = `/data/photo/price/${fileName}`;
        const existingPrice = await Price.findOne({ key: fileIndex });

        if (existingPrice) {
            existingPrice.image = fileUrl;
            await existingPrice.save();
        } else {
            const price = new Price({
                image: fileUrl,
                key: fileIndex,
            });
            await price.save();
        }

        session.tempMessage = await ctx.reply(`Фотография ${fileIndex} успешно обновлена.`);
        setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);

        return ctx.scene.leave();
    }
}

module.exports = PriceMethods;
