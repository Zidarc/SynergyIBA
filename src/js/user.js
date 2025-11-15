import { getTeamkey } from "./teamdata.js";

let masterCoin = [];
let userCoins = [];
let freeCoins = 0;

const supabaseUrl = 'https://ztzjruycuxyblnsgqjqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZXhqbXl2aXB1YXphbnh1eWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxODY4MDQsImV4cCI6MjA3ODc2MjgwNH0.jynkTkG9aLy1s_MFPIK3c-fwlFxS8FKKOsIrxqNH0PQ';

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", async () => {
    await fetchMasterCoins();
    await fetchUserData();
    setupRealtime();
    setupEventListeners();
});

function roundTo4Decimals(value) {
    return Math.round(value * 10000) / 10000;
}

// ---------------------- MasterCoins ----------------------
async function fetchMasterCoins() {
    try {
        const response = await fetch(`/.netlify/functions/read?teamkey=MasterCoins`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        if (!data.error) {
            masterCoin = data.Stock.map(roundTo4Decimals);
            updateCoinElements(data);
        }
    } catch (err) {
        console.error("Error fetching MasterCoins:", err);
    }
}

// Update DOM for master coins
function updateCoinElements(data) {
    const coinIds = ['OGDC','PPL','NBP','MEBL','HBL','MCB','FCCL','LUCK','EFERT','ENGRO','HUBC','UNITY','HASCOL','SNGP','PSO','PAEL','TRG','ISL','SEARL','NML'];
    const coinChangeIds = coinIds.map(id => id + 'Change');
    const coinTrendIds = coinIds.map(id => id + 'Trend');

    coinIds.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<pre>${masterCoin[i]}</pre>`;
    });

    coinChangeIds.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<pre>${roundTo4Decimals(data.StockChange[i])}</pre>`;
    });

    coinTrendIds.forEach((id, i) => {
        const div = document.getElementById(id);
        if (!div) return;

        const trendClass = data.StockChange[i] > 0 ? "trending_up"
                          : data.StockChange[i] < 0 ? "trending_down"
                          : "unknown_med";

        div.textContent = trendClass;
        div.classList.remove("trending-green","trending-red","trend-black");

        if (trendClass === "trending_up") div.classList.add("trending-green");
        else if (trendClass === "trending_down") div.classList.add("trending-red");
        else div.classList.add("trend-black");
    });
}

// ---------------------- User Data ----------------------
async function fetchUserData() {
    try {
        const teamkey = getTeamkey();
        const response = await fetch(`/.netlify/functions/read?teamkey=${teamkey}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        if (!data.error) {
            userCoins = data.Stock.map(roundTo4Decimals);
            freeCoins = roundTo4Decimals(data.free_money);

            updateUserElements();
        }
    } catch (err) {
        console.error("Error fetching user data:", err);
    }
}

function updateUserElements() {
    const coinIdsU = ['OGDCU','PPLU','NBPU','MEBLU','HBLU','MCBU','FCCLU','LUCKU','EFERTU','ENGROU','HUBCU','UNITYU','HASCOLU','SNGPU','PSOU','PAELU','TRGU','ISLU','SEARLU','NMLU'];
    coinIdsU.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<pre>${userCoins[i]}</pre>`;
    });

    const freeEl = document.getElementById("FreeMoney");
    if (freeEl) freeEl.innerHTML = `<pre>${freeCoins}</pre>`;

    const totalWorth = roundTo4Decimals(freeCoins + masterCoin.reduce((acc, val, i) => acc + val * userCoins[i], 0));
    const totalEl = document.getElementById("TotalWorth");
    if (totalEl) totalEl.innerHTML = `<pre>${totalWorth}</pre>`;
}

// ---------------------- Realtime ----------------------
function setupRealtime() {
    supabaseClient
      .channel('userdata')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'userdata', filter: 'Team_password=eq.MasterCoins' },
        (payload) => {
            console.log("Realtime MasterCoins update received", payload);

            if (payload.new) {
                masterCoin = payload.new.Stock.map(roundTo4Decimals);
                updateCoinElements(payload.new);
                fetchUserData(); // Update user holdings immediately
            }
        }
      )
      .subscribe();
}

// ---------------------- Event Listeners ----------------------
function setupEventListeners() {
    const buySellBtn = document.getElementById("readSelectedValue");
    const liquidateBtn = document.getElementById("liquidate");

    if (buySellBtn) {
        buySellBtn.addEventListener("click", async () => {
            const coinType = document.getElementById("CoinType")?.value;
            const transactionType = document.getElementById("transactionType")?.value;
            const coinVal = roundTo4Decimals(parseFloat(document.getElementById("update")?.value));

            if (!coinType || !transactionType || coinVal <= 0) return;

            try {
                const teamId = getTeamkey();
                const response = await fetch(`/.netlify/functions/update?cointype=${coinType}&teamId=${teamId}&transactiontype=${transactionType}&coinval=${coinVal}`);
                if (response.ok) fetchUserData();
            } catch (err) {
                console.error("Error during transaction:", err);
            }
        });
    }

    if (liquidateBtn) {
        liquidateBtn.addEventListener("click", async () => {
            const coinType = document.getElementById("CoinType")?.value;
            if (!coinType) return;

            const coinTypes = ["OGDC","PPL","NBP","MEBL","HBL","MCB","FCCL","LUCK","EFERT","ENGRO","HUBC","UNITY","HASCOL","SNGP","PSO","PAEL","TRG","ISL","SEARL","NML"];
            const index = coinTypes.indexOf(coinType);
            if (index === -1) return;

            const coinAmount = roundTo4Decimals(userCoins[index]);
            if (coinAmount <= 0) return;

            try {
                const teamId = getTeamkey();
                const response = await fetch(`/.netlify/functions/update?cointype=${coinType}&teamId=${teamId}&transactiontype=sell&coinval=${coinAmount}`);
                if (response.ok) fetchUserData();
            } catch (err) {
                console.error("Error during liquidation:", err);
            }
        });
    }

    // Buying power calculation
    const updateInput = document.getElementById("update");
    const coinTypeInput = document.getElementById("CoinType");
    const buyingPowerDiv = document.getElementById("buyingPowerDiv");

    if (updateInput) updateInput.addEventListener("input", calculateBuyingPower);
    if (coinTypeInput) coinTypeInput.addEventListener("change", calculateBuyingPower);

    function calculateBuyingPower() {
        const inputValue = parseFloat(updateInput?.value);
        const coinType = coinTypeInput?.value;

        if (!coinType || isNaN(inputValue) || inputValue <= 0) return;

        const coinTypes = ["OGDC","PPL","NBP","MEBL","HBL","MCB","FCCL","LUCK","EFERT","ENGRO","HUBC","UNITY","HASCOL","SNGP","PSO","PAEL","TRG","ISL","SEARL","NML"];
        const index = coinTypes.indexOf(coinType);
        if (index === -1) return;

        const content = inputValue * masterCoin[index];
        if (!isNaN(content)) buyingPowerDiv.textContent = ` ${content}`;
    }
}
