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
      // En Next.js, necesitamos usar una estrategia diferente
      // El plugin debe estar disponible globalmente después de importarlo
      
      // Método 1: Importación dinámica
      try {
        await import('jspdf-autotable');
        // Dar tiempo para que el plugin se registre
        await new Promise(res => setTimeout(res, 100));
        
        // Verificar si se registró correctamente
        const testDoc = new jsPDF();
        // @ts-ignore
        if (typeof (testDoc as any).autoTable === 'function') {
          autoTablePlugin = true;
          resolve();
          return;
        }
      } catch (e) {
        console.log('Dynamic import failed:', e);
      }

      // Método 2: Verificar si ya está disponible
      const testDoc = new jsPDF();
      // @ts-ignore
      if (typeof (testDoc as any).autoTable === 'function') {
        autoTablePlugin = true;
        resolve();
        return;
      }

      // Si llegamos aquí, el plugin no se cargó
      throw new Error('jspdf-autotable plugin could not be loaded');
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
    // Intentar cargar el plugin una vez más
    if (typeof window !== 'undefined') {
      try {
        // @ts-ignore
        require('jspdf-autotable');
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
