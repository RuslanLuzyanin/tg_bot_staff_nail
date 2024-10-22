const { Procedure } = require('../../../database/models/index');

class ProcedureMethods {
    /**
     * Создание новой процедуры - шаг 1.
     * Ввод названия процедуры на английском языке.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterEnglishName(ctx) {
        const { session } = ctx;
        session.editingProcedure = {};
        session.tempMessage = await ctx.reply('Введите название процедуры на английском:');
        return ctx.wizard.next();
    }

    /**
     * Создание новой процедуры - шаг 2.
     * Ввод названия процедуры на русском языке.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterRussianName(ctx) {
        const { session, message } = ctx;

        const englishName = message.text.trim();

        const existingProcedure = await Procedure.findOne({ englishName });

        if (existingProcedure) {
            await ctx.deleteMessage(message.message_id);
            await ctx.deleteMessage(session.tempMessage.message_id);

            session.tempMessage = await ctx.reply(
                'Ошибка: процедура с таким английским названием уже существует. Введите другое название.'
            );
            return ctx.wizard.selectStep(ctx.wizard.cursor);
        }

        // Если название уникально, продолжаем процесс
        session.editingProcedure.englishName = englishName;
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        session.tempMessage = await ctx.reply('Введите название процедуры на русском:');
        return ctx.wizard.next();
    }

    /**
     * Создание новой процедуры - шаг 3.
     * Ввод длительность процедуры.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterDuration(ctx) {
        const { session, message } = ctx;
        session.editingProcedure.russianName = message.text;
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        session.tempMessage = await ctx.reply('Введите длительность процедуры в часах:');
        return ctx.wizard.next();
    }

    /**
     * Создание новой процедуры - шаг 4.
     * Сохранение новой процедуры в базе данных.
     * @param {object} ctx - Контекст Telegram.
     */

    static async saveProcedure(ctx) {
        const { session, message } = ctx;
        session.editingProcedure.duration = message.text;
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        const { englishName, russianName, duration } = session.editingProcedure;
        const newProcedure = new Procedure({ englishName, russianName, duration });
        await newProcedure.save();

        session.tempMessage = await ctx.reply(`Новая процедура "${russianName}" успешно создана.`);
        setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);
        return ctx.scene.leave();
    }

    /**
     * Редактирование процедуры - шаг 1.
     * Получение текущей длительности процедуры.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterNewProcedureDuration(ctx) {
        const { session, callbackQuery } = ctx;
        session.editingProcedure = {};
        session.editingProcedure.englishName = callbackQuery.data.split('_')[3];
        const procedure = await Procedure.findOne({ englishName: session.editingProcedure.englishName });
        session.tempMessage = await ctx.reply(
            `Текущая длительность процедуры "${procedure.russianName}": ${procedure.duration} часа.\nВведите новую длительность процедуры "${procedure.russianName}" в часах:`
        );
        return ctx.wizard.next();
    }

    /**
     * Редактирование процедуры - шаг 2.
     * Обновление длительности процедуры.
     * @param {object} ctx - Контекст Telegram.
     */

    static async saveUpdatedProcedure(ctx) {
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
}

module.exports = ProcedureMethods;
