const { Schema, model } = require('mongoose');

const recordSchema = new Schema({
    userId: { type: String, required: true, ref: 'users' },
    date: { type: String, required: true },
    time: { type: String, required: true },
    procedure: { type: String, required: true, ref: 'procedures' },
});

const Record = model('Record', recordSchema);

module.exports = Record;
