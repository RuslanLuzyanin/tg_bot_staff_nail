const { Procedure } = require('../../../database/models/index');

class ProcedureMethods {
    /**
     * Создание новой процедуры - шаг 1.
     * Сохранение названия группы процедуры.
     * Ввод названия процедуры на русском языке.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterRussianName(ctx) {
        const { session, callbackQuery } = ctx;
        session.editingProcedure = {};
        const selectGroup = callbackQuery.data.split('_')[3];

        const procedures = await Procedure.find({
            englishName: {$regex: `^${selectGroup}`}
        }).sort({englishName: 1});

        let lastNumber = 0;
        if (procedures.length > 0) {
            const lastProcedure = procedures[procedures.length - 1];
            const match = lastProcedure.englishName.match(/\d+$/);

            if (match) {
                lastNumber = parseInt(match[0], 10);
            }
        }

        const newProcedureNumber = lastNumber + 1;

        session.editingProcedure.englishName = `${selectGroup}${newProcedureNumber}`;
        console.log(session.editingProcedure.englishName);

        session.tempMessage = await ctx.reply('Введите название процедуры на русском:');
        return ctx.wizard.next();
    }


    /**
     * Создание новой процедуры - шаг 2.
     * Ввод длительность процедуры.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterDuration(ctx) {
        const { session, message } = ctx;

        if (!message.text || message.text.trim().length === 0) {
            await ctx.reply(
                'Ошибка: текст оповещения не может быть пустым. Пожалуйста, введите текст снова.'
            );
            return ctx.wizard.selectStep(ctx.wizard.cursor - 1);
        }

        session.editingProcedure.russianName = message.text;
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        session.tempMessage = await ctx.reply('Введите длительность процедуры в часах:');
        return ctx.wizard.next();
    }

    /**
     * Создание новой процедуры - шаг 3.
     * Сохранение новой процедуры в базе данных.
     * @param {object} ctx - Контекст Telegram.
     */

    static async saveProcedure(ctx) {
        const { session, message } = ctx;
        const procedureTime = parseFloat(message.text);

        if (isNaN(procedureTime) || procedureTime < 0.5 || procedureTime > 12) {
            await ctx.reply(
                'Ошибка: продолжительность процедуры должна быть числом в диапазоне от 0.5 до 12 часов. Пожалуйста, введите время снова.'
            );
            return ctx.wizard.selectStep(ctx.wizard.cursor - 1);
        }

        session.editingProcedure.duration = procedureTime;
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
        const procedureTime = parseFloat(message.text);

        if (isNaN(procedureTime) || procedureTime < 0.5 || procedureTime > 12) {
            await ctx.reply(
                'Ошибка: продолжительность процедуры должна быть числом в диапазоне от 0.5 до 12 часов. Пожалуйста, введите время снова.'
            );
            return ctx.wizard.selectStep(ctx.wizard.cursor - 1);
        }

        const procedure = await Procedure.findOne({ englishName: session.editingProcedure.englishName });
        const newDuration = procedureTime;

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
