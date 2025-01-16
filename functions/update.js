import { getTeamkey } from "../src/teamdata";

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
        const response = await fetch(`/.netlify/functions/read?teamkey=${teamkey}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        userCoins = data.Stock;
        freeCoins = data.free_money;

        if (data.error) {
            console.error(`Error: ${data.error}`);
        } else {
            const coinIdsU = ['OGDCU', 'PPLU', 'NBPU', 'MEBLU', 'HBLU', 'MCBU', 'FCCLU', 'LUCKU', 'EFERTU', 'ENGROU', 'HUBCU', 'UNITYU', 'HASCOLU', 'SNGPU', 'PSOU', 'PAELU', 'TRGU', 'ISLU', 'SEARLU', 'NMLU'];

            // Update coin holdings for the user
            coinIdsU.forEach((coinId, index) => {
                const htmlContent = `<pre>${data.Stock[index]}</pre>`;
                document.getElementById(coinId).innerHTML = htmlContent;
            });

            // Display free money
            document.getElementById("FreeMoney").innerHTML = `<pre>${data.free_money}</pre>`;

            // Calculate total worth on the client side
            const totalWorth = freeCoins + masterCoin.reduce((acc, masterCoinVal, index) => {
                return acc + masterCoinVal * userCoins[index];
            }, 0);

            // Round the total worth and update the UI
            document.getElementById("TotalWorth").innerHTML = `<pre>${totalWorth.toFixed(3)}</pre>`;
        }
    } catch (error) {
        console.error("Error:", error);
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


  document.getElementById("readSelectedValue").addEventListener("click", async function () {
    try {
        // Retrieve and validate input values
        let cointype = document.getElementById("CoinType").value;
        let transactiontype = document.getElementById("transactionType").value;
        let coinval = document.getElementById("update").value;

        if (!cointype) {
            console.error("Coin type is not selected or invalid.");
            return;
        }

        if (!transactiontype) {
            console.error("Transaction type is not selected or invalid.");
            return;
        }

        if (!coinval || isNaN(coinval) || coinval <= 0) {
            console.error("Invalid coin value entered. It must be greater than 0.");
            return;
        }

        // Validate team ID
        const teamId = getTeamkey();
        if (!teamId) {
            console.error("Team ID not found.");
            return;
        }

        // Make the API call to update the coin transaction
        const response = await fetch(
            `/.netlify/functions/update?cointype=${cointype}&teamId=${teamId}&transactiontype=${transactiontype}&coinval=${coinval}`
        );

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        // Update data after successful transaction
        await readdata();
        console.log("Transaction successful.");
    } catch (error) {
        console.error("An error occurred:", error);
    }
});

document.getElementById("liquidate").addEventListener("click", async function () {
    try {
        // Retrieve and validate the coin type
        let cointype = document.getElementById("CoinType").value;
        if (!cointype) {
            console.error("Coin type is not selected or invalid.");
            return;
        }

        const coinTypes = ["OGDC", "PPL", "NBP", "MEBL", "HBL", "MCB", "FCCL", "LUCK", "EFERT", "ENGRO", "HUBC", "UNITY", "HASCOL", "SNGP", "PSO", "PAEL", "TRG", "ISL", "SEARL", "NML"];
        const index = coinTypes.indexOf(cointype);

        if (index === -1) {
            console.error("Invalid coin type selected.");
            return;
        }

        // Retrieve the coin amount from userCoins
        let coinamount = userCoins[index];
        if (!coinamount || isNaN(coinamount) || coinamount <= 0) {
            console.error("Invalid coin amount entered. It must be greater than 0.");
            return;
        }

        // Validate team ID
        const teamId = getTeamkey();
        if (!teamId) {
            console.error("Team ID not found.");
            return;
        }

        // Make the API call to update the coin transaction
        const response = await fetch(
            `/.netlify/functions/update?cointype=${cointype}&teamId=${teamId}&transactiontype=sell&coinval=${coinamount}`
        );

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        // Update data after successful liquidation
        await readdata();
        console.log("Liquidation successful.");
    } catch (error) {
        console.error("An error occurred:", error);
    }
});

updateInput.addEventListener("input", calculateBuyingPower);
coinTypeInput.addEventListener("change", calculateBuyingPower);

function calculateBuyingPower() {
    try {
        // Retrieve input values and validate
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

        // Validate coin type and calculate buying power
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

        // Display calculated buying power
        buyingPowerDiv.textContent = ` ${content}`;
    } catch (error) {
        console.error("Error in the calculation:", error);
    }
}




