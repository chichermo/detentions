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
      const autotableModule = await import('jspdf-autotable');
      
      // Guardar referencia global si es posible
      if (typeof window !== 'undefined') {
        // @ts-ignore
        (window as any).__jspdf_autotable__ = autotableModule;
      }
      
      // Esperar múltiples veces para asegurar que el prototipo se extienda
      for (let i = 0; i < 10; i++) {
        await new Promise(res => setTimeout(res, 300));
        
        const testDoc = new jsPDF();
        // @ts-ignore
        if (typeof (testDoc as any).autoTable === 'function') {
          autoTablePlugin = true;
          resolve();
          return;
        }
        
        // También verificar en el prototipo
        // @ts-ignore
        if (typeof jsPDF.prototype.autoTable === 'function') {
          autoTablePlugin = true;
          resolve();
          return;
        }
      }

      // Si después de todos los intentos no está disponible, marcar como cargado de todos modos
      // La función autoTable intentará múltiples estrategias en tiempo de ejecución
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
  // Intentar múltiples formas de acceder a autoTable
  // @ts-ignore
  if (typeof (doc as any).autoTable === 'function') {
    // @ts-ignore
    return (doc as any).autoTable(options);
  }
  
  // Intentar acceder a través del constructor
  // @ts-ignore
  if (typeof jsPDF.prototype.autoTable === 'function') {
    // @ts-ignore
    return jsPDF.prototype.autoTable.call(doc, options);
  }
  
  // Intentar acceder directamente al método interno
  // @ts-ignore
  if (typeof jsPDF.API !== 'undefined' && typeof jsPDF.API.autoTable === 'function') {
    // @ts-ignore
    return jsPDF.API.autoTable(doc, options);
  }
  
  // Intentar acceder desde window si está disponible
  if (typeof window !== 'undefined') {
    // @ts-ignore
    const jspdf = (window as any).jspdf || (window as any).jsPDF;
    if (jspdf && typeof jspdf.prototype?.autoTable === 'function') {
      // @ts-ignore
      return jspdf.prototype.autoTable.call(doc, options);
    }
    
    // Intentar acceder directamente desde el módulo importado
    try {
      // @ts-ignore
      const autotableModule = (window as any).__jspdf_autotable__;
      if (autotableModule && typeof autotableModule === 'function') {
        return autotableModule(doc, options);
      }
    } catch (e) {
      // Ignorar error
    }
  }
  
  // Si nada funciona, crear un nuevo documento y verificar de nuevo
  const testDoc = new jsPDF();
  // @ts-ignore
  if (typeof (testDoc as any).autoTable === 'function') {
    // @ts-ignore
    return (testDoc as any).autoTable(options);
  }
  
  throw new Error('jspdf-autotable no está disponible. Por favor, recarga la página e intenta de nuevo.');
}
