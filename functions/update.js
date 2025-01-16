const { createClient } = require('@supabase/supabase-js');
const Decimal = require('decimal.js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
    try {
        const teamId = event.queryStringParameters && event.queryStringParameters.teamId;
        const coinType = event.queryStringParameters && event.queryStringParameters.cointype;
        const transactionType = event.queryStringParameters && event.queryStringParameters.transactiontype;
        let coinVal = new Decimal(event.queryStringParameters && event.queryStringParameters.coinval);
        
        // Validate coinVal (ensure it's a positive number and not zero)
        if (coinVal.lte(0)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "coinVal must be a positive number greater than zero" }),
            };
        }
        
        let index;
        let type;
        if (transactionType === "buy") {
            type = 1;
        } else if (transactionType === "sell") {
            type = 2;
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid transactionType. It must be either 'buy' or 'sell'" }),
            };
        }

        const coinTypes = ["OGDC", "PPL", "NBP", "MEBL", "HBL", "MCB", "FCCL", "LUCK", "EFERT", "ENGRO", "HUBC", "UNITY", "HASCOL", "SNGP", "PSO", "PAEL", "TRG", "ISL", "SEARL", "NML"];
        index = coinTypes.indexOf(coinType);

        if (index === -1) {
            console.error("Invalid coinType:", coinType);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid coinType" }),
            };
        }

        if (!teamId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Team name is missing in the request parameters" }),
            };
        }

        const { data: UserData, error: userError } = await supabase
            .from('userdata')
            .select('Stock, free_money')
            .eq('Team_password', teamId)
            .single();

        if (userError) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: userError.message }),
            };
        }

        // Keep the variables as Decimal instances for calculations
        let freeCoins = new Decimal(UserData.free_money);
        let userCoinVal = new Decimal(UserData.Stock[index]);

        // Ensure freeCoins and userCoinVal are not negative
        if (freeCoins.lte(0) || userCoinVal.lte(0)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Negative values are not allowed for free_money or Stock" }),
            };
        }

        const { data: masterData, error: masterError } = await supabase
            .from('userdata')
            .select('Stock')
            .eq('Team_password', 'MasterCoins')
            .single();

        if (masterError) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: masterError.message }),
            };
        }

        const serverCoinVal = new Decimal(masterData.Stock[index]);

        // Ensure serverCoinVal is not negative
        if (serverCoinVal.lte(0)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Server coin value cannot be negative" }),
            };
        }

        if (type === 1) {
            // Buy operation
            if (serverCoinVal.mul(coinVal).lte(freeCoins)) {
                const updatedBalance = freeCoins.minus(serverCoinVal.mul(coinVal));
                const updatedStock = [...UserData.Stock];
                updatedStock[index] = userCoinVal.plus(coinVal).toFixed(4); // Round to 4 decimal places

                const { data: updatedData, error: updateError } = await supabase
                    .from('userdata')
                    .update({
                        Stock: updatedStock,
                        free_money: updatedBalance.toFixed(4), // Ensure free_money is in 4 decimal places
                    })
                    .eq('Team_password', teamId)
                    .single();

                if (updateError) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: updateError.message }),
                    };
                }

                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: "Document updated successfully.", data: updatedData }),
                };
            } else {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: "Insufficient funds to complete the buy transaction" }),
                };
            }
        } else if (type === 2) {
            // Sell operation
            if (coinVal.lte(userCoinVal)) {
                const increment = freeCoins.plus(coinVal.mul(serverCoinVal));
                const updatedStock = [...UserData.Stock];
                updatedStock[index] = userCoinVal.minus(coinVal).toFixed(4); // Round to 4 decimal places

                const { data: updatedData, error: updateError } = await supabase
                    .from('userdata')
                    .update({
                        Stock: updatedStock,
                        free_money: increment.toFixed(4), // Ensure free_money is in 4 decimal places
                    })
                    .eq('Team_password', teamId)
                    .single();

                if (updateError) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: updateError.message }),
                    };
                }

                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: "Document updated successfully.", data: updatedData }),
                };
            } else {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: "Not enough stock to complete the sell transaction" }),
                };
            }
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid transactionType or coinVal" }),
        };
    } catch (error) {
        console.error("Error in the function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error", details: error.message }),
        };
    }
};
