// src/pages/Produits.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios.js"

export default function Produits() {
  const [produits, setProduits] = useState([]);
  const [filtre, setFiltre] = useState("");

  useEffect(() => {
    const fetchProduits = async () => {
      try {
        const token = localStorage.getItem("token");
const { data } = await api.get("/api/produit", {
  headers: { Authorization: `Bearer ${token}` },
});
        console.log("📦 Produits chargés :", data);
        // data est déjà un tableau
        setProduits(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erreur lors du chargement :", err);
      }
    };
    fetchProduits();
  }, []);

  // 🔍 Filtrage corrigé : on filtre sur "name" et "laboratoire.name"
  const produitsFiltres = produits.filter((p) => {
    const nomProduit = p.name?.toLowerCase() || "";
    const nomLabo = p.laboratoire?.name?.toLowerCase() || "";
    return (
      nomProduit.includes(filtre.toLowerCase()) ||
      nomLabo.includes(filtre.toLowerCase())
    );
  });

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
      <h1 className="text-3xl font-bold mb-6 text-center">Liste des Produits</h1>

      <div className="flex justify-center mb-4">
        <input
          type="text"
          placeholder="Rechercher un produit ou un laboratoire..."
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          className="w-1/2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring focus:ring-indigo-400"
        />
      </div>

      <table className="w-full border-collapse bg-gray-800 rounded-lg overflow-hidden">
        <thead className="bg-gray-700 text-gray-300">
          <tr>
            <th className="py-3 px-4 text-left">Nom du produit</th>
            <th className="py-3 px-4 text-left">Laboratoire</th>
            <th className="py-3 px-4 text-left">Date d’ajout</th>
            <th className="py-3 px-4 text-left">Prix</th>
          </tr>
        </thead>
        <tbody>
          {produitsFiltres.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center py-6 text-gray-400">
                Aucun produit trouvé.
              </td>
            </tr>
          ) : (
            produitsFiltres.map((p) => (
              <tr key={p._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="py-3 px-4">{p.name}</td>
                <td className="py-3 px-4">{p.laboratoire?.name || "—"}</td>
                <td className="py-3 px-4">{formaterDate(p.createdAt)}</td>
                <td className="py-3 px-4">{p.price ? `${p.price} DA` : "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
