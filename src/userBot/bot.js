const { Telegraf } = require('telegraf');
const { MongoClient } = require('mongodb');
const { session } = require('telegraf-session-mongodb');
const mongoose = require('mongoose');
const StartCommand = require('../shared/commands/startCommand');
const InfoCommand = require('./commands/infoCommand');
const PortfolioCommand = require('./commands/portfolioCommand');
const ContactCommand = require('./commands/contactCommand');
const PriceCommand = require('./commands/priceCommand');
const CallbackHandler = require('./handlers/callbackHandler');
const MessageHandler = require('./handlers/messageHandler');
const ScheduledTasksHandler = require('./handlers/scheduledTasksHandler');
const User = require('../database/models/user');
const Log = require('../lib/log');
const ErrorHandler = require('../lib/errorHandler');
const { userBotToken, uri } = require('../config/config');

class UserBot {
    constructor() {
        this.bot = new Telegraf(userBotToken);
        this.logger = new Log();
        this.mongoClient = null;
        this.scheduledTasksHandler = new ScheduledTasksHandler(this.bot, this.logger);
        ErrorHandler.setLogger(this.logger);
    }

    /**
     * Запускает бота и выполняет необходимые инициализационные действия.
     */
    async start() {
        try {
            await this.connectToMongoDB();
            await this.setupSessionMiddleware();
            await this.registerCommandHandlers();
            await this.registerCallbackQueryHandler();
            await this.registerMessageHandler();
            await this.launchBot();
            this.scheduledTasksHandler.start();
        } catch (error) {
            ErrorHandler.handleError(error, this.ctx);
        }
    }

    /**
     * Устанавливает соединение с MongoDB.
     */
    async connectToMongoDB() {
        this.mongoClient = await MongoClient.connect(uri);
        await mongoose.connect(uri);
        this.logger.info('Подключение к MongoDB успешно установлено');
    }

    /**
     * Настраивает middleware для хранения сессий в MongoDB.
     */
    async setupSessionMiddleware() {
        this.bot.use(session(this.mongoClient.db(), { collectionName: 'userSessions' }));
        this.logger.info('Middleware сессий установлен');
    }

    /**
     * Регистрирует обработчики команд бота.
     */
    async registerCommandHandlers() {
        const commands = [StartCommand, InfoCommand, PortfolioCommand, ContactCommand, PriceCommand];

        for (const Command of commands) {
            this.bot.command(Command.name, async (ctx) => {
                try {
                    await ctx.deleteMessage();
                    await new Command(ctx).handle();
                } catch (error) {
                    ErrorHandler.handleError(error, ctx);
                }
            });
        }
    }

    /**
     * Регистрирует обработчик callback-запросов.
     */
    async registerCallbackQueryHandler() {
        this.bot.on('callback_query', async (ctx) => {
            const callbackHandler = new CallbackHandler(this.logger);
            try {
                await callbackHandler.handle(ctx, this.logger, this.bot);
            } catch (error) {
                ErrorHandler.handleError(error, ctx);
            }
        });
    }

    /**
     * Регистрирует обработчик сообщений.
     */
    async registerMessageHandler() {
        this.bot.on('message', async (ctx) => {
            const messageHandler = new MessageHandler(ctx, this.bot);
            try {
                await messageHandler.handle();
            } catch (error) {
                ErrorHandler.handleError(error, ctx);
            }
        });
    }

    /**
     * Запускает бота.
     */
    async launchBot() {
        this.bot.launch();
        this.logger.info('Бот запущен');
    }

    /**
     * Останавливает бота и выполняет необходимые действия при остановке.
     */
    async stop() {
        const users = await User.find();
        for (const user of users) {
            await this.bot.telegram.sendMessage(user.chatId, 'Бот временно недоступен.');
        }
        this.bot.stop();
        this.logger.info('Бот остановлен');
    }
}

module.exports = UserBot;
