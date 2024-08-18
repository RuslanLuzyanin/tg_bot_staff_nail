const Record = require('../../../models/Record');
const moment = require('moment');
/**
 * Сервис для очистки устаревших записей из базы данных.
 */
class CleanupService {
    /**
     * Удаляет все записи, дата которых старше одного дня.
     */
    static async cleanupOldRecords() {
        const oneDay = 24 * 60 * 60 * 1000; // 1 день в миллисекундах
        const cutoffDate = new Date(Date.now() - oneDay);

        await Record.deleteMany({
            date: { $lt: cutoffDate },
        });
    }
}

module.exports = CleanupService;
