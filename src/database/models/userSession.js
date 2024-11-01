const { Schema, model } = require('mongoose');

const sessionSchema = new Schema({
    selectedSlot: { type: String },
    selectedGroupProcedure: { type: String },
    selectedProcedure: { type: String, ref: 'procedures' },
    selectedYear: { type: String },
    selectedMonth: { type: String },
    selectedDate: { type: Date },
    selectedTime: { type: String },
    appointments: {
        type: [
            {
                groupProcedure: { type: String },
                procedure: { type: String, ref: 'procedures' },
                date: { type: Date },
                time: { type: String },
            },
        ],
    },
});

const UserSession = model('usersession', sessionSchema);

module.exports = UserSession;
