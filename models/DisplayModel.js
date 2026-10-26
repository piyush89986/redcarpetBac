const  mongoose  = require('mongoose');

const displaySchema = new mongoose.Schema({
  backgroundImage: String,
  phoenixText: String,
  pText: String,
  royalPassText: String,
  displayid: String,
});

const DisplayModel = mongoose.model("Display", displaySchema);

module.exports = DisplayModel;
