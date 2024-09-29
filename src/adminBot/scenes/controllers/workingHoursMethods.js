const { WorkingTime } = require('../../../database/models/index');

class WorkingHoursMethods {
    /**
     * Обновление рабочих часов - шаг 1.
     * Запрашивает время начала рабочего дня.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterStartTime(ctx) {
        const { session } = ctx;
        session.tempMessage = await ctx.reply('Введите начало рабочего дня (в формате HH:MM):');
        return ctx.wizard.next();
    }

    /**
     * Обновление рабочих часов - шаг 2.
     * Запрашивает время окончания рабочего дня.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterEndTime(ctx) {
        const { session, message } = ctx;
        session.workingHours = { startTime: message.text };
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);
        session.tempMessage = await ctx.reply('Введите конец рабочего дня (в формате HH:MM):');
        return ctx.wizard.next();
    }

    /**
     * Обновление рабочих часов - шаг 3.
     * Обновляет рабочие часы в базе данных.
     * @param {object} ctx - Контекст Telegram.
     */

    static async saveWorkingHours(ctx) {
        const { session, message } = ctx;
        session.workingHours.endTime = message.text;
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        const { startTime, endTime } = session.workingHours;
        await WorkingTime.findOneAndUpdate({}, { startTime, endTime }, { upsert: true });

        session.tempMessage = await ctx.reply(
            `Рабочие часы обновлены, рабочие часы сейчас: ${startTime} - ${endTime}`
        );
        setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);
        return ctx.scene.leave();
    }
}

module.exports = WorkingHoursMethods;
