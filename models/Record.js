const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'users' },
    date: { type: String, required: true },
    time: { type: String, required: true },
    procedure: { type: String, required: true, ref: 'procedures' },
});

const Record = mongoose.model('Record', recordSchema);

module.exports = Record;
