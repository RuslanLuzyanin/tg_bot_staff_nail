const { Schema, model } = require('mongoose');

const portfolioSchema = new Schema({
    image: { type: String },
    key: { type: Number, required: true, unique: true },
});

const Portfolio = model('Portfolio', portfolioSchema);

module.exports = Portfolio;
