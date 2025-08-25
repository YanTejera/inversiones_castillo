import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Undo, Redo, Type } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  height = 400,
  placeholder = "Escriba el contenido del documento aquí..."
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState({
    bold: false,
    italic: false,
    underline: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false
  });

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateActiveStates();
    handleContentChange();
  };

  const updateActiveStates = () => {
    setIsActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      alignLeft: document.queryCommandState('justifyLeft'),
      alignCenter: document.queryCommandState('justifyCenter'),
      alignRight: document.queryCommandState('justifyRight'),
      alignJustify: document.queryCommandState('justifyFull')
    });
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleInput = () => {
    handleContentChange();
    updateActiveStates();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Atajo de teclado para deshacer/rehacer
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      execCommand('undo');
    } else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      execCommand('redo');
    }
  };

  const insertHeading = (level: number) => {
    execCommand('formatBlock', `<h${level}>`);
  };

  const ToolbarButton: React.FC<{
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }> = ({ onClick, active = false, children, title }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded border ${
        active 
          ? 'bg-blue-600 text-white border-blue-600' 
          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="rich-text-editor border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2">
        <div className="flex flex-wrap gap-1">
          {/* Deshacer/Rehacer */}
          <ToolbarButton onClick={() => execCommand('undo')} title="Deshacer">
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('redo')} title="Rehacer">
            <Redo className="h-4 w-4" />
          </ToolbarButton>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Títulos */}
          <select 
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'p') execCommand('formatBlock', '<p>');
              else insertHeading(parseInt(value));
            }}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="p">Párrafo</option>
            <option value="1">Título 1</option>
            <option value="2">Título 2</option>
            <option value="3">Título 3</option>
          </select>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Formato de texto */}
          <ToolbarButton 
            onClick={() => execCommand('bold')} 
            active={isActive.bold}
            title="Negrita"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => execCommand('italic')} 
            active={isActive.italic}
            title="Cursiva"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => execCommand('underline')} 
            active={isActive.underline}
            title="Subrayado"
          >
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Alineación */}
          <ToolbarButton 
            onClick={() => execCommand('justifyLeft')} 
            active={isActive.alignLeft}
            title="Alinear a la izquierda"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => execCommand('justifyCenter')} 
            active={isActive.alignCenter}
            title="Centrar"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => execCommand('justifyRight')} 
            active={isActive.alignRight}
            title="Alinear a la derecha"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => execCommand('justifyFull')} 
            active={isActive.alignJustify}
            title="Justificar"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Listas */}
          <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Lista con viñetas">
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Lista numerada">
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Formato especial */}
          <button
            onClick={() => {
              const selection = window.getSelection();
              if (selection && selection.toString()) {
                execCommand('createLink', prompt('Ingrese la URL:') || '');
              } else {
                alert('Seleccione texto para crear un enlace');
              }
            }}
            className="px-2 py-1 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
            title="Insertar enlace"
          >
            Enlace
          </button>
          
          <button
            onClick={() => {
              const html = prompt('Ingrese línea de firma personalizada:') || '______________________________';
              execCommand('insertHTML', `<div style="text-align: center; margin: 20px 0;"><div style="border-top: 1px solid #333; width: 200px; margin: 0 auto; padding-top: 5px;">${html}</div></div>`);
            }}
            className="px-2 py-1 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
            title="Insertar línea de firma"
          >
            Firma
          </button>
        </div>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={updateActiveStates}
        onKeyUp={updateActiveStates}
        style={{ height: height, minHeight: height }}
        className="p-4 outline-none overflow-y-auto document-content"
        data-placeholder={placeholder}
      />
      
      {/* CSS para el placeholder */}
      <style>{`
        .rich-text-editor [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        .rich-text-editor .document-content {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #333;
        }
        
        .rich-text-editor .document-content h1 {
          font-size: 18pt;
          font-weight: bold;
          text-align: center;
          margin: 1.5em 0 1em 0;
          color: #2c3e50;
          border-bottom: 2px solid #2c3e50;
          padding-bottom: 10px;
        }
        
        .rich-text-editor .document-content h2 {
          font-size: 16pt;
          font-weight: bold;
          margin: 1.5em 0 1em 0;
          color: #2c3e50;
        }
        
        .rich-text-editor .document-content h3 {
          font-size: 14pt;
          font-weight: bold;
          margin: 1.2em 0 0.8em 0;
          color: #2c3e50;
        }
        
        .rich-text-editor .document-content p {
          margin: 1em 0;
          text-align: justify;
        }
        
        .rich-text-editor .document-content ul,
        .rich-text-editor .document-content ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        
        .rich-text-editor .document-content li {
          margin: 0.5em 0;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;