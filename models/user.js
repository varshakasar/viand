const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

var user = new mongoose.Schema({
	mobile:{
		type:String,
		required:true,
		unique:true
	},
	password:{
		type:String,
		required:true
	},
	otp:String,
	flag:Boolean,
	expiresIn:Date
});

module.exports = user;