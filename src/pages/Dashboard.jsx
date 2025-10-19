import React, { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import { io } from "socket.io-client"; // Add this import
export default function Dashboard() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
 const socket = useMemo(() => io("http://localhost:5000"), []);
  const [permissions, setPermissions] = useState({}); // New: store permissions per user
  const token = localStorage.getItem("token");
 
   useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);
  // Récupérer tous les administrateurs
  const fetchAdmins = async () => {
    try {
      const { data } = await api.get("/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAdmins(data);

      // Initialize permissions state for each admin
      const perms = {};
      data.forEach((user) => {
        perms[user._id] = {
          canEdit: user.canEdit || false,
          canUpload: user.canUpload || false,
          canDownload: user.canDownload || false,
        };
      });
      setPermissions(perms);

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

  // Handle permission changes
  const handlePermissionChange = (userId, field, value) => {
    setPermissions((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }));
  };

  // Save permissions for a user
  const savePermissions = async (userId) => {
    try {
      await api.put(`/users/${userId}/permissions`, permissions[userId], {
        headers: { Authorization: `Bearer ${token}` },
      });
       
      
      // Emit socket event (optional, since backend already emits)
      socket.emit("permission-updated", { userId });
      alert("✅ Permissions mises à jour !");
    } catch (err) {
      console.error(err);
      alert("❌ Échec de la mise à jour des permissions");
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
                <th>Permissions</th> {/* New column */}
              </tr>
            </thead>
            <tbody>
              {admins.map((user) => (
                <tr key={user._id} className="border-b border-gray-700">
                  <td className="py-2">{user.name}</td>
                  <td>{user.email}</td>
                  <td className="capitalize">{user.role}</td>
                  <td>
                    {user.role !== "root" && (
                      <div className="space-x-2 text-xs">
                        <label>
                          <input
                            type="checkbox"
                            checked={permissions[user._id]?.canEdit || false}
                            onChange={(e) =>
                              handlePermissionChange(user._id, "canEdit", e.target.checked)
                            }
                          />{" "}
                          Edit
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={permissions[user._id]?.canUpload || false}
                            onChange={(e) =>
                              handlePermissionChange(user._id, "canUpload", e.target.checked)
                            }
                          />{" "}
                          Upload
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={permissions[user._id]?.canDownload || false}
                            onChange={(e) =>
                              handlePermissionChange(user._id, "canDownload", e.target.checked)
                            }
                          />{" "}
                          Download
                        </label>
                        <button
                          onClick={() => savePermissions(user._id)}
                          className="ml-2 px-2 py-1 bg-blue-600 rounded hover:bg-blue-500 text-xs"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </td>
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
