const mongoose = require('mongoose');


const userTokenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },  
  token: {
    type: String,
    required: true
  },
  shopid: {
    type: String,
    required: true
  }
},
{
  timestamps:true
});

const User = mongoose.model('PhoenixUser', userTokenSchema);
module.exports = User;
