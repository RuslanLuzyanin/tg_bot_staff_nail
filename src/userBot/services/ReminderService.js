const Record = require('../../db/models/record');
const Procedure = require('../../db/models/procedure');
const moment = require('moment');
/**
 * Сервис для отправки напоминаний пользователям о предстоящих записях на процедуры.
 */
class ReminderService {
    /**
     * Отправляет напоминания пользователям о записях на завтрашний день.
     *
     * @param {Telegraf} bot - Экземпляр бота Telegraf.
     */
    static async sendReminders(bot) {
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
            let skipCount = 0;
            for (const appointment of appointments) {
                if (skipCount > 0) {
                    skipCount--;
                    continue;
                }
                const procedure =
                    proceduresByEnglishName[appointment.procedure];
                const formattedDate = moment(appointment.date)
                    .locale('ru')
                    .format('D MMM');
                const message = [
                    `Напоминаем, что завтра(${formattedDate}) в ${appointment.time},`,
                    `у Вас процедура - ${procedure.russianName}.`,
                    `Если Ваши планы поменялись свяжитесь с мастером или отмените запись.`,
                    `Ждём Вас 😉`,
                ].join('\n');
                messagePromises.push(
                    bot.telegram.sendMessage(user.chatId, message)
                );
                skipCount = procedure.duration - 1;
            }
        }

        await Promise.all(messagePromises);
    }
}

module.exports = ReminderService;
