const { adminId } = require('../../config/config');

/**
 * Класс для обработки сообщений.
 */
class MessageHandler {
    /**
     * Создает экземпляр MessageHandler.
     * @param {Object} ctx - Контекст сообщения.
     * @param {Object} bot - Экземпляр бота.
     */
    constructor(ctx, bot) {
        this.ctx = ctx;
        this.bot = bot;
    }

    /**
     * Обрабатывает текстовые сообщения.
     */
    async handleTextMessage() {
        const { from, message } = this.ctx;
        await this.bot.telegram.sendMessage(
            adminId,
            `Пользователь ${from.first_name} ${from.last_name} (@${from.username}) ${from.id} отправил сообщение: ${message.text}`
        );
        const messageUser = await this.ctx.reply('Ваше сообщение передано Администратору');
        setTimeout(() => this.ctx.deleteMessage(messageUser.message_id), 3000);
    }

    /**
     * Обрабатывает сообщения с фотографиями.
     */
    async handlePhotoMessage() {
        const { from, message } = this.ctx;
        const photo = await this.ctx.telegram.getFile(message.photo[message.photo.length - 1].file_id);
        console.log(photo);
        await this.bot.telegram.sendPhoto(adminId, photo.file_id, {
            caption: `Пользователь ${from.first_name} ${from.last_name} (@${from.username}) ${from.id} отправил фотографию`,
        });
        const messageUser = await this.ctx.reply('Ваша фотография передана Администратору');
        setTimeout(() => this.ctx.deleteMessage(messageUser.message_id), 3000);
    }

    /**
     * Обрабатывает голосовые сообщения.
     */
    async handleVoiceMessage() {
        const { from, message } = this.ctx;
        const voice = await this.ctx.telegram.getFile(message.voice.file_id);
        await this.bot.telegram.sendVoice(adminId, voice.file_id, {
            caption: `Пользователь ${from.first_name} ${from.last_name} (@${from.username}) ${from.id} отправил голосовое сообщение`,
        });
        const messageUser = await this.ctx.reply('Ваше голосовое сообщение передано Администратору');
        setTimeout(() => this.ctx.deleteMessage(messageUser.message_id), 3000);
    }

    /**
     * Обрабатывает сообщения с контактами.
     */
    async handleContactMessage() {
        const { message } = this.ctx;
        await this.bot.telegram.sendContact(
            adminId,
            message.contact.phone_number,
            message.contact.first_name,
            { last_name: message.contact.last_name }
        );
        const messageUser = await this.ctx.reply('Ваш контакт передан Администратору');
        setTimeout(() => this.ctx.deleteMessage(messageUser.message_id), 3000);
    }

    /**
     * Определяет тип сообщения и вызывает соответствующий метод для его обработки.
     */
    async handle() {
        const { message } = this.ctx;
        if (message.text) {
            await this.handleTextMessage();
        } else if (message.photo) {
            await this.handlePhotoMessage();
        } else if (message.voice) {
            await this.handleVoiceMessage();
        } else if (message.contact) {
            await this.handleContactMessage();
        }
    }
}

module.exports = MessageHandler;
