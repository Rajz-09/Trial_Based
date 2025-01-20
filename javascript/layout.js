document.addEventListener("DOMContentLoaded", () => {
    const navLinks = document.querySelectorAll(".nav-link");

    // Set active link based on current URL
    const currentPath = window.location.pathname.split("/").pop();

    navLinks.forEach((link) => {
        const linkPath = link.getAttribute("href").split("/").pop();
        if (linkPath === currentPath || linkPath === "" && currentPath === "index.html") {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // const toggleMenu = () => {
    //     const mobileNav = document.querySelector('.mobile-nav');
    //     if (!mobileNav) return; // Safety check in case mobile-nav is not found

    //     const screenWidth = window.innerWidth;

    //     // Check if the screen width is mobile-sized
    //     if (screenWidth <= 768) {
    //         mobileNav.classList.toggle('active');
    //     }
    // }

    const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", toggleMenu);
    }

    // Fetch and display user data
    async function fetchUserData() {
        try {
            // Step 1: Retrieve the token from localStorage (set during login)
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("User not logged in. Token not found.");
            }

            // Step 2: Decode the token to get the user data
            const decodedToken = jwt_decode(token);

            // Extract email from the decoded token
            const userEmail = decodedToken.email || "User";
            const username = userEmail.split("@")[0]; // Extract username before '@'

            // Ensure username is not empty before processing
            if (!username) {
                throw new Error("Invalid username extracted from token.");
            }

            // Get the user initial (first character) and capitalize it
            const userInitial = username.charAt(0).toUpperCase();

            // Format the username: first 5 characters + space + remaining characters
            const formattedUsername =
                username.length > 5
                    ? username.slice(0, 5) + " - " + username.slice(5)
                    : username;

            // Step 3: Update the UI dynamically
            document.querySelector(".user-profile").textContent = userInitial;
            document.querySelector(".user-profile-mobile").textContent = userInitial;

        } catch (error) {
            console.error("Error fetching user data:", error.message);
            alert("An error occurred. Please log in again.");
        }
    }

    // Call the function to fetch and display user data
    fetchUserData();

    // Function to apply blur effect on the main content when the sidebar is open
    function applyBlurEffect() {
        const container = document.getElementById('mainContent'); // Reference to main content container
        const drawer = document.getElementById('navLinks'); // Reference to the sidebar (mobile-nav)

        // Check if the sidebar is open
        if (drawer.classList.contains('active')) {
            container.style.filter = 'blur(5px)'; // Add blur effect when sidebar is open
            container.style.pointerEvents = 'none'; // Disable interactions (optional)
        } else {
            container.style.filter = 'none'; // Remove blur when sidebar is closed
            container.style.pointerEvents = 'auto'; // Re-enable interactions
        }
    }

    // Function to close the sidebar when clicked outside
    function closeSidebarOnClickOutside(event) {
        const sidebar = document.getElementById('navLinks'); // mobile sidebar
        const menuButton = document.querySelector('.mobile-menu-btn'); // mobile menu button
        if (!sidebar.contains(event.target) && !menuButton.contains(event.target)) {
            sidebar.classList.remove('active'); // Removes 'active' class to close the sidebar
            applyBlurEffect(); // Remove blur effect when sidebar is closed
        }
    }

    // Toggle the mobile sidebar menu when clicking the menu button
    function toggleMenu() {
        const sidebar = document.getElementById('navLinks');
        sidebar.classList.toggle('active'); // Toggle the 'active' class
        applyBlurEffect(); // Apply blur effect based on the sidebar state and screen size
    }

    // Add event listener to detect clicks outside the sidebar
    document.addEventListener('click', closeSidebarOnClickOutside);

    // Resize event to reapply the blur effect based on screen width
    window.addEventListener('resize', function () {
        applyBlurEffect(); // Apply or remove blur when resizing the window
    });

    // Initially apply blur effect on page load if needed
    applyBlurEffect();

    // Select all logout links with the 'data-page="index"' attribute
    const logoutLinks = document.querySelectorAll('[data-page="index"]');

    // Add the logout functionality to all selected elements
    logoutLinks.forEach((logoutLink) => {
        logoutLink.addEventListener("click", (event) => {
            event.preventDefault(); // Prevent the default anchor behavior

            // Remove the token and email from local storage (or session storage if used)
            localStorage.removeItem("token");
            localStorage.removeItem("userEmail");


            // Redirect to the login page
            window.location.href = "index.html";
        });
    });

    const profileWrapper = document.querySelector('.profile-wrapper');
    const dropdown = document.querySelector('.profile-dropdown');

    // Toggle dropdown on profile click
    profileWrapper.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!profileWrapper.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    // Prevent dropdown from closing when clicking inside it
    dropdown.addEventListener('click', function (e) {
        e.stopPropagation();
    });
});
