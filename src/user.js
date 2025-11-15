import { getTeamkey } from "./teamdata.js";
const { createClient } = require('@supabase/supabase-js');

let masterCoin;
let userCoins;
let freeCoins;

// const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const supabaseClient = supabase.createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", async function() {
    await master();
});


function roundTo4Decimals(value) {
    return Math.round(value * 10000) / 10000;
}

async function master() {
    try {
        const response = await fetch(`/.netlify/functions/read?teamkey=MasterCoins`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        masterCoin = data.Stock.map(value => roundTo4Decimals(value));

        if (!data.error) {
            const coinId = ['OGDC', 'PPL', 'NBP', 'MEBL', 'HBL', 'MCB', 'FCCL', 'LUCK', 'EFERT', 'ENGRO', 'HUBC', 'UNITY', 'HASCOL', 'SNGP', 'PSO', 'PAEL', 'TRG', 'ISL', 'SEARL', 'NML'];
            coinId.forEach((coinId, index) => {
                const htmlContent = `<pre>${masterCoin[index]}</pre>`;
                document.getElementById(coinId).innerHTML = htmlContent;
            });

            const pccoinIds = ['OGDCChange', 'PPLChange', 'NBPChange', 'MEBLChange', 'HBLChange', 'MCBChange', 'FCCLChange', 'LUCKChange', 'EFERTChange', 'ENGROChange', 'HUBCChange', 'UNITYChange', 'HASCOLChange', 'SNGPChange', 'PSOChange', 'PAELChange', 'TRGChange', 'ISLChange', 'SEARLChange', 'NMLChange'];
            pccoinIds.forEach((coinId1, index) => {
                const htmlContent = `<pre>${roundTo4Decimals(data.StockChange[index])}</pre>`;
                document.getElementById(coinId1).innerHTML = htmlContent;
            });

            const coinIds = ['OGDCTrend', 'PPLTrend', 'NBPTrend', 'MEBLTrend', 'HBLTrend', 'MCBTrend', 'FCCLTrend', 'LUCKTrend', 'EFERTTrend', 'ENGROTrend', 'HUBCTrend', 'UNITYTrend', 'HASCOLTrend', 'SNGPTrend', 'PSOTrend', 'PAELTrend', 'TRGTrend', 'ISLTrend', 'SEARLTrend', 'NMLTrend'];
            coinIds.forEach((coinId2, index) => {
                const trendClass = data.StockChange[index] > 0 ? "trending_up" :
                                   data.StockChange[index] < 0 ? "trending_down" :
                                   "unknown_med";
                document.getElementById(coinId2).innerText = trendClass;
            });

            coinIds.forEach((coinId) => {
                const coinDiv = document.getElementById(coinId);
                const coinValue = coinDiv.textContent;

                coinDiv.classList.remove("trending-green", "trending-red", "trend-black");
                if (coinValue === "trending_up") {
                    coinDiv.classList.add("trending-green");
                } else if (coinValue === "trending_down") {
                    coinDiv.classList.add("trending-red");
                } else {
                    coinDiv.classList.add("trend-black");
                }
            });
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await readdata();
    }
}

async function readdata() {
    try {
        const teamkey = getTeamkey();
        const response = await fetch(`/.netlify/functions/read?teamkey=${teamkey}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        userCoins = data.Stock.map(value => roundTo4Decimals(value));
        freeCoins = roundTo4Decimals(data.free_money);

        if (!data.error) {
            const coinIdsU = ['OGDCU', 'PPLU', 'NBPU', 'MEBLU', 'HBLU', 'MCBU', 'FCCLU', 'LUCKU', 'EFERTU', 'ENGROU', 'HUBCU', 'UNITYU', 'HASCOLU', 'SNGPU', 'PSOU', 'PAELU', 'TRGU', 'ISLU', 'SEARLU', 'NMLU'];
            coinIdsU.forEach((coinId, index) => {
                const htmlContent = `<pre>${userCoins[index]}</pre>`;
                document.getElementById(coinId).innerHTML = htmlContent;
            });

            document.getElementById("FreeMoney").innerHTML = `<pre>${freeCoins}</pre>`;

            const totalWorth = roundTo4Decimals(freeCoins + masterCoin.reduce((acc, masterCoinVal, index) => {
                return acc + masterCoinVal * userCoins[index];
            }, 0));

            document.getElementById("TotalWorth").innerHTML = `<pre>${totalWorth}</pre>`;
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
supabaseClient
  .channel('userdata')
  .on('postgres_changes', 
    {
      event: 'UPDATE', 
      schema: 'public',
      table: 'userdata',
      filter: 'Team_password=eq.MC',
    }, 
    (payload) => {
      console.log('Change received!', payload);
      master(); 
    }
  )
  .subscribe();

document.getElementById("readSelectedValue").addEventListener("click", async function () {
    try {
        const cointype = document.getElementById("CoinType").value;
        const transactiontype = document.getElementById("transactionType").value;
        const coinval = roundTo4Decimals(parseFloat(document.getElementById("update").value));

        if (cointype && transactiontype && coinval > 0) {
            const teamId = getTeamkey();
            const response = await fetch(
                `/.netlify/functions/update?cointype=${cointype}&teamId=${teamId}&transactiontype=${transactiontype}&coinval=${coinval}`
            );

            if (response.ok) await readdata();
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

document.getElementById("liquidate").addEventListener("click", async function () {
    try {
        const cointype = document.getElementById("CoinType").value;

        if (!cointype) return;
        const coinTypes = ["OGDC", "PPL", "NBP", "MEBL", "HBL", "MCB", "FCCL", "LUCK", "EFERT", "ENGRO", "HUBC", "UNITY", "HASCOL", "SNGP", "PSO", "PAEL", "TRG", "ISL", "SEARL", "NML"];
        const index = coinTypes.indexOf(cointype);

        if (index === -1) return;

        const coinamount = roundTo4Decimals(userCoins[index]);

        if (coinamount > 0) {
            const teamId = getTeamkey();
            const response = await fetch(
                `/.netlify/functions/update?cointype=${cointype}&teamId=${teamId}&transactiontype=sell&coinval=${coinamount}`
            );

            if (response.ok) await readdata();
        }
    } catch (error) {
        console.error("Error:", error);
    }
});
const updateInput = document.getElementById("update");
const coinTypeInput = document.getElementById("CoinType");
const buyingPowerDiv = document.getElementById("buyingPowerDiv");
updateInput.addEventListener("input", calculateBuyingPower);
coinTypeInput.addEventListener("change", calculateBuyingPower);

function calculateBuyingPower() {
    try {
        const inputValue = updateInput.value;
        const coinType = coinTypeInput.value;

        if (!coinType) {
            console.error("Coin type is not selected or invalid.");
            return;
        }

        if (!inputValue || isNaN(inputValue) || inputValue <= 0) {
            console.error("Invalid input value for calculation. It must be greater than 0.");
            return;
        }
        const coinTypes = ["OGDC", "PPL", "NBP", "MEBL", "HBL", "MCB", "FCCL", "LUCK", "EFERT", "ENGRO", "HUBC", "UNITY", "HASCOL", "SNGP", "PSO", "PAEL", "TRG", "ISL", "SEARL", "NML"];
        const index = coinTypes.indexOf(coinType);

        if (index === -1) {
            console.error("Invalid coin type for calculation.");
            return;
        }

        const content = inputValue * masterCoin[index];

        if (isNaN(content)) {
            console.error("Error in calculation: result is NaN.");
            return;
        }

        buyingPowerDiv.textContent = ` ${content}`;
    } catch (error) {
        console.error("Error in the calculation:", error);
    }
}
