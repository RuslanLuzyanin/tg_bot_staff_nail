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

        if (!this.isValidTimeFormat(message.text)) {
            await ctx.reply(
                'Ошибка: время начала рабочего дня должно быть в формате HH:MM и находиться в диапазоне от 00:00 до 23:59. Пожалуйста, введите время снова.'
            );
            return ctx.wizard.selectStep(ctx.wizard.cursor - 1);
        }

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

        if (!this.isValidTimeFormat(message.text)) {
            await ctx.reply(
                'Ошибка: время окончания рабочего дня должно быть в формате HH:MM и находиться в диапазоне от 00:00 до 23:59. Пожалуйста, введите время снова.'
            );
            return ctx.wizard.selectStep(ctx.wizard.cursor - 1);
        }

        session.workingHours.endTime = message.text;
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        const { startTime, endTime } = session.workingHours;

        if (this.isEndTimeEarlierThanStartTime(startTime, endTime)) {
            await ctx.reply(
                'Ошибка: время окончания рабочего дня должно быть позже времени начала. Пожалуйста, введите время снова.'
            );
            return ctx.wizard.selectStep(ctx.wizard.cursor - 1);
        }

        await WorkingTime.findOneAndUpdate({}, { startTime, endTime }, { upsert: true });

        session.tempMessage = await ctx.reply(
            `Рабочие часы обновлены, рабочие часы сейчас: ${startTime} - ${endTime}`
        );
        setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);
        return ctx.scene.leave();
    }

    /**
     * Проверяет, является ли время корректным.
     * @param {string} time - Время в формате HH:MM.
     * @returns {boolean} - true, если время корректно; иначе false.
     */
    static isValidTimeFormat(time) {
        const timePattern = /^(0[0-9]|1[0-9]|2[0-3]|[0-9]):([0-5][0-9])$/;
        return timePattern.test(time);
    }

    /**
     * Проверяет, является ли время окончания раньше времени начала.
     * @param {string} startTime - Время начала в формате HH:MM.
     * @param {string} endTime - Время окончания в формате HH:MM.
     * @returns {boolean} - true, если время окончания раньше времени начала; иначе false.
     */
    static isEndTimeEarlierThanStartTime(startTime, endTime) {
        const start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${endTime}:00`);
        return end <= start;
    }
}

module.exports = WorkingHoursMethods;
