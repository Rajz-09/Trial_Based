// Arrays representing Western and Classical scales
const westernNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const classicalSwar = ['S', 'R(k)', 'R', 'G(k)', 'G', 'm', 'M', 'P', 'D(k)', 'D', 'N(k)', 'N'];

// Mapping between classical swaras and Western notes
const swaraToWestern = {
    'S': 'C', 'R(k)': 'C#', 'R': 'D', 'G(k)': 'D#', 'G': 'E',
    'm': 'F', 'M': 'F#', 'P': 'G', 'D(k)': 'G#', 'D': 'A',
    'N(k)': 'A#', 'N': 'B'
};

const westernToSwara = Object.fromEntries(
    Object.entries(swaraToWestern).map(([key, value]) => [value, key])
);

// Function to create a rotated array starting from the given note
function rotateArray(array, startNote) {
    const startIndex = array.indexOf(startNote);
    return array.slice(startIndex).concat(array.slice(0, startIndex));
}

// Function to generate a scale based on a given root and pattern
function generateScale(root, pattern) {
    const rotatedNotes = rotateArray(westernNotes, root);
    let scale = [rotatedNotes[0]]; // Start with the root note
    let currentIndex = 0;

    for (let step of pattern) {
        currentIndex = (currentIndex + step) % rotatedNotes.length;
        scale.push(rotatedNotes[currentIndex]);
    }

    return scale;
}

// Function to update 'to-scale' dropdown options
function updateToScaleOptions(fromScaleRoot) {
    const toScaleSelect = document.getElementById('to-scale');
    toScaleSelect.innerHTML = ''; // Clear existing options.

    // Determine the pattern based on the presence of '#' in the root note
    const isMinor = fromScaleRoot.includes('#');
    const pattern = isMinor ? [2, 1, 2, 2, 1, 2, 2] : [2, 2, 1, 2, 2, 2, 1]; // Minor or Major scale pattern

    // Generate the scale based on the root note and selected pattern
    const derivedScale = generateScale(fromScaleRoot, pattern);

    // Populate the 'to-scale' dropdown with the generated scale
    derivedScale.forEach(note => {
        const option = document.createElement('option');
        const classicalSwara = westernToSwara[note] || ''; // Get corresponding swara
        option.value = note;
        option.textContent = `${note} - ${classicalSwara}`;
        toScaleSelect.appendChild(option);
    });

    // Set the first option as selected by default
    if (toScaleSelect.options.length > 0) {
        toScaleSelect.options[0].selected = true;
    }
}

