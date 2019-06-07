const passwordHash = require('password-hash');
const mongoose = require('mongoose');
const async = require('async');
//const bcrypt = require('bcrypt');
const otplib = require('otplib');
var https = require('https');
const request = require('request');
var urlencode = require('urlencode');
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
            var msg = 'Your One Time Password is ' + secret;

            let userExist = await User.findOne({
                mobile: mobile
            });
            if (userExist) throw new Error('Mobile Number already exists.');
            const hashedPassword = passwordHash.generate(password);
            var d = new Date();
            var currenttime = d.getTime();
            sendTextLocalSMS(mobile, msg);
            const user = new User({
                mobile: mobile,
                password: hashedPassword,
                otp: secret,
                flag: false,
                expiresIn: currenttime + 300000
            });
            let newUser = await user.save()
            if (!newUser) throw new Error('Error in user Registration...');
            res.json({
                success: true,
                message: "OTP will be sent on mobile plz enter OTP...",
                data: mobile
            });
        } catch (err) {
            res.send(err.toString())
        }
    }

    async function sendTextLocalSMS(mobileNumber, msg) {
        let options = {
            'apikey': config.apiKey,
            'message': msg,
            'sender': 'txtlcl',
            'numbers': mobileNumber
        }
        request.post({
                url: 'https://api.textlocal.in/send/',
                form: options
            },
            (err, response, body) => {
                if (err) throw new Error('Error in request');
                console.log(msg)
            })
    }


    result.regenerateOTP = async (req, res, next) => {
        console.log('Inside regenerateOTP');
        try{
            if (!req.body || !req.body.mobile) {
                throw new Error('mobile not defined.');
            }
            let {mobile} = req.body;
            let userExist = await User.findOne({
                mobile: mobile
            });
            var d = new Date();
            var currenttime = d.getTime();
            if (!userExist) throw new Error('Invalid credentials.');
            const newsecret = otplib.authenticator.generateSecret();
            var msg = 'Your One Time Password is ' + newsecret;
            //regenerate otp
            sendTextLocalSMS(mobile, msg);
            let updateUser = await User.findOneAndUpdate({mobile: mobile}, {
                    $set: {
                        otp: newsecret,
                        expiresIn: currenttime + 300000
                    }
                },(err,updateData) => {
                    if(err) throw new Error('Invalid user.');
                    res.json({
                        success:true,
                        message:'OTP send on mobile',
                        data:updateData
                    })
                })
        } catch(err){
            res.send(err.toString());
        }
    }
    result.submitOTP = async (req, res, next) => {
        console.log('Inside submitOTP');
        try {
            if (!req.body || !req.body.otp) {
                throw new Error('OTP not defined.');
            }
            if (!req.body || !req.body.mobile) {
                throw new Error('mobile not defined.');
            }
            var reqTime = new Date();
            let {mobile,otp} = req.body;
            let userExist = await User.findOne({
                mobile: mobile
            });
            if (!userExist) throw new Error('Invalid credentials.');
            if (reqTime.getTime() > userExist.expiresIn.getTime()) {
                //regenerate otp
                res.send('Your OTP is expired plz regenerate OTP!!');
                //sendTextLocalSMS(mobile, msg);
            } else {
                let userflag = await User.findOne({otp: otp,mobile: mobile});
                if (!userflag) throw new Error('Invalid user...');
                let updateUser = await User.findOneAndUpdate({mobile: mobile}, {
                    $set: {
                        otp: null,
                        flag: true
                    }
                }, (err, updatedData) => {
                    if (err) throw new Error('otp value not set to null...');
                    console.log('otp is null...')
                })
                res.send('Register...');
            }
        } catch (err) {
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
            if (!userExist) throw new Error('Invalid mobile or password.');
            const newHashPass = (passwordHash.verify(password, userExist.password));
            if (!newHashPass) throw new Error('Invalid mobile or password.');
            res.json({
                success: true,
                message: "successfully login..."
            });
        } catch (err) {
            res.send(err.toString())
        }
    }

    //forgot password

    result.forgotpassword = async(req, res, next) => {
       console.log('Within forgotpassword api');
       try{
        if (!req.body || !req.body.mobile) {
                throw new Error('mobile not defined.');
            }
            let {mobile} = req.body;
            let userExist = await User.findOne({
                mobile: mobile
            });
            if (!userExist) throw new Error('Invalid credentials.');
            var d = new Date();
            var currenttime = d.getTime();
            const newsecret = otplib.authenticator.generateSecret();
            var msg = 'Your One Time Password is ' + newsecret;
            sendTextLocalSMS(mobile, msg);
            let updateotp = await User.findOneAndUpdate({mobile:mobile},{
                $set:{
                    otp:newsecret,
                    expiresIn: currenttime + 300000
                }
            },(err,updateuserotp) => {
                if(err) throw new Error('Error in otp updation.');
                res.status(200).json({
                            message:'OTP send on mobile',
                            data:{otp:newsecret,mobile:updateuserotp.mobile}
                        });
            })

        } catch(err) {
            res.send(err.toString())
        }
    }
     result.verifyOTP = async (req, res, next) => {
        console.log('Inside verifyOTP');
        try {
            if (!req.body || !req.body.otp) {
                throw new Error('OTP not defined.');
            }
            if (!req.body || !req.body.mobile) {
                throw new Error('mobile not defined.');
            }
            var reqTime = new Date();
            let {mobile,otp} = req.body;
            let userExist = await User.findOne({
                mobile: mobile
            });
            if (!userExist) throw new Error('Invalid credentials.');
            if (reqTime.getTime() > userExist.expiresIn.getTime()) {
                //regenerate otp
                res.send('Your OTP is expired plz regenerate OTP!!');
                //sendTextLocalSMS(mobile, msg);
            } else {
                let userflag = await User.findOne({otp: otp,mobile: mobile});
                if (!userflag) throw new Error('Invalid user...');
                let updateUser = await User.findOneAndUpdate({mobile: mobile}, {
                    $set: {
                        otp: null,
                        flag: true
                    }
                }, (err, updatedData) => {
                    if (err) throw new Error('otp value not set to null...');
                    console.log('otp is null...');
                    res.status(200).json({
                            message: 'OTP verified!',
                            data:{mobile:mobile}
                        });
                })
                
            }
        } catch (err) {
            res.send(err.toString());
        }
    }

    result.resetPassword = async(req, res, next) => {
        console.log('within resetPassword api');
        try{
            if (!req.body || !req.body.mobile) {
                throw new Error('mobile not defined.');
            }
            if (!req.body || !req.body.password) {
                throw new Error('password not defined.');
            }
            if (!req.body || !req.body.confirmpassword) {
                throw new Error('confirmpassword not defined.');
            }
            let {mobile,password,confirmpassword} = req.body;
            const hashedPassword = passwordHash.generate(password);
            let userExist = await User.findOne({
                mobile: mobile
            });
            if (!userExist) throw new Error('Invalid credentials.');
            else{
                if(password === confirmpassword) {
                    User.updateMany({
                        mobile:mobile
                    },
                    {
                        $set:{
                            password:hashedPassword
                        }
                    })
                    res.status(200).json({
                            message: 'Password reset'
                        });
            } else{
                throw new Error('Password not match.')
            }
            }
        } catch(err) {
            res.send(err.toString())
        }
    }


    /*result.updateProfile = async (req, res, next) => {
        console.log("Inside updateProfile");
        try {
            if (!req.body || !req.body.name) {
                throw new Error('Name not defined.');
            }

            if (!req.body || !req.body.address) {
                throw new Error('Address not defined.');
            }
            let {
                name,
                address
            } = req.body;
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
        } catch (err) {
            res.send(err.toString())
        }
    }*/
    result.homes = async(req, res, next) => {
       console.log('Within homes list') 
    }
    result.restaurants = async(req, res, next) => {
       console.log('Within restaurants list') 
    }
    result.combos = async(req, res, next) => {
       console.log('Within combos list') 
    }
    return result;
}

//List homes-->location
//List restaurants-->location
//List combos-->location

