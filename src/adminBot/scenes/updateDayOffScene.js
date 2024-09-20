const { Scenes } = require('telegraf');
const WorkingTime = require('../../database/models/workingTime');
const Record = require('../../database/models/record');
/**
 * Сцена для обновления выходных дней.
 * @type {Scenes.WizardScene}
 */
const updateDayOffScene = new Scenes.WizardScene(
    'update_day_off',
    /**
     * Обрабатывает первый шаг сцены - запрашивает даты выходных.
     * @param {object} ctx - Объект контекста Telegram.
     * @returns {Promise<number>} - Возвращает следующий шаг сцены.
     */
    async (ctx) => {
        const { session } = ctx;
        session.tempMessage = await ctx.reply(`Введите даты выходных в этом месяце (например: 1, 5, 15):`);
        return ctx.wizard.next();
    },
    /**
     * Обрабатывает второй шаг сцены - создает записи о выходных днях.
     * @param {object} ctx - Объект контекста Telegram.
     * @returns {Promise<object>} - Возвращает объект сцены.
     */
    async (ctx) => {
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
);

module.exports = updateDayOffScene;
