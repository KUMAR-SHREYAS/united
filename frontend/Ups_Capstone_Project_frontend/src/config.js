const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const API_BASE_URL = isLocalhost
  ? "http://localhost:8000"  // Local FastAPI server for you
  : "https://01cd-152-58-159-246.ngrok-free.app";  // Ngrok backend for public access 