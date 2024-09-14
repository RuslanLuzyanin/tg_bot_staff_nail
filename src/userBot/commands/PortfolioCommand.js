const Portfolio = require('../../database/models/portfolio');

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
        const portfolios = await Portfolio.find().sort({ key: 1 });
        const { telegram, chat } = this.ctx;

        const mediaGroup = portfolios
            .filter((portfolio) => portfolio.image)
            .map((portfolio) => ({
                type: 'photo',
                media: { source: portfolio.image },
            }));

        if (mediaGroup.length > 0) {
            await this.ctx.reply('Мои работы:');
            await telegram.sendMediaGroup(chat.id, mediaGroup);
        } else {
            await this.ctx.reply('Портфолио пока не загружено.');
        }
    }
}

module.exports = PortfolioCommand;
