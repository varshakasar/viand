//Require all routes
const express = require('express');
let router = express.Router();
let userController = require('./users.js')();

let models = require('../models/index')();
let User = models.user();

router.get('/', function(req, res) {
  res.send("HOME..");
});
//user
router.post('/registration', userController.register);
router.post('/submitOTP',userController.submitOTP);
router.post('/login', userController.login);
router.post('/regenerateOTP',userController.regenerateOTP);
//router.post('/updateProfile',isVerified,userController.updateProfile);

router.post('/forgotpassword', userController.forgotpassword);
router.post('/verifyOTP', userController.verifyOTP);
router.post('/resetPassword',userController.resetPassword);

router.post('/homes',userController.homes);
router.post('/restaurants',userController.restaurants);
router.post('/combos',userController.combos);


function isVerified(req, res, next){
	 if (req.session.mobile && req.session.password) {
    	next();
  	 } else {
    	res.send('You are not logged in First Login..')
  	}
}
module.exports = router;