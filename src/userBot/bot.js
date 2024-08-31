const { Telegraf } = require('telegraf');
const { MongoClient } = require('mongodb');
const { session } = require('telegraf-session-mongodb');
const StartCommand = require('./commands/startCommand');
const InfoCommand = require('./commands/infoCommand');
const PortfolioCommand = require('./commands/portfolioCommand');
const ContactCommand = require('./commands/contactCommand');
const PriceCommand = require('./commands/priceCommand');
const CallbackHandler = require('./callbacks/callbackHandler');
const ReminderService = require('./services/reminderService');
const CleanUpService = require('./services/cleanUpService');
const User = require('../db/models/user');
const Log = require('../lib/log');
const ErrorHandler = require('../lib/errorHandler');
const config = require('../config/config');
const mongoose = require('mongoose');
const cron = require('node-cron');

class UserBot {
    constructor() {
        this.bot = new Telegraf(config.telegramToken);
        this.logger = new Log();
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
            await this.registerCommandHandlers();
            await this.registerCallbackQueryHandler();
            await this.registerMessageHandler();
            await this.launchBot();
            await this.cleanupOldRecords();
            await this.scheduleReminders();
            await this.scheduleCleanUp();
        } catch (error) {
            ErrorHandler.handleError(error, this.ctx);
        }
    }

    /**
     * Устанавливает соединение с MongoDB.
     */
    async connectToMongoDB() {
        this.mongoClient = await MongoClient.connect(config.uri);
        await mongoose.connect(config.uri);
        this.logger.info('Подключение к MongoDB успешно установлено');
    }

    /**
     * Настраивает middleware для хранения сессий в MongoDB.
     */
    async setupSessionMiddleware() {
        this.bot.use(
            session(this.mongoClient.db(), { collectionName: 'sessions' })
        );
        this.logger.info('Middleware сессий установлен');
    }

    /**
     * Регистрирует обработчики команд бота.
     */
    async registerCommandHandlers() {
        const commands = [
            StartCommand,
            InfoCommand,
            PortfolioCommand,
            ContactCommand,
            PriceCommand,
        ];

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
            const { from, message } = ctx;
            this.logger.info(
                `Получено сообщение от пользователя ${from.id}: ${message.text}`
            );
            await this.bot.telegram.sendMessage(
                config.userId,
                `Пользователь ${from.first_name} ${from.last_name} (@${from.username}) ${from.id} отправил сообщение: ${message.text}`
            );
            const messageUser = await ctx.reply(
                'Ваше сообщение передано Администратору'
            );
            setTimeout(() => ctx.deleteMessage(messageUser.message_id), 3000);
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
     * Удаляет устаревшие записи из базы данных.
     */
    async cleanupOldRecords() {
        await CleanUpService.cleanupOldRecords();
        this.logger.info('Устаревшие записи очищены');
    }

    /**
     * Планирует отправку напоминаний пользователям.
     */
    async scheduleReminders() {
        cron.schedule('0 10 * * *', async () => {
            await ReminderService.sendReminders(this.bot);
            this.logger.info('Уведомления отправлены');
        });
    }

    /**
     * Планирует удаление устаревших записей.
     */
    async scheduleCleanUp() {
        cron.schedule('0 10 * * *', async () => {
            await CleanUpService.cleanupOldRecords();
            this.logger.info('Устаревшие записи очищены');
        });
    }

    /**
     * Останавливает бота и выполняет необходимые действия при остановке.
     */
    async stop() {
        await this.sendStopNotifications();
        await this.bot.stop();
        this.logger.info('Бот остановлен');
    }

    /**
     * Отправляет уведомление пользователям о временной недоступности бота.
     */
    async sendStopNotifications() {
        const users = await User.find();
        for (const user of users) {
            await this.bot.telegram.sendMessage(
                user.chatId,
                'Бот временно недоступен.'
            );
            this.logger.info(`Уведомление отправлено пользователю ${user.id}`);
        }
    }
}

module.exports = UserBot;
