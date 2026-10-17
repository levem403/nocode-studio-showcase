/**
 * @file createEditor.js
 * @description Inicialização e controle de instâncias do CodeMirror.
 * Responsável por injetar editores com syntax highlighting (Python/SQL) no DOM.
 */
export async function createCodeEditor({ parent, value = '', mode = 'python', onChange }) {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  parent.appendChild(textarea);

  const editor = CodeMirror.fromTextArea(textarea, {
    mode: mode,
    lineNumbers: true,
    theme: 'default',
  });

  editor.on('change', () => {
    if (onChange) {
      onChange(editor.getValue());
    }
  });

  return editor;
}