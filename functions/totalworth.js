const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
    try {
        // Step 1: Fetch MasterCoins' stock from the 'userdata' table
        const { data: masterData, error: masterError } = await supabase
            .from('userdata')
            .select('Stock')  // Assuming 'stock' is an array of 20 elements in the MasterCoins row
            .eq('Team_password', 'MasterCoins')
            .single(); // Fetch a single row (MasterCoins row)
        
        if (masterError) {
            throw new Error(`Error fetching MasterCoins data: ${masterError.message}`);
        }

        const masterStock = masterData.Stock;  // masterStock is an array of 20 elements

        // Step 2: Fetch all users' stock data
        const { data: users, error: usersError } = await supabase
            .from('userdata')
            .select('Team_password, Stock, free_money');  // Adjust to select stock and free_money for each user
        
        if (usersError) {
            throw new Error(`Error fetching user data: ${usersError.message}`);
        }

        // Step 3: Iterate over all users to calculate their total_worth
        for (let user of users) {
            const teamId = user.Team_password;
            const userStock = user.Stock;  // userStock is an array of 20 elements
            const freeCoins = user.free_money;

            // Step 4: Check if the arrays have the same length
            if (masterStock.length !== userStock.length) {
                console.error(`Arrays must have the same length for element-wise multiplication. Skipping team ${teamId}`);
                continue;  // Skip this user and continue with the next one
            }

            // Step 5: Calculate the sum of the product of stock arrays
            let sum = userStock.reduce((acc, userStockVal, index) => {
                return acc + userStockVal * masterStock[index];
            }, 0);

            console.log(`Sum of the product for team ${teamId}:`, sum);

            const total = sum + freeCoins;

            // Step 6: Update the document in Supabase for each user
            const { data: updatedData, error } = await supabase
                .from('userdata')
                .update({ total_worth: total })
                .eq('Team_password', teamId)
                .single();  // Update one row at a time

            if (error) {
                console.error(`Error updating data for team ${teamId}:`, error.message);
                continue;  // Skip updating this user if there's an error
            }

            console.log(`Successfully updated total_worth for team ${teamId}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "All documents updated successfully." }),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};
