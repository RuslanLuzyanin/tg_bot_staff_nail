const UserCallback = require('./userCallback');
const MenuCallback = require('./menuCallback');
const AdminCallback = require('./adminCallback');

const callbackCodes = {
    MENU_MAIN: 'menu_main',
    USER_VERIFICATION: 'user_verification',

    BLOCK_USER: 'menu_block_user',
    BLOCK_HANDLE: 'admin_block_',

    UNBLOCK_USER: 'menu_unblock_user',
    UNBLOCK_HANDLE: 'admin_unblock_',

    CHECK_RECORDS: 'menu_check_records',
    CHECK_RECORDS_THREE_DAYS: 'menu_check_three_days_records',

    UPDATE_WORKING_HOURS: 'admin_update_hours',

    CREATE_NOTIFICATION: 'admin_create_notification',
    VIEW_NOTIFICATION: 'admin_view_notification',
    DELETE_NOTIFICATION: 'admin_delete_notification',

    MENU_PROCEDURES: 'menu_procedures',
    SELECT_GROUP: 'admin_select_group',
    CREATE_PROCEDURE: 'admin_create_procedure_',
    UPDATE_PROCEDURE: 'admin_update_procedure_',
    DELETE_PROCEDURE: 'admin_delete_procedure_',

    MENU_PRICE: 'menu_price',
    CREATE_PRICE: 'admin_create_price_',
    UPDATE_PRICE: 'admin_update_price_',
    DELETE_PRICE: 'admin_delete_price_',

    MENU_PORTFOLIO: 'menu_portfolio',
    CREATE_PORTFOLIO: 'admin_create_portfolio_',
    UPDATE_PORTFOLIO: 'admin_update_portfolio_',
    DELETE_PORTFOLIO: 'admin_delete_portfolio_',

    SELECT_OFF: 'menu_select_day_off',
    DELETE_OFF: 'menu_delete_day_off',
    SELECT_MONTH: 'menu_select_month_',
    DELETE_MONTH: 'menu_delete_month_',
    SELECT_DAY_OFF: 'admin_confirm_day_off',
    DELETE_DAY_OFF: 'admin_delete_day_off_',
};

const callbackActions = {
    [callbackCodes.MENU_MAIN]: [MenuCallback.createMainMenu],
    [callbackCodes.USER_VERIFICATION]: [UserCallback.handleVerification, MenuCallback.createMainMenu],

    [callbackCodes.BLOCK_USER]: [MenuCallback.createBlocUserMenu],
    [callbackCodes.BLOCK_HANDLE]: [AdminCallback.handleBlockUser, MenuCallback.createMainMenu],

    [callbackCodes.UNBLOCK_USER]: [MenuCallback.createUnBlocUserMenu],
    [callbackCodes.UNBLOCK_HANDLE]: [AdminCallback.handleUnBlockUser, MenuCallback.createMainMenu],

    [callbackCodes.CHECK_RECORDS]: [AdminCallback.getRecordsData, MenuCallback.createCheckRecordsMenu],
    [callbackCodes.CHECK_RECORDS_THREE_DAYS]: [
        AdminCallback.getRecordsDataThreeDays,
        MenuCallback.createCheckRecordsMenu,
    ],

    [callbackCodes.UPDATE_WORKING_HOURS]: [AdminCallback.handleUpdateWorkingHours],

    [callbackCodes.CREATE_NOTIFICATION]: [AdminCallback.handleCreateNotification],
    [callbackCodes.VIEW_NOTIFICATION]: [AdminCallback.handleViewNotification],
    [callbackCodes.DELETE_NOTIFICATION]: [AdminCallback.handleDeleteNotification],

    [callbackCodes.MENU_PROCEDURES]: [MenuCallback.createProcedureMenu],
    [callbackCodes.SELECT_GROUP]: [MenuCallback.createGroupProcedureMenu],
    [callbackCodes.CREATE_PROCEDURE]: [AdminCallback.handleCreateProcedure, MenuCallback.createMainMenu],
    [callbackCodes.UPDATE_PROCEDURE]: [AdminCallback.handleEditProcedure, MenuCallback.createMainMenu],
    [callbackCodes.DELETE_PROCEDURE]: [AdminCallback.handleDeleteProcedure, MenuCallback.createProcedureMenu],

    [callbackCodes.MENU_PRICE]: [MenuCallback.createPriceMenu],
    [callbackCodes.CREATE_PRICE]: [AdminCallback.handleCreatePrice, MenuCallback.createPriceMenu],
    [callbackCodes.UPDATE_PRICE]: [AdminCallback.handleUpdatePrice, MenuCallback.createMainMenu],
    [callbackCodes.DELETE_PRICE]: [AdminCallback.handleDeletePrice, MenuCallback.createPriceMenu],

    [callbackCodes.MENU_PORTFOLIO]: [MenuCallback.createPortfolioMenu],
    [callbackCodes.CREATE_PORTFOLIO]: [AdminCallback.handleCreatePortfolio, MenuCallback.createPortfolioMenu],
    [callbackCodes.UPDATE_PORTFOLIO]: [AdminCallback.handleUpdatePortfolio, MenuCallback.createMainMenu],
    [callbackCodes.DELETE_PORTFOLIO]: [AdminCallback.handleDeletePortfolio, MenuCallback.createPortfolioMenu],

    [callbackCodes.SELECT_OFF]: [MenuCallback.createSelectMonthMenu],
    [callbackCodes.DELETE_OFF]: [MenuCallback.createDeleteMonthMenu],
    [callbackCodes.SELECT_MONTH]: [
        AdminCallback.handleSelectMonth,
        AdminCallback.handleConfirmDayOff,
        MenuCallback.createMainMenu,
    ],
    [callbackCodes.DELETE_MONTH]: [AdminCallback.handleSelectMonth, MenuCallback.createDeleteDayOffMenu],
    [callbackCodes.DELETE_DAY_OFF]: [AdminCallback.handleDeleteDayOff, MenuCallback.createMainMenu],
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
