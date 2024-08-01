const mongoose = require('mongoose');

const procedureSchema = new mongoose.Schema({
    englishName: { type: String, required: true, unique: true },
    russianName: { type: String, required: true },
    duration: { type: Number, required: true },
});

const Procedure = mongoose.model('Procedure', procedureSchema);

module.exports = Procedure;
