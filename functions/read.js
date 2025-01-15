const mongoose = require("mongoose");
const UserData = require("../models/userdata");
require('dotenv').config();

exports.handler = async (event, context) => {
    try {
        mongoose.connect(process.env.MONGODB_URI);
        // Extract team key from the query parameters
        const teamkey = event.queryStringParameters && event.queryStringParameters.teamkey;

        if (!teamkey) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Team key is missing in the request parameters" }),
            };
        }

        // Find data for the specified team
        const data = await UserData.findOne({ Team_password: teamkey });

        if (!data) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: `Team '${teamkey}' not found` }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};
