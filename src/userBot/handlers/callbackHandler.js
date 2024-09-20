const MenuCallback = require('../callbacks/menuCallback');
const AppointmentCallback = require('../callbacks/appointmentCallback');
const UserCallback = require('../callbacks/userCallback');

const callbackCodes = {
    MENU_MAIN: 'menu_to_main_menu',
    MENU_SLOTS: 'menu_to_slot_menu',
    MENU_PROCEDURE: 'menu_to_procedure_menu',
    MENU_MONTH: 'menu_to_month_menu',
    MENU_DAY: 'menu_to_day_menu',
    MENU_TIME: 'menu_to_time_menu',
    MENU_CANCEL_APPOINTMENT: 'menu_to_cancel_appointment',
    MENU_CHECK_APPOINTMENT: 'menu_to_check_appointment',
    USER_VERIFICATION: 'user_verification',
    SELECT_SLOT: 'app_select_slot_',
    CHANGE_SLOT: 'change_select_slot',
    SELECT_PROCEDURE: 'app_select_procedure_',
    SELECT_MONTH: 'app_select_month_',
    SELECT_DAY: 'app_select_day_',
    SELECT_TIME: 'app_select_time_',
    CONFIRM_APPOINTMENT: 'app_confirm',
    CANCEL_APPOINTMENT: 'app_cancel_',
};

const callbackActions = {
    [callbackCodes.USER_VERIFICATION]: [UserCallback.handleVerification, MenuCallback.createMainMenu],
    [callbackCodes.MENU_CANCEL_APPOINTMENT]: [
        AppointmentCallback.handleGetAppointments,
        MenuCallback.createCancelAppointmentsMenu,
    ],
    [callbackCodes.MENU_CHECK_APPOINTMENT]: [
        AppointmentCallback.handleGetAppointments,
        MenuCallback.createCheckAppointmentsMenu,
    ],
    [callbackCodes.MENU_MAIN]: [MenuCallback.createMainMenu],
    [callbackCodes.MENU_SLOTS]: [AppointmentCallback.handleGetAppointments, MenuCallback.createSlotMenu],
    [callbackCodes.MENU_PROCEDURE]: [MenuCallback.createProcedureMenu],
    [callbackCodes.MENU_MONTH]: [MenuCallback.createMonthMenu],
    [callbackCodes.MENU_DAY]: [MenuCallback.createDayMenu],
    [callbackCodes.MENU_TIME]: [MenuCallback.createTimeMenu],
    [callbackCodes.CHANGE_SLOT]: [AppointmentCallback.clearSelectedSlot, MenuCallback.createSlotMenu],
    [callbackCodes.SELECT_SLOT]: [AppointmentCallback.handleSelectSlot, MenuCallback.createProcedureMenu],
    [callbackCodes.SELECT_PROCEDURE]: [
        AppointmentCallback.handleSelectProcedure,
        MenuCallback.createMonthMenu,
    ],
    [callbackCodes.SELECT_MONTH]: [AppointmentCallback.handleSelectMonth, MenuCallback.createDayMenu],
    [callbackCodes.SELECT_DAY]: [AppointmentCallback.handleSelectDay, MenuCallback.createTimeMenu],
    [callbackCodes.SELECT_TIME]: [
        UserCallback.handleVerification,
        AppointmentCallback.handleSelectTime,
        MenuCallback.createConfirmationMenu,
    ],
    [callbackCodes.CONFIRM_APPOINTMENT]: [AppointmentCallback.handleConfirm, MenuCallback.createMainMenu],
    [callbackCodes.CANCEL_APPOINTMENT]: [AppointmentCallback.handleCancel, MenuCallback.createMainMenu],
};

class CallbackHandler {
    /**
     * Создает экземпляр класса CallbackHandler.
     *
     * @param {Object} logger - Логгер для ведения журналов.
     */
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Обрабатывает колбек-запрос.
     *
     * Ищет соответствующее действие по данным колбек-запроса
     * и выполняет связанные с ним функции.
     *
     * @param {Object} ctx - Контекст колбек-запроса.
     * @param {Object} logger - Логгер для ведения журналов.
     * @param {Object} bot - Экземпляр бота.
     * @throws {Error} Вызывает ошибку, если не удалось найти соответствующее действие.
     */
    async handle(ctx, logger, bot) {
        const data = ctx.callbackQuery.data;
        const matchingKey = Object.keys(callbackActions).find((key) => data.startsWith(key));

        if (matchingKey) {
            const callbacks = callbackActions[matchingKey];
            await this.executeCallbacks(callbacks, ctx, logger, bot);
            return;
        }

        throw new Error('unknownCallbackError');
    }

    /**
     * Выполняет массив функций обратного вызова.
     *
     * @param {Function[]} callbacks - Массив функций обратного вызова для выполнения.
     * @param {Object} ctx - Контекст колбек-запроса.
     * @param {Object} logger - Логгер для ведения журналов.
     * @param {Object} bot - Экземпляр бота.
     */
    async executeCallbacks(callbacks, ctx, logger, bot) {
        for (const callback of callbacks) {
            await callback(ctx, logger, bot);
        }
    }
}

module.exports = CallbackHandler;
