const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'users' },
    selectedDate: { type: Date, required: true },
    selectedTime: { type: String, required: true },
    selectedProcedure: { type: String, required: true, ref: 'procedures' },
    selectedMonth: { type: String, required: true },
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
