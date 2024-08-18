const { Schema, model } = require('mongoose');

const sessionSchema = new Schema({
    selectedProcedure: { type: String, ref: 'procedures' },
    selectedYear: { type: String },
    selectedMonth: { type: String },
    selectedDate: { type: Date },
    selectedTime: { type: String },
    appointments: {
        type: [
            {
                procedure: { type: String, ref: 'procedures' },
                date: { type: Date },
                time: { type: String },
            },
        ],
    },
});

const Session = model('Session', sessionSchema);

module.exports = Session;
