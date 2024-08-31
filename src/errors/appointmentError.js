const CustomError = require('./CustomError');

class AppointmentError extends CustomError {
    constructor(code, ...params) {
        super(code, AppointmentError.ERRORS[code], ...params);
    }
}

AppointmentError.ERRORS = {
    appointmentConflictError: 'Запись конфликтует с созданными',
};

module.exports = AppointmentError;
