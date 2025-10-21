import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import logo from "../assets/r_y.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { data } = await api.post("/api/auth/login", { email, password });

      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Role-based redirect
      if (data.user.role === "root") {
        navigate("/dashboard");
      } else {
        navigate("/admin-panel");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          alt="Company Logo"
          src={logo}
          className="mx-auto h-12 w-auto rounded-full shadow-lg"
        />
        <h2 className="mt-8 text-center text-2xl font-bold tracking-tight text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Access the system dashboard
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="example@email.com"
                className="block w-full rounded-md bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="block w-full rounded-md bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-400">
          Not a member?{" "}
          <a
            href="#"
            className="font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Contact system administrator
          </a>
        </p>
      </div>
    </div>
  );
}
