const cron = require('node-cron');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

const { Record, Procedure, Notification, User } = require('../../database/models/index');

class ScheduledTasksHandler {
    /**
     * Создает экземпляр класса ScheduledTasksHandler.
     *
     * @param {Object} bot - Экземпляр бота для отправки сообщений.
     * @param {Object} logger - Логгер для ведения журналов.
     */
    constructor(bot, logger) {
        this.bot = bot;
        this.logger = logger;
    }

    /**
     * Запускает планировщик напоминаний.
     * Напоминания рассылаются каждый день в 10:00.
     */
    async scheduleReminders() {
        cron.schedule('0 10 * * *', async () => {
            const tomorrow = {
                start: moment().startOf('day').add(1, 'day').toDate(),
                end: moment().endOf('day').add(1, 'day').toDate(),
            };

            const records = await Record.aggregate([
                {
                    $match: {
                        date: {
                            $gte: tomorrow.start,
                            $lt: tomorrow.end,
                        },
                    },
                },
                {
                    $group: {
                        _id: '$userId',
                        appointments: { $push: '$$ROOT' },
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: 'id',
                        as: 'user',
                    },
                },
                {
                    $unwind: '$user',
                },
            ]);

            const procedures = await Procedure.find();
            const proceduresByEnglishName = procedures.reduce((acc, proc) => {
                acc[proc.englishName] = proc;
                return acc;
            }, {});

            const messagePromises = [];
            for (const { user, appointments } of records) {
                for (const appointment of appointments) {
                    const procedure = proceduresByEnglishName[appointment.procedure];
                    const formattedDate = moment(appointment.date).locale('ru').format('D MMM');
                    const message = [
                        `Доброе утро ☀️`,
                        `Напоминаю, что завтра(${formattedDate}) в ${appointment.time},`,
                        `У тебя запись ко мне на процедуру🥰`,
                        `Если твои планы поменялись, свяжись со мной или отмени запись 🫶`,
                    ].join('\n');
                    messagePromises.push(this.bot.telegram.sendMessage(user.chatId, message));
                }
            }

            await Promise.all(messagePromises);
            this.logger.info('Уведомления отправлены');
        });
    }

    /**
     * Запускает планировщик уведомлений.
     * Уведомления рассылаются каждый день в 10:00.
     */
    async scheduleNotifications() {
        cron.schedule('0 10 * * *', async () => {
            const notification = await Notification.findOneAndDelete();
            if (!notification) return;

            const users = await User.find({}, { chatId: 1 });
            const filePath = path.join(process.cwd(), notification.photoNotification);

            const mediaGroup = [
                {
                    type: 'photo',
                    media: { source: filePath },
                    caption: notification.messageNotification,
                },
            ];

            const messagePromises = users.map((user) =>
                this.bot.telegram.sendMediaGroup(user.chatId, mediaGroup)
            );
            await Promise.all(messagePromises);
            fs.unlinkSync(filePath);
            this.logger.info('Оповещения отправлены');
        });
    }

    /**
     * Запускает планировщик для очистки устаревших записей.
     * Устаревшие записи удаляются каждый день в 10:00.
     */
    async scheduleCleanUp() {
        cron.schedule('0 10 * * *', async () => {
            const cutoffDate = moment().subtract(1, 'day').toDate();

            await Record.deleteMany({
                date: { $lt: cutoffDate },
            });
            this.logger.info('Устаревшие записи удалены');
        });
    }

    /**
     * Запускает все планировщики задач.
     */
    start() {
        this.scheduleReminders();
        this.scheduleNotifications();
        this.scheduleCleanUp();
        this.logger.info('Планировщики задач запущены');
    }
}

module.exports = ScheduledTasksHandler;
