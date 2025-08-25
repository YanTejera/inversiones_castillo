import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import TurndownService from 'turndown';

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Configurar TurndownService para conversión HTML a Markdown
const turndownService = new TurndownService({
  headingStyle: 'atx', // Usar # para títulos
  bulletListMarker: '-', // Usar - para listas
  codeBlockStyle: 'fenced', // Usar ``` para bloques de código
  emDelimiter: '*', // Usar * para cursiva
  strongDelimiter: '**', // Usar ** para negrita
  linkStyle: 'inlined', // Links inline
  linkReferenceStyle: 'full',
  converters: []
});

// Personalizar reglas de conversión
turndownService.addRule('lineBreaks', {
  filter: ['br'],
  replacement: () => '\n'
});

turndownService.addRule('paragraphs', {
  filter: 'p',
  replacement: (content) => `\n\n${content}\n\n`
});

turndownService.addRule('preserveSpacing', {
  filter: (node) => {
    return node.nodeType === 3 && /^\s+$/.test(node.nodeValue || '');
  },
  replacement: (content, node) => {
    return node.nodeValue?.includes('\n') ? '\n' : ' ';
  }
});

export interface ImportResult {
  content: string;
  success: boolean;
  error?: string;
}

export class FileImportService {
  /**
   * Extrae texto de un archivo PDF preservando estructura
   */
  static async extractTextFromPDF(file: File): Promise<ImportResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      // Extraer texto de todas las páginas
      for (let i = 1; i <= pdf.numPages; i++) {
        if (i > 1) {
          fullText += '\n\n---\n\n'; // Separador de páginas
        }
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Procesar elementos de texto preservando estructura
        let pageText = '';
        let lastY = 0;
        let currentLine = '';
        
        for (const item of textContent.items as any[]) {
          const currentY = item.transform[5];
          const text = item.str;
          
          // Detectar salto de línea por cambio de posición vertical
          if (lastY !== 0 && Math.abs(currentY - lastY) > 5) {
            if (currentLine.trim()) {
              pageText += this.formatTextLine(currentLine.trim()) + '\n';
            }
            currentLine = text;
          } else {
            currentLine += (currentLine && text ? ' ' : '') + text;
          }
          
          lastY = currentY;
        }
        
        // Agregar la última línea
        if (currentLine.trim()) {
          pageText += this.formatTextLine(currentLine.trim());
        }
        
        fullText += pageText;
      }

      const formattedContent = this.formatPlainTextAsMarkdown(fullText);

      return {
        content: formattedContent,
        success: true
      };
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return {
        content: '',
        success: false,
        error: `Error al procesar el archivo PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Extrae texto de un archivo DOCX preservando formato como HTML
   */
  static async extractTextFromDOCX(file: File): Promise<ImportResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Configurar opciones avanzadas de mammoth para mejor preservación de formato
      const options = {
        arrayBuffer,
        styleMap: [
          // Mapear estilos de Word a HTML/CSS
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh", 
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Title'] => h1.title:fresh",
          "p[style-name='Subtitle'] => h2.subtitle:fresh",
          "r[style-name='Strong'] => strong",
          "r[style-name='Emphasis'] => em",
          "p[style-name='List Paragraph'] => li:fresh",
          "p[style-name='Quote'] => blockquote > p:fresh",
          // Estilos en español
          "p[style-name='Título 1'] => h1:fresh",
          "p[style-name='Título 2'] => h2:fresh", 
          "p[style-name='Título 3'] => h3:fresh",
          "p[style-name='Párrafo de lista'] => li:fresh",
          "p[style-name='Cita'] => blockquote > p:fresh"
        ],
        includeDefaultStyleMap: true,
        includeEmbeddedStyleMap: true
      };
      
      // Extraer HTML con formato preservado
      const htmlResult = await mammoth.convertToHtml(options);
      
      if (htmlResult.value) {
        // Limpiar y mejorar el HTML generado
        const cleanedHtml = this.cleanAndEnhanceHTML(htmlResult.value);
        
        // Mostrar warnings si existen
        if (htmlResult.messages && htmlResult.messages.length > 0) {
          console.warn('DOCX conversion warnings:', htmlResult.messages);
        }
        
        return {
          content: cleanedHtml,
          success: true
        };
      }
      
      // Fallback a texto plano si HTML falla
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      const htmlFromText = this.convertPlainTextToHTML(textResult.value);
      
      return {
        content: htmlFromText,
        success: true
      };
    } catch (error) {
      console.error('Error extracting text from DOCX:', error);
      return {
        content: '',
        success: false,
        error: `Error al procesar el archivo DOCX: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Extrae texto de archivos HTML preservando formato
   */
  static extractTextFromHTML(htmlContent: string): ImportResult {
    try {
      // Limpiar y mejorar el HTML
      const cleanedHtml = this.cleanAndEnhanceHTML(htmlContent);
      
      return {
        content: cleanedHtml,
        success: true
      };
    } catch (error) {
      console.error('Error extracting text from HTML:', error);
      
      // Fallback a extracción de texto plano
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const textContent = doc.body?.textContent || doc.textContent || '';
        const htmlFromText = this.convertPlainTextToHTML(textContent);
        
        return {
          content: htmlFromText,
          success: true
        };
      } catch (fallbackError) {
        return {
          content: '',
          success: false,
          error: `Error al procesar el archivo HTML: ${error instanceof Error ? error.message : 'Error desconocido'}`
        };
      }
    }
  }

