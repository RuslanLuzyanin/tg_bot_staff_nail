const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    procedure: { type: String, required: true, ref: 'procedures' },
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio;
