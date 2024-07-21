const { getProcedureMenu } = require('../services/bookAppointmentServices/getProcedureMenu');
const { handleCallbackQuery } = require('../services/bookAppointmentServices/handleCallbackQuery');

class BookAppointment {
    constructor() {
        this.getProcedureMenu = getProcedureMenu;
        this.handleCallbackQuery = handleCallbackQuery;
    }

    startBooking(ctx) {
        ctx.editMessageText('Выберите процедуру:', this.getProcedureMenu());
    }

    handleCallback(ctx) {
        this.handleCallbackQuery(ctx);
    }
}

module.exports = BookAppointment;
