const { getProcedureMenu } = require('./getProcedureMenu');
const getDateMenu = require('./getDateMenu');
const getTimeMenu = require('./getTimeMenu');
const getConfirmMenu = require('./getConfirmMenu');
const { showMainMenu } = require('../../handlers/start');
const handleManicureSelection = require('./handleManicureSelection');
const handlePedicureSelection = require('./handlePedicureSelection');
const handleConfirmAppointment = require('./handleConfirmAppointment');
const handleDateSelection = require('./handleDateSelection');
const handleTimeSelection = require('./handleTimeSelection');
const { unavailableDatesObj, availableTimesObj } = require('./unvailableWindows');

const callbackHandlers = {
    select_manicure: handleManicureSelection,
    select_pedicure: handlePedicureSelection,
    show_next_dates: (ctx) => ctx.editMessageText('Выберите дату:', getDateMenu(24, false, true, unavailableDatesObj)),
    show_prev_dates: (ctx) => ctx.editMessageText('Выберите дату:', getDateMenu(0, true, false, unavailableDatesObj)),
    confirm_appointment: handleConfirmAppointment,
    back_to_procedure_menu: (ctx) => ctx.editMessageText('Выберите процедуру:', getProcedureMenu()),
    back_to_date_menu: (ctx) => ctx.editMessageText('Выберите дату:', getDateMenu(0, true, false, unavailableDatesObj)),
    back_to_time_menu: (ctx) => ctx.editMessageText('Выберите время:', getTimeMenu(availableTimesObj)),
    back_to_main_menu: (ctx) => showMainMenu(ctx),
};

async function handleCallbackQuery(ctx) {
    const callbackData = ctx.callbackQuery.data;

    // Обработчик для выбора даты
    if (callbackData.startsWith('select_date_')) {
        await handleDateSelection(ctx);
        ctx.editMessageText('Выберите время:', getTimeMenu(availableTimesObj));
        return;
    }

    // Обработчик для выбора времени
    if (callbackData.startsWith('select_time_')) {
        const confirmationMessage = handleTimeSelection(ctx);
        if (confirmationMessage) {
            ctx.editMessageText(confirmationMessage, getConfirmMenu());
        }
        return;
    }

    const handler = callbackHandlers[callbackData];
    if (handler) {
        handler(ctx);
    } else {
        ctx.answerCbQuery('Неизвестная команда');
    }
}

module.exports = { handleCallbackQuery };
