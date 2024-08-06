const { Schema, model } = require('mongoose');

const portfolioSchema = new Schema({
    imageUrl: { type: String, required: true },
    procedure: { type: String, required: true, ref: 'procedures' },
});

const Portfolio = model('Portfolio', portfolioSchema);

module.exports = Portfolio;
