const { Scenes } = require('telegraf');
const WorkingTime = require('../../database/models/workingTime');
/**
 * Сцена для обновления рабочих часов.
 * @type {Scenes.WizardScene}
 */
const updateWorkingHoursScene = new Scenes.WizardScene(
    'update_working_hours',
    /**
     * Обрабатывает первый шаг сцены - запрашивает время начала рабочего дня.
     * @param {object} ctx - Объект контекста Telegram.
     * @returns {Promise<number>} - Возвращает следующий шаг сцены.
     */
    async (ctx) => {
        const { session } = ctx;
        session.tempMessage = await ctx.reply('Введите начало рабочего дня (в формате HH:MM):');
        return ctx.wizard.next();
    },
    /**
     * Обрабатывает второй шаг сцены - запрашивает время окончания рабочего дня.
     * @param {object} ctx - Объект контекста Telegram.
     * @returns {Promise<number>} - Возвращает следующий шаг сцены.
     */
    async (ctx) => {
        const { session, message } = ctx;
        session.workingHours = { startTime: message.text };
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);
        session.tempMessage = await ctx.reply('Введите конец рабочего дня (в формате HH:MM):');
        return ctx.wizard.next();
    },
    /**
     * Обрабатывает третий шаг сцены - обновляет рабочие часы.
     * @param {object} ctx - Объект контекста Telegram.
     * @returns {Promise<object>} - Возвращает объект сцены.
     */
    async (ctx) => {
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
);

module.exports = updateWorkingHoursScene;
