function switchToRegister() {
    document.getElementById('loginCard').classList.add('d-none');
    document.getElementById('registerCard').classList.remove('d-none');
}

function switchToLogin() {
    document.getElementById('registerCard').classList.add('d-none');
    document.getElementById('loginCard').classList.remove('d-none');
}

function togglePassword(inputId, toggleIcon) {
    const passwordInput = document.getElementById(inputId);
    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";

    if (isPassword) {
        toggleIcon.classList.remove("fa-eye-slash");
        toggleIcon.classList.add("fa-eye");
        toggleIcon.style.color = "black"; 
    } else {
        toggleIcon.classList.remove("fa-eye");
        toggleIcon.classList.add("fa-eye-slash");
        toggleIcon.style.color = "gray"; 
    }
}

// Login Form Submission
document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch("https://swarparivrittidemo.vercel.app/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("userEmail", data.userEmail);
            localStorage.setItem("token", data.token);
            window.location.href = "mainContent.html"; // Redirect to the home page
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error("Error:", err);
        alert("An error occurred. Please try again.");
    }
});

// Register Form Submission
document.getElementById("registerForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    try {
        const response = await fetch("https://swarparivrittidemo.vercel.app/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            window.location.href = "mainContent.html"; // Redirect to login page
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error("Error:", err);
        alert("An error occurred. Please try again.");
    }
});
