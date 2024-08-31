const CustomError = require('./CustomError');

class CallbackError extends CustomError {
    constructor(code, ...params) {
        super(code, CallbackError.ERRORS[code], ...params);
    }
}

CallbackError.ERRORS = {
    unknownCallback: 'Неизвестный колбек',
};

module.exports = CallbackError;
