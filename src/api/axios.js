import axios from "axios";

const api = axios.create({
  baseURL: "https://client-backend-0vev.onrender.com/", // your backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
