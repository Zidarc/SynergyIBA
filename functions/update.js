const { createClient } = require('@supabase/supabase-js');
const Decimal = require('decimal.js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
    try {
        // -------------------------
        // Parse Query Parameters
        // -------------------------
        const teamId = event.queryStringParameters?.teamId;
        const coinType = event.queryStringParameters?.cointype;
        const transactionType = event.queryStringParameters?.transactiontype;
        const coinValRaw = event.queryStringParameters?.coinval;

        if (!teamId || !coinType || !transactionType || !coinValRaw) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing query parameters" })
            };
        }

        const coinVal = new Decimal(coinValRaw);

        const coinTypes = [
            "OGDC","PPL","NBP","MEBL","HBL","MCB","FCCL","LUCK","EFERT","ENGRO",
            "HUBC","UNITY","HASCOL","SNGP","PSO","PAEL","TRG","ISL","SEARL","NML"
        ];

        const index = coinTypes.indexOf(coinType);
        if (index === -1) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid coinType" })
            };
        }

        // Convert transaction type to numeric
        const type = transactionType === "buy" ? 1 : transactionType === "sell" ? 2 : null;
        if (!type) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid transactionType" })
            };
        }

        // -------------------------
        // Fetch User Row
        // -------------------------
        const { data: userRow, error: userError } = await supabase
            .from('userdata')
            .select('Stock, free_money')
            .eq('Team_password', teamId)
            .single();

        if (userError || !userRow) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "User not found" })
            };
        }

        let freeCoins = new Decimal(userRow.free_money);
        let userCoinVal = new Decimal(userRow.Stock[index]);

        // -------------------------
        // Fetch Master Coin Prices
        // -------------------------
        const { data: masterRow, error: masterError } = await supabase
            .from('userdata')
            .select('Stock')
            .eq('Team_password', 'MasterCoins')
            .single();

        if (masterError || !masterRow) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "MasterCoins row missing" })
            };
        }

        const serverCoinVal = new Decimal(masterRow.Stock[index]);

        // -------------------------
        // BUY Logic
        // -------------------------
        if (type === 1) {
            const cost = serverCoinVal.mul(coinVal);

            if (cost.gt(freeCoins)) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: "Insufficient balance to buy" })
                };
            }

            const updatedStock = [...userRow.Stock];
            const newBalance = freeCoins.minus(cost);

            updatedStock[index] = userCoinVal.plus(coinVal).toNumber();

            await supabase
                .from('userdata')
                .update({
                    Stock: updatedStock,
                    free_money: newBalance.toNumber()
                })
                .eq('Team_password', teamId);

            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Buy transaction successful" })
            };
        }

        // -------------------------
        // SELL Logic
        // -------------------------
        if (type === 2) {
            if (coinVal.gt(userCoinVal)) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: "Not enough stock to sell" })
                };
            }

            const earnings = coinVal.mul(serverCoinVal);
            const updatedStock = [...userRow.Stock];
            const newBalance = freeCoins.plus(earnings);

            updatedStock[index] = userCoinVal.minus(coinVal).toNumber();

            await supabase
                .from('userdata')
                .update({
                    Stock: updatedStock,
                    free_money: newBalance.toNumber()
                })
                .eq('Team_password', teamId);

            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Sell transaction successful" })
            };
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Unexpected error" })
        };

    } catch (error) {
        console.error("Internal Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Internal Server Error",
                details: error.message
            })
        };
    }
};
