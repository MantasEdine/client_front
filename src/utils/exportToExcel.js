// src/utils/exportToExcel.js
import * as XLSX from "xlsx";

export const exportToExcel = (data, fileName = "produits.xlsx") => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Produits");
  XLSX.writeFile(workbook, fileName);
};
