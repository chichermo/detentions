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
  
  // No verificar aquí - dejar que autoTable() maneje la verificación
  // Esto permite que funcione incluso si el prototipo no se ha extendido completamente
  
  return doc;
}

export function autoTable(doc: jsPDF, options: any) {
  // Función helper para intentar ejecutar autoTable
  const tryAutoTable = (target: any): any => {
    // @ts-ignore
    if (typeof target?.autoTable === 'function') {
      // @ts-ignore
      return target.autoTable(options);
    }
    return null;
  };

  // Intentar múltiples formas de acceder a autoTable
  let result = tryAutoTable(doc);
  if (result !== null) return result;
  
  // Intentar acceder a través del prototipo
  // @ts-ignore
  result = tryAutoTable(jsPDF.prototype);
  if (result !== null) return result;
  
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
    if (jspdf) {
      result = tryAutoTable(jspdf.prototype);
      if (result !== null) return result;
    }
    
    // Intentar acceder directamente desde el módulo importado
    try {
      // @ts-ignore
      const autotableModule = (window as any).__jspdf_autotable__;
      if (autotableModule) {
        // El módulo puede ser un objeto con un método default o puede ser la función directamente
        if (typeof autotableModule === 'function') {
          return autotableModule(doc, options);
        }
        // @ts-ignore
        if (autotableModule.default && typeof autotableModule.default === 'function') {
          // @ts-ignore
          return autotableModule.default(doc, options);
        }
      }
    } catch (e) {
      // Ignorar error
    }
  }
  
  // Último intento: forzar la carga y esperar
  if (typeof window !== 'undefined') {
    return new Promise((resolve, reject) => {
      import('jspdf-autotable')
        .then((module) => {
          // Guardar referencia
          // @ts-ignore
          (window as any).__jspdf_autotable__ = module;
          
          // Esperar un momento para que se registre
          setTimeout(() => {
            // Intentar de nuevo con todas las estrategias
            let finalResult = tryAutoTable(doc);
            if (finalResult !== null) {
              resolve(finalResult);
              return;
            }
            
            // @ts-ignore
            finalResult = tryAutoTable(jsPDF.prototype);
            if (finalResult !== null) {
              resolve(finalResult);
              return;
            }
            
            // Si el módulo tiene un método default
            // @ts-ignore
            if (module.default && typeof module.default === 'function') {
              // @ts-ignore
              resolve(module.default(doc, options));
              return;
            }
            
            reject(new Error('jspdf-autotable no está disponible después de cargar. Por favor, recarga la página.'));
          }, 1000);
        })
        .catch(reject);
    });
  }
  
  throw new Error('jspdf-autotable no está disponible. Por favor, recarga la página e intenta de nuevo.');
}
