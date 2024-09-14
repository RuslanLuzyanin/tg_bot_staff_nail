const { Schema, model } = require('mongoose');

const workingTimeSchema = new Schema({
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
});

const WorkingTime = model('WorkingTime', workingTimeSchema);

module.exports = WorkingTime;
