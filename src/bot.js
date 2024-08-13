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
const config = require('../config/Config');
const mongoose = require('mongoose');
const cron = require('node-cron');

class TelegramBot {
    constructor() {
        this.bot = new Telegraf(config.telegramToken);
        this.logger = new Log();
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
            await this.cleanupOldRecords();
            await this.launchBot();
            await this.scheduleReminders();
            await this.scheduleCleanUp();
        } catch (error) {
            this.logger.error('Ошибка при запуске бота:', error);
        }
    }

    /**
     * Устанавливает соединение с MongoDB.
     */
    async connectToMongoDB() {
        await mongoose.connect(config.uri);
        this.logger.info('Подключение к MongoDB успешно установлено');

        const client = await MongoClient.connect(config.uri);
        this.logger.info('Соединение с MongoDB установлено');
    }

    /**
     * Настраивает middleware для хранения сессий в MongoDB.
     */
    async setupSessionMiddleware() {
        const db = (await MongoClient.connect(config.uri)).db();
        this.bot.use(session(db, { collectionName: 'sessions' }));
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
        ];

        commands.forEach((Command) => {
            this.bot.command(Command.name, async (ctx) => {
                try {
                    await new Command(ctx).handle();
                } catch (error) {
                    this.logger.error(
                        `Ошибка при обработке команды "${Command.name}":`,
                        error
                    );
                    await ctx.reply(
                        'Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.'
                    );
                }
            });
        });
    }

    /**
     * Регистрирует обработчик callback-запросов.
     */
    async registerCallbackQueryHandler() {
        this.bot.on('callback_query', async (ctx) => {
            const callbackHandler = new CallbackHandler(
                new UserCallback(ctx, this.logger),
                new AppointmentCallback(ctx, this.logger),
                new MenuCallback(ctx, this.logger),
                this.logger
            );
            await callbackHandler.handle(ctx);
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
        try {
            await this.sendStopNotifications();
            await this.bot.stop();
            this.logger.info('Бот остановлен');
        } catch (error) {
            this.logger.error('Ошибка при остановке бота:', error);
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
                this.logger.error(
                    `Ошибка при отправке уведомления пользователю ${user.id}:`,
                    error
                );
            }
        }
    }
}

module.exports = TelegramBot;
