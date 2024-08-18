class CallbackHandler {
    constructor(userCallback, appointmentCallback, menuCallback, logger) {
        this.userCallback = userCallback;
        this.appointmentCallback = appointmentCallback;
        this.menuCallback = menuCallback;
        this.logger = logger;
        this.callbackMap = this.generateCallbackMap();
    }

    generateCallbackMap() {
        return {
            user_verification: [
                'userCallback.handleVerification',
                'menuCallback.createMainMenu',
            ],
            menu_to_cancel_appointment: [
                'appointmentCallback.handleGetAppointments',
                'menuCallback.createCancelAppointmentsMenu',
            ],
            menu_to_check_appointment: [
                'appointmentCallback.handleGetAppointments',
                'menuCallback.createCheckAppointmentsMenu',
            ],
            menu_to_main_menu: ['menuCallback.createMainMenu'],
            menu_to_procedure_menu: [
                'appointmentCallback.handleGetAppointments',
                'menuCallback.createProcedureMenu',
            ],
            menu_to_month_menu: ['menuCallback.createMonthMenu'],
            menu_to_day_menu: ['menuCallback.createDayMenu'],
            menu_to_time_menu: ['menuCallback.createTimeMenu'],
            app_select_procedure_: [
                'appointmentCallback.handleSelectProcedure',
                'menuCallback.createMonthMenu',
            ],
            app_select_month_: [
                'appointmentCallback.handleSelectMonth',
                'menuCallback.createDayMenu',
            ],
            app_select_day_: [
                'appointmentCallback.handleSelectDay',
                'menuCallback.createTimeMenu',
            ],
            app_select_time_: [
                'appointmentCallback.handleSelectTime',
                'menuCallback.createConfirmationMenu',
            ],
            app_confirm: [
                'appointmentCallback.handleConfirm',
                'menuCallback.createMainMenu',
            ],
            app_cancel_: [
                'appointmentCallback.handleCancel',
                'menuCallback.createMainMenu',
            ],
        };
    }

    async handle(ctx) {
        const matchingKey = Object.keys(this.callbackMap).find((key) =>
            ctx.callbackQuery.data.startsWith(key)
        );

        if (matchingKey) {
            const callbacks = this.callbackMap[matchingKey];
            await this.executeCallbacks(callbacks);
            return;
        }

        throw { code: 'unknownCallback' };
    }

    async executeCallbacks(callbacks) {
        for (const callback of callbacks) {
            const [className, methodName] = callback.split('.');
            await this[className][methodName]();
        }
    }
}

module.exports = CallbackHandler;
