/**
 * Utilidades para exportación a PDF con jspdf-autotable
 * Maneja la carga dinámica del plugin de manera confiable
 */

import jsPDF from 'jspdf';

// Importar jspdf-autotable de forma estática solo en el cliente
let autoTableLoaded = false;
if (typeof window !== 'undefined') {
  // Precargar el módulo cuando se carga el módulo
  import('jspdf-autotable')
    .then(() => {
      autoTableLoaded = true;
    })
    .catch((err) => {
      console.warn('Could not preload jspdf-autotable:', err);
    });
}

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
      // Importar el módulo
      await import('jspdf-autotable');
      
      // Esperar múltiples veces para asegurar que el prototipo se extienda
      for (let i = 0; i < 5; i++) {
        await new Promise(res => setTimeout(res, 200));
        
        const testDoc = new jsPDF();
        // @ts-ignore
        if (typeof (testDoc as any).autoTable === 'function') {
          autoTablePlugin = true;
          resolve();
          return;
        }
      }

      // Si después de todos los intentos no está disponible, marcar como cargado de todos modos
      // Puede que funcione en tiempo de ejecución
      console.warn('jspdf-autotable loaded but autoTable not immediately available on prototype');
      autoTablePlugin = true;
      resolve();
    } catch (error) {
      console.error('Error loading jspdf-autotable:', error);
      reject(error);
    }
  });

  return loadingPromise;
}

export async function createPDF(): Promise<jsPDF> {
  if (typeof window === 'undefined') {
    throw new Error('PDF export is only available in the browser');
  }

  // Asegurar que el plugin esté cargado
  await loadAutoTablePlugin();
  
  // Crear el documento
  const doc = new jsPDF();
  
  // Verificar que autoTable esté disponible
  // @ts-ignore
  if (typeof (doc as any).autoTable !== 'function') {
    // Esperar un poco más y verificar de nuevo
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // @ts-ignore
    if (typeof (doc as any).autoTable !== 'function') {
      // Último intento: cargar explícitamente y esperar más tiempo
      try {
        await import('jspdf-autotable');
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.error('Final attempt to load autotable failed:', e);
      }
      
      // Verificar una última vez
      // @ts-ignore
      if (typeof (doc as any).autoTable !== 'function') {
        throw new Error('jspdf-autotable no está disponible. Por favor, recarga la página e intenta de nuevo.');
      }
    }
  }
  
  return doc;
}

export function autoTable(doc: jsPDF, options: any) {
  // @ts-ignore
  if (typeof (doc as any).autoTable !== 'function') {
    // Intentar acceder directamente al método interno
    // @ts-ignore
    if (typeof jsPDF.API !== 'undefined' && typeof jsPDF.API.autoTable === 'function') {
      // @ts-ignore
      return jsPDF.API.autoTable(doc, options);
    }
    
    // Último recurso: intentar cargar de nuevo
    if (typeof window !== 'undefined') {
      try {
        // @ts-ignore
        const autotable = require('jspdf-autotable');
        if (autotable && typeof autotable === 'function') {
          // @ts-ignore
          return autotable(doc, options);
        }
      } catch (e) {
        // Ignorar error
      }
    }
    
    // @ts-ignore
    if (typeof (doc as any).autoTable !== 'function') {
      throw new Error('jspdf-autotable no está cargado. Por favor, recarga la página.');
    }
  }
  // @ts-ignore
  return (doc as any).autoTable(options);
}
