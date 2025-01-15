const mongoose = require('mongoose');

const coinNames = ['Bitcoin', 'Polkadot', 'Luna', 'Dogecoin', 'XRP', 'BNB', 'Ethereum'];

const usersdata = new mongoose.Schema({
    Team_name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    Team_password: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    free_money: {
        type: Number,
        required: true,
        trim: true
    },
    total_worth: {
        type: Number,
        required: true,
        trim: true
    },
    stock: {
        type: [Number],
        required: true,
        validate: {
            validator: function (v) {
                return v.length === coinNames.length;
            },
            message: props => `${props.path} array length should match the number of coins`
        }
    },
    stock_percantagechange: {
        type: [Number],
        required: true,
        validate: {
            validator: function (v) {
                return v.length === coinNames.length;
            },
            message: props => `${props.path} array length should match the number of coins`
        }
    }
}, { collection: 'UserData' }); 

const UserData = mongoose.model("UserData", usersdata);
module.exports = UserData;
