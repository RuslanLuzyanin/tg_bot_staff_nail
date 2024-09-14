const { Schema, model } = require('mongoose');

const portfolioSchema = new Schema({
    image: { type: Buffer },
    key: { type: Number, required: true, unique: true },
});

const Portfolio = model('Portfolio', portfolioSchema);

module.exports = Portfolio;
