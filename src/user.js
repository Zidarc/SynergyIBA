import { getTeamkey } from "./teamdata.js";

let masterCoin;
let userCoins;
let freeCoins;
const supabaseUrl = 'https://ztzjruycuxyblnsgqjqi.supabase.co';  // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0empydXljdXh5Ymxuc2dxanFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzI5OTEsImV4cCI6MjA1MjU0ODk5MX0.2ayQNIfLivLUH5rOnKJrSViIT4jX9Ww3A0xAFv9WlSE';  // Replace with your Supabase anonymous API key

// Create a new client instance with a different variable name
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", async function() {
    await master();
});
async function master() {
    try {
        const response = await fetch(`/.netlify/functions/read?teamkey=MasterCoins`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        masterCoin = data.Stock;
        if (data.error) {
            //document.getElementById("status").innerText = `Error: ${data.error}`;
        } else {
            const coinId = ['OGDC', 'PPL', 'NBP', 'MEBL', 'HBL', 'MCB', 'FCCL', 'LUCK', 'EFERT', 'ENGRO', 'HUBC', 'UNITY', 'HASCOL', 'SNGP', 'PSO', 'PAEL', 'TRG', 'ISL', 'SEARL', 'NML'];

            coinId.forEach((coinId, index) => {
                const htmlContent = `<pre>${data.Stock[index]}</pre>`;
                document.getElementById(coinId).innerHTML = htmlContent;
            });
            //document.getElementById("status").innerText = "Data fetched successfully.";


            const pccoinIds = ['OGDCChange', 'PPLChange', 'NBPChange', 'MEBLChange', 'HBLChange', 'MCBChange', 'FCCLChange', 'LUCKChange', 'EFERTChange', 'ENGROChange', 'HUBCChange', 'UNITYChange', 'HASCOLChange', 'SNGPChange', 'PSOChange', 'PAELChange', 'TRGChange', 'ISLChange', 'SEARLChange', 'NMLChange'];

            pccoinIds.forEach((coinId1, index) => {
                const htmlContent = `<pre>${data.StockChange[index]}</pre>`;
                document.getElementById(coinId1).innerHTML = htmlContent;
            });
            
           // document.getElementById("status").innerText = "Data fetched successfully.";

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
        //document.getElementById("status").innerText = "Error: " + error;
    }finally{
        await readdata();
    }
};

async function readdata() {
    try {
        const teamkey = getTeamkey();
        //const total = await fetch(`/.netlify/functions/totalworth?teamId=${teamId}`);
        const response = await fetch(`/.netlify/functions/read?teamkey=${teamkey}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.statusU}`);
        }

        const data = await response.json();
        userCoins = data.Stock;
        freeCoins = data.free_money;
        let sum = freeCoins + (masterCoin.reduce((acc, masterCoinVal, index) => acc + masterCoinVal * userCoins[index], 0));
        sum =+sum.toFixed(3);
        if (data.error) {
            //document.getElementById("statusU").innerText = `Error: ${data.error}`;
        } else {
            const coinIdsU = ['OGDCU', 'PPLU', 'NBPU', 'MEBLU', 'HBLU', 'MCBU', 'FCCLU', 'LUCKU', 'EFERTU', 'ENGROU', 'HUBCU', 'UNITYU', 'HASCOLU', 'SNGPU', 'PSOU', 'PAELU', 'TRGU', 'ISLU', 'SEARLU', 'NMLU'];

            coinIdsU.forEach((coinId, index) => {
                const htmlContent = `<pre>${data.Stock[index]}</pre>`;
                document.getElementById(coinId).innerHTML = htmlContent;
            });
                   
            document.getElementById("FreeMoney").innerHTML = "<pre>" + data.free_money + "</pre>";
            document.getElementById("TotalWorth").innerHTML = "<pre>" + sum + "</pre>";

            };

    } catch (error) {
        //document.getElementById("statusU").innerText = "Error: " + error;
    }
}
supabaseClient
  .channel('userdata')
  .on('postgres_changes', 
    {
      event: 'UPDATE', // We are listening for updates (changes)
      schema: 'public',
      table: 'userdata',
      filter: 'Team_password=eq.MC', // Filter for the row where Team_password = 'MasterCoins'
    }, 
    (payload) => {
      console.log('Change received!', payload);
      master();  // Call the master function to update the UI
    }
  )
  .subscribe();


document.getElementById("readSelectedValue").addEventListener("click", async function() {
    try {
        let cointype = document.getElementById("CoinType").value;
        let transactiontype = document.getElementById("transactionType").value;
        let coinval = document.getElementById("update").value;
        const teamId = getTeamkey();
        const response = await fetch(`/.netlify/functions/update?cointype=${cointype}&teamId=${teamId}&transactiontype=${transactiontype}&coinval=${coinval}`);
        //const total = await fetch(`/.netlify/functions/totalworth?teamId=${teamId}`);
        await readdata();
    } catch (error) {
        //document.getElementById("statusN").innerText = " Error: " + error;
    }
});

document.getElementById("liquidate").addEventListener("click", async function() {
    try {
        let cointype = document.getElementById("CoinType").value;
        let transactiontype = 2
        const teamId = getTeamId();
        let index;
        const coinTypes = ["OGDC", "PPL", "NBP", "MEBL", "HBL", "MCB", "FCCL", "LUCK", "EFERT", "ENGRO", "HUBC", "UNITY", "HASCOL", "SNGP", "PSO", "PAEL", "TRG", "ISL", "SEARL", "NML"];
        index = coinTypes.indexOf(coinTypes);
        let coinamount = userCoins[index];
        const response = await fetch(`/.netlify/functions/update?cointype=${cointype}&teamId=${teamId}&transactiontype=${transactiontype}&coinval=${coinamount}`);
        //const total = await fetch(`/.netlify/functions/totalworth?teamId=${teamId}`);
        await readdata();
    } catch (error) {
        //document.getElementById("statusN").innerText = " Error: " + error;
    }
    
});


const updateInput = document.getElementById("update");
const buyingPowerDiv = document.querySelector(".buying-power");
const coinTypeInput = document.getElementById("CoinType");


updateInput.addEventListener("input", calculateBuyingPower);
coinTypeInput.addEventListener("change", calculateBuyingPower);

function calculateBuyingPower() {
    try {
        const inputValue = updateInput.value;
        const coinType = coinTypeInput.value;

        let indexs;

        const coinTypes = ["OGDC", "PPL", "NBP", "MEBL", "HBL", "MCB", "FCCL", "LUCK", "EFERT", "ENGRO", "HUBC", "UNITY", "HASCOL", "SNGP", "PSO", "PAEL", "TRG", "ISL", "SEARL", "NML"];
        indexs = coinTypes.indexOf(coinType);

        if (indexs === undefined) {
            console.error("Invalid coinType:", coinType);
            return;
        }

        const content = inputValue * masterCoin[indexs];

        buyingPowerDiv.textContent = ` ${content}`;
    } catch (error) {
        console.error("Error in the calculation:", error);
    }
}



