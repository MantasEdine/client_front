import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { io } from "socket.io-client";

const token = localStorage.getItem("token");

const api = axios.create({
  baseURL: "https://client-backend-0vev.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  },
});

const socket = io("https://client-backend-0vev.onrender.com");

export default function RemisesTable() {
  const [fournisseurs, setFournisseurs] = useState([
    { id: 1, name: "FOURNISSEUR 1" },
    { id: 2, name: "FOURNISSEUR 2" },
    { id: 3, name: "FOURNISSEUR 3" },
  ]);
  const [rows, setRows] = useState([]);
  const [editingHeader, setEditingHeader] = useState(null);
  const [tempHeaderName, setTempHeaderName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);

  useEffect(() => {
    socket.on("remise-updated", () => {
      console.log("✅ Remise mise à jour par un autre utilisateur");
    });
    return () => socket.off("remise-updated");
  }, []);

  useEffect(() => {
    if (rows.length > 0) {
      const savedData = { rows, fournisseurs };
      try {
        const dataStr = JSON.stringify(savedData);
        const chunks = [];
        const chunkSize = 1000000;
        
        for (let i = 0; i < dataStr.length; i += chunkSize) {
          chunks.push(dataStr.slice(i, i + chunkSize));
        }
        
        chunks.forEach((chunk, index) => {
          sessionStorage.setItem(`remises_work_${index}`, chunk);
        });
        sessionStorage.setItem('remises_work_chunks', chunks.length.toString());
      } catch (e) {
        console.error("Error saving work:", e);
      }
    }
  }, [rows, fournisseurs]);

  useEffect(() => {
    try {
      const chunksCount = parseInt(sessionStorage.getItem('remises_work_chunks') || '0');
      if (chunksCount > 0) {
        let dataStr = '';
        for (let i = 0; i < chunksCount; i++) {
          dataStr += sessionStorage.getItem(`remises_work_${i}`) || '';
        }
        
        if (dataStr) {
          const parsed = JSON.parse(dataStr);
          if (parsed.rows && parsed.rows.length > 0) {
            setShowRecoveryBanner(true);
          }
        }
      }
    } catch (e) {
      console.error("Error loading saved work:", e);
    }
  }, []);

  const recoverWork = () => {
    try {
      const chunksCount = parseInt(sessionStorage.getItem('remises_work_chunks') || '0');
      let dataStr = '';
      for (let i = 0; i < chunksCount; i++) {
        dataStr += sessionStorage.getItem(`remises_work_${i}`) || '';
      }
      
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        setRows(parsed.rows || []);
        setFournisseurs(parsed.fournisseurs || fournisseurs);
        setShowRecoveryBanner(false);
        alert(`✅ ${parsed.rows?.length || 0} lignes récupérées!`);
      }
    } catch (e) {
      alert("❌ Erreur lors de la récupération");
    }
  };

  const dismissRecovery = () => {
    if (window.confirm("⚠️ Voulez-vous vraiment ignorer le travail sauvegardé?")) {
      const chunksCount = parseInt(sessionStorage.getItem('remises_work_chunks') || '0');
      for (let i = 0; i < chunksCount; i++) {
        sessionStorage.removeItem(`remises_work_${i}`);
      }
      sessionStorage.removeItem('remises_work_chunks');
      setShowRecoveryBanner(false);
    }
  };

  const clearWork = () => {
    if (window.confirm("⚠️ Supprimer tout le travail?")) {
      setRows([]);
      const chunksCount = parseInt(sessionStorage.getItem('remises_work_chunks') || '0');
      for (let i = 0; i < chunksCount; i++) {
        sessionStorage.removeItem(`remises_work_${i}`);
      }
      sessionStorage.removeItem('remises_work_chunks');
      alert("✅ Travail supprimé");
    }
  };

  const createEmptyRow = () => ({
    id: Date.now() + Math.random(),
    produit: "",
    laboratoire: "",
    quantiteEnStock: "",
    quantiteVendue: "",
    quantiteNecessaire: "",
    remises: {},
  });

  const calculateBestOffers = (remises) => {
    const offers = fournisseurs
      .map((f) => ({ name: f.name, value: parseFloat(remises[f.id]) || 0, id: f.id }))
      .filter((o) => o.value > 0)
      .sort((a, b) => b.value - a.value);

    return [
      offers[0] || { name: "—", value: 0, id: null },
      offers[1] || { name: "—", value: 0, id: null },
      offers[2] || { name: "—", value: 0, id: null },
    ];
  };

  const addFournisseur = () => {
    const name = prompt("Nom du nouveau fournisseur :");
    if (!name || !name.trim()) return;
    const newId = Math.max(...fournisseurs.map((f) => f.id), 0) + 1;
    setFournisseurs([...fournisseurs, { id: newId, name: name.trim() }]);
  };

  const removeFournisseur = (id) => {
    if (fournisseurs.length <= 1) {
      alert("Vous devez avoir au moins un fournisseur.");
      return;
    }
    if (!window.confirm("Supprimer ce fournisseur ?")) return;
    setFournisseurs(fournisseurs.filter((f) => f.id !== id));
    setRows(rows.map((row) => {
      const newRemises = { ...row.remises };
      delete newRemises[id];
      return { ...row, remises: newRemises };
    }));
  };

  const startEditingHeader = (f) => {
    setEditingHeader(f.id);
    setTempHeaderName(f.name);
  };

  const saveHeaderName = () => {
    if (!tempHeaderName.trim()) {
      setEditingHeader(null);
      return;
    }
    setFournisseurs(fournisseurs.map((f) =>
      f.id === editingHeader ? { ...f, name: tempHeaderName.trim() } : f
    ));
    setEditingHeader(null);
    setTempHeaderName("");
  };

  const addRow = () => setRows([...rows, createEmptyRow()]);

  const deleteRow = (id) => {
    if (rows.length <= 1) return;
    if (!window.confirm("Supprimer cette ligne ?")) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  const duplicateRow = (index) => {
    const copy = { ...rows[index], id: Date.now() + Math.random() };
    const newRows = [...rows];
    newRows.splice(index + 1, 0, copy);
    setRows(newRows);
  };

  const updateCell = (rowId, field, value) => {
    setRows(rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  };

  const updateRemise = (rowId, fournisseurId, value) => {
    setRows(rows.map((row) =>
      row.id === rowId ? { ...row, remises: { ...row.remises, [fournisseurId]: value } } : row
    ));
  };

  const exportAndUploadToBackend = async () => {
    if (rows.length === 0 || !rows.some(r => r.produit || r.laboratoire)) {
      alert("⚠️ Aucune donnée à télécharger.");
      return;
    }

    const fileName = prompt(
      "Nom du fichier Excel (sans extension) :",
      `remises_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}`
    );
    if (!fileName || !fileName.trim()) return;

    const cleanFileName = fileName.trim().replace(/[^a-z0-9_-]/gi, '_');

    try {
      setUploading(true);

      const data = rows
        .filter(r => r.produit && r.laboratoire)
        .map((row) => {
          const obj = {
            Produit: row.produit,
            Laboratoire: row.laboratoire,
            "Quantité en Stock": row.quantiteEnStock || "",
            "Quantité Vendue": row.quantiteVendue || "",
            "Quantité Nécessaire": row.quantiteNecessaire || "",
          };

          fournisseurs.forEach((f) => {
            obj[f.name] = row.remises[f.id] || "";
          });

          const best = calculateBestOffers(row.remises);
          obj["Fournisseur 1"] = best[0].value > 0 ? `${best[0].name} (${best[0].value}%)` : "—";
          obj["Fournisseur 2"] = best[1].value > 0 ? `${best[1].name} (${best[1].value}%)` : "—";
          obj["Fournisseur 3"] = best[2].value > 0 ? `${best[2].name} (${best[2].value}%)` : "—";

          return obj;
        });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Remises");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const finalFileName = `${cleanFileName}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("✅ Fichier téléchargé dans le navigateur");

      const formData = new FormData();
      formData.append("file", blob, finalFileName);

      const response = await api.post("/excel/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Réponse backend:", response.data);

      alert(`✅ Fichier téléchargé et sauvegardé !\n\n📊 Résumé:\n- ${response.data.stats?.processed || 0} lignes traitées\n- Fichier: ${response.data.filename}`);

      socket.emit("remise-update");

    } catch (err) {
      console.error("❌ Erreur lors de l'export/upload:", err);
      alert(`❌ Erreur: ${err.response?.data?.message || err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async (file) => {
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
      const excludedCols = [
        "Produit", "Laboratoire", 
        "Quantité en Stock", "Quantité Vendue", "Quantité Nécessaire",
        "Fournisseur 1", "Fournisseur 2", "Fournisseur 3", 
        "MEILLEURE OFFRE", "2ÈME OFFRE", "3ÈME OFFRE"
      ];
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
          quantiteEnStock: r["Quantité en Stock"] || "",
          quantiteVendue: r["Quantité Vendue"] || "",
          quantiteNecessaire: r["Quantité Nécessaire"] || "",
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
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      row.produit.toLowerCase().includes(q) ||
      row.laboratoire.toLowerCase().includes(q);

    if (!selectedFournisseur) return matchesSearch;

    const bestOffers = calculateBestOffers(row.remises);
    const isInTop3 = bestOffers.some(offer => offer.name === selectedFournisseur && offer.value > 0);
    
    return matchesSearch && isInTop3;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {showRecoveryBanner && (
        <div className="mb-4 p-4 rounded bg-blue-900/50 border border-blue-600 flex items-center justify-between animate-pulse">
          <div>
            <p className="text-white font-semibold text-lg">🔄 Travail non sauvegardé détecté!</p>
            <p className="text-sm text-blue-200">Voulez-vous récupérer votre travail précédent?</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={recoverWork}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold text-lg"
            >
              📂 RÉCUPÉRER
            </button>
            <button
              onClick={dismissRecovery}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
            >
              ✕ Ignorer
            </button>
          </div>
        </div>
      )}

      {fournisseurs.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400">Filtrer par fournisseur:</span>
          <button
            onClick={() => setSelectedFournisseur(null)}
            className={`px-3 py-1 rounded text-sm transition-colors ${!selectedFournisseur ? "bg-indigo-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"}`}
          >
            Tous ({rows.length})
          </button>
          {fournisseurs.map((f) => {
            const count = rows.filter(row => {
              const bestOffers = calculateBestOffers(row.remises);
              return bestOffers.some(offer => offer.name === f.name && offer.value > 0);
            }).length;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFournisseur(f.name)}
                className={`px-3 py-1 rounded text-sm transition-colors ${selectedFournisseur === f.name ? "bg-indigo-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"}`}
              >
                {f.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold">Tableau des Remises</h1>

        <div className="flex items-center gap-2 text-sm">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white"
          />

          <label className="bg-gray-700 px-2 py-1 rounded cursor-pointer hover:bg-gray-600">
            📂 Importer Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => e.target.files[0] && handleImport(e.target.files[0])}
              className="hidden"
            />
          </label>

          <button onClick={addFournisseur} className="bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-500">
            + Fournisseur
          </button>

          <button onClick={addRow} className="bg-green-600 px-2 py-1 rounded hover:bg-green-500">
            + Ligne
          </button>

          {rows.length > 0 && (
            <button
              onClick={clearWork}
              className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-xs"
            >
              🗑️ Clear
            </button>
          )}

          <button
            onClick={exportAndUploadToBackend}
            disabled={uploading}
            className={`bg-blue-600 px-2 py-1 rounded hover:bg-blue-500 ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {uploading ? "⏳ Envoi..." : "💾 Télécharger Excel"}
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-700 rounded-lg">
          <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-400 mb-2">Aucune donnée</h3>
          <p className="text-sm text-gray-500 mb-4">Importez un fichier Excel ou ajoutez une ligne</p>
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
        </div>
      ) : (
        <div className="overflow-auto border border-gray-700 rounded">
          <table className="min-w-full table-auto text-xs">
            <thead>
              <tr className="bg-gray-800 text-gray-200">
                <th className="px-2 py-2 text-left border-r border-gray-700 sticky left-0 bg-gray-800 z-20">Produit</th>
                <th className="px-2 py-2 text-left border-r border-gray-700">Laboratoire</th>
                <th className="px-2 py-2 text-left border-r border-gray-700 bg-blue-900/20">Qté Stock</th>
                <th className="px-2 py-2 text-left border-r border-gray-700 bg-blue-900/20">Qté Vendue</th>
                <th className="px-2 py-2 text-left border-r border-gray-700 bg-blue-900/20">Qté Nécessaire</th>
                {fournisseurs.map((f) => (
                  <th key={f.id} className="px-2 py-2 border-r border-gray-700 relative" onDoubleClick={() => startEditingHeader(f)}>
                    {editingHeader === f.id ? (
                      <input
                        value={tempHeaderName}
                        onChange={(e) => setTempHeaderName(e.target.value)}
                        onBlur={saveHeaderName}
                        onKeyDown={(e) => e.key === "Enter" && saveHeaderName()}
                        autoFocus
                        className="w-full bg-gray-700 px-1 py-1 rounded text-xs"
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{f.name}</span>
                        <button onClick={() => removeFournisseur(f.id)} className="text-red-400 hover:text-red-300 text-xs ml-1">✕</button>
                      </div>
                    )}
                  </th>
                ))}
                <th className="px-2 py-2 bg-emerald-900/30 border-r border-gray-700">Fournisseur 1</th>
                <th className="px-2 py-2 bg-yellow-900/30 border-r border-gray-700">Fournisseur 2</th>
                <th className="px-2 py-2 bg-orange-900/30 border-r border-gray-700">Fournisseur 3</th>
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
                        className="w-full bg-transparent px-1 py-1 text-xs outline-none"
                        placeholder="Produit"
                      />
                    </td>
                    <td className="px-2 py-1 border-b border-gray-800">
                      <input
                        value={row.laboratoire}
                        onChange={(e) => updateCell(row.id, "laboratoire", e.target.value)}
                        className="w-full bg-transparent px-1 py-1 text-xs outline-none"
                        placeholder="Laboratoire"
                      />
                    </td>
                    <td className="px-2 py-1 border-b border-gray-800 bg-blue-900/10">
                      <input
                        type="number"
                        value={row.quantiteEnStock}
                        onChange={(e) => updateCell(row.id, "quantiteEnStock", e.target.value)}
                        className="w-full bg-transparent px-1 py-1 text-xs text-right outline-none"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-2 py-1 border-b border-gray-800 bg-blue-900/10">
                      <input
                        type="number"
                        value={row.quantiteVendue}
                        onChange={(e) => updateCell(row.id, "quantiteVendue", e.target.value)}
                        className="w-full bg-transparent px-1 py-1 text-xs text-right outline-none"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-2 py-1 border-b border-gray-800 bg-blue-900/10">
                      <input
                        type="number"
                        value={row.quantiteNecessaire}
                        onChange={(e) => updateCell(row.id, "quantiteNecessaire", e.target.value)}
                        className="w-full bg-transparent px-1 py-1 text-xs text-right outline-none"
                        placeholder="0"
                      />
                    </td>
                    {fournisseurs.map((f) => (
                      <td key={f.id} className="px-2 py-1 border-b border-gray-800">
                        <input
                          value={row.remises[f.id] || ""}
                          onChange={(e) => updateRemise(row.id, f.id, e.target.value)}
                          className="w-full bg-transparent px-1 py-1 text-xs text-right outline-none"
                          placeholder="0"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1 border-b border-gray-800 bg-emerald-900/10 text-emerald-300">
                      {bestOffers[0].value > 0 ? (
                        <button 
                          onClick={() => setSelectedFournisseur(bestOffers[0].name)}
                          className="hover:underline cursor-pointer w-full text-left"
                        >
                          {bestOffers[0].name} ({bestOffers[0].value}%)
                        </button>
                      ) : "—"}
                    </td>
                    <td className="px-2 py-1 border-b border-gray-800 bg-yellow-900/10 text-yellow-300">
                      {bestOffers[1].value > 0 ? (
                        <button 
                          onClick={() => setSelectedFournisseur(bestOffers[1].name)}
                          className="hover:underline cursor-pointer w-full text-left"
                        >
                          {bestOffers[1].name} ({bestOffers[1].value}%)
                        </button>
                      ) : "—"}
                    </td>
                    <td className="px-2 py-1 border-b border-gray-800 bg-orange-900/10 text-orange-300">
                      {bestOffers[2].value > 0 ? (
                        <button 
                          onClick={() => setSelectedFournisseur(bestOffers[2].name)}
                          className="hover:underline cursor-pointer w-full text-left"
                        >
                          {bestOffers[2].name} ({bestOffers[2].value}%)
                        </button>
                      ) : "—"}
                    </td>
                    <td className="px-2 py-1 border-b border-gray-800">
                      <div className="flex gap-1">
                        <button onClick={() => duplicateRow(rowIndex)} className="text-blue-400 hover:text-blue-300 text-xs">Dup</button>
                        <button onClick={() => deleteRow(row.id)} className="text-red-400 hover:text-red-300 text-xs">Supp</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400 space-y-1">
        <p>💾 Votre travail est automatiquement sauvegardé</p>
        <p>💡 Double-cliquez sur un nom de fournisseur pour le renommer.</p>
        <p>📦 Les colonnes bleues (Quantités) sont toujours présentes comme Produit et Laboratoire.</p>
        <p>🔍 Cliquez sur un nom dans les colonnes "Fournisseur 1/2/3" pour filtrer les produits où ce fournisseur apparaît dans le top 3.</p>
        {selectedFournisseur && (
          <p className="text-indigo-400">
            ✓ Affichage filtré: {filteredRows.length} produit(s) où <strong>{selectedFournisseur}</strong> est dans le top 3
          </p>
        )}
      </div>
    </div>
  );
}