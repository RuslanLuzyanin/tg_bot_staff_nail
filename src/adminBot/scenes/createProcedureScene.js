const { Scenes } = require('telegraf');
const Procedure = require('../../database/models/procedure');
/**
 * Сцена для создания процедуры.
 * @type {Scenes.WizardScene}
 */
const createProcedureScene = new Scenes.WizardScene(
    'create_procedure',
    /**
     * Обрабатывает первый шаг сцены - ввод названия процедуры на английском.
     * @param {object} ctx - Объект контекста Telegram.
     * @returns {Promise<number>} - Возвращает следующий шаг сцены.
     */
    async (ctx) => {
        const { session } = ctx;
        session.editingProcedure = {};
        session.tempMessage = await ctx.reply('Введите название процедуры на английском:');
        return ctx.wizard.next();
    },
    /**
     * Обрабатывает второй шаг сцены - ввод названия процедуры на русском.
     * @param {object} ctx - Объект контекста Telegram.
     * @returns {Promise<number>} - Возвращает следующий шаг сцены.
     */
    async (ctx) => {
        const { session, message } = ctx;
        session.editingProcedure.englishName = message.text;
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        session.tempMessage = await ctx.reply('Введите название процедуры на русском:');
        return ctx.wizard.next();
    },
    /**
     * Обрабатывает третий шаг сцены - ввод длительности процедуры.
     * @param {object} ctx - Объект контекста Telegram.
     * @returns {Promise<number>} - Возвращает следующий шаг сцены.
     */
    async (ctx) => {
        const { session, message } = ctx;
        session.editingProcedure.russianName = message.text;
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        session.tempMessage = await ctx.reply('Введите длительность процедуры в часах:');
        return ctx.wizard.next();
    },
    /**
     * Обрабатывает четвёртый шаг сцены - сохранение новой процедуры.
     * @param {object} ctx - Объект контекста Telegram.
     * @returns {Promise<object>} - Возвращает объект сцены.
     */
    async (ctx) => {
        const { session, message } = ctx;
        session.editingProcedure.duration = parseInt(message.text);
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        const { englishName, russianName, duration } = session.editingProcedure;
        const newProcedure = new Procedure({ englishName, russianName, duration });
        await newProcedure.save();

        session.tempMessage = await ctx.reply(`Новая процедура "${russianName}" успешно создана.`);
        setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);
        return ctx.scene.leave();
    }
);

module.exports = createProcedureScene;
