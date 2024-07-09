const { Markup } = require('telegraf');
const moment = require('moment');
const { getMainMenu, getBackToMenuButton, getBackToDateButton } = require('../utils/menu');
const {
    getProcedureButtons,
    getTimeButtons,
    workingHours,
    AVAILABLE_APPOINTMENTS,
} = require('../services/appointmentService');

class ActionHandler {
    constructor(bot) {
        this.bot = bot;
        this.setup();
    }

    setup() {
        const actions = [
            { action: 'back_to_date', handler: this.backToDate },
            { action: 'book_appointment', handler: this.bookAppointment },
            { action: 'cancel_appointment', handler: this.cancelAppointment },
            { action: 'check_appointment', handler: this.checkAppointment },
            { action: 'back_to_menu', handler: this.backToMenu },
            { action: 'back_to_procedure', handler: this.backToProcedure },
        ];

        Object.keys(AVAILABLE_APPOINTMENTS).forEach((procedureKey) => {
            actions.push({
                action: `book_${procedureKey.toLowerCase()}`,
                handler: this.bookProcedure.bind(this, procedureKey),
            });
        });

        workingHours.forEach((time) => {
            actions.push({ action: `book_time_${time}`, handler: this.bookTime.bind(this, time) });
        });

        actions.forEach(({ action, handler }) => {
            this.bot.action(action, handler.bind(this));
        });
    }

    bookAppointment(ctx) {
        ctx.editMessageText('Выберите процедуру:', getProcedureButtons());
    }

    bookProcedure(procedureKey, ctx) {
        ctx.session = ctx.session || {};
        ctx.session.procedure = procedureKey;
        const today = moment().startOf('day');
        const dates = [];
        for (let i = 0; i < 20; i++) {
            dates.push(today.clone().add(i, 'days').format('DD.MM'));
        }
        const dateButtons = dates.map((date, index) => {
            return Markup.button.callback(date, `pick_date_${date}`);
        });
        const groupedButtons = [];
        for (let i = 0; i < dateButtons.length; i += 4) {
            groupedButtons.push(dateButtons.slice(i, i + 4));
        }
        const backButton = Markup.button.callback('Назад', 'back_to_procedure');
        groupedButtons.push([backButton]);
        ctx.editMessageText('Выберите дату:', Markup.inlineKeyboard(groupedButtons));
    }

    pickDate(date, ctx) {
        ctx.session.date = date;
        ctx.editMessageText(`Выбрана дата: ${date}. Теперь выберите время:`, getTimeButtons());
    }

    bookTime(time, ctx) {
        const procedure = ctx.session.procedure;
        const date = ctx.session.date;
        if (!procedure || !date) {
            ctx.reply('Произошла ошибка: название процедуры или дата не определены.');
            return;
        }
        ctx.telegram.sendMessage(ctx.from.id, `Вы зарегистрировались на ${procedure} ${date} в ${time}.`);
        ctx.editMessageText('Выберите опцию:', getMainMenu());
    }

    cancelAppointment(ctx) {
        ctx.editMessageText('Функция отмены записи', Markup.inlineKeyboard([getBackToMenuButton()]));
    }

    checkAppointment(ctx) {
        ctx.editMessageText('Функция проверки записи', Markup.inlineKeyboard([getBackToMenuButton()]));
    }

    backToMenu(ctx) {
        ctx.editMessageText('Выберите опцию:', getMainMenu());
    }
    backToProcedure(ctx) {
        if (ctx.session && ctx.session.procedure) {
            const procedure = ctx.session.procedure;
            ctx.session.procedure = procedure;
        }
        ctx.editMessageText('Выберите процедуру:', getProcedureButtons());
    }
    backToDate(ctx) {
        this.bookProcedure(ctx.session.procedure, ctx);
    }
}

function setupActions(bot) {
    const actionHandler = new ActionHandler(bot);
    actionHandler.setup();
    bot.action(/pick_date_(.+)/, (ctx) => {
        const date = ctx.match[1];
        actionHandler.pickDate(date, ctx);
    });
}

module.exports = { setupActions };
