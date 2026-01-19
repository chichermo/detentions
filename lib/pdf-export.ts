/**
 * Utilidades para exportación a PDF con jspdf-autotable
 * Maneja la carga dinámica del plugin de manera confiable
 */

import jsPDF from 'jspdf';

let autoTablePlugin: any = null;
let loadingPromise: Promise<void> | null = null;

async function loadAutoTablePlugin(): Promise<void> {
  if (autoTablePlugin) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise(async (resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Cannot load jspdf-autotable on server'));
      return;
    }

    try {
      // Usar importación dinámica para cargar el plugin
      await import('jspdf-autotable');
      autoTablePlugin = true;
      resolve();
    } catch (error) {
      console.error('Error loading jspdf-autotable:', error);
      // Intentar con require como fallback
      try {
        // @ts-ignore
        require('jspdf-autotable');
        autoTablePlugin = true;
        resolve();
      } catch (requireError) {
        reject(requireError);
      }
    }
  });

  return loadingPromise;
}

export async function createPDF(): Promise<jsPDF> {
  await loadAutoTablePlugin();
  return new jsPDF();
}

export function autoTable(doc: jsPDF, options: any) {
  // @ts-ignore
  if (typeof (doc as any).autoTable !== 'function') {
    throw new Error('jspdf-autotable no está cargado. Por favor, recarga la página.');
  }
  // @ts-ignore
  return (doc as any).autoTable(options);
}
