const { Schema, model } = require('mongoose');

const recordSchema = new Schema({
    userId: { type: String, required: true, ref: 'users' },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    procedure: { type: String, required: true, ref: 'procedures' },
});

const Record = model('Record', recordSchema);

module.exports = Record;
