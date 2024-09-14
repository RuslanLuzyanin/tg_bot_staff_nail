const { Scenes } = require('telegraf');
const Procedure = require('../../database/models/procedure');

const createProcedureScene = new Scenes.WizardScene(
    'create_procedure',
    async (ctx) => {
        const { session } = ctx;
        session.tempMessage = await ctx.reply('Введите название процедуры на английском:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const { session, message } = ctx;
        session.editingProcedure.englishName = message.text;
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        session.tempMessage = await ctx.reply('Введите название процедуры на русском:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const { session, message } = ctx;
        session.editingProcedure.russianName = message.text;
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        session.tempMessage = await ctx.reply('Введите длительность процедуры в часах:');
        return ctx.wizard.next();
    },
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
