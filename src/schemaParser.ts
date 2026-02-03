import { XMLParser } from 'fast-xml-parser';
import { TreeNode } from './types';

export function parseXML(xmlString: string): TreeNode[] {
  const parser = new XMLParser({ 
    ignoreAttributes: false, 
    attributeNamePrefix: '@_',
    preserveOrder: false,
    parseTagValue: true
  });
  const result = parser.parse(xmlString);
  return buildTree(result, '', null);
}

export function parseJSON(jsonString: string): TreeNode[] {
  const obj = JSON.parse(jsonString);
  return buildTree(obj, '', null);
}

function buildTree(obj: any, parentPath: string, parentKey: string | null): TreeNode[] {
  const nodes: TreeNode[] = [];
  
  for (const key in obj) {
    const value = obj[key];
    
    const path = parentPath ? `${parentPath}.${key}` : key;
    
    // Handle arrays - just show the array container, not individual items
    if (Array.isArray(value)) {
      // Get first item to show structure
      const firstItem = value[0];
      
      const arrayNode: TreeNode = {
        name: key,
        path,
        type: 'array',
        children: firstItem && typeof firstItem === 'object' ? buildTree(firstItem, path, key) : []
      };
      
      nodes.push(arrayNode);
    } else if (typeof value === 'object' && value !== null) {
      // Regular object - check if it has attributes
      const node: TreeNode = {
        name: key,
        path,
        type: 'object',
        children: buildTree(value, path, key)
      };
      nodes.push(node);
    } else {
      // Primitive value
      const node: TreeNode = {
        name: key,
        path,
        type: getType(value),
      };
      nodes.push(node);
    }
  }

  return nodes;
}

function getType(value: any): TreeNode['type'] {
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object' && value !== null) return 'object';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'string';
}
