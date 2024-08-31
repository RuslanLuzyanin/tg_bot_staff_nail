const Price = require('../../db/models/price');

/**
 * Класс, обрабатывающий команду /price.
 */
class PriceCommand {
    static name = 'price';

    /**
     * Создает экземпляр класса PriceCommand.
     * @param {object} ctx - Контекст телеграф.
     */
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * Обрабатывает команду /price.
     * Загружает изображения из базы данных и отправляет их пользователю в виде медиагруппы.
     */
    async handle() {
        const prices = await Price.find().catch((error) => {
            throw new DataBaseError('findPriceError', error);
        });
        const priceUrls = prices.map((prices) => prices.imageUrl);

        const { telegram, chat } = this.ctx;

        const replyPromise = this.ctx.reply('Мои цены:');
        const mediaGroupPromise = telegram.sendMediaGroup(
            chat.id,
            priceUrls.map((url) => ({ type: 'photo', media: url }))
        );

        await Promise.all([replyPromise, mediaGroupPromise]);
    }
}

module.exports = PriceCommand;
