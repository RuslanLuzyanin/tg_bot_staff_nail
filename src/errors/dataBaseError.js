const CustomError = require('./CustomError');

class DataBaseError extends CustomError {
    constructor(code, ...params) {
        super(code, DataBaseError.ERRORS[code], ...params);
    }
}

DataBaseError.ERRORS = {
    searchAppointmentError: 'Ошибка при поиске записей',
};

module.exports = DataBaseError;
