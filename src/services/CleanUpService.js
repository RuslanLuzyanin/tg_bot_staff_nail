const Record = require('../../models/Record');
const moment = require('moment');

class CleanupService {
    static async cleanupOldRecords() {
        const today = moment().format('D MMMM');
        const oldRecords = await Record.find({ date: { $lt: today } });

        for (const record of oldRecords) {
            await record.delete();
        }
    }
}

module.exports = CleanupService;
