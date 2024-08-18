class ErrorHandler {
    static ERRORS = {
        unknownEnvKey: 'Неизвестный ключ ENV',
        unknownCallback: 'Неизвестный колбек',
        callbackExecutionError: 'Ошибка при обработке callback-запроса',
        commandExecutionError: 'Ошибка при обработке команды',
        messageHandlerError: 'Ошибка при обработке сообщения',
        mongoDbConnectionError: 'Ошибка при подключении к MongoDB',
        sessionMiddlewareSetupError: 'Ошибка при настройке middleware сессий',
        commandHandlerRegistrationError:
            'Ошибка при регистрации обработчика команд',
        callbackHandlerRegistrationError:
            'Ошибка при регистрации обработчика callback-запросов',
        messageHandlerRegistationError:
            'Ошибка при регистрации обработчика сообщений',
        botLaunchError: 'Ошибка при запуске бота',
        recordCleanupError: 'Ошибка при очистке устаревших записей',
        reminderSchedulingError: 'Ошибка при планировании отправки напоминаний',
        cleanupSchedulingError:
            'Ошибка при планировании очистки устаревших записей',
        botStopError: 'Ошибка при остановке бота',
        stopNotificationError:
            'Ошибка при отправке уведомления о недоступности бота',
        validateMenuDataMassiveError: 'MenuData должен быть массивом объектов',
        validateMenuDataTextError:
            'Каждый элемент MenuData должен иметь свойство text',
        validateMenuDataCallbackError:
            'Каждый элемент MenuData должен иметь свойство callback или url',
        unexpectedError: 'Непредвиденная ошибка',
    };

    static handleError(error, ctx) {
        const errorCode = Object.keys(this.ERRORS).find(
            (code) => error.code === code
        );
        const errorMessage =
            this.ERRORS[errorCode] || this.ERRORS.unexpectedError;

        this.logger.error(errorMessage, error);
        ctx.reply(
            'Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.'
        );
    }

    static setLogger(logger) {
        this.logger = logger;
    }
}

module.exports = ErrorHandler;
