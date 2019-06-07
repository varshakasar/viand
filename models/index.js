//Require all models
const mongoose = require('mongoose'),
    _ = require('lodash'),
    user = require('./user');


//let connections = {};

module.exports =  () => {

    let mongoModels = {};

    mongoModels.user =  () => {
        return mongoose.model('user', user);
    };

  return mongoModels;
};