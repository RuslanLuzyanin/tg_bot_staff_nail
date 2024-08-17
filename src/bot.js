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
const ReminderService = require('./services/ReminderService');
const CleanUpService = require('./services/CleanUpService');
const User = require('../models/User');
const Log = require('../lib/Log');
const ErrorHandler = require('../lib/ErrorHandler');
const config = require('../config/Config');
const mongoose = require('mongoose');
const cron = require('node-cron');

class TelegramBot {
    constructor() {
        this.bot = new Telegraf(config.telegramToken);
        this.logger = new Log();
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
            await this.cleanupOldRecords();
            await this.launchBot();
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
        try {
            await mongoose.connect(config.uri);
            this.logger.info('Подключение к MongoDB успешно установлено');

            const client = await MongoClient.connect(config.uri);
            this.logger.info('Соединение с MongoDB установлено');
        } catch (error) {
            throw { code: 'mongoDbConnectionError', error };
        }
    }

    /**
     * Настраивает middleware для хранения сессий в MongoDB.
     */
    async setupSessionMiddleware() {
        try {
            const db = (await MongoClient.connect(config.uri)).db();
            this.bot.use(session(db, { collectionName: 'sessions' }));
            this.logger.info('Middleware сессий установлен');
        } catch (error) {
            throw { code: 'sessionMiddlewareSetupError', error };
        }
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
        ];

        for (const Command of commands) {
            try {
                this.bot.command(Command.name, async (ctx) => {
                    try {
                        await new Command(ctx).handle();
                    } catch (error) {
                        ErrorHandler.handleError(
                            { code: 'commandExecutionError', error },
                            ctx
                        );
                    }
                });
            } catch (error) {
                throw { code: 'commandHandlerRegistrationError', error };
            }
        }
    }

    /**
     * Регистрирует обработчик callback-запросов.
     */
    async registerCallbackQueryHandler() {
        try {
            this.bot.on('callback_query', async (ctx) => {
                const callbackHandler = new CallbackHandler(
                    new UserCallback(ctx, this.logger),
                    new AppointmentCallback(ctx, this.logger),
                    new MenuCallback(ctx, this.logger),
                    this.logger
                );
                try {
                    await callbackHandler.handle(ctx);
                } catch (error) {
                    ErrorHandler.handleError(
                        { code: 'callbackExecutionError', error },
                        ctx
                    );
                }
            });
        } catch (error) {
            throw { code: 'callbackHandlerRegistrationError', error };
        }
    }

    /**
     * Регистрирует обработчик сообщений.
     */
    async registerMessageHandler() {
        try {
            this.bot.on('message', async (ctx) => {
                try {
                    this.logger.info(
                        `Получено сообщение от пользователя ${ctx.message.from.id}: ${ctx.message.text}`
                    );
                    await new InfoCommand(ctx).handle();
                } catch (error) {
                    ErrorHandler.handleError(
                        { code: 'messageHandlerError', error },
                        ctx
                    );
                }
            });
        } catch (error) {
            throw { code: 'messageHandlerRegistationError', error };
        }
    }

    /**
     * Запускает бота.
     */
    async launchBot() {
        try {
            this.bot.launch();
            this.logger.info('Бот запущен');
        } catch (error) {
            throw { code: 'botLaunchError', error };
        }
    }

    /**
     * Удаляет устаревшие записи из базы данных.
     */
    async cleanupOldRecords() {
        try {
            await CleanUpService.cleanupOldRecords();
            this.logger.info('Устаревшие записи очищены');
        } catch (error) {
            throw { code: 'recordCleanupError', error };
        }
    }

    /**
     * Планирует отправку напоминаний пользователям.
     */
    async scheduleReminders() {
        try {
            cron.schedule('0 10 * * *', async () => {
                await ReminderService.sendReminders(this.bot);
                this.logger.info('Уведомления отправлены');
            });
        } catch (error) {
            throw { code: 'reminderSchedulingError', error };
        }
    }

    /**
     * Планирует удаление устаревших записей.
     */
    async scheduleCleanUp() {
        try {
            cron.schedule('0 10 * * *', async () => {
                await CleanUpService.cleanupOldRecords();
                this.logger.info('Устаревшие записи очищены');
            });
        } catch (error) {
            throw { code: 'cleanupSchedulingError', error };
        }
    }

    /**
     * Останавливает бота и выполняет необходимые действия при остановке.
     */
    async stop() {
        try {
            await this.sendStopNotifications();
            await this.bot.stop();
            this.logger.info('Бот остановлен');
        } catch (error) {
            throw { code: 'botStopError', error };
        }
    }

    /**
     * Отправляет уведомление пользователям о временной недоступности бота.
     */
    async sendStopNotifications() {
        const users = await User.find();
        for (const user of users) {
            try {
                await this.bot.telegram.sendMessage(
                    user.chatId,
                    'Бот временно недоступен.'
                );
                this.logger.info(
                    `Уведомление отправлено пользователю ${user.id}`
                );
            } catch (error) {
                throw { code: 'stopNotificationError', error };
            }
        }
    }
}

module.exports = TelegramBot;
