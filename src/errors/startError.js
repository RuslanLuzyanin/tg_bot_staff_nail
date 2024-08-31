const CustomError = require('./CustomError');

class StartError extends CustomError {
    constructor(code, ...params) {
        super(code, StartError.ERRORS[code], ...params);
    }
}

StartError.ERRORS = {
    unknownEnvKey: 'Неизвестный ключ ENV',
};

module.exports = StartError;
