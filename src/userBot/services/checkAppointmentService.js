const Record = require('../../database/models/record');
const moment = require('moment');

class CheckAppointmentService {
    static async checkAvailability(selectedDate, selectedTime, duration) {
        const startTime = moment(selectedTime, 'HH:mm');
        const endTime = startTime.clone().add(duration, 'hours');

        const conflictingRecords = await Record.find({
            date: new Date(selectedDate),
            time: {
                $gte: startTime.format('HH:mm'),
                $lt: endTime.format('HH:mm'),
            },
        });
        return conflictingRecords.length;
    }
}

module.exports = CheckAppointmentService;
