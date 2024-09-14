class ErrorHandler {
    static ERRORS = {
        unknownEnvKeyError: 'Неизвестный ключ ENV',
        unknownCallbackError: 'Неизвестный колбек',
        userIsBannedError: 'Вы заблокированы',
        userIsNotAdminError: 'У вас нет доступа',
        recordLimitError:
            'У Вас уже есть 3 записи на процедуры. Вы не можете создать новую запись',
        appointmentConflictError:
            'Запись конфликтует с созданными рание записями',
        validateMenuDataMassiveError: 'MenuData должен быть массивом объектов',
        validateMenuDataTextError:
            'Каждый элемент MenuData должен иметь свойство text',
        validateMenuDataCallbackError:
            'Каждый элемент MenuData должен иметь свойство callback или url',
    };

    static async handleError(error, ctx) {
        this.logger.error(error.stack);

        const errorMessage = this.ERRORS[error.message];
        const message = errorMessage
            ? `Извините, произошла ошибка: ${errorMessage}. Пожалуйста, попробуйте еще раз.`
            : 'Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.';

        const response = await ctx.reply(message);
        setTimeout(() => ctx.deleteMessage(response.message_id), 5000);
    }

    static setLogger(logger) {
        this.logger = logger;
    }
}

module.exports = ErrorHandler;
