const { Telegraf, Scenes } = require('telegraf');
const { MongoClient } = require('mongodb');
const { session } = require('telegraf-session-mongodb');
const Log = require('../lib/log');
const ErrorHandler = require('../lib/errorHandler');
const mongoose = require('mongoose');
const StartCommand = require('../shared/commands/startCommand');
const CallbackHandler = require('./callbacks/callbackHandler');
const { adminBotToken, uri } = require('../config/config');
const createProcedureScene = require('./scenes/createProcedureScene');
const editProcedureScene = require('./scenes/editProcedureScene');
const createNotificationScene = require('./scenes/createNotificationScene');
const updateWorkingHoursScene = require('./scenes/updateWorkingHoursScene');
const updatePorfolioScene = require('./scenes/updatePortfolioScene');
const updatePriceScene = require('./scenes/updatePriceScene');
const updateDayOffScene = require('./scenes/updateDayOffScene');

class AdminBot {
    constructor() {
        this.bot = new Telegraf(adminBotToken);
        this.logger = new Log();
        this.stage = new Scenes.Stage();
        this.mongoClient = null;
        ErrorHandler.setLogger(this.logger);
    }

    /**
     * Запускает бота и выполняет необходимые инициализационные действия.
     */
    async start() {
        try {
            await this.connectToMongoDB();
            await this.setupSessionMiddleware();
            await this.registerScene();
            await this.registerCommandHandlers();
            await this.registerCallbackQueryHandler();
            await this.launchBot();
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
     * Настраивает middleware в MongoDB.
     */
    async setupSessionMiddleware() {
        this.bot.use(session(this.mongoClient.db(), { collectionName: 'adminSessons' }));
        this.bot.use(this.stage.middleware());
        this.logger.info('Middleware установлен');
    }

    /**
     * Регистрирует сцены (Scenes) для бота.
     */
    async registerScene() {
        const scenes = [
            createProcedureScene,
            editProcedureScene,
            createNotificationScene,
            updateWorkingHoursScene,
            updatePorfolioScene,
            updatePriceScene,
            updateDayOffScene,
        ];

        for (const scene of scenes) {
            this.stage.register(scene);
        }
    }

    /**
     * Регистрирует обработчики команд бота.
     */
    async registerCommandHandlers() {
        const commands = [StartCommand];

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
            const callbackHandler = new CallbackHandler(this.logger, this.stage);
            try {
                await callbackHandler.handle(ctx, this.logger, this.bot);
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
        this.bot.stop();
        this.logger.info('Бот остановлен');
    }
}

module.exports = AdminBot;
