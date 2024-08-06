const Record = require('../../models/Record');
const Procedure = require('../../models/Procedure');
const User = require('../../models/User');
const moment = require('moment');

class ReminderService {
    static async sendReminders(bot) {
        const tomorrow = moment().add(1, 'day').format('D MMMM');
        const records = await Record.find({ date: tomorrow });
        const processedRecords = [];

        for (const record of records) {
            if (!processedRecords.includes(record.userId)) {
                const user = await User.findOne({ id: record.userId });
                const appointments = await Record.find({
                    userId: record.userId,
                    date: tomorrow,
                }).sort({ time: 1 });

                let skipCount = 0;
                for (const appointment of appointments) {
                    if (skipCount > 0) {
                        skipCount--;
                        continue;
                    }

                    const procedure = await Procedure.findOne({
                        englishName: appointment.procedure,
                    });
                    const formattedDate = moment(tomorrow, 'D MMMM')
                        .locale('ru')
                        .format('D MMM');
                    const message = `Напоминаем, что завтра, ${formattedDate}, у Вас запись на процедуру "${procedure.russianName}" в ${appointment.time}.`;
                    await bot.telegram.sendMessage(user.chatId, message);

                    const procedureDuration = procedure.duration;
                    skipCount = procedureDuration - 1;
                }

                processedRecords.push(record.userId);
            }
        }
    }
}

module.exports = ReminderService;
