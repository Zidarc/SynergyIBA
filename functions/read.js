require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
    try {
        // ------------------------------------------
        // 1) Extract teamkey from query parameters
        // ------------------------------------------
        const teamkey = event.queryStringParameters?.teamkey;
        console.log("Received teamkey:", teamkey);

        if (!teamkey) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Team key is missing in the request parameters" }),
            };
        }

        // ------------------------------------------
        // 2) Query Supabase for the given team
        // ------------------------------------------
        const { data, error } = await supabase
            .from('userdata')
            .select('*')
            .eq('Team_password', teamkey)
            .single();

        if (error) {
            console.error("Error querying Supabase:", error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Failed to query Supabase", details: error.message }),
            };
        }

        if (!data) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: `Team '${teamkey}' not found` }),
            };
        }

        // ------------------------------------------
        // 3) Return the team data as JSON
        // ------------------------------------------
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };

    } catch (err) {
        console.error("Unexpected error in handler:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error", details: err.message }),
        };
    }
};
