const { Portfolio } = require('../../../database/models/index');

const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

class PortfolioMethods {
    /**
     * Обновление Портфолио - шаг 1.
     * Запрашивает новую фотографию для портфолио.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterPortfolioPhoto(ctx) {
        const { callbackQuery, session } = ctx;
        session.selectedIndex = callbackQuery.data.split('_')[3];
        session.tempMessage = await ctx.reply(
            `Отправьте новую фотографию для портфолио ${session.selectedIndex}:`
        );
        return ctx.wizard.next();
    }

    /**
     * Обновление Портфолио - шаг 2.
     * Обновляет фотографию в портфолио.
     * @param {object} ctx - Контекст Telegram.
     */

    static async savePortfolioPhoto(ctx) {
        const { session, message } = ctx;
        const largestPhoto = message.photo[message.photo.length - 1];
        const photoUrl = await ctx.telegram.getFileLink(largestPhoto.file_id);

        const fileIndex = session.selectedIndex;
        const fileName = `photoPortfolio_${fileIndex}.jpg`;
        const dirPath = path.join(process.cwd(), 'data', 'photo', 'portfolio');
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

        const fileUrl = `/data/photo/portfolio/${fileName}`;
        const existingPortfolio = await Portfolio.findOne({ key: fileIndex });

        if (existingPortfolio) {
            existingPortfolio.image = fileUrl;
            await existingPortfolio.save();
        } else {
            const portfolio = new Portfolio({
                image: fileUrl,
                key: fileIndex,
            });
            await portfolio.save();
        }

        session.tempMessage = await ctx.reply(`Фотография ${fileIndex} успешно обновлена.`);
        setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);

        return ctx.scene.leave();
    }
}

module.exports = PortfolioMethods;
