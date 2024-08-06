class CallbackHandler {
    constructor(userCallback, appointmentCallback, menuCallback, logger) {
        this.userCallback = userCallback;
        this.appointmentCallback = appointmentCallback;
        this.menuCallback = menuCallback;
        this.logger = logger;

        this.callbackMap = {
            user_verification: [
                this.userCallback.handleVerification,
                this.menuCallback.createMainMenu,
            ],
            menu_to_cancel_appointment: [
                this.appointmentCallback.handleGetAppointments,
                this.menuCallback.createCancelAppointmentsMenu,
            ],
            menu_to_check_appointment: [
                this.appointmentCallback.handleGetAppointments,
                this.menuCallback.createCheckAppointmentsMenu,
            ],
            menu_to_main_menu: [this.menuCallback.createMainMenu],
            menu_to_procedure_menu: [
                this.appointmentCallback.handleGetAppointments,
                this.menuCallback.createProcedureMenu,
            ],
            menu_to_month_menu: [this.menuCallback.createMonthMenu],
            menu_to_day_menu: [this.menuCallback.createDayMenu],
            menu_to_time_menu: [this.menuCallback.createTimeMenu],
            app_select_procedure_: [
                this.appointmentCallback.handleSelectProcedure,
                this.menuCallback.createMonthMenu,
            ],
            app_select_month_: [
                this.appointmentCallback.handleSelectMonth,
                this.menuCallback.createDayMenu,
            ],
            app_select_day_: [
                this.appointmentCallback.handleSelectDay,
                this.menuCallback.createTimeMenu,
            ],
            app_select_time_: [
                this.appointmentCallback.handleSelectTime,
                this.menuCallback.createConfirmationMenu,
            ],
            app_confirm: [
                this.appointmentCallback.handleConfirm,
                this.menuCallback.createMainMenu,
            ],
            app_cancel_: [
                this.appointmentCallback.handleCancel,
                this.menuCallback.createMainMenu,
            ],
        };
    }

    async handle(ctx) {
        const matchingKey = Object.keys(this.callbackMap).find((key) =>
            ctx.callbackQuery.data.startsWith(key)
        );

        if (matchingKey) {
            const callbacks = this.callbackMap[matchingKey];
            await this.executeCallbacks(ctx, callbacks);
            return;
        }

        throw new Error(`Неизвестный колбек: ${ctx.callbackQuery.data}`);
    }

    async executeCallbacks(ctx, callbacks) {
        for (const callback of callbacks) {
            try {
                await callback(ctx);
            } catch (error) {
                this.logger.error(
                    `Ошибка при обработке колбека "${callbacks[0]}":`,
                    error
                );
                await ctx.reply(
                    'Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.'
                );
            }
        }
    }
}

module.exports = CallbackHandler;
