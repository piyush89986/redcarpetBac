const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String},
  email: { type: String, required: true,unique:false },
  password: { type: String, required: true },
  role: { type: String},
});

const User = mongoose.model('foods', UserSchema);

module.exports = User;