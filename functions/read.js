require('dotenv').config();
const mongoose = require("mongoose");
const UserData = require("../models/userdata");

exports.handler = async (event, context) => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB.");

        const teamkey = event.queryStringParameters && event.queryStringParameters.teamkey;
        console.log("Received teamkey:", teamkey);

        if (!teamkey) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Team key is missing in the request parameters" }),
            };
        }

        const data = await UserData.findOne({ Team_password: new RegExp(`^${teamkey}$`, 'i') });
        console.log("Query result:", data);

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
        console.error("Error details:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error", details: error.message }),
        };
    }
};
