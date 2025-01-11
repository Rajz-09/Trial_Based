// Enhanced JWT Parsing Function
function parseJWT(token) {
    try {
        if (!token) {
            console.error('No token found');
            throw new Error('No authentication token');
        }

        // Split token into parts
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }

        // Decode the payload (second part of the token)
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = atob(base64);

        // Parse the JSON payload
        const user = JSON.parse(jsonPayload);

        // Validate required fields
        if (!user.id || !user.email) {
            throw new Error('Incomplete user data in token');
        }

        return user;
    } catch (error) {
        console.error('Error parsing JWT:', error.message);
        alert('Authentication failed. Please log in again.');
        window.location.href = '/index.html';
        return null;
    }
}

// Retrieve the JWT token from localStorage
const token = localStorage.getItem('token');
let user = null;

// Verify and parse token
try {
    user = parseJWT(token);
} catch (error) {
    console.error('Token verification failed:', error);
    window.location.href = '/index.html';
}

// Payment Processing Function
async function processPayment(event, productName, amount, description) {
    event.preventDefault(); // Prevent form submission

    if (!user) {
        alert('User not authenticated. Please log in again.');
        window.location.href = '/index.html';
        return;
    }

    try {
        const userEmail = user.email;
        const userName = user.name || user.email.split('@')[0];

        // Step 1: Create an order
        const response = await fetch('https://swarparivrittitrial.vercel.app/api/createOrder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: amount,
                subscriptionPlan: productName
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create order');
        }

        const data = await response.json();

        // Step 2: Open Razorpay checkout
        const options = {
            key: data.key_id,
            amount: data.amount,
            currency: "INR",
            name: "Flute Notation Converter",
            description,
            order_id: data.order_id, // Razorpay's order_id
            handler: async function (response) {
                try {
                    //alert("Payment Succeeded! Payment ID: " + response.razorpay_payment_id);

                    // Step 3: Notify backend of payment success
                    const paymentResponse = await fetch('https://swarparivrittitrial.vercel.app/api/simulatePaymentSuccess', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            orderId: data.order_id // Use the correct order_id
                        })
                    });

                    if (!paymentResponse.ok) {
                        throw new Error('Failed to finalize payment');
                    }

                    const paymentData = await paymentResponse.json();
                    if (paymentData.success) {
                        alert(paymentData.message);
                        window.location.href = 'mainContent.html';

                    } else {
                        throw new Error(paymentData.message || 'Payment finalization failed');
                    }
                } catch (err) {
                    console.error("Error finalizing payment:", err);
                    alert("Error: " + err.message);
                }
            },
            prefill: {
                name: userName,
                email: userEmail,
            },
            theme: {
                color: "#3498db"
            }
            
        };

        console.log("Options: ", options);

        const razorpayObject = new Razorpay(options);
        razorpayObject.on('payment.failed', function (response) {
            alert("Payment Failed! " + response.error.description);
        });

        razorpayObject.open();
    } catch (error) {
        console.error("Error during payment processing:", error);
        alert("Error: " + error.message);
        window.location.href = '/index.html';
    }
}
