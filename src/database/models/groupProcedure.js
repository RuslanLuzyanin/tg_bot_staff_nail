const { Schema, model } = require('mongoose');

const groupProcedureSchema = new Schema({
    englishName: { type: String, required: true, unique: true },
    russianName: { type: String, required: true },
});

const GroupProcedure = model('GroupProcedure', groupProcedureSchema);

module.exports = GroupProcedure;
