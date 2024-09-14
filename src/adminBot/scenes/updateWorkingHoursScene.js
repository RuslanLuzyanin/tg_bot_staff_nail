const { Scenes } = require('telegraf');
const WorkingTime = require('../../database/models/workingTime');

const updateWorkingHoursScene = new Scenes.WizardScene(
    'update_working_hours',
    async (ctx) => {
        const { session } = ctx;
        session.tempMessage = await ctx.reply('Введите начало рабочего дня (в формате HH:MM):');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const { session, message } = ctx;
        session.workingHours = { startTime: message.text };
        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);
        session.tempMessage = await ctx.reply('Введите конец рабочего дня (в формате HH:MM):');
        return ctx.wizard.next();
    },
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
