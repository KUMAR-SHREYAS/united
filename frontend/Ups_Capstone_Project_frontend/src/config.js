const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

// export const API_BASE_URL = isLocalhost
//   ? "http://localhost:8000"  // Local FastAPI server for you
//   : "https://01cd-152-58-159-246.ngrok-free.app";  // Ngrok backend for public access 
// Change the check to always use the production URL for this test
export const API_BASE_URL = 
    "http://98.84.99.64/api"; // <-- Use the EC2 IP directly
    // OR, if you use the isLocalhost variable, ensure the EC2 address is set as the default