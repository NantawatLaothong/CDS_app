const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

// create a Schema for User 
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    tickets: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Ticket'
        }
    ],
    fname: String,
    lname: String,
    Bio: {
        text: {
            type: String
        }, 
        profileImage: {
                url: String,
                filename: String,
        }
    },
    department: {
        type: String,
        required: true,
        enum: ["CS", 'MATH', 'IT', 'SCI', 'ART', 'BIOLOGY']
    },
    role: {
        type: String,
        enum: ["supervisor", 'employee', 'IT']
    },
}, { timestamps: true });
// This will add Username nad password to the schema and some methods to use for authentication 
// username will be unique
userSchema.plugin(passportLocalMongoose);

// https://www.udemy.com/course/the-web-developer-bootcamp/learn/lecture/22117222#overview

module.exports = mongoose.model('User', userSchema);