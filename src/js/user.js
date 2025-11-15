import { getTeamkey } from "./teamdata.js";

let masterCoin = [];
let userCoins = [];
let freeCoins = 0;

const supabaseUrl = 'https://ztzjruycuxyblnsgqjqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZXhqbXl2aXB1a...';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", master);

function roundTo4Decimals(value) {
    return Math.round(value * 10000) / 10000;
}

// Fetch and display master coin data
async function master() {
    try {
        const response = await fetch(`/.netlify/functions/read?teamkey=MasterCoins`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        masterCoin = data.Stock.map(roundTo4Decimals);

        if (!data.error) {
            updateCoinElements(data);
        }
    } catch (error) {
        console.error("Error fetching master coins:", error);
    } finally {
        await readdata();
    }
}

// Update DOM elements for master coins
function updateCoinElements(data) {
    const coinIds = ['OGDC','PPL','NBP','MEBL','HBL','MCB','FCCL','LUCK','EFERT','ENGRO','HUBC','UNITY','HASCOL','SNGP','PSO','PAEL','TRG','ISL','SEARL','NML'];
    const coinChangeIds = coinIds.map(id => id + 'Change');
    const coinTrendIds = coinIds.map(id => id + 'Trend');

    coinIds.forEach((id, i) => {
        document.getElementById(id).innerHTML = `<pre>${masterCoin[i]}</pre>`;
    });

    coinChangeIds.forEach((id, i) => {
        document.getElementById(id).innerHTML = `<pre>${roundTo4Decimals(data.StockChange[i])}</pre>`;
    });

    coinTrendIds.forEach((id, i) => {
        const trendClass = data.StockChange[i] > 0 ? "trending_up" :
                           data.StockChange[i] < 0 ? "trending_down" :
                           "unknown_med";
        const div = document.getElementById(id);
        div.textContent = trendClass;
        div.classList.remove("trending-green","trending-red","trend-black");

        if (trendClass === "trending_up") div.classList.add("trending-green");
        else if (trendClass === "trending_down") div.classList.add("trending-red");
        else div.classList.add("trend-black");
    });
}

// Fetch and display user-specific coin data
async function readdata() {
    try {
        const teamkey = getTeamkey();
        const response = await fetch(`/.netlify/functions/read?teamkey=${teamkey}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        userCoins = data.Stock.map(roundTo4Decimals);
        freeCoins = roundTo4Decimals(data.free_money);

        if (!data.error) {
            const coinIdsU = ['OGDCU','PPLU','NBPU','MEBLU','HBLU','MCBU','FCCLU','LUCKU','EFERTU','ENGROU','HUBCU','UNITYU','HASCOLU','SNGPU','PSOU','PAELU','TRGU','ISLU','SEARLU','NMLU'];
            coinIdsU.forEach((id, i) => {
                document.getElementById(id).innerHTML = `<pre>${userCoins[i]}</pre>`;
            });

            document.getElementById("FreeMoney").innerHTML = `<pre>${freeCoins}</pre>`;

            const totalWorth = roundTo4Decimals(freeCoins + masterCoin.reduce((acc, val, i) => acc + val * userCoins[i], 0));
            document.getElementById("TotalWorth").innerHTML = `<pre>${totalWorth}</pre>`;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

// Real-time updates for MC changes
supabaseClient
  .channel('userdata')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'userdata', filter: 'Team_password=eq.MasterCoins' }, 
    (payload) => {
        console.log('Change received!', payload);
        master(); 
    }
  )
  .subscribe();

// Event listeners for buy/sell operations
document.getElementById("readSelectedValue").addEventListener("click", async () => {
    try {
        const coinType = document.getElementById("CoinType").value;
        const transactionType = document.getElementById("transactionType").value;
        const coinVal = roundTo4Decimals(parseFloat(document.getElementById("update").value));

        if (coinType && transactionType && coinVal > 0) {
            const teamId = getTeamkey();
            const response = await fetch(`/.netlify/functions/update?cointype=${coinType}&teamId=${teamId}&transactiontype=${transactionType}&coinval=${coinVal}`);
            if (response.ok) await readdata();
        }
    } catch (error) {
        console.error("Error during transaction:", error);
    }
});

document.getElementById("liquidate").addEventListener("click", async () => {
    try {
        const coinType = document.getElementById("CoinType").value;
        if (!coinType) return;

        const coinTypes = ["OGDC","PPL","NBP","MEBL","HBL","MCB","FCCL","LUCK","EFERT","ENGRO","HUBC","UNITY","HASCOL","SNGP","PSO","PAEL","TRG","ISL","SEARL","NML"];
        const index = coinTypes.indexOf(coinType);
        if (index === -1) return;

        const coinAmount = roundTo4Decimals(userCoins[index]);
        if (coinAmount > 0) {
            const teamId = getTeamkey();
            const response = await fetch(`/.netlify/functions/update?cointype=${coinType}&teamId=${teamId}&transactiontype=sell&coinval=${coinAmount}`);
            if (response.ok) await readdata();
        }
    } catch (error) {
        console.error("Error during liquidation:", error);
    }
});

// Buying power calculation
const updateInput = document.getElementById("update");
const coinTypeInput = document.getElementById("CoinType");
const buyingPowerDiv = document.getElementById("buyingPowerDiv");

updateInput.addEventListener("input", calculateBuyingPower);
coinTypeInput.addEventListener("change", calculateBuyingPower);

function calculateBuyingPower() {
    try {
        const inputValue = parseFloat(updateInput.value);
        const coinType = coinTypeInput.value;

        if (!coinType || isNaN(inputValue) || inputValue <= 0) return;

        const coinTypes = ["OGDC","PPL","NBP","MEBL","HBL","MCB","FCCL","LUCK","EFERT","ENGRO","HUBC","UNITY","HASCOL","SNGP","PSO","PAEL","TRG","ISL","SEARL","NML"];
        const index = coinTypes.indexOf(coinType);
        if (index === -1) return;

        const content = inputValue * masterCoin[index];
        if (!isNaN(content)) buyingPowerDiv.textContent = ` ${content}`;
    } catch (error) {
        console.error("Error calculating buying power:", error);
    }
}