  /**
   * Limpia texto RTF básico removiendo códigos de control
   */
  static cleanRTFText(rtfContent: string): ImportResult {
    try {
      // Remover códigos de control RTF básicos
      let cleanText = rtfContent
        .replace(/\{\*?\\[^{}]+}?/g, '') // Remover códigos de control
        .replace(/\\[a-z]+\d*\s?/g, '') // Remover comandos RTF
        .replace(/[{}]/g, '') // Remover llaves
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();

      return {
        content: cleanText,
        success: true
      };
    } catch (error) {
      console.error('Error cleaning RTF text:', error);
      return {
        content: '',
        success: false,
        error: `Error al procesar el archivo RTF: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Función principal para extraer texto de cualquier archivo soportado
   */
  static async extractTextFromFile(file: File): Promise<ImportResult> {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    try {
      // PDF
      if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
        return await this.extractTextFromPDF(file);
      }

      // DOCX
      if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await this.extractTextFromDOCX(file);
      }

      // HTML
      if (fileName.endsWith('.html') || fileName.endsWith('.htm') || fileType.startsWith('text/html')) {
        const text = await this.readTextFile(file);
        return this.extractTextFromHTML(text);
      }

      // RTF
      if (fileName.endsWith('.rtf') || fileType === 'application/rtf') {
        const text = await this.readTextFile(file);
        return this.cleanRTFText(text);
      }

      // Archivos de texto plano
      if (fileType.startsWith('text/') || 
          fileName.endsWith('.txt') || 
          fileName.endsWith('.md') ||
          fileName.endsWith('.csv') ||
          fileName.endsWith('.json') ||
          fileName.endsWith('.xml')) {
        const content = await this.readTextFile(file);
        
        // Si ya es Markdown, convertir a HTML
        if (fileName.endsWith('.md')) {
          const cleanedMarkdown = this.cleanAndFormatMarkdown(content);
          // Para documentos markdown, podríamos convertir a HTML si queremos
          // Por ahora mantenemos markdown para compatibilidad
          return {
            content: cleanedMarkdown,
            success: true
          };
        }
        
        // Para otros archivos de texto, convertir a HTML
        const htmlContent = this.convertPlainTextToHTML(content);
        return {
          content: htmlContent,
          success: true
        };
      }

      // Formato no soportado
      return {
        content: '',
        success: false,
        error: `Formato de archivo no soportado: ${file.name}\n\nFormatos soportados:\n• Documentos: PDF, DOCX, RTF\n• Texto: TXT, MD, HTML, CSV, JSON, XML`
      };

    } catch (error) {
      console.error('Error processing file:', error);
      return {
        content: '',
        success: false,
        error: `Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Formatea una línea de texto detectando patrones especiales
   */
  private static formatTextLine(line: string): string {
    // Detectar títulos por mayúsculas o palabras clave
    if (line.toUpperCase() === line && line.length > 5 && line.length < 100) {
      return `## ${line}`;
    }
    
    // Detectar listas por bullets o números
    if (/^[\s]*[\u2022\u2023\u25E6\u2043\u2219]/.test(line)) {
      return `- ${line.replace(/^[\s]*[\u2022\u2023\u25E6\u2043\u2219]\s*/, '')}`;
    }
    
    if (/^[\s]*\d+[\.)\s]/.test(line)) {
      return line.replace(/^[\s]*\d+[\.)\s]*/, '1. ');
    }
    
    return line;
  }
  
  /**
   * Formatea texto plano como Markdown
   */
  private static formatPlainTextAsMarkdown(text: string): string {
    if (!text) return '';
    
    // Dividir en líneas y procesar
    const lines = text.split('\n');
    const formattedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        formattedLines.push('');
        continue;
      }
      
      // Detectar patrones y formatear
      const formatted = this.formatTextLine(line);
      formattedLines.push(formatted);
    }
    
