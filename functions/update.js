const { createClient } = require('@supabase/supabase-js');
const Decimal = require('decimal.js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
    try {
        const teamId = event.queryStringParameters && event.queryStringParameters.teamId;
        if (teamId === "MasterCoins") {
            const { data: MasterCoinsdata, error: masterCoinsError } = await supabase
                .from('userdata')
                .select('*')
                .eq('Team_password', 'MasterCoins')
                .single();

            if (masterCoinsError) {
                throw new Error(`Error fetching MasterCoins data: ${masterCoinsError.message}`);
            }

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
                return new Decimal(stock)
                    .mul(new Decimal(1).plus(new Decimal(change).div(100)))
                    .toNumber();
            });

            const updatedMasterCoinsStockChange = MasterCoinsStockChange.map((change, index) => new Decimal(change).plus(new Decimal(MCStockChange[index])).toNumber());

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
            let coinVal = new Decimal(event.queryStringParameters && event.queryStringParameters.coinval);
            let index;
            let type;
            if (transactionType === "buy") {
                type = 1;
            } else {
                type = 2;
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
                .eq('team_password', teamId)
                .single();

            if (userError) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: userError.message }),
                };
            }
            let freeCoins = new Decimal(UserData.free_money);
            let userCoinVal = new Decimal(UserData.Stock[index]);

            const { data: masterData, error: masterError } = await supabase
                .from('userdata')
                .select('Stock')
                .eq('team_password', 'MasterCoins')
                .single();

            if (masterError) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: masterError.message }),
                };
            }

            const serverCoinVal = new Decimal(masterData.Stock[index]);

            if (type === 1) {
                if (serverCoinVal.mul(coinVal).lte(freeCoins)) {
                    const updatedBalance = freeCoins.minus(serverCoinVal.mul(coinVal));
                    const updatedStock = [...UserData.Stock];
                    updatedStock[index] = userCoinVal.plus(coinVal).toNumber(); // Convert to float8-compatible value
            
                    const { data: updatedData, error: updateError } = await supabase
                        .from('userdata')
                        .update({
                            Stock: updatedStock,
                            free_money: updatedBalance.toNumber(), // Convert to native number
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
                if (coinVal.lte(userCoinVal)) {
                    const increment = freeCoins.plus(coinVal.mul(serverCoinVal));
                    const updatedStock = [...UserData.Stock];
                    updatedStock[index] = userCoinVal.minus(coinVal).toNumber(); // Convert to float8-compatible value
            
                    const { data: updatedData, error: updateError } = await supabase
                        .from('userdata')
                        .update({
                            Stock: updatedStock,
                            free_money: increment.toNumber(), // Convert to native number
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
