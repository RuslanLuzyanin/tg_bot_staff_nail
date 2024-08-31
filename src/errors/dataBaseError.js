const CustomError = require('./CustomError');

class DataBaseError extends CustomError {
    constructor(code, ...params) {
        super(code, DataBaseError.ERRORS[code], ...params);
    }
}

DataBaseError.ERRORS = {
    findRecodError: 'Ошибка при поиске записей',
    findUserError: 'Ошибка при поиске пользователя',
    saveUserError: 'Ошибка при сохранении пользователя',
    findProcedureError: 'Ошибка при поиске процедуры',
    findWorkingTimeError: 'Ошибка при поиске рабочего времени',
    saveRecordError: 'Ошибка при сохранении записи',
    deleteRecordError: 'Ошибка при удалении записи',
    findPortfolioError: 'Ошибка при поиске портфолио',
    findPriceError: 'Ошибка при поиске прайса',
};

module.exports = DataBaseError;
