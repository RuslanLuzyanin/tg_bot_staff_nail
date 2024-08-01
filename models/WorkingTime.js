const mongoose = require('mongoose');

const workingTimeSchema = new mongoose.Schema({
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
});

const WorkingTime = mongoose.model('WorkingTime', workingTimeSchema);

module.exports = WorkingTime;
