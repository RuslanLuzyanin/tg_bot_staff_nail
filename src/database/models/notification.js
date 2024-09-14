const { Schema, model } = require('mongoose');

const notificationSchema = new Schema({
    messageNotification: { type: String, require: true },
    photoNotification: { type: Buffer, require: true },
});

const Notification = model('Notification', notificationSchema);

module.exports = Notification;
