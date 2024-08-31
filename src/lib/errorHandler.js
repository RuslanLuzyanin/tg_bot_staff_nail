const AppointmentError = require('../errors/appointmentError');
const CallbackError = require('../errors/callbackError');
const MenuError = require('../errors/menuError');

class ErrorHandler {
    static async handleError(error, ctx) {
        this.logger.error(error.stack);

        let message;
        if (error instanceof CallbackError) {
            message =
                'Извините, произошла ошибка при обработке callback-запроса. Пожалуйста, попробуйте еще раз.';
        } else if (error instanceof AppointmentError) {
            message =
                'Извините, это время занято. Пожалуйста, попробуйте еще раз.';
        } else if (error instanceof MenuError) {
            message =
                'Извините, произошла ошибка с данными меню. Пожалуйста, попробуйте еще раз.';
        } else {
            message =
                'Извините, произошла неизвестная ошибка. Пожалуйста, попробуйте еще раз.';
        }

        const response = await ctx.reply(message);
        setTimeout(() => ctx.deleteMessage(response.message_id), 3000);
    }

    static setLogger(logger) {
        this.logger = logger;
    }
}

module.exports = ErrorHandler;
