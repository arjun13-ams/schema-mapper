import React, { useState } from 'react';
import { TreeNode } from './types';

interface Props {
  nodes: TreeNode[];
  title: string;
  onNodeClick?: (node: TreeNode) => void;
  selectedNode?: TreeNode | null;
}

export default function SchemaTree({ nodes, title, onNodeClick, selectedNode }: Props) {
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
        }}>{title}</h3>
      </div>
      
      <div style={{ 
        flex: 1,
        overflow: 'auto',
        padding: '16px 0'
      }}>
        {nodes.length === 0 ? (
          <div style={{
            padding: '40px 24px',
            textAlign: 'center',
            color: '#86868b',
            fontSize: '15px'
          }}>
            No schema loaded
          </div>
        ) : (
          nodes.map(node => 
            <TreeNodeItem 
              key={node.path} 
              node={node} 
              onNodeClick={onNodeClick} 
              selectedNode={selectedNode} 
            />
          )
        )}
      </div>
    </div>
  );
}

function TreeNodeItem({ node, onNodeClick, selectedNode }: { node: TreeNode; onNodeClick?: (node: TreeNode) => void; selectedNode?: TreeNode | null }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNode?.path === node.path;
  const isArray = node.type === 'array';

  return (
    <div style={{ marginLeft: '16px' }}>
      <div 
        style={{ 
          cursor: 'pointer', 
          padding: '8px 16px',
          margin: '2px 8px',
          borderRadius: '6px',
          background: isSelected ? '#007aff' : 'transparent',
          color: isSelected ? '#ffffff' : '#1d1d1f',
          fontWeight: isSelected ? '500' : '400',
          fontSize: '14px',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onNodeClick?.(node);
        }}
        onMouseOver={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = '#f0f0f0';
          }
        }}
        onMouseOut={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {hasChildren && (
          <span style={{ 
            fontSize: '12px',
            color: isSelected ? '#ffffff' : '#86868b',
            transition: 'transform 0.2s ease',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)'
          }}>
            ▼
          </span>
        )}
        <span style={{ flex: 1 }}>
          {node.name}{isArray ? '[]' : ''}
        </span>
        <span style={{ 
          fontSize: '12px',
          color: isSelected ? 'rgba(255,255,255,0.7)' : '#86868b',
          fontFamily: 'SF Mono, Monaco, monospace'
        }}>
          ({node.type})
        </span>
      </div>
      {expanded && hasChildren && (
        <div style={{ marginLeft: '8px' }}>
          {node.children!.map(child => 
            <TreeNodeItem 
              key={child.path} 
              node={child} 
              onNodeClick={onNodeClick} 
              selectedNode={selectedNode} 
            />
          )}
        </div>
      )}
    </div>
  );
}
