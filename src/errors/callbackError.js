const CustomError = require('./CustomError');

class CallbackError extends CustomError {
    constructor(code, ...params) {
        super(code, CallbackError.ERRORS[code], ...params);
    }
}

CallbackError.ERRORS = {
    searchAppointmentError: 'Ошибка при поиске записей',
    unknownCallback: 'Неизвестный колбек',
};

module.exports = CallbackError;
