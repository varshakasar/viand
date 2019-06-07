const passwordHash = require('password-hash');
const mongoose = require('mongoose');
const async = require('async');
const bcrypt = require('bcrypt');
const otplib = require('otplib');
const twilio = require('twilio');
let models = require('../models/index')();
let config = require('../config/config.json');

let User = models.user();

module.exports = () => {
    var result = {};

    result.register = async (req, res, next) => {
        console.log('Inside registration...');
        try {
            if (!req.body || !req.body.mobile) {
                throw new Error('Mobile not defined.');
            }
            if (!req.body || !req.body.password) {
                throw new Error('Password not defined.');
            }
            let {mobile,password} = req.body;
            const secret = otplib.authenticator.generateSecret();
            var accountSid = config.accountSid; // Your Account SID from www.twilio.com/console
			var authToken = config.authToken;   // Your Auth Token from www.twilio.com/console
			var client = new twilio(accountSid, authToken);

            const token = otplib.authenticator.generate(secret);
            let userExist = await User.findOne({
        		mobile: mobile
      		});
      		if (userExist) throw new Error('Mobile Number already exists.');
            const hashedPassword = passwordHash.generate(password);
            let msgBody = "Your One Time Password is "+secret;
            let msgStatus = await client.messages.create({body:msgBody,to:mobile,from:'+14073782796'});
				if(!msgStatus) throw new Error('Message not send....')
				console.log('Message send!!!');
				req.session.mobile = mobile;
				req.session.otp = secret;
				console.log(req.session.mobile);
				console.log(req.session.otp);
				const user = new User({
                    mobile: mobile,
                    password: hashedPassword
                });
                let newUser = await user.save()
                if (!newUser) throw new Error('Error in user Registration...');
      			res.json({
		          success: true,
		          message: "OTP will be sent on mobile plz enter OTP..."
		        });     
        }catch (err) {
            res.send(err.toString())
        }
    }
    result.submitOTP = async (req,res,next) => {
    	console.log('Inside submitOTP');
    	try{
    		if (!req.body || !req.body.otp) {
                throw new Error('OTP not defined.');
            }
            console.log(req.session.otp)
            if(req.body.otp == req.session.otp){
            	let flag = await User.findOne({mobile:req.session.mobile});
            	if(!flag) throw new Error('Invalid user...');
            	res.send('Register...');
            }else{
            	throw new Error('OTP not valid...')
            }
        //     let otpExist = await User.findOne({otp:otp,mobile:req.session.mobile});
      		// if(!otpExist) throw new Error('Wrong credentials...');
      		// 	res.send('Register...')
    	} catch(err){
    		res.send(err.toString());
    	}

    }
    result.login = async (req, res, next) => {
        console.log("Inside login");
        try {
            if (!req.body || !req.body.mobile) {
                throw new Error('Mobile not defined.');
            }

            if (!req.body || !req.body.password) {
                throw new Error('Password not defined.');
            }
            let {mobile,password} = req.body;
            req.session.mobile = mobile;
            req.session.password = password;
            let userExist = await User.findOne({
        		mobile: mobile
      		});
      		if (!userExist) {
        		throw new Error('Mobile Number not register.');
      		}
            const newHashPass = (passwordHash.verify(password, userExist.password));
            if (!newHashPass) throw new Error('Incorrect password.');
            res.json({
		          success: true,
		          message: "successfully login..."
		        });
        }catch (err) {
            res.send(err.toString())
        }
    }

    result.updateProfile = async (req,res,next) => {
    	console.log("Inside updateProfile");
    	try {
            if (!req.body || !req.body.name) {
                throw new Error('Name not defined.');
            }

            if (!req.body || !req.body.address) {
                throw new Error('Address not defined.');
            }
            let {name,address} = req.body;
            let userExist = await User.findOne({
        		mobile: req.session.mobile
      		});
      		if (!userExist) {
        		throw new Error('User not exist.');
      		}
            if (!newHashPass) throw new Error('Incorrect password.');
            res.json({
		          success: true,
		          message: "successfully login..."
		        });
        }catch (err) {
            res.send(err.toString())
        }
    }
    return result;
}

