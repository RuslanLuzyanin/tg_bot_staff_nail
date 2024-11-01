const {Procedure} = require('../../../database/models/index');

class ProcedureMethods {
    /**
     * Создание новой процедуры - шаг 1.
     * Сохранение названия группы процедуры.
     * Ввод названия процедуры на русском языке.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterRussianName(ctx) {
        const {session, callbackQuery} = ctx;
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
        session.tempMessage = await ctx.reply('Введите название процедуры на русском:');
        return ctx.wizard.next();
    }


    /**
     * Создание новой процедуры - шаг 2.
     * Ввод длительность процедуры.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterDuration(ctx) {
        const {session, message} = ctx;

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
     * Ввод цены процедуры
     * @param {object} ctx - Контекст Telegram.
     */
    static async enterPrice(ctx) {
        const {session, message} = ctx;
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

        session.tempMessage = await ctx.reply('Введите цену процедуры в рублях:');
        return ctx.wizard.next();
    }

    /**
     * Создание новой процедуры - шаг 4.
     * Сохранение процедуры в базе данных.
     * @param {object} ctx - Контекст Telegram.
     */
    static async saveProcedure(ctx) {
        const {session, message} = ctx;
        const procedurePrice = parseFloat(message.text);

        if (isNaN(procedurePrice) || procedurePrice <= 0) {
            await ctx.reply(
                'Ошибка: цена должна быть положительным числом. Пожалуйста, введите цену снова.'
            );
            return ctx.wizard.selectStep(ctx.wizard.cursor - 1);
        }

        session.editingProcedure.price = procedurePrice;
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        const {englishName, russianName, duration, price} = session.editingProcedure;
        const newProcedure = new Procedure({englishName, russianName, duration, price});
        await newProcedure.save();

        session.tempMessage = await ctx.reply(`Новая процедура "${russianName}" успешно создана.`);
        setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);
        return ctx.scene.leave();
    }

    /**
     * Редактирование процедуры - шаг 1.
     * Получение текущей длительности и цены процедуры.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterNewProcedureDetails(ctx) {
        const {session, callbackQuery} = ctx;
        session.editingProcedure = {};
        session.editingProcedure.englishName = callbackQuery.data.split('_')[3];

        const procedure = await Procedure.findOne({englishName: session.editingProcedure.englishName});

        session.tempMessage = await ctx.reply(
            `Текущая длительность процедуры "${procedure.russianName}": ${procedure.duration} часа.\n` +
            `Текущая цена: ${procedure.price} руб.\nВведите новую длительность процедуры "${procedure.russianName}" в часах:`
        );

        return ctx.wizard.next();
    }

    /**
     * Редактирование процедуры - шаг 2.
     * Обновление длительности процедуры и запрос новой цены.
     * @param {object} ctx - Контекст Telegram.
     */

    static async enterNewPrice(ctx) {
        const {session, message} = ctx;
        const procedureTime = parseFloat(message.text);

        if (isNaN(procedureTime) || procedureTime < 0.5 || procedureTime > 12) {
            await ctx.reply(
                'Ошибка: продолжительность процедуры должна быть числом в диапазоне от 0.5 до 12 часов. Пожалуйста, введите время снова.'
            );
            return ctx.wizard.selectStep(ctx.wizard.cursor - 1);
        }

        session.editingProcedure.newDuration = procedureTime;
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        session.tempMessage = await ctx.reply('Введите новую цену процедуры в рублях:');
        return ctx.wizard.next();
    }

    /**
     * Редактирование процедуры - шаг 3.
     * Сохранение новой длительности и цены процедуры.
     * @param {object} ctx - Контекст Telegram.
     */

    static async saveUpdatedProcedure(ctx) {
        const {session, message} = ctx;
        const newPrice = parseFloat(message.text);

        if (isNaN(newPrice) || newPrice <= 0) {
            await ctx.reply(
                'Ошибка: цена должна быть положительным числом. Пожалуйста, введите цену снова.'
            );
            return ctx.wizard.selectStep(ctx.wizard.cursor - 1);
        }

        const procedure = await Procedure.findOne({englishName: session.editingProcedure.englishName});

        procedure.duration = session.editingProcedure.newDuration;
        procedure.price = newPrice;
        await procedure.save();

        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        session.tempMessage = await ctx.reply(
            `Длительность процедуры "${procedure.russianName}" успешно изменена на ${procedure.duration} часа, ` +
            `а цена на ${procedure.price} руб.`
        );
        setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);

        return ctx.scene.leave();
    }

}

module.exports = ProcedureMethods;
