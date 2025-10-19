import React, { useState, useEffect } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  // Récupérer tous les administrateurs
  const fetchAdmins = async () => {
    try {
      const { data } = await api.get("/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(data);
    } catch (err) {
      console.error(err);
      setError("Échec du chargement des utilisateurs");
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Créer un nouvel administrateur
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/register", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Administrateur créé avec succès !");
      setForm({ name: "", email: "", password: "" });
      fetchAdmins();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Échec de la création de l’administrateur");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Tableau de bord Root</h1>

      {/* Formulaire de création d’un administrateur */}
      <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Créer un nouvel administrateur</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nom"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
          <input
            type="email"
            placeholder="Adresse e-mail"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full p-2 rounded bg-gray-700 text-white"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}

          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-400 py-2 rounded font-semibold"
          >
            Créer
          </button>
        </form>
      </div>

      {/* Liste des administrateurs */}
      <div className="mt-12 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Administrateurs actifs</h2>
        <div className="bg-gray-800 p-4 rounded-lg shadow-md overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-2">Nom</th>
                <th>Adresse e-mail</th>
                <th>Rôle</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((user) => (
                <tr key={user._id} className="border-b border-gray-700">
                  <td className="py-2">{user.name}</td>
                  <td>{user.email}</td>
                  <td className="capitalize">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {admins.length === 0 && (
            <p className="text-gray-400 text-center mt-4">
              Aucun utilisateur trouvé.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
