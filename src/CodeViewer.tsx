import React from 'react';
import Editor from '@monaco-editor/react';

interface Props {
  code: string;
  language: string;
}

export default function CodeViewer({ code, language }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0 }}>Generated Code</h3>
        <div>
          <button onClick={() => navigator.clipboard.writeText(code)}>Copy</button>
          <button onClick={() => {
            const blob = new Blob([code], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transform.${language === 'python' ? 'py' : 'xsl'}`;
            a.click();
          }}>Download</button>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <Editor
          height="100%"
          language={language}
          value={code}
          options={{ readOnly: true, minimap: { enabled: false } }}
        />
      </div>
    </div>
  );
}
