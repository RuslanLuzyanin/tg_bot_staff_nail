const Portfolio = require('../../db/models/portfolio');
const DataBaseError = require('../../errors/dataBaseError');

/**
 * Класс, обрабатывающий команду /portfolio.
 */
class PortfolioCommand {
    static name = 'portfolio';

    /**
     * Создает экземпляр класса PortfolioCommand.
     * @param {object} ctx - Контекст телеграф.
     */
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * Обрабатывает команду /portfolio.
     * Загружает изображения из базы данных и отправляет их пользователю в виде медиагруппы.
     */
    async handle() {
        const portfolios = await Portfolio.find().catch((error) => {
            throw new DataBaseError('findPortfolioError', error);
        });
        const photoUrls = portfolios.map((portfolio) => portfolio.imageUrl);

        const { telegram, chat } = this.ctx;

        const replyPromise = this.ctx.reply('Мои работы:');
        const mediaGroupPromise = telegram.sendMediaGroup(
            chat.id,
            photoUrls.map((url) => ({ type: 'photo', media: url }))
        );

        await Promise.all([replyPromise, mediaGroupPromise]);
    }
}

module.exports = PortfolioCommand;
