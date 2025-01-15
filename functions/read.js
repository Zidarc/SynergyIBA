require('dotenv').config();
const { createClient } = require('@supabase/supabase-js'); 

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
    try {
        const teamkey = event.queryStringParameters && event.queryStringParameters.teamkey;
        console.log("Received teamkey:", teamkey);

        if (!teamkey) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Team key is missing in the request parameters" }),
            };
        }

        console.log("Executing query with teamkey:", teamkey);
        
        // Query Supabase to find the team with the given teamkey
        const { data, error } = await supabase
            .from('userdata')  // Replace 'userdata' with your actual table name
            .select('*')
            .eq('Team_password', teamkey)  // Adjust the column name if needed
            .single();

        if (error) {
            console.error("Error querying Supabase:", error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Failed to query Supabase" }),
            };
        }

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
