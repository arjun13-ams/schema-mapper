import React from 'react';
import { MappingRule } from './types';

interface Props {
  mappings: MappingRule[];
  onDeleteMapping: (id: string) => void;
}

export default function MappingPanel({ mappings, onDeleteMapping }: Props) {
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex',
      flexDirection: 'column',
      background: '#fafafa',
      borderRight: '1px solid #e5e5e7'
    }}>
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid #e5e5e7',
        background: '#ffffff'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '17px',
          fontWeight: '600',
          color: '#1d1d1f',
          letterSpacing: '-0.022em'
        }}>Mappings</h3>
      </div>
      
      <div style={{ 
        flex: 1,
        overflow: 'auto',
        padding: '16px 0'
      }}>
        {mappings.length === 0 ? (
          <div style={{
            padding: '40px 24px',
            textAlign: 'center',
            color: '#86868b',
            fontSize: '15px'
          }}>
            No mappings yet. Click output fields to map.
          </div>
        ) : (
          <div style={{
            overflowX: 'auto',
            overflowY: 'visible',
            minHeight: 'min-content'
          }}>
            <table style={{ 
              width: '100%',
              minWidth: '600px',
              borderCollapse: 'separate',
              borderSpacing: 0
            }}>
              <thead>
                <tr>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '12px 24px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6e6e73',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: '#f5f5f7',
                    borderBottom: '1px solid #e5e5e7',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>Output</th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '12px 24px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6e6e73',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: '#f5f5f7',
                    borderBottom: '1px solid #e5e5e7',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>Source</th>
                  <th style={{ 
                    textAlign: 'center', 
                    padding: '12px 24px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6e6e73',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: '#f5f5f7',
                    borderBottom: '1px solid #e5e5e7',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    width: '80px'
                  }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m, index) => (
                  <tr key={m.id} style={{
                    background: index % 2 === 0 ? '#ffffff' : '#fafafa',
                    transition: 'background-color 0.2s ease'
                  }}>
                    <td style={{ 
                      padding: '16px 24px',
                      fontSize: '14px',
                      color: '#1d1d1f',
                      borderBottom: '1px solid #f0f0f0',
                      maxWidth: '250px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }} title={m.outputPath}>
                      {m.outputPath}
                    </td>
                    <td style={{ 
                      padding: '16px 24px',
                      fontSize: '14px',
                      color: m.ruleType === 'constant' ? '#007aff' : '#1d1d1f',
                      borderBottom: '1px solid #f0f0f0',
                      maxWidth: '250px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: m.ruleType === 'constant' ? 'SF Mono, Monaco, monospace' : 'inherit'
                    }} title={m.ruleType === 'constant' ? `"${m.constantValue}"` : m.sourcePath}>
                      {m.ruleType === 'constant' ? `"${m.constantValue}"` : m.sourcePath}
                    </td>
                    <td style={{ 
                      padding: '16px 24px',
                      borderBottom: '1px solid #f0f0f0',
                      textAlign: 'center'
                    }}>
                      <button 
                        onClick={() => onDeleteMapping(m.id)}
                        style={{
                          background: '#ff3b30',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minWidth: '60px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#d70015';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = '#ff3b30';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
