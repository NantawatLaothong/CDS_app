const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ticketScheme = new Schema({
    id: {
        type: String,
        required: true
    },
    spec: {
        type: String
    },
    user:{
            type: Schema.Types.ObjectId,
            ref: 'User'
    },
    submitted: {
        type: Date,
        default: Date.now
    },
    approved: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Denied'],
        default: 'Pending'
    },
    completed: {
        type: String,
        enum: ['In-Progress', 'Dilivered', 'Denied'],
        default: 'In-Progress'
    },
    address: {
        type: String,
        requird: true
    },
    notes: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketScheme);