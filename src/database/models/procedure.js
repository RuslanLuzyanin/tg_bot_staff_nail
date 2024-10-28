const { Schema, model } = require('mongoose');

const procedureSchema = new Schema({
    englishName: { type: String, required: true, unique: true },
    russianName: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
});

const Procedure = model('Procedure', procedureSchema);

module.exports = Procedure;
