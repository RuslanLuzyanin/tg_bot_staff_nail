const { Scenes } = require('telegraf');
const Portfolio = require('../../database/models/portfolio');
/**
 * Сцена для обновления портфолио.
 * @type {Scenes.WizardScene}
 */
const updatePortfolioScene = new Scenes.WizardScene(
    'update_portfolio',
    /**
     * Обрабатывает первый шаг сцены - запрашивает новую фотографию для портфолио.
     * @param {object} ctx - Объект контекста Telegram.
     * @returns {Promise<number>} - Возвращает следующий шаг сцены.
     */
    async (ctx) => {
        const { callbackQuery, session } = ctx;
        session.selectedIndex = callbackQuery.data.split('_')[3];
        session.tempMessage = await ctx.reply(
            `Отправьте новую фотографию для портфолио ${session.selectedIndex}:`
        );
        return ctx.wizard.next();
    },
    /**
     * Обрабатывает второй шаг сцены - обновляет фотографию в портфолио.
     * @param {object} ctx - Объект контекста Telegram.
     * @returns {Promise<object>} - Возвращает объект сцены.
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

        const existingPortfolio = await Portfolio.findOne({ key: session.selectedIndex });

        if (existingPortfolio) {
            existingPortfolio.image = session.lastPhoto;
            await existingPortfolio.save();
        } else {
            const portfolio = new Portfolio({
                image: session.lastPhoto,
                key: session.selectedIndex,
            });
            await portfolio.save();
        }

        session.tempMessage = await ctx.reply(`Фотография ${session.selectedIndex} успешно обновлена.`);
        setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);
        return ctx.scene.leave();
    }
);

module.exports = updatePortfolioScene;
