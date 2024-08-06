const { Schema, model } = require('mongoose');

const sessionSchema = new Schema({
    selectedDate: { type: Date },
    selectedTime: { type: String },
    selectedProcedure: { type: String, ref: 'procedures' },
    selectedMonth: { type: String },
    appointments: {
        type: [
            {
                procedure: { type: String, ref: 'procedures' },
                date: { type: String },
                time: { type: String },
            },
        ],
    },
});

const Session = model('Session', sessionSchema);

module.exports = Session;
