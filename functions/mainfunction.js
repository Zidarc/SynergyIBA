const { createClient } = require('@supabase/supabase-js');
const Decimal = require('decimal.js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
    try {
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
        const MCStockChange = event.queryStringParameters.updatingval ? JSON.parse(event.queryStringParameters.updatingval) : [];

        // Step 1: Update MasterCoinsStock and MasterCoinsStockChange
        const updatedMasterCoinsStock = MasterCoinsStock.map((stock, index) => {
            const change = MCStockChange[index] || 0;
            return new Decimal(stock)
                .mul(new Decimal(1).plus(new Decimal(change).div(100)))
                .toNumber();
        });

        const updatedMasterCoinsStockChange = MasterCoinsStockChange.map((change, index) => {
            return new Decimal(MCStockChange[index] || 0).toNumber();
        });

        // Update the MasterCoins data first
        const { error: updateMasterCoinsError } = await supabase
            .from('userdata')
            .update({
                Stock: updatedMasterCoinsStock,
                StockChange: updatedMasterCoinsStockChange
            })
            .eq('Team_password', 'MasterCoins');

        if (updateMasterCoinsError) {
            throw new Error(`Error updating MasterCoins data: ${updateMasterCoinsError.message}`);
        }

        // Step 2: Now update MCStockChange with the updated MasterCoinsStockChange values
        const { error: updateMCStockChangeError } = await supabase
            .from('userdata')
            .update({
                StockChange: updatedMasterCoinsStockChange
            })
            .eq('Team_password', 'MC');

        if (updateMCStockChangeError) {
            throw new Error(`Error updating MCStockChange data: ${updateMCStockChangeError.message}`);
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",  // Allows any origin to access the function
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",  // Allow these HTTP methods
                "Access-Control-Allow-Headers": "Content-Type, Authorization",  // Allow these headers
            },
            body: JSON.stringify({ message: "MasterCoins data and MCStockChange updated successfully." }),
        };

    } catch (error) {
        console.error("Error in the function:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",  // Allows any origin to access the function
            },
            body: JSON.stringify({ error: "Internal Server Error", details: error.message }),
        };
    }
};
