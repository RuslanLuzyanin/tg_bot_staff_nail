const { Schema, model } = require('mongoose');

const priceSchema = new Schema({
    image: { type: String },
    key: { type: Number, required: true, unique: true },
});

const Price = model('Price', priceSchema);

module.exports = Price;
