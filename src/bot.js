const { Telegraf } = require('telegraf');
const { MongoClient } = require('mongodb');
const { session } = require('telegraf-session-mongodb');
const StartCommand = require('./commands/StartCommand');
const InfoCommand = require('./commands/InfoCommand');
const PortfolioCommand = require('./commands/PortfolioCommand');
const ContactCommand = require('./commands/ContactCommand');
const CallbackHandler = require('./callbacks/CallbackHandler');
const UserCallback = require('./callbacks/UserCallback');
const AppointmentCallback = require('./callbacks/AppointmentCallback');
const MenuCallback = require('./callbacks/MenuCallback');
const AppLogger = require('./AppLogger');
const config = require('./Config');
const mongoose = require('mongoose');

class TelegramBot {
    constructor() {
        this.bot = new Telegraf(config.telegramToken);
        this.logger = new AppLogger();
    }

    async start() {
        try {
            await mongoose.connect(config.uri);
            this.logger.info('Подключение к MongoDB успешно установлено');

            const client = await MongoClient.connect(config.uri);
            this.logger.info('Соединение с MongoDB установлено');

            const db = client.db();
            this.bot.use(session(db, { collectionName: 'sessions' }));
            this.logger.info('Middleware сессий установлен');

            const commands = [StartCommand, InfoCommand, PortfolioCommand, ContactCommand];

            commands.forEach((Command) => {
                this.bot.command(Command.name, (ctx) => new Command(ctx).handle());
            });

            this.bot.on('callback_query', (ctx) => {
                const callbackHandler = new CallbackHandler(
                    ctx,
                    new UserCallback(ctx),
                    new AppointmentCallback(ctx),
                    new MenuCallback(ctx)
                );
                callbackHandler.handleCallback(ctx.callbackQuery.data);
            });

            this.bot.launch();
            this.logger.info('Бот запущен');
        } catch (error) {
            this.logger.error('Ошибка при запуске бота:', error);
        }
    }
}

module.exports = TelegramBot;
