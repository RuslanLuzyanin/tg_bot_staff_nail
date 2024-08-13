const Record = require('../../models/Record');
const moment = require('moment');
/**
 * Сервис для очистки устаревших записей из базы данных.
 */
class CleanupService {
    /**
     * Удаляет все записи, дата которых старше одного дня.
     */
    static async cleanupOldRecords() {
        const records = await Record.find();

        for (const record of records) {
            const recordDate = moment(record.date, 'D MMMM');
            if (recordDate.isBefore(moment().subtract(1, 'day'), 'day')) {
                await Record.deleteOne({ _id: record._id });
            }
        }
    }
}

module.exports = CleanupService;
