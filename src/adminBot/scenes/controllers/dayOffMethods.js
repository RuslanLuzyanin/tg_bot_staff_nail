const { Record, WorkingTime } = require('../../../database/models/index');

class DayOffMethods {
    /**
     * Обновление выходных дней - шаг 1.
     * Запрос дат выходных дней.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterDayOffDates(ctx) {
        const { session } = ctx;

        const workingTimeExists = (await WorkingTime.countDocuments()) > 0;

        if (!workingTimeExists) {
            session.tempMessage = await ctx.reply(
                'Ошибка: не найдены записи рабочего времени. Пожалуйста, настройте рабочее время перед добавлением выходных.'
            );
            setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);
            return ctx.scene.leave();
        }

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

        const invalidDates = dateParts.filter((dateStr) => isNaN(dateStr) || dateStr < 1 || dateStr > 31);

        if (invalidDates.length > 0) {
            await ctx.reply(
                `Ошибка: следующие даты неверные: ${invalidDates.join(', ')}. Пожалуйста, введите даты снова.`
            );
            return ctx.wizard.selectStep(ctx.wizard.cursor - 1);
        }

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