    // Limpiar múltiples líneas vacías
    return formattedLines
      .join('\n')
      .replace(/\n\n\n+/g, '\n\n')
      .trim();
  }
  
  /**
   * Limpia y mejora HTML generado para mejor visualización
   */
  private static cleanAndEnhanceHTML(html: string): string {
    if (!html) return '';
    
    let cleanedHtml = html
      // Limpiar espacios extra entre tags
      .replace(/>\s+</g, '><')
      // Preservar espacios dentro del contenido
      .replace(/\s+/g, ' ')
      // Limpiar múltiples <br> consecutivos
      .replace(/(<br\s*\/?>){3,}/g, '<br><br>')
      // Convertir párrafos vacíos a espacios
      .replace(/<p>\s*<\/p>/g, '<br>')
      // Asegurar que los títulos tengan espacios apropiados
      .replace(/(<\/h[1-6]>)(?!<)/g, '$1<br>')
      // Mejorar listas
      .replace(/(<\/li>)(?!<\/)/g, '$1')
      // Limpiar espacios al inicio y final
      .trim();

    // Envolver en div con clase para estilos específicos
    cleanedHtml = `<div class="document-content">${cleanedHtml}</div>`;
    
    return cleanedHtml;
  }

  /**
   * Convierte texto plano a HTML con formato básico
   */
  private static convertPlainTextToHTML(text: string): string {
    if (!text) return '';
    
    const lines = text.split('\n');
    const htmlLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        htmlLines.push('<br>');
        continue;
      }
      
      // Detectar títulos (líneas en mayúsculas o con formato especial)
      if (this.isTitle(line)) {
        htmlLines.push(`<h2>${line}</h2>`);
      }
      // Detectar listas
      else if (this.isList(line)) {
        const listContent = line.replace(/^[\s]*[•\-*]\s*/, '');
        htmlLines.push(`<li>${listContent}</li>`);
      }
      // Párrafo normal
      else {
        htmlLines.push(`<p>${line}</p>`);
      }
    }
    
    // Envolver listas en <ul>
    let result = htmlLines.join('');
    result = result.replace(/(<li>.*<\/li>)+/g, (match) => `<ul>${match}</ul>`);
    
    return `<div class="document-content">${result}</div>`;
  }

  /**
   * Detecta si una línea es un título
   */
  private static isTitle(line: string): boolean {
    // Título si está en mayúsculas y tiene longitud apropiada
    return line.toUpperCase() === line && 
           line.length > 5 && 
           line.length < 100 && 
           /^[A-ZÁÉÍÓÚ\s\d\-_:]+$/.test(line);
  }

  /**
   * Detecta si una línea es parte de una lista
   */
  private static isList(line: string): boolean {
    return /^[\s]*[•\-*]\s/.test(line) || /^[\s]*\d+[.)]\s/.test(line);
  }

  /**
   * Limpia y formatea Markdown generado
   */
  private static cleanAndFormatMarkdown(markdown: string): string {
    if (!markdown) return '';
    
    return markdown
      // Limpiar espacios extra
      .replace(/[ \t]+/g, ' ')
      // Limpiar múltiples saltos de línea
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      // Arreglar listas
      .replace(/^[\s]*[-*+]\s*$/gm, '')
      // Arreglar títulos
      .replace(/^#+\s*$/gm, '')
      // Limpiar espacios al inicio y final
      .trim();
  }
  
  /**
   * Función auxiliar para leer archivos de texto
   */
  private static readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Obtiene información sobre los formatos soportados
   */
  static getSupportedFormats(): { [key: string]: string[] } {
    return {
      'Documentos': ['PDF', 'DOCX', 'RTF'],
      'Texto': ['TXT', 'MD', 'HTML', 'CSV', 'JSON', 'XML'],
    };
  }

  /**
   * Verifica si un archivo es soportado
   */
  static isFileSupported(file: File): boolean {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    const supportedExtensions = ['.pdf', '.docx', '.rtf', '.html', '.htm', '.txt', '.md', '.csv', '.json', '.xml'];
    const supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/rtf'];

    return supportedExtensions.some(ext => fileName.endsWith(ext)) || 
           supportedTypes.some(type => fileType === type) ||
           fileType.startsWith('text/');
  }
}