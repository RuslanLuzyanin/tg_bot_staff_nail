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
const User = require('../models/User');
const Log = require('../lib/Log');
const config = require('../config/Config');
const mongoose = require('mongoose');

class TelegramBot {
    constructor() {
        this.bot = new Telegraf(config.telegramToken);
        this.logger = new Log();
    }

    async start() {
        try {
            await this.connectToMongoDB();
            await this.setupSessionMiddleware();
            await this.registerCommandHandlers();
            await this.registerCallbackQueryHandler();
            await this.launchBot();
        } catch (error) {
            this.logger.error('Ошибка при запуске бота:', error);
        }
    }

    async connectToMongoDB() {
        await mongoose.connect(config.uri);
        this.logger.info('Подключение к MongoDB успешно установлено');

        const client = await MongoClient.connect(config.uri);
        this.logger.info('Соединение с MongoDB установлено');
    }

    async setupSessionMiddleware() {
        const db = (await MongoClient.connect(config.uri)).db();
        this.bot.use(session(db, { collectionName: 'sessions' }));
        this.logger.info('Middleware сессий установлен');
    }

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

    async launchBot() {
        this.bot.launch();
        this.logger.info('Бот запущен');
    }

    async stop() {
        try {
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
            await this.bot.stop();
            this.logger.info('Бот остановлен');
        } catch (error) {
            this.logger.error('Ошибка при остановке бота:', error);
        }
    }
}

module.exports = TelegramBot;