// Function to transpose notes while retaining octave indicators (',', "'")
function transposeNotesWithOctave(notes, interval) {
    return notes.map(note => {
        const baseSwara = note.replace(/['|,]+/g, ''); // Extract base swara
        const octaveIndicator = note.replace(baseSwara, ''); // Extract octave symbols
        const westernNote = swaraToWestern[baseSwara];

        if (!westernNote) return note; // Skip if not a valid swara

        const originalIndex = westernNotes.indexOf(westernNote);
        const transposedIndex = (originalIndex + interval + westernNotes.length) % westernNotes.length; // Ensure positive index
        const transposedNote = westernNotes[transposedIndex];

        // Convert back to swara with the octave symbol.
        const convertedSwara = westernToSwara[transposedNote] || transposedNote;
        return convertedSwara + octaveIndicator; // Preserve octave indicators
    });
}

// Populate the "to-scale" dropdown based on a default "from-scale"
window.onload = () => {
    const defaultFromScale = 'C'; // Set default "from-scale"
    updateToScaleOptions(defaultFromScale);

    const fromScaleDropdown = document.getElementById('from-scale');
    fromScaleDropdown.addEventListener('change', (event) => {
        const selectedRoot = event.target.value;
        updateToScaleOptions(selectedRoot); // Update 'to-scale' based on selected 'from-scale'
    });
};

// Global variables
let convertButtonClickCount = 0; // Local click counter
let isSubscriptionActive = false; // Subscription status
let storedConvertCount = 0; // Stored convert count from backend

// Helper function to fetch data with authorization
async function fetchWithAuth(url, method = "GET", body = null) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not logged in. Token not found.");

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Request failed: ${response.statusText}`);

    return response.json();
}

// Function to fetch subscription status
async function checkSubscriptionStatus() {
    try {
        const data = await fetchWithAuth("https://www.swarparivritti.com/api/checkSubscription");
        console.log("Subscription API Response:", data); // Debugging output

        // Use subscriptionActive directly as it matches the backend response
        if (data && data.subscriptionActive !== undefined) {
            isSubscriptionActive = data.subscriptionActive;
        } else {
            console.error("Subscription active status not found in response:", data);
            isSubscriptionActive = false;
        }
        
        console.log("Subscription Active:", isSubscriptionActive);
        return isSubscriptionActive;
    } catch (error) {
        console.error("Error checking subscription status:", error.message);
        isSubscriptionActive = false;
        return false;
    }
}

// Function to fetch stored convert count
async function fetchStoredConvertCount() {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("User not logged in. Token not found.");

        const decodedToken = jwt_decode(token); // Decode token to get user email
        const email = decodedToken.email;

        const data = await fetchWithAuth("https://www.swarparivritti.com/api/increment-convert", "POST", { email });
        storedConvertCount = data.convertCount || 0;
        //console.log("Stored Convert Count:", storedConvertCount);
    } catch (error) {
        console.error("Error fetching convert count:", error.message);
        storedConvertCount = 0; // Default to 0 on error
    }
}



// Function to perform note transposition
function transposeNotes() {
    const fromScale = document.getElementById("from-scale").value;
    const toScale = document.getElementById("to-scale").value;
    const inputNotation = document.getElementById("input-notation").value.trim();
    const outputTextarea = document.getElementById("output-notation");

    if (!fromScale || !toScale || inputNotation.length === 0) {
        alert("Please select both scales and provide input notation.");
        return;
    }

    // Perform transposition logic
    const interval = westernNotes.indexOf(toScale) - westernNotes.indexOf(fromScale);
    const lines = inputNotation.split("\n");
    const outputLines = lines.map((line) => {
        const words = line.split(" ");
        const transposedWords = transposeNotesWithOctave(words, interval);
        return transposedWords.join(" ");
    });

    outputTextarea.value = outputLines.join("\n");

    // Scroll to output area smoothly
    outputTextarea.scrollIntoView({ behavior: "smooth", block: "center" });
}

// Function to show a loader overlay
function showLoader() {
    const loaderOverlay = document.createElement("div");
    loaderOverlay.classList.add("loader-overlay");

    const loader = document.createElement("div");
    loader.classList.add("loader");
    loaderOverlay.appendChild(loader);

    // Target the main-container instead of container
    const mainContainer = document.querySelector(".main-container");
    if (!mainContainer) {
        console.error("Main container not found");
        return null;
    }
    
    mainContainer.appendChild(loaderOverlay);
    loaderOverlay.style.visibility = "visible";
    loaderOverlay.style.display = "flex";

    return loaderOverlay;
}

// Update the convert button event listener
// document.getElementById("convert-btn").addEventListener("click", async () => {
//     try {
//         await checkSubscriptionStatus();

//         // Increment convert count in the backend and fetch the updated value
//         const updatedConvertCount = await incrementConvertCount();
//         storedConvertCount = updatedConvertCount; // Update the local stored count
//         const totalConvertCount = storedConvertCount; // Use stored count as source of truth

//         console.log("Total Convert Count:", totalConvertCount);

//         if (!isSubscriptionActive && totalConvertCount >= 10) {
//             window.location.href = "membership.html";
//             return;
//         }

//         const loaderOverlay = showLoader();
//         if (!loaderOverlay) {
//             throw new Error("Could not create loader overlay");
//         }

//         setTimeout(() => {
//             loaderOverlay.remove();
//             transposeNotes();
//         }, 2000);
//     } catch (error) {
//         console.error("Error during conversion:", error.message);
//         alert("An error occurred. Please try again later.");
//     }
// });

document.getElementById("convert-btn").addEventListener("click", async () => {
    try {
        const subscriptionStatus = await checkSubscriptionStatus();
        console.log("Current subscription status:", subscriptionStatus);

        // Increment convert count in the backend and fetch the updated value
        const updatedConvertCount = await incrementConvertCount();
        storedConvertCount = updatedConvertCount;
        const totalConvertCount = storedConvertCount;

        console.log("Total Convert Count:", totalConvertCount);

        if (!subscriptionStatus && totalConvertCount >= 10) {
            window.location.href = "membership.html";
            return;
        }

        const loaderOverlay = showLoader();
        if (!loaderOverlay) {
            throw new Error("Could not create loader overlay");
        }

        setTimeout(() => {
            loaderOverlay.remove();
            transposeNotes();
        }, 2000);
    } catch (error) {
        console.error("Error during conversion:", error.message);
        alert("An error occurred. Please try again later.");
    }
});

// Function to increment convert count in the backend
async function incrementConvertCount() {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("User not logged in. Token not found.");

        const decodedToken = jwt_decode(token);
        const email = decodedToken.email;

        const data = await fetchWithAuth("https://www.swarparivritti.com/api/increment-convert", "POST", { email });
        return data.convertCount; // Return updated count from backend
    } catch (error) {
        console.error("Error incrementing convert count:", error.message);
        throw error;
    }
}


// Add event listener for 'Enter' key in the input field
document.getElementById('input-notation').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevents a new line from being added in the text area
        document.getElementById('convert-btn').click(); // Simulates a click on the convert button
    }
});

// Add copy-to-clipboard functionality
function copyToClipboard(buttonId, textAreaId) {
    const textArea = document.getElementById(textAreaId);
    textArea.select();
    document.execCommand('copy');

    const button = document.getElementById(buttonId);
    button.innerHTML = '<span class="mr-1">&#10003;</span> Copied';

    setTimeout(() => {
        button.innerHTML = '<span class="mr-1">&#128203;</span> Copy';
    }, 2000);
}

document.getElementById('copy-input-button').addEventListener('click', () => {
    copyToClipboard('copy-input-button', 'input-notation');
});

document.getElementById('copy-output-button').addEventListener('click', () => {
    copyToClipboard('copy-output-button', 'output-notation');
});


// Show loader when converting scale
const drawer = document.getElementById('drawer');
const openDrawerButton = document.getElementById('open-drawer');
const container = document.querySelector('.container'); // Select only the container

// document.getElementById('logout').addEventListener('click', function (event) {
//     event.preventDefault();

//     // Clear the token stored in localStorage or sessionStorage
//     localStorage.removeItem('token'); // If you're using localStorage
//     localStorage.removeItem('userEmail'); // Clear the user data
//     // Optional: Display a logout confirmation (you can remove this if not needed)
//     alert('You have been logged out successfully!');

//     // Redirect the user to the login page
//     window.location.href = './index.html';
// });