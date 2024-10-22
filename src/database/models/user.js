const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    first_name: { type: String },
    last_name: { type: String },
    chatId: { type: String, required: true },
    isBanned: { type: Boolean, default: false },
});

const User = model('User', userSchema);

module.exports = User;
