const { Price } = require('../../database/models/index');

const path = require('path');
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
        const prices = await Price.find().sort({ key: 1 });
        const { telegram, chat } = this.ctx;

        const mediaGroup = prices
            .filter((price) => price.image)
            .map((price) => {
                const filePath = path.join(process.cwd(), price.image);
                return { type: 'photo', media: { source: filePath } };
            });

        if (mediaGroup.length > 0) {
            await this.ctx.reply('Мои цены:');
            await telegram.sendMediaGroup(chat.id, mediaGroup);
        } else {
            await this.ctx.reply('Прайс-лист пока не загружен.');
        }
    }
}

module.exports = PriceCommand;
