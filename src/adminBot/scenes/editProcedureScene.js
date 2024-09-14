const { Scenes } = require('telegraf');
const Procedure = require('../../database/models/procedure');

const editProcedureScene = new Scenes.WizardScene(
    'edit_procedure',
    async (ctx) => {
        const { session, callbackQuery } = ctx;
        session.editingProcedure.englishName = callbackQuery.data.split('_')[3];

        const procedure = await Procedure.findOne({ englishName: session.editingProcedure.englishName });
        session.tempMessage = await ctx.reply(
            `Текущая длительность процедуры "${procedure.russianName}": ${procedure.duration} часа.\nВведите новую длительность процедуры "${procedure.russianName}" в часах:`
        );
        return ctx.wizard.next();
    },
    async (ctx) => {
        const { session, message } = ctx;
        const procedure = await Procedure.findOne({ englishName: session.editingProcedure.englishName });
        const newDuration = parseInt(message.text);

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
