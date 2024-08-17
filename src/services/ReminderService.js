const Record = require('../../models/Record');
const Procedure = require('../../models/Procedure');
const User = require('../../models/User');
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
        const tomorrow = moment().add(1, 'day').format('D MMMM');
        const records = await Record.aggregate([
            { $match: { date: tomorrow } },
            { $group: { _id: '$userId', appointments: { $push: '$$ROOT' } } },
        ]);

        const procedures = await Procedure.find();
        const proceduresByEnglishName = procedures.reduce((acc, proc) => {
            acc[proc.englishName] = proc;
            return acc;
        }, {});

        const messagePromises = [];
        for (const { _id: userId, appointments } of records) {
            const user = await User.findOne({ id: userId });
            let skipCount = 0;
            for (const appointment of appointments) {
                if (skipCount > 0) {
                    skipCount--;
                    continue;
                }
                const procedure =
                    proceduresByEnglishName[appointment.procedure];
                const formattedDate = moment(tomorrow, 'D MMMM')
                    .locale('ru')
                    .format('D MMM');
                const message = `Напоминаем, что завтра, ${formattedDate}, у Вас запись на процедуру "${procedure.russianName}" в ${appointment.time}.`;
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
