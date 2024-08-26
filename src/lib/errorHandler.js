class ErrorHandler {
    static ERRORS = {
        unknownEnvKey: 'Неизвестный ключ ENV',
        unknownCallback: 'Неизвестный колбек',
        searchAppointmentError: 'Ошибка при поиске записей',
        callbackExecutionError: 'Ошибка при обработке callback-запроса',
        commandExecutionError: 'Ошибка при обработке команды',
        validateMenuDataMassiveError: 'MenuData должен быть массивом объектов',
        validateMenuDataTextError:
            'Каждый элемент MenuData должен иметь свойство text',
        validateMenuDataCallbackError:
            'Каждый элемент MenuData должен иметь свойство callback или url',
    };

    static async handleError(error, ctx) {
        const errorMessage =
            this.ERRORS[error.code] || this.ERRORS.unexpectedError;

        this.logger.error(errorMessage, error.stack);

        const message = await ctx.reply(
            'Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.'
        );
        setTimeout(() => ctx.deleteMessage(message.message_id), 3000);
    }

    static setLogger(logger) {
        this.logger = logger;
    }
}

module.exports = ErrorHandler;
