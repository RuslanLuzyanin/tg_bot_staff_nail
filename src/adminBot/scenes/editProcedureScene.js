const { Scenes } = require('telegraf');
const Procedure = require('../../database/models/procedure');
/**
 * Сцена для редактирования процедуры.
 * @type {Scenes.WizardScene}
 */
const editProcedureScene = new Scenes.WizardScene(
    'edit_procedure',
    /**
     * Обрабатывает первый шаг сцены - получение текущей длительности процедуры.
     * @param {object} ctx - Объект контекста Telegram.
     * @returns {Promise<number>} - Возвращает следующий шаг сцены.
     */
    async (ctx) => {
        const { session, callbackQuery } = ctx;
        session.editingProcedure = {};
        session.editingProcedure.englishName = callbackQuery.data.split('_')[3];

        const procedure = await Procedure.findOne({ englishName: session.editingProcedure.englishName });
        session.tempMessage = await ctx.reply(
            `Текущая длительность процедуры "${procedure.russianName}": ${procedure.duration} часа.\nВведите новую длительность процедуры "${procedure.russianName}" в часах:`
        );
        return ctx.wizard.next();
    },
    /**
     * Обрабатывает второй шаг сцены - обновление длительности процедуры.
     * @param {object} ctx - Объект контекста Telegram.
     * @returns {Promise<object>} - Возвращает объект сцены.
     */
    async (ctx) => {
        const { session, message } = ctx;
        const procedure = await Procedure.findOne({ englishName: session.editingProcedure.englishName });
        const newDuration = message.text;

        procedure.duration = newDuration;
        await procedure.save();

        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        session.tempMessage = await ctx.reply(
            `Длительность процедуры "${procedure.russianName}" успешно изменена на ${procedure.duration} часа.`
        );
        setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);
        return ctx.scene.leave();
    }
);

module.exports = editProcedureScene;
