import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { io } from "socket.io-client";

const api = axios.create({
  baseURL: "https://client-backend-0vev.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

const socket = io("https://client-backend-0vev.onrender.com");

export default function AdminPanel() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [permissions, setPermissions] = useState({
    canEdit: false,
    canUpload: false,
    canDownload: false,
  });
  const [availableFiles, setAvailableFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedRowForValidation, setSelectedRowForValidation] = useState(null);
  const [selectedFournisseurForCommand, setSelectedFournisseurForCommand] = useState(null);
  const [commandsCreated, setCommandsCreated] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  const [savedFilesAvailable, setSavedFilesAvailable] = useState([]);
  const [showFileDropdown, setShowFileDropdown] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "admin";

  // 🔥 AUTO-SAVE
  useEffect(() => {
    if (rows.length > 0 && selectedFile) {
      localStorage.setItem(`excel_work_${selectedFile}`, JSON.stringify(rows));
    }
  }, [rows, selectedFile]);

  // 🔥 SAVE COMMANDS
  useEffect(() => {
    if (commandsCreated.length > 0) {
      localStorage.setItem("pending_commands", JSON.stringify(commandsCreated));
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [commandsCreated]);

  // 🔥 LOAD COMMANDS ON START
  useEffect(() => {
    const savedCommands = localStorage.getItem("pending_commands");
    if (savedCommands) {
      try {
        const parsed = JSON.parse(savedCommands);
        setCommandsCreated(parsed);
        setHasUnsavedChanges(true);
      } catch (e) {
        console.error("Error loading commands:", e);
      }
    }
  }, []);

  // 🔥 CHECK FOR SAVED WORK
  useEffect(() => {
    const allKeys = Object.keys(localStorage);
    const savedFiles = allKeys.filter(key => key.startsWith('excel_work_'));
    if (savedFiles.length > 0 && rows.length === 0) {
      setSavedFilesAvailable(savedFiles);
      setShowRecoveryBanner(true);
    }
  }, []);

  // 🔥 ALERT BEFORE LEAVING
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "⚠️ Vous avez des commandes non exportées!";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    checkEditAccess();
    fetchAvailableFiles();
    socket.on("permission-updated", checkEditAccess);
    socket.on("remise-updated", fetchAvailableFiles);
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
      setPermissions({
        canEdit: data.canEdit || false,
        canUpload: data.canUpload || false,
        canDownload: data.canDownload || false,
      });
    } catch (err) {
      console.error("Error checking access:", err);
      setPermissions({
        canEdit: false,
        canUpload: false,
        canDownload: false,
      });
    }
  };

  const fetchAvailableFiles = async () => {
    try {
      const { data } = await api.get("/excel/files", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableFiles(data.files || []);
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  const recoverLatestWork = () => {
    if (savedFilesAvailable.length > 0) {
      const latestFile = savedFilesAvailable[0].replace('excel_work_', '');
      loadExcelFile(latestFile);
      setShowRecoveryBanner(false);
    }
  };

  const loadExcelFile = async (fileName) => {
    try {
      const savedWork = localStorage.getItem(`excel_work_${fileName}`);
      if (savedWork) {
        const useRecovery = window.confirm(
          "🔄 Un travail non sauvegardé a été trouvé. Récupérer?"
        );
        
        if (useRecovery) {
          const recovered = JSON.parse(savedWork);
          setRows(recovered);
          setSelectedFile(fileName);
          
          if (recovered.length > 0 && recovered[0].remises) {
            const remiseKeys = Object.keys(recovered[0].remises);
            const recoveredFournisseurs = remiseKeys.map((key) => ({
              id: parseInt(key),
              name: `Fournisseur ${key}`
            }));
            setFournisseurs(recoveredFournisseurs);
          }
          
          alert(`✅ ${recovered.length} lignes récupérées!`);
          return;
        } else {
          localStorage.removeItem(`excel_work_${fileName}`);
        }
      }

      const response = await api.get(`/excel/download/${fileName}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "arraybuffer",
      });

      const workbook = XLSX.read(response.data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!json || json.length === 0) {
        alert("Fichier vide ou invalide.");
        return;
      }

      const headers = Object.keys(json[0]);
      const excludedCols = [
        "Produit",
        "Laboratoire",
        "MEILLEURE OFFRE",
        "2ÈME OFFRE",
        "3ÈME OFFRE",
        "Fournisseur 1",
        "Fournisseur 2",
        "Fournisseur 3",
        "Quantité en Stock",
        "Quantité Vendue",
        "Quantité Nécessaire",
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
          quantiteEnStock: parseFloat(r["Quantité en Stock"] || 0),
          quantiteVendue: parseFloat(r["Quantité Vendue"] || 0),
          quantiteNecessaire: parseFloat(r["Quantité Nécessaire"] || 0),
          remises,
        };
      });

      setRows(newRows);
      setSelectedFile(fileName);
      alert(`✅ ${newRows.length} lignes chargées!`);
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors du chargement du fichier.");
    }
  };

  const calculateBestOffers = (remises) => {
    const offers = fournisseurs
      .map((f) => ({
        id: f.id,
        name: f.name,
        value: parseFloat(remises[f.id]) || 0,
      }))
      .filter((o) => o.value > 0)
      .sort((a, b) => b.value - a.value);

    return [
      offers[0] || { id: null, name: "—", value: 0 },
      offers[1] || { id: null, name: "—", value: 0 },
      offers[2] || { id: null, name: "—", value: 0 },
    ];
  };

  const updateCell = (rowId, field, value) => {
    if (!permissions.canEdit && !isAdmin) {
      alert("Vous n'avez pas la permission de modifier.");
      return;
    }
    setRows(
      rows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  const openValidationModal = (row) => {
    const bestOffers = calculateBestOffers(row.remises);
    setSelectedRowForValidation(row);
    setSelectedFournisseurForCommand(bestOffers[0]);
    setShowValidationModal(true);
  };

  const closeValidationModal = () => {
    setShowValidationModal(false);
    setSelectedRowForValidation(null);
    setSelectedFournisseurForCommand(null);
  };

  const validateAndCreateCommande = () => {
    if (!selectedRowForValidation || !selectedFournisseurForCommand) return;

    const row = selectedRowForValidation;
    const fournisseur = selectedFournisseurForCommand;

    if (!fournisseur || fournisseur.value === 0) {
      alert("Aucune offre disponible.");
      return;
    }

    const commande = {
      id: Date.now(),
      produit: row.produit,
      laboratoire: row.laboratoire,
      quantiteNecessaire: row.quantiteNecessaire,
      fournisseur: fournisseur.name,
      date: new Date().toLocaleDateString("fr-FR"),
    };

    const newCommands = [...commandsCreated, commande];
    setCommandsCreated(newCommands);

    // Remove row from table
    setRows(rows.filter(r => r.id !== row.id));

    alert(`✅ Commande créée: ${row.produit} - ${fournisseur.name}`);
    closeValidationModal();
  };

  const exportCommandes = () => {
    if (commandsCreated.length === 0) {
      alert("Aucune commande à exporter.");
      return;
    }

    const dataToExport = commandsCreated.map((cmd) => ({
      Date: cmd.date,
      Produit: cmd.produit,
      Laboratoire: cmd.laboratoire,
      Fournisseur: cmd.fournisseur,
      "Quantité Nécessaire": cmd.quantiteNecessaire,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Commandes");

    const fileName = `commandes_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    alert(`✅ ${commandsCreated.length} commandes exportées!`);
    
    setCommandsCreated([]);
    setHasUnsavedChanges(false);
    localStorage.removeItem("pending_commands");
  };

  const clearSavedWork = () => {
    if (window.confirm("⚠️ Supprimer tout le travail?")) {
      if (selectedFile) {
        localStorage.removeItem(`excel_work_${selectedFile}`);
      }
      setRows([]);
      alert("✅ Travail supprimé");
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
      {/* 🔥 RECOVERY BANNER */}
      {showRecoveryBanner && (
        <div className="mb-4 p-4 rounded bg-blue-900/50 border border-blue-600 flex items-center justify-between animate-pulse">
          <div>
            <p className="text-white font-semibold text-lg">🔄 Travail non sauvegardé détecté!</p>
            <p className="text-sm text-blue-200">Récupérer votre dernier travail?</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={recoverLatestWork}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold"
            >
              📂 RÉCUPÉRER
            </button>
            <button
              onClick={() => setShowRecoveryBanner(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className={`mb-4 p-3 rounded ${isAdmin ? "bg-yellow-900/30 border border-yellow-700" : "bg-green-900/30 border border-green-700"}`}>
        <div className="text-sm">
          <p className="text-white font-semibold">Rôle: {isAdmin ? "Admin" : "Root"}</p>
          {hasUnsavedChanges && (
            <p className="text-yellow-300 mt-1">⚠️ {commandsCreated.length} commande(s) non exportée(s)</p>
          )}
        </div>
      </div>

      {/* 🔥 FILTER BY FOURNISSEUR */}
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
        <h1 className="text-xl font-bold">Panneau Admin - Gestion des Commandes</h1>

        <div className="flex items-center gap-2 text-sm">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white"
          />

          <div className="relative">
            <button
              onClick={() => setShowFileDropdown(!showFileDropdown)}
              className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 flex items-center gap-1"
            >
              📁 Fichiers ({availableFiles.length})
            </button>
            
            {showFileDropdown && (
              <div className="absolute top-full mt-1 right-0 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-64 max-h-96 overflow-y-auto">
                {availableFiles.length === 0 ? (
                  <div className="px-4 py-3 text-gray-400 text-xs">Aucun fichier disponible</div>
                ) : (
                  availableFiles.map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        loadExcelFile(file.name);
                        setShowFileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 text-xs border-b border-gray-700 last:border-b-0"
                    >
                      <div className="font-medium text-white">{file.name}</div>
                      <div className="text-gray-400 text-xs mt-1">
                        {new Date(file.date).toLocaleString('fr-FR')}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {rows.length > 0 && selectedFile && (
            <button
              onClick={clearSavedWork}
              className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-xs"
            >
              🗑️ Clear
            </button>
          )}

          {commandsCreated.length > 0 && (
            <div className="px-2 py-1 bg-blue-900/50 border border-blue-700 rounded">
              {commandsCreated.length} commande(s)
            </div>
          )}

          <button
            onClick={exportCommandes}
            disabled={commandsCreated.length === 0}
            className={`px-2 py-1 rounded ${commandsCreated.length > 0 ? "bg-green-600 hover:bg-green-500" : "bg-gray-600 opacity-50 cursor-not-allowed"}`}
          >
            Exporter Commandes
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-700 rounded-lg">
          <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-400 mb-2">Aucun fichier chargé</h3>
          <p className="text-sm text-gray-500 mb-4">Sélectionnez un fichier pour commencer</p>
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
                <th className="px-2 py-2 border-r border-gray-700">Qté Stock</th>
                <th className="px-2 py-2 border-r border-gray-700">Qté Vendue</th>
                <th className="px-2 py-2 border-r border-gray-700">Qté Nécessaire</th>

                <th className="px-2 py-2 bg-emerald-900/30 border-r border-gray-700">
                  Fournisseur 1
                </th>
                <th className="px-2 py-2 bg-yellow-900/30 border-r border-gray-700">
                  Fournisseur 2
                </th>
                <th className="px-2 py-2 bg-orange-900/30 border-r border-gray-700">
                  Fournisseur 3
                </th>

                <th className="px-2 py-2 bg-gray-800">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row) => {
                const bestOffers = calculateBestOffers(row.remises);

                return (
                  <tr key={row.id} className="even:bg-gray-900/50 hover:bg-gray-800/50">
                    <td className="px-2 py-1 border-b border-gray-800 sticky left-0 bg-gray-900">
                      {row.produit}
                    </td>

                    <td className="px-2 py-1 border-b border-gray-800">
                      {row.laboratoire}
                    </td>

                    <td className="px-2 py-1 border-b border-gray-800 text-center">
                      <input
                        type="number"
                        value={row.quantiteEnStock}
                        onChange={(e) => updateCell(row.id, "quantiteEnStock", parseFloat(e.target.value) || 0)}
                        className="w-20 px-1 py-1 text-xs text-center outline-none bg-transparent"
                      />
                    </td>

                    <td className="px-2 py-1 border-b border-gray-800 text-center">
                      <input
                        type="number"
                        value={row.quantiteVendue}
                        onChange={(e) => updateCell(row.id, "quantiteVendue", parseFloat(e.target.value) || 0)}
                        className="w-20 px-1 py-1 text-xs text-center outline-none bg-transparent"
                      />
                    </td>

                    <td className="px-2 py-1 border-b border-gray-800 text-center">
                      <input
                        type="number"
                        value={row.quantiteNecessaire}
                        onChange={(e) => updateCell(row.id, "quantiteNecessaire", parseFloat(e.target.value) || 0)}
                        className="w-20 px-1 py-1 text-xs text-center outline-none bg-transparent"
                      />
                    </td>

                    <td className="px-2 py-1 border-b border-gray-800 bg-emerald-900/10 text-emerald-300">
                      {bestOffers[0].value > 0 ? (
                        <button 
                          onClick={() => setSelectedFournisseur(bestOffers[0].name)}
                          className="hover:underline cursor-pointer w-full text-left"
                        >
                          {bestOffers[0].name}
                        </button>
                      ) : "—"}
                    </td>

                    <td className="px-2 py-1 border-b border-gray-800 bg-yellow-900/10 text-yellow-300">
                      {bestOffers[1].value > 0 ? (
                        <button 
                          onClick={() => setSelectedFournisseur(bestOffers[1].name)}
                          className="hover:underline cursor-pointer w-full text-left"
                        >
                          {bestOffers[1].name}
                        </button>
                      ) : "—"}
                    </td>

                    <td className="px-2 py-1 border-b border-gray-800 bg-orange-900/10 text-orange-300">
                      {bestOffers[2].value > 0 ? (
                        <button 
                          onClick={() => setSelectedFournisseur(bestOffers[2].name)}
                          className="hover:underline cursor-pointer w-full text-left"
                        >
                          {bestOffers[2].name}
                        </button>
                      ) : "—"}
                    </td>

                    <td className="px-2 py-1 border-b border-gray-800">
                      <button
                        onClick={() => openValidationModal(row)}
                        className="text-green-400 hover:text-green-300 text-xs px-2 py-1 rounded bg-green-900/20"
                      >
                        Valider
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Validation Modal */}
      {showValidationModal && selectedRowForValidation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Créer une commande</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-gray-400">Produit</label>
                <p className="text-white font-medium">{selectedRowForValidation.produit}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Laboratoire</label>
                <p className="text-white font-medium">{selectedRowForValidation.laboratoire}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Quantité nécessaire</label>
                <p className="text-white font-medium">{selectedRowForValidation.quantiteNecessaire}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 block mb-2">Fournisseur</label>
                <select
                  value={selectedFournisseurForCommand?.id || ""}
                  onChange={(e) => {
                    const offers = calculateBestOffers(selectedRowForValidation.remises);
                    const selected = offers.find(o => o.id === parseInt(e.target.value));
                    setSelectedFournisseurForCommand(selected);
                  }}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                >
                  {calculateBestOffers(selectedRowForValidation.remises)
                    .filter(o => o.value > 0)
                    .map((offer, idx) => (
                      <option key={offer.id} value={offer.id}>
                        {offer.name} {idx === 0 && "(Meilleure)"} {idx === 1 && "(2ème)"} {idx === 2 && "(3ème)"}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={validateAndCreateCommande}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white font-medium"
              >
                Créer
              </button>
              <button
                onClick={closeValidationModal}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400 space-y-1">
        <p>💾 Votre travail est automatiquement sauvegardé</p>
        <p>🔍 Cliquez sur un nom de fournisseur pour filtrer</p>
        {selectedFournisseur && (
          <p className="text-indigo-400">
            ✓ Affichage filtré: {filteredRows.length} produit(s) où <strong>{selectedFournisseur}</strong> est dans le top 3
          </p>
        )}
        <p>Admin ne voit PAS les pourcentages de remise (confidentiels)</p>
      </div>
    </div>
  );
}