import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { io } from "socket.io-client";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

const socket = io("http://localhost:5000");

export default function AdminPanel() {
  const [fournisseurs, setFournisseurs] = useState([
    { id: 1, name: "FOURNISSEUR 1" },
    { id: 2, name: "FOURNISSEUR 2" },
    { id: 3, name: "FOURNISSEUR 3" },
  ]);
  const [rows, setRows] = useState([]);
  const [editingHeader, setEditingHeader] = useState(null);
  const [tempHeaderName, setTempHeaderName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [editingCell, setEditingCell] = useState(null);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // Check if admin has edit access
  useEffect(() => {
    checkEditAccess();
    socket.on("permission-updated", checkEditAccess);
    socket.on("remise-updated", fetchRemises);
    return () => {
      socket.off("permission-updated");
      socket.off("remise-updated");
    };
  }, []);

  const checkEditAccess = async () => {
    try {
      const { data } = await api.get(`/auth/check-access/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCanEdit(data.canEdit);
    } catch (err) {
      console.error("Error checking access:", err);
      setCanEdit(false);
    }
  };

  const fetchRemises = async () => {
    try {
      const { data } = await api.get("/remise", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Process and display remises
      console.log("Remises updated:", data);
    } catch (err) {
      console.error("Error fetching remises:", err);
    }
  };

  const calculateBestOffers = (remises) => {
    const offers = fournisseurs
      .map((f) => ({
        name: f.name,
        value: parseFloat(remises[f.id]) || 0,
      }))
      .filter((o) => o.value > 0)
      .sort((a, b) => b.value - a.value);

    return [
      offers[0] || { name: "—", value: 0 },
      offers[1] || { name: "—", value: 0 },
      offers[2] || { name: "—", value: 0 },
    ];
  };

  const createEmptyRow = () => ({
    id: Date.now() + Math.random(),
    produit: "",
    laboratoire: "",
    remises: {},
  });

  const addRow = () => {
    if (!canEdit) {
      alert("❌ Vous n'avez pas la permission de modifier les données.");
      return;
    }
    setRows([...rows, createEmptyRow()]);
  };

  const deleteRow = (id) => {
    if (!canEdit) {
      alert("❌ Vous n'avez pas la permission de supprimer les données.");
      return;
    }
    if (rows.length <= 1) return;
    if (!window.confirm("Supprimer cette ligne ?")) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  const duplicateRow = (index) => {
    if (!canEdit) {
      alert("❌ Vous n'avez pas la permission de dupliquer les données.");
      return;
    }
    const copy = { ...rows[index], id: Date.now() + Math.random() };
    const newRows = [...rows];
    newRows.splice(index + 1, 0, copy);
    setRows(newRows);
  };

  const updateCell = (rowId, field, value) => {
    if (!canEdit) {
      alert("❌ Vous n'avez pas la permission de modifier les données.");
      return;
    }
    setRows(
      rows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  const updateRemise = (rowId, fournisseurId, value) => {
    if (!canEdit) {
      alert("❌ Vous n'avez pas la permission de modifier les données.");
      return;
    }
    setRows(
      rows.map((row) =>
        row.id === rowId
          ? { ...row, remises: { ...row.remises, [fournisseurId]: value } }
          : row
      )
    );
  };

  const startEditingHeader = (f) => {
    if (!canEdit) {
      alert("❌ Vous n'avez pas la permission de modifier les données.");
      return;
    }
    setEditingHeader(f.id);
    setTempHeaderName(f.name);
  };

  const saveHeaderName = () => {
    if (!tempHeaderName.trim()) {
      setEditingHeader(null);
      return;
    }
    setFournisseurs(
      fournisseurs.map((f) =>
        f.id === editingHeader ? { ...f, name: tempHeaderName.trim() } : f
      )
    );
    setEditingHeader(null);
    setTempHeaderName("");
  };

  // Save to database (admin can only view, not export)
  const saveToDatabase = async () => {
    if (!canEdit) {
      alert("❌ Vous n'avez pas la permission de sauvegarder les données.");
      return;
    }

    try {
      const validRows = rows.filter((r) => r.produit && r.laboratoire);

      if (validRows.length === 0) {
        alert("⚠️ Aucune donnée à sauvegarder.");
        return;
      }

      for (const row of validRows) {
        let laboId = null;
        try {
          const { data: laboData } = await api.post(
            "/laboratoire",
            { name: row.laboratoire },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          laboId = laboData.laboratoire._id;
        } catch (err) {
          if (err.response?.status === 400) {
            const { data: labos } = await api.get("/laboratoire", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const existingLabo = labos.find((l) => l.name === row.laboratoire);
            laboId = existingLabo?._id;
          }
        }

        let produitId = null;
        try {
          const { data: produitData } = await api.post(
            "/produit",
            { name: row.produit, laboratoireId: laboId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          produitId = produitData.produit._id;
        } catch (err) {
          if (err.response?.status === 400) {
            const { data: produits } = await api.get("/produit", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const existingProduit = produits.find((p) => p.name === row.produit);
            produitId = existingProduit?._id;
          }
        }

        for (const fournisseur of fournisseurs) {
          const remiseValue = row.remises[fournisseur.id];
          if (remiseValue && parseFloat(remiseValue) > 0) {
            let fournisseurId = null;
            try {
              const { data: fournData } = await api.post(
                "/fournisseur",
                { name: fournisseur.name },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              fournisseurId = fournData.fournisseur._id;
            } catch (err) {
              if (err.response?.status === 400) {
                const { data: fourns } = await api.get("/fournisseur", {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const existingFourn = fourns.find((f) => f.name === fournisseur.name);
                fournisseurId = existingFourn?._id;
              }
            }

            try {
              await api.post(
                "/remise",
                {
                  produitId: produitId,
                  fournisseurId: fournisseurId,
                  remise: parseFloat(remiseValue),
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            } catch (err) {
              console.log("Remise existe déjà ou erreur:", err.response?.data);
            }
          }
        }
      }

      alert("✅ Données sauvegardées avec succès !");
      socket.emit("remise-update");
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
      alert("❌ Erreur lors de la sauvegarde des données.");
    }
  };

  const handleImport = async (file) => {
    if (!canEdit) {
      alert("❌ Vous n'avez pas la permission d'importer des données.");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!json || json.length === 0) {
        alert("Fichier vide ou invalide.");
        return;
      }

      const headers = Object.keys(json[0]);
      const excludedCols = ["Produit", "Laboratoire", "MEILLEURE OFFRE", "2ÈME OFFRE", "3ÈME OFFRE"];
      const fournisseurCols = headers.filter((h) => !excludedCols.includes(h));

      const newFournisseurs = fournisseurCols.map((name, i) => ({
        id: i + 1,
        name,
      }));

      setFournisseurs(newFournisseurs);

      const newRows = json.map((r, i) => {
        const remises = {};
        newFournisseurs.forEach((f) => {
          const val = r[f.name];
          if (val) {
            const cleanVal = String(val).replace("%", "").replace(",", ".").trim();
            remises[f.id] = cleanVal;
          }
        });

        return {
          id: Date.now() + i,
          produit: r["Produit"] || "",
          laboratoire: r["Laboratoire"] || "",
          remises,
        };
      });

      setRows(newRows);
      alert(`✅ ${newRows.length} lignes importées !`);
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de l'import du fichier.");
    }
  };

  const filteredRows = rows.filter((row) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      row.produit.toLowerCase().includes(q) ||
      row.laboratoire.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Permission Banner */}
      <div className={`mb-4 p-3 rounded ${canEdit ? "bg-green-900/30 border border-green-700" : "bg-red-900/30 border border-red-700"}`}>
        <p className={canEdit ? "text-green-300" : "text-red-300"}>
          {canEdit ? "✅ Vous avez les permissions de modification" : "🔒 Vous n'avez PAS les permissions de modification"}
        </p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold">Panneau Admin - Gestion des Remises</h1>

        <div className="flex items-center gap-2 text-sm">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white"
          />

          <label className={`px-2 py-1 rounded cursor-pointer ${canEdit ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-700 opacity-50 cursor-not-allowed"}`}>
            📂 Importer Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => e.target.files[0] && handleImport(e.target.files[0])}
              className="hidden"
              disabled={!canEdit}
            />
          </label>

          <button
            onClick={addRow}
            disabled={!canEdit}
            className={`px-2 py-1 rounded ${canEdit ? "bg-green-600 hover:bg-green-500" : "bg-gray-600 opacity-50 cursor-not-allowed"}`}
          >
            + Ligne
          </button>

          <button
            onClick={saveToDatabase}
            disabled={!canEdit}
            className={`px-2 py-1 rounded ${canEdit ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-600 opacity-50 cursor-not-allowed"}`}
          >
            💾 Sauvegarder
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-700 rounded-lg">
          <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-400 mb-2">Aucune donnée</h3>
          <p className="text-sm text-gray-500 mb-4">Importez un fichier Excel ou ajoutez une ligne pour commencer</p>
          {canEdit && (
            <div className="flex gap-2">
              <label className="bg-indigo-600 px-4 py-2 rounded cursor-pointer hover:bg-indigo-500">
                📂 Importer Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => e.target.files[0] && handleImport(e.target.files[0])}
                  className="hidden"
                />
              </label>
              <button onClick={addRow} className="bg-green-600 px-4 py-2 rounded hover:bg-green-500">
                + Ajouter une ligne
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-auto border border-gray-700 rounded">
          <table className="min-w-full table-auto text-xs">
            <thead>
              <tr className="bg-gray-800 text-gray-200">
                <th className="px-2 py-2 text-left border-r border-gray-700 sticky left-0 bg-gray-800 z-20">
                  Produit
                </th>
                <th className="px-2 py-2 text-left border-r border-gray-700">Laboratoire</th>

                {fournisseurs.map((f) => (
                  <th
                    key={f.id}
                    className="px-2 py-2 border-r border-gray-700 relative"
                    onDoubleClick={() => startEditingHeader(f)}
                  >
                    {editingHeader === f.id ? (
                      <input
                        value={tempHeaderName}
                        onChange={(e) => setTempHeaderName(e.target.value)}
                        onBlur={saveHeaderName}
                        onKeyDown={(e) => e.key === "Enter" && saveHeaderName()}
                        autoFocus
                        disabled={!canEdit}
                        className="w-full bg-gray-700 px-1 py-1 rounded text-xs"
                      />
                    ) : (
                      <span className="font-medium">{f.name}</span>
                    )}
                  </th>
                ))}

                <th className="px-2 py-2 bg-emerald-900/30 border-r border-gray-700">
                  MEILLEURE OFFRE
                </th>
                <th className="px-2 py-2 bg-yellow-900/30 border-r border-gray-700">
                  2ÈME OFFRE
                </th>
                <th className="px-2 py-2 bg-orange-900/30 border-r border-gray-700">
                  3ÈME OFFRE
                </th>

                <th className="px-2 py-2 bg-gray-800">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row, rowIndex) => {
                const bestOffers = calculateBestOffers(row.remises);

                return (
                  <tr key={row.id} className="even:bg-gray-900/50 hover:bg-gray-800/50">
                    <td className="px-2 py-1 border-b border-gray-800 sticky left-0 bg-gray-900">
                      <input
                        value={row.produit}
                        onChange={(e) => updateCell(row.id, "produit", e.target.value)}
                        disabled={!canEdit}
                        className={`w-full px-1 py-1 text-xs outline-none ${canEdit ? "bg-transparent" : "bg-gray-800 opacity-50"}`}
                        placeholder="Produit"
                      />
                    </td>

                    <td className="px-2 py-1 border-b border-gray-800">
                      <input
                        value={row.laboratoire}
                        onChange={(e) => updateCell(row.id, "laboratoire", e.target.value)}
                        disabled={!canEdit}
                        className={`w-full px-1 py-1 text-xs outline-none ${canEdit ? "bg-transparent" : "bg-gray-800 opacity-50"}`}
                        placeholder="Laboratoire"
                      />
                    </td>

                    {fournisseurs.map((f) => (
                      <td key={f.id} className="px-2 py-1 border-b border-gray-800">
                        <input
                          value={row.remises[f.id] || ""}
                          onChange={(e) => updateRemise(row.id, f.id, e.target.value)}
                          disabled={!canEdit}
                          className={`w-full px-1 py-1 text-xs text-right outline-none ${canEdit ? "bg-transparent" : "bg-gray-800 opacity-50"}`}
                          placeholder="0"
                        />
                      </td>
                    ))}

                    <td className="px-2 py-1 border-b border-gray-800 bg-emerald-900/10 text-emerald-300">
                      {bestOffers[0].value > 0
                        ? `${bestOffers[0].name} (${bestOffers[0].value}%)`
                        : "—"}
                    </td>

                    <td className="px-2 py-1 border-b border-gray-800 bg-yellow-900/10 text-yellow-300">
                      {bestOffers[1].value > 0
                        ? `${bestOffers[1].name} (${bestOffers[1].value}%)`
                        : "—"}
                    </td>

                    <td className="px-2 py-1 border-b border-gray-800 bg-orange-900/10 text-orange-300">
                      {bestOffers[2].value > 0
                        ? `${bestOffers[2].name} (${bestOffers[2].value}%)`
                        : "—"}
                    </td>

                    <td className="px-2 py-1 border-b border-gray-800">
                      <div className="flex gap-1">
                        <button
                          onClick={() => duplicateRow(rowIndex)}
                          disabled={!canEdit}
                          className={canEdit ? "text-blue-400 hover:text-blue-300 text-xs" : "text-gray-500 text-xs cursor-not-allowed"}
                        >
                          Dup
                        </button>
                        <button
                          onClick={() => deleteRow(row.id)}
                          disabled={!canEdit}
                          className={canEdit ? "text-red-400 hover:text-red-300 text-xs" : "text-gray-500 text-xs cursor-not-allowed"}
                        >
                          Supp
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400">
        💡 Les permissions de modification sont contrôlées par le Root. Contactez l'administrateur pour obtenir les permissions d'édition.
      </div>
    </div>
  );
}