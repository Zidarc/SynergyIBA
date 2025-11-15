import { setTeamkey } from "./teamdata.js";

// Set team key after login
function setTeamIdAfterLogin(key) {
    setTeamkey(key);
}

// Clear input fields on page reload or back navigation
window.addEventListener('pageshow', (event) => {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        setTeamIdAfterLogin("");
        document.getElementById('teamName').value = "";
        document.getElementById('password').value = "";
    }
});

// Sign-in function
async function signIn() {
    const teamName = document.getElementById('teamName').value.trim();
    const password = document.getElementById('password').value.trim();

    setTeamIdAfterLogin(password);

    const errorBox = document.getElementById('errorbox');
    errorBox.innerText = "";

    if (!teamName || !password) {
        errorBox.innerText = "Please enter both Team Name and Password.";
        return;
    }

    try {
        const response = await fetch(`https://synergy-iba.netlify.app/.netlify/functions/read?teamkey=${password}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            errorBox.innerText = `Error: ${data.error}`;
            return;
        }

        if (data.Team_password === password) {
            // Successful login: redirect to user page
            window.location.href = '/user.html';
        } else {
            errorBox.innerText = "Incorrect password.";
        }

    } catch (err) {
        console.error("Sign-in error:", err);
        errorBox.innerText = "An error occurred during sign-in. Please try again.";
    }
}

// Expose function globally for button onclick
window.signIn = signIn;
