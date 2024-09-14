const { Scenes } = require('telegraf');
const WorkingTime = require('../../database/models/workingTime');
const Record = require('../../database/models/record');

const updateDayOffScene = new Scenes.WizardScene(
    'update_day_off',
    async (ctx) => {
        const { session } = ctx;
        session.tempMessage = await ctx.reply(`Введите даты выходных в этом месяце (например: 1, 5, 15):`);
        return ctx.wizard.next();
    },
    async (ctx) => {
        const { session, message } = ctx;
        const dateParts = message.text.split(',').map((dateStr) => dateStr.trim());
        const workingTime = await WorkingTime.findOne({}, { startTime: 1, endTime: 1 });
        const [startTime, endTime] = [workingTime.startTime, workingTime.endTime];
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);

        for (const dateStr of dateParts) {
            const date = new Date(`${session.selectedYear}-${session.selectedMonth}-${dateStr}`);
            for (let hour = startHour; hour < endHour; hour++) {
                const time = `${hour.toString().padStart(2, '0')}:00`;
                await Record.create({ userId: ctx.from.id, date, time, procedure: 'OFF' });
            }
        }

        await ctx.deleteMessage(message.message_id);
        await ctx.deleteMessage(session.tempMessage.message_id);

        session.tempMessage = await ctx.reply('Выходные дни успешно обновлены.');
        setTimeout(() => ctx.deleteMessage(session.tempMessage.message_id), 5000);
        return ctx.scene.leave();
    }
);

module.exports = updateDayOffScene;
