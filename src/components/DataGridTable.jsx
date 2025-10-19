// src/components/DataGridTable.jsx
import React from "react";

export default function DataGridTable({ data, setData }) {
  const handleChange = (index, key, value) => {
    const updated = [...data];
    updated[index][key] = value;
    setData(updated);
  };

  if (!data || data.length === 0) {
    return <p className="text-gray-400 text-center mt-6">Aucune donnée à afficher</p>;
  }

  const headers = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full bg-gray-800 text-white rounded-lg">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-2 border-b border-gray-700 capitalize">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-700">
              {headers.map((key) => (
                <td key={key} className="px-4 py-2">
                  <input
                    className="bg-gray-700 w-full px-2 py-1 rounded text-sm"
                    value={row[key]}
                    onChange={(e) => handleChange(i, key, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
