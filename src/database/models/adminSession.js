const { Schema, model } = require('mongoose');

const adminSessionSchema = new Schema({
    tempMessage: { type: String },
    lastMessage: { type: String },
    selectedIndex: { type: Number },
    selectedYear: { type: Number },
    selectedMonth: { type: Number },
    editingRecord: {
        selectedDate: { type: String },
        selectedTime: { type: String },
        selectedProcedure: { type: String },
        selectedUser: { type: String },
    },
    workingHours: {
        startTime: { type: String },
        endTime: { type: String },
    },
    editingProcedure: {
        englishName: { type: String },
        russianName: { type: String },
        duration: { type: Number },
    },
});

const AdminSession = model('AdminSession', adminSessionSchema);

module.exports = AdminSession;
