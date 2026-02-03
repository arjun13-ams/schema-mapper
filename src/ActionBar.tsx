import React from 'react';
import { FileType } from './types';

interface Props {
  inputType: FileType | null;
  outputType: FileType | null;
  onInputTypeChange: (type: FileType) => void;
  onOutputTypeChange: (type: FileType) => void;
  onInputFileUpload: (file: File) => void;
  onOutputFileUpload: (file: File) => void;
  onGeneratePython: () => void;
  onGenerateXSLT: () => void;
  canGeneratePython: boolean;
  canGenerateXSLT: boolean;
  fileInputKey: number;
  copyInputStructure: boolean;
  onCopyInputStructureChange: (checked: boolean) => void;
}

export default function ActionBar({
  inputType, outputType, onInputTypeChange, onOutputTypeChange,
  onInputFileUpload, onOutputFileUpload, onGeneratePython, onGenerateXSLT,
  canGeneratePython, canGenerateXSLT, fileInputKey, copyInputStructure, onCopyInputStructureChange
}: Props) {
  const showCopyCheckbox = inputType === 'xml' && outputType === 'xml';
  
  const selectStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #d2d2d7',
    background: '#ffffff',
    fontSize: '14px',
    color: '#1d1d1f',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '120px'
  };

  const fileInputStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #d2d2d7',
    background: '#ffffff',
    fontSize: '14px',
    color: '#1d1d1f',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const buttonStyle = (enabled: boolean) => ({
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: enabled ? '#007aff' : '#f2f2f7',
    color: enabled ? '#ffffff' : '#8e8e93',
    fontSize: '14px',
    fontWeight: '500',
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s ease',
    minWidth: '140px'
  });
  
  return (
    <div style={{ 
      padding: '16px 24px', 
      background: '#ffffff',
      borderBottom: '1px solid #e5e5e7', 
      display: 'flex', 
      gap: '16px', 
      alignItems: 'center',
      flexWrap: 'wrap'
    }}>
      <select 
        value={inputType || ''} 
        onChange={e => onInputTypeChange(e.target.value as FileType)}
        style={selectStyle}
        onMouseOver={(e) => {
          if (!inputType) e.currentTarget.style.borderColor = '#007aff';
        }}
        onMouseOut={(e) => {
          if (!inputType) e.currentTarget.style.borderColor = '#d2d2d7';
        }}
      >
        <option value="">Input Type</option>
        <option value="xml">XML</option>
        <option value="json">JSON</option>
      </select>
      
      <input 
        key={`input-${fileInputKey}`} 
        type="file" 
        onChange={e => e.target.files?.[0] && onInputFileUpload(e.target.files[0])}
        style={fileInputStyle}
      />
      
      <select 
        value={outputType || ''} 
        onChange={e => onOutputTypeChange(e.target.value as FileType)}
        style={selectStyle}
        onMouseOver={(e) => {
          if (!outputType) e.currentTarget.style.borderColor = '#007aff';
        }}
        onMouseOut={(e) => {
          if (!outputType) e.currentTarget.style.borderColor = '#d2d2d7';
        }}
      >
        <option value="">Output Type</option>
        <option value="xml">XML</option>
        <option value="json">JSON</option>
      </select>
      
      <input 
        key={`output-${fileInputKey}`} 
        type="file" 
        onChange={e => e.target.files?.[0] && onOutputFileUpload(e.target.files[0])}
        style={fileInputStyle}
      />
      
      {showCopyCheckbox && (
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontSize: '14px',
          color: '#1d1d1f',
          cursor: 'pointer'
        }}>
          <input 
            type="checkbox" 
            checked={copyInputStructure} 
            onChange={e => onCopyInputStructureChange(e.target.checked)}
            style={{
              width: '16px',
              height: '16px',
              accentColor: '#007aff'
            }}
          />
          Copy input structure
        </label>
      )}
      
      <button 
        onClick={onGeneratePython} 
        disabled={!canGeneratePython}
        style={buttonStyle(canGeneratePython)}
        onMouseOver={(e) => {
          if (canGeneratePython) {
            e.currentTarget.style.background = '#0056cc';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseOut={(e) => {
          if (canGeneratePython) {
            e.currentTarget.style.background = '#007aff';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        Generate Python
      </button>
      
      <button 
        onClick={onGenerateXSLT} 
        disabled={!canGenerateXSLT}
        style={buttonStyle(canGenerateXSLT)}
        onMouseOver={(e) => {
          if (canGenerateXSLT) {
            e.currentTarget.style.background = '#0056cc';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseOut={(e) => {
          if (canGenerateXSLT) {
            e.currentTarget.style.background = '#007aff';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        Generate XSLT
      </button>
    </div>
  );
}
