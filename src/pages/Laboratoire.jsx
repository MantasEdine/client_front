// src/pages/Laboratoires.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios.js"


export default function Laboratoires() {
  const [laboratoires, setLaboratoires] = useState([]);
  const [filtre, setFiltre] = useState("");

  useEffect(() => {
    const fetchLaboratoires = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/laboratoire", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("🏥 Laboratoires chargés :", data);
        // data peut être un objet avec un tableau ou directement un tableau
        setLaboratoires(Array.isArray(data) ? data : data.laboratoires || []);
      } catch (err) {
        console.error("Erreur lors du chargement :", err.response?.data || err.message);
      }
    };

    fetchLaboratoires();
  }, []);

  // 🔍 Filtrage par nom de labo
  const laboratoiresFiltres = laboratoires.filter((labo) => {
    const nom = labo.name?.toLowerCase() || "";
    return nom.includes(filtre.toLowerCase());
  });

  // 🗓️ Formatage de la date
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
      <h1 className="text-3xl font-bold mb-6 text-center">Liste des Laboratoires</h1>

      <div className="flex justify-center mb-4">
        <input
          type="text"
          placeholder="Rechercher un laboratoire..."
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          className="w-1/2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring focus:ring-indigo-400"
        />
      </div>

      <table className="w-full border-collapse bg-gray-800 rounded-lg overflow-hidden">
        <thead className="bg-gray-700 text-gray-300">
          <tr>
            <th className="py-3 px-4 text-left">Nom du laboratoire</th>
            <th className="py-3 px-4 text-left">Date de création</th>
          </tr>
        </thead>
        <tbody>
          {laboratoiresFiltres.length === 0 ? (
            <tr>
              <td colSpan="2" className="text-center py-6 text-gray-400">
                Aucun laboratoire trouvé.
              </td>
            </tr>
          ) : (
            laboratoiresFiltres.map((labo) => (
              <tr
                key={labo._id}
                className="border-b border-gray-700 hover:bg-gray-700/50"
              >
                <td className="py-3 px-4">{labo.name}</td>
                <td className="py-3 px-4">{formaterDate(labo.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
