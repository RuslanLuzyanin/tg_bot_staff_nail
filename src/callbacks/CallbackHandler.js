class CallbackHandler {
    constructor(ctx, userCallback, appointmentCallback, menuCallback) {
        this.ctx = ctx;
        this.userCallback = userCallback;
        this.appointmentCallback = appointmentCallback;
        this.menuCallback = menuCallback;

        this.callbackMap = {
            menu_book_appointment: [
                this.userCallback.handleRecordUser.bind(this.userCallback),
                () => this.menuCallback.createProcedureMenu(),
            ],
            menu_to_main_menu: [
                this.userCallback.clearIdUser.bind(this.userCallback),
                () => this.menuCallback.createMainMenu(),
            ],
            menu_to_procedure_menu: [
                this.appointmentCallback.clearProcedure.bind(this.appointmentCallback),
                () => this.menuCallback.createProcedureMenu(),
            ],
            menu_to_month_menu: [
                this.appointmentCallback.clearMonth.bind(this.appointmentCallback),
                () => this.menuCallback.createMonthMenu(),
            ],
            menu_to_day_menu: [
                this.appointmentCallback.clearDay.bind(this.appointmentCallback),
                () => this.menuCallback.createDayMenu(),
            ],
            menu_to_time_menu: [
                this.appointmentCallback.clearTime.bind(this.appointmentCallback),
                () => this.menuCallback.createTimeMenu(),
            ],
            app_select_procedure_: [
                this.appointmentCallback.handleSelectProcedure.bind(this.appointmentCallback),
                () => this.menuCallback.createMonthMenu(),
            ],
            app_select_month_: [
                this.appointmentCallback.handleSelectMonth.bind(this.appointmentCallback),
                () => this.menuCallback.createDayMenu(),
            ],
            app_select_day_: [
                this.appointmentCallback.handleSelectDay.bind(this.appointmentCallback),
                () => this.menuCallback.createTimeMenu(),
            ],
            app_select_time_: [
                this.appointmentCallback.handleSelectTime.bind(this.appointmentCallback),
                () => this.menuCallback.createConfirmationMenu(),
            ],
            app_confirm: [
                this.appointmentCallback.handleConfirm.bind(this.appointmentCallback),
                () => this.menuCallback.createMainMenu(),
            ],
        };
    }

    async handleCallback(callbackData) {
        const match = Object.keys(this.callbackMap).find((key) => callbackData.startsWith(key));

        if (match) {
            const callbacks = this.callbackMap[match];

            for (const callback of callbacks) {
                await callback(this.ctx);
            }
            return;
        }
        throw new Error(`Неизвестный колбек: ${callbackData}`);
    }
}

module.exports = CallbackHandler;
