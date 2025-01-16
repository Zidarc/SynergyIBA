const { createClient } = require('@supabase/supabase-js');
const Decimal = require('decimal.js');

// const response = await fetch(`/.netlify/functions/update?cointype=${cointype}&teamId=${teamId}&transactiontype=${transactiontype}&coinval=${coinval}`);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
    try {
        const teamId = event.queryStringParameters && event.queryStringParameters.teamId;

const { data: MasterCoinsdata, error: masterCoinsError } = await supabase
    .from('userdata')
    .select('*')
    .eq('Team_password', 'MasterCoins')
    .single();

if (masterCoinsError) {
    throw new Error(`Error fetching MasterCoins data: ${masterCoinsError.message}`);
}

if (teamId === "MasterCoins") {
    const { data: MCdata, error: mcError } = await supabase
        .from('userdata')
        .select('*')
        .eq('Team_password', 'MC')
        .single();

    if (mcError) {
        throw new Error(`Error fetching MC data: ${mcError.message}`);
    }

    const MasterCoinsStock = MasterCoinsdata.Stock;
    const MasterCoinsStockChange = MasterCoinsdata.StockChange;
    const MCStockChange = MCdata.StockChange;

    const updatedMasterCoinsStock = MasterCoinsStock.map((stock, index) => {
        const change = MCStockChange[index];
        return stock * (100 + change / 100);
    });

    const updatedMasterCoinsStockChange = MasterCoinsStockChange.map((change, index) => change);

    const { error: updateError } = await supabase
        .from('userdata')
        .update({
            Stock: updatedMasterCoinsStock,
            StockChange: updatedMasterCoinsStockChange
        })
        .eq('Team_password', 'MasterCoins');

    if (updateError) {
        throw new Error(`Error updating MasterCoins data: ${updateError.message}`);
    }

                } else {    
                        const coinType = event.queryStringParameters && event.queryStringParameters.cointype;
                        const transactionType = event.queryStringParameters && event.queryStringParameters.transactiontype;
                        let coinVal = event.queryStringParameters && event.queryStringParameters.coinval;
                        let index;
                        let type;
                
                        if (transactionType === "buy") {
                            type = 1;
                        } else {
                            type = 2;
                        }
                
                        if (coinType === "bitcoin") {
                            index = 0;
                        } else if (coinType === "polkadot") {
                            index = 1;
                        } else if (coinType === "luna") {
                            index = 2;
                        } else if (coinType === "dogecoin") {
                            index = 3;
                        } else if (coinType === "xrp") {
                            index = 4;
                        } else if (coinType === "bnb") {
                            index = 5;
                        } else if (coinType === "eth"){
                            index = 6;
                        } else {
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
                
                        // Fetch user data from Supabase
                        const { data, error: userError } = await supabase
                            .from('userdata')
                            .select('coins, free_money')
                            .eq('team_password', teamId)
                            .single();  // Assuming the teamId is unique to each entry
                
                        if (userError) {
                            return {
                                statusCode: 400,
                                body: JSON.stringify({ error: userError.message }),
                            };
                        }
                
                        let userCoins = data.coins;
                        let freeCoins = data.free_money;
                        let userCoinVal = data.coins[index];
                
                        // Fetch server data (MasterCoins) from Supabase
                        const { data: masterData, error: masterError } = await supabase
                            .from('userdata')
                            .select('coins')
                            .eq('team_password', 'MasterCoins')
                            .single();
                
                        if (masterError) {
                            return {
                                statusCode: 400,
                                body: JSON.stringify({ error: masterError.message }),
                            };
                        }
                
                        const serverCoinVal = masterData.coins[index];
                        let coincount = new Decimal(coinVal).dividedBy(serverCoinVal).toNumber();
                
                        if (type === 1) {
                            if (coincount <= (freeCoins / serverCoinVal)) {
                                // Update in case of buying
                                let updatebalance = new Decimal(freeCoins).minus(coinVal).toDecimalPlaces(8, Decimal.ROUND_DOWN).toNumber();
                                
                                // Perform update
                                const { data: updatedData, error: updateError } = await supabase
                                    .from('userdata')
                                    .update({
                                        [`coins.${index}`]: new Decimal(userCoinVal).plus(coincount).toNumber(),
                                        free_money: updatebalance
                                    })
                                    .eq('team_password', teamId)
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
                            }
                        } else if (type === 2) {
                            if (coincount <= userCoinVal) {
                                let increment = new Decimal(freeCoins).plus(coinVal).toNumber();
                                
                                // Perform update
                                const { data: updatedData, error: updateError } = await supabase
                                    .from('userdata')
                                    .update({
                                        [`coins.${index}`]: new Decimal(userCoinVal).minus(coincount).toNumber(),
                                        free_money: increment
                                    })
                                    .eq('team_password', teamId)
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
                            }
                        }
                
                        return {
                            statusCode: 400,
                            body: JSON.stringify({ error: "Invalid transactionType or coinVal" }),
                        };
            }
        } catch (error) {
            console.error("Error in the function:", error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Internal Server Error", details: error.message }),
        };
    }
};
