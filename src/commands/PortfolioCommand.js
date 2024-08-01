const Portfolio = require('../../models/Portfolio');

class PortfolioCommand {
    static name = 'portfolio';
    constructor(ctx) {
        this.ctx = ctx;
    }
    async handle() {
        try {
            const portfolios = await Portfolio.find();
            const photoUrls = portfolios.map((portfolio) => portfolio.imageUrl);

            if (this.ctx.from.id === this.ctx.message.from.id) {
                await this.ctx.reply('Мои работы:');
                await this.ctx.telegram.sendMediaGroup(
                    this.ctx.chat.id,
                    photoUrls.map((url) => ({ type: 'photo', media: url }))
                );
            } else {
                await this.ctx.reply('Эта команда доступна только тому, кто ее вызвал.');
            }
        } catch (error) {
            console.error('Ошибка при обработке команды "Портфолио":', error);
        }
    }
}

module.exports = PortfolioCommand;
