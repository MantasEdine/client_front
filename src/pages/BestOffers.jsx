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

// Socket.io connection
const socket = io("http://localhost:5000");

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

  const token = localStorage.getItem("token");

  // Socket.io listeners
  useEffect(() => {
    socket.on("remise-updated", () => {
      console.log("Remise updated by another user");
    });

    return () => {
      socket.off("remise-updated");
    };
  }, []);

  // Créer une ligne vide
  const createEmptyRow = () => ({
    id: Date.now() + Math.random(),
    produit: "",
    laboratoire: "",
    remises: {},
  });

  // Calcul automatique des 3 meilleures offres
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

  // Ajouter un fournisseur
  const addFournisseur = () => {
    const name = prompt("Nom du nouveau fournisseur :");
    if (!name || !name.trim()) return;

    const newId = Math.max(...fournisseurs.map((f) => f.id), 0) + 1;
    setFournisseurs([...fournisseurs, { id: newId, name: name.trim() }]);
  };

  // Supprimer un fournisseur
  const removeFournisseur = (id) => {
    if (fournisseurs.length <= 1) {
      alert("Vous devez avoir au moins un fournisseur.");
      return;
    }
    if (!window.confirm("Supprimer ce fournisseur ?")) return;

    setFournisseurs(fournisseurs.filter((f) => f.id !== id));
    setRows(
      rows.map((row) => {
        const newRemises = { ...row.remises };
        delete newRemises[id];
        return { ...row, remises: newRemises };
      })
    );
  };

  // Renommer un fournisseur
  const startEditingHeader = (f) => {
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

  // Ajouter une ligne
  const addRow = () => {
    setRows([...rows, createEmptyRow()]);
  };

  // Supprimer une ligne
  const deleteRow = (id) => {
    if (rows.length <= 1) return;
    if (!window.confirm("Supprimer cette ligne ?")) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  // Dupliquer une ligne
  const duplicateRow = (index) => {
    const copy = { ...rows[index], id: Date.now() + Math.random() };
    const newRows = [...rows];
    newRows.splice(index + 1, 0, copy);
    setRows(newRows);
  };

  // Modifier une cellule
  const updateCell = (rowId, field, value) => {
    setRows(
      rows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  // Modifier une remise
  const updateRemise = (rowId, fournisseurId, value) => {
    setRows(
      rows.map((row) =>
        row.id === rowId
          ? { ...row, remises: { ...row.remises, [fournisseurId]: value } }
          : row
      )
    );
  };

  // Sauvegarder TOUT dans la DB
  const saveAllToDatabase = async () => {
    try {
      // Filtrer les lignes vides
      const validRows = rows.filter(r => r.produit && r.laboratoire);
      
      if (validRows.length === 0) {
        alert("Aucune donnée à sauvegarder.");
        return false;
      }

      for (const row of validRows) {
        // 1. Créer/récupérer laboratoire
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
            // Labo existe déjà, le récupérer
            const { data: labos } = await api.get("/laboratoire", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const existingLabo = labos.find((l) => l.name === row.laboratoire);
            laboId = existingLabo?._id;
          } else {
            throw err;
          }
        }

        // 2. Créer/récupérer produit
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
            // Produit existe déjà
            const { data: produits } = await api.get("/produit", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const existingProduit = produits.find((p) => p.name === row.produit);
            produitId = existingProduit?._id;
          } else {
            throw err;
          }
        }

        // 3. Créer/récupérer fournisseurs et créer remises
        for (const fournisseur of fournisseurs) {
          const remiseValue = row.remises[fournisseur.id];
          if (remiseValue && parseFloat(remiseValue) > 0) {
            // Créer/récupérer fournisseur
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
              } else {
                throw err;
              }
            }

            // Créer remise
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

      return true;
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
      alert("❌ Erreur lors de la sauvegarde des données.");
      return false;
    }
  };

  // Export Excel + Upload to backend + Reset
  const exportAndUploadToBackend = async () => {
    if (rows.length === 0 || !rows.some(r => r.produit || r.laboratoire)) {
      alert("⚠️ Aucune donnée à télécharger.");
      return;
    }

    // Demander le nom du fichier
    const fileName = prompt(
      "Nom du fichier Excel (sans extension) :",
      `remises_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}`
    );
    if (!fileName || !fileName.trim()) return;

    const cleanFileName = fileName.trim().replace(/[^a-z0-9_-]/gi, '_');

    try {
      setUploading(true);

      // 1. Sauvegarder toutes les données dans la DB
      const saved = await saveAllToDatabase();
      if (!saved) {
        setUploading(false);
        return;
      }

      // 2. Créer les données Excel
      const data = rows
        .filter(r => r.produit || r.laboratoire) // Exclure lignes vides
        .map((row) => {
          const obj = {
            Produit: row.produit,
            Laboratoire: row.laboratoire,
          };

          fournisseurs.forEach((f) => {
            obj[f.name] = row.remises[f.id] || "";
          });

          const best = calculateBestOffers(row.remises);
          obj["MEILLEURE OFFRE"] = best[0].value > 0 ? `${best[0].name} (${best[0].value}%)` : "—";
          obj["2ÈME OFFRE"] = best[1].value > 0 ? `${best[1].name} (${best[1].value}%)` : "—";
          obj["3ÈME OFFRE"] = best[2].value > 0 ? `${best[2].name} (${best[2].value}%)` : "—";

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

      // 3. Télécharger localement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = finalFileName;
      link.click();
      window.URL.revokeObjectURL(url);

      // 4. Uploader vers le backend
      const formData = new FormData();
      formData.append("file", blob, finalFileName);

      await api.post("/excel/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("✅ Fichier téléchargé et sauvegardé sur le serveur !");

      // 5. Notifier via socket
      socket.emit("remise-update");

      // 6. RESET le tableau
      setRows([]);
      setFournisseurs([
        { id: 1, name: "FOURNISSEUR 1" },
        { id: 2, name: "FOURNISSEUR 2" },
        { id: 3, name: "FOURNISSEUR 3" },
      ]);
    } catch (err) {
      console.error("Erreur lors de l'export/upload :", err);
      alert("❌ Erreur lors de la sauvegarde du fichier.");
    } finally {
      setUploading(false);
    }
  };

  // Import Excel
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
      const excludedCols = ["Produit", "Laboratoire", "MEILLEURE OFFRE", "2ÈME OFFRE", "3ÈME OFFRE"];
      const fournisseurCols = headers.filter((h) => !excludedCols.includes(h));

      // Créer les fournisseurs localement (pas de sauvegarde DB)
      const newFournisseurs = fournisseurCols.map((name, i) => ({
        id: i + 1,
        name,
      }));

      setFournisseurs(newFournisseurs);

      // Créer les lignes localement (pas de sauvegarde DB)
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
      alert(`✅ ${newRows.length} lignes importées ! Les meilleures offres sont calculées automatiquement.`);
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

          <button
            onClick={addFournisseur}
            className="bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-500"
          >
            + Fournisseur
          </button>

          <button
            onClick={addRow}
            className="bg-green-600 px-2 py-1 rounded hover:bg-green-500"
          >
            + Ligne
          </button>

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
          <svg
            className="w-16 h-16 text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-400 mb-2">Aucune donnée</h3>
          <p className="text-sm text-gray-500 mb-4">Importez un fichier Excel ou ajoutez une ligne pour commencer</p>
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
            <button
              onClick={addRow}
              className="bg-green-600 px-4 py-2 rounded hover:bg-green-500"
            >
              + Ajouter une ligne
            </button>
          </div>
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
                        className="w-full bg-gray-700 px-1 py-1 rounded text-xs"
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{f.name}</span>
                        <button
                          onClick={() => removeFournisseur(f.id)}
                          className="text-red-400 hover:text-red-300 text-xs ml-1"
                        >
                          ✕
                        </button>
                      </div>
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
                          className="text-blue-400 hover:text-blue-300 text-xs"
                        >
                          Dup
                        </button>
                        <button
                          onClick={() => deleteRow(row.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
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
        💡 Double-cliquez sur un nom de fournisseur pour le renommer. 
        Les données sont sauvegardées uniquement quand vous cliquez sur "Télécharger Excel".
      </div>
    </div>
  );
}