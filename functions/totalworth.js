const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async () => {
    try {
        // ------------------------------------------
        // 1) Fetch MasterCoins prices
        // ------------------------------------------
        const { data: masterRow, error: masterError } = await supabase
            .from('userdata')
            .select('Stock')
            .eq('Team_password', 'MasterCoins')
            .single();

        if (masterError || !masterRow) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "MasterCoins row missing" })
            };
        }

        const masterStock = masterRow.Stock;
        if (!Array.isArray(masterStock)) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "MasterCoins Stock must be an array" })
            };
        }

        // ------------------------------------------
        // 2) Fetch ALL users (including MasterCoins)
        // ------------------------------------------
        const { data: users, error: usersError } = await supabase
            .from('userdata')
            .select('Team_password, Team_name, Stock, free_money');

        if (usersError || !users) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Could not fetch users" })
            };
        }

        const updates = [];

        // ------------------------------------------
        // 3) Compute total_worth for each user
        // ------------------------------------------
        for (const user of users) {
            if (user.Team_password === "MasterCoins") continue; // Skip MasterCoins row

            const teamId = user.Team_password;
            const userStock = user.Stock || [];
            const freeMoney = Number(user.free_money || 0);

            if (!Array.isArray(userStock)) {
                console.warn(`Skipping ${teamId}: Stock is not an array.`);
                continue;
            }

            if (userStock.length !== masterStock.length) {
                console.warn(`Skipping ${teamId}: Stock length mismatch.`);
                continue;
            }

            // Compute Σ(userStock[i] * masterStock[i])
            let stockWorth = 0;
            for (let i = 0; i < userStock.length; i++) {
                stockWorth += userStock[i] * masterStock[i];
            }

            const totalWorth = stockWorth + freeMoney;

            updates.push({
                Team_password: teamId,
                total_worth: totalWorth
            });
        }

        // ------------------------------------------
        // 4) Batch update total_worth (Faster)
        // ------------------------------------------
        for (const entry of updates) {
            const { error } = await supabase
                .from('userdata')
                .update({ total_worth: entry.total_worth })
                .eq('Team_password', entry.Team_password);

            if (error) {
                console.error(`Failed to update ${entry.Team_password}:`, error.message);
            }
        }

        // ------------------------------------------
        // 5) Fetch updated leaderboard sorted
        // ------------------------------------------
        const { data: sortedTeams, error: sortedError } = await supabase
            .from('userdata')
            .select('Team_name, Team_password, total_worth')
            .neq('Team_password', 'MasterCoins') // exclude master
            .order('total_worth', { ascending: false });

        if (sortedError) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Could not fetch leaderboard" })
            };
        }

        // Final response
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Leaderboard updated successfully.",
                leaderboard: sortedTeams
            })
        };

    } catch (err) {
        console.error("Leaderboard Error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" })
        };
    }
};
