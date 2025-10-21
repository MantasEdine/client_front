import React, { useEffect, useState } from "react";
import api from "../api/axios.js"

export default function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [filtre, setFiltre] = useState("");

  useEffect(() => {
    const fetchFournisseurs = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/fournisseur", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("📦 Fournisseurs chargés :", data);
        // Vérifie si la réponse est un tableau ou un objet contenant un tableau
        setFournisseurs(Array.isArray(data) ? data : data.fournisseurs || []);
      } catch (err) {
        console.error("Erreur lors du chargement :", err.response?.data || err.message);
      }
    };

    fetchFournisseurs();
  }, []);

  // 🔍 Filtrage par nom du fournisseur
  const fournisseursFiltres = fournisseurs.filter((f) => {
    const nom = f.name?.toLowerCase() || "";
    return nom.includes(filtre.toLowerCase());
  });

  // 🗓️ Formatage de la date de création
  const formaterDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Liste des Fournisseurs</h1>

      <div className="flex justify-center mb-4">
        <input
          type="text"
          placeholder="Rechercher un fournisseur..."
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          className="w-1/2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring focus:ring-indigo-400"
        />
      </div>

      <table className="w-full border-collapse bg-gray-800 rounded-lg overflow-hidden">
        <thead className="bg-gray-700 text-gray-300">
          <tr>
            <th className="py-3 px-4 text-left">Nom du fournisseur</th>
            <th className="py-3 px-4 text-left">Date de création</th>
          </tr>
        </thead>
        <tbody>
          {fournisseursFiltres.length === 0 ? (
            <tr>
              <td colSpan="2" className="text-center py-6 text-gray-400">
                Aucun fournisseur trouvé.
              </td>
            </tr>
          ) : (
            fournisseursFiltres.map((f) => (
              <tr
                key={f._id}
                className="border-b border-gray-700 hover:bg-gray-700/50"
              >
                <td className="py-3 px-4">{f.name}</td>
                <td className="py-3 px-4">{formaterDate(f.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
