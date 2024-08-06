const Portfolio = require('../../models/Portfolio');

class PortfolioCommand {
    static name = 'portfolio';
    constructor(ctx) {
        this.ctx = ctx;
    }
    async handle() {
        const portfolios = await Portfolio.find();
        const photoUrls = portfolios.map((portfolio) => portfolio.imageUrl);

        const { from, message, telegram, chat } = this.ctx;

        if (from.id === message.from.id) {
            await ctx.reply('Мои работы:');
            await telegram.sendMediaGroup(
                chat.id,
                photoUrls.map((url) => ({ type: 'photo', media: url }))
            );
        } else {
            await ctx.reply('Эта команда доступна только тому, кто ее вызвал.');
        }
    }
}

module.exports = PortfolioCommand;
