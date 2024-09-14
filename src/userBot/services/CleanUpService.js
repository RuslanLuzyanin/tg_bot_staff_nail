const Record = require('../../database/models/record');
const moment = require('moment');
/**
 * Сервис для очистки устаревших записей из базы данных.
 */
class CleanupService {
    /**
     * Удаляет все записи, дата которых старше одного дня.
     */
    static async cleanupOldRecords() {
        const cutoffDate = moment().subtract(1, 'day').toDate();

        await Record.deleteMany({
            date: { $lt: cutoffDate },
        });
    }
}

module.exports = CleanupService;
