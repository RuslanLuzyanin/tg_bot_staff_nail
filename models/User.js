const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    chatId: { type: String, required: true },
});

const User = model('User', userSchema);

module.exports = User;
