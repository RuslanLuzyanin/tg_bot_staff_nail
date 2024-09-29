const { Record, WorkingTime } = require('../../../database/models/index');

class DayOffMethods {
    /**
     * Обновление выходных дней - шаг 1.
     * Запрос дат выходных дней.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterDayOffDates(ctx) {
        const { session } = ctx;
        session.tempMessage = await ctx.reply(`Введите даты выходных в этом месяце (например: 1, 5, 15):`);
        return ctx.wizard.next();
    }

    /**
     * Обновление выходных дней - шаг 2.
     * Создание записей о выходных днях в базе данных.
     * @param {object} ctx - Контекст Telegram.
     */

    static async saveDayOffRecords(ctx) {
        const { session, message } = ctx;
        const dateParts = message.text.split(',').map((dateStr) => dateStr.trim());
        const { startTime } = await WorkingTime.findOne({}, { startTime: 1 });

        for (const dateStr of dateParts) {
            const date = new Date(`${session.selectedYear}-${session.selectedMonth}-${dateStr}`);
            const time = startTime;
            await Record.create({ userId: ctx.from.id, date, time, procedure: 'Off' });
        }

        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        session.tempMessage = await ctx.reply('Выходные дни успешно обновлены.');
        setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);
        return ctx.scene.leave();
    }
}

module.exports = DayOffMethods;
