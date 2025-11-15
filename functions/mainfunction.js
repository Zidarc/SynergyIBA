require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Decimal = require('decimal.js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
    try {
        // ------------------------------------------
        // 1) Fetch MasterCoins data
        // ------------------------------------------
        const { data: masterData, error: masterError } = await supabase
            .from('userdata')
            .select('*')
            .eq('Team_password', 'MasterCoins')
            .single();

        if (masterError) {
            throw new Error(`Error fetching MasterCoins data: ${masterError.message}`);
        }

        // ------------------------------------------
        // 2) Fetch MC team data
        // ------------------------------------------
        const { data: mcData, error: mcError } = await supabase
            .from('userdata')
            .select('*')
            .eq('Team_password', 'MC')
            .single();

        if (mcError) {
            throw new Error(`Error fetching MC data: ${mcError.message}`);
        }

        // ------------------------------------------
        // 3) Parse the updating values from query params
        // ------------------------------------------
        const MCStockChange = event.queryStringParameters?.updatingval
            ? JSON.parse(event.queryStringParameters.updatingval)
            : [];

        const masterStock = masterData.Stock;
        const masterStockChange = masterData.StockChange;

        // ------------------------------------------
        // 4) Update MasterCoins stock based on MCStockChange
        // ------------------------------------------
        const updatedMasterStock = masterStock.map((stock, index) => {
            const change = MCStockChange[index] ?? 0;
            return new Decimal(stock)
                .mul(new Decimal(1).plus(new Decimal(change).div(100)))
                .toNumber();
        });

        const updatedMasterStockChange = masterStockChange.map((_, index) => {
            return new Decimal(MCStockChange[index] ?? 0).toNumber();
        });

        // ------------------------------------------
        // 5) Save updated MasterCoins data
        // ------------------------------------------
        const { error: updateMasterError } = await supabase
            .from('userdata')
            .update({
                Stock: updatedMasterStock,
                StockChange: updatedMasterStockChange
            })
            .eq('Team_password', 'MasterCoins');

        if (updateMasterError) {
            throw new Error(`Error updating MasterCoins: ${updateMasterError.message}`);
        }

        // ------------------------------------------
        // 6) Update MC's StockChange with the same changes
        // ------------------------------------------
        const { error: updateMCError } = await supabase
            .from('userdata')
            .update({
                StockChange: updatedMasterStockChange
            })
            .eq('Team_password', 'MC');

        if (updateMCError) {
            throw new Error(`Error updating MC StockChange: ${updateMCError.message}`);
        }

        // ------------------------------------------
        // 7) Return success response
        // ------------------------------------------
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
            body: JSON.stringify({ message: "MasterCoins and MCStockChange updated successfully." }),
        };

    } catch (error) {
        console.error("Error in updateMasterCoins function:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: "Internal Server Error", details: error.message }),
        };
    }
};
