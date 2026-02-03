import { MappingRule } from './types';

export function generateXSLT(mappings: MappingRule[], notes: string, copyInputStructure: boolean): string {
  const notesComment = notes ? `<!-- Mapping Notes:\n${notes}\n-->\n\n` : '';
  
  if (copyInputStructure) {
    // Generate identity transform with overrides
    return generateIdentityTransformXSLT(mappings, notesComment);
  } else {
    // Generate structure-only XSLT (current behavior)
    const xmlStructure = buildXMLStructure(mappings);
    const templates = generateTemplates(xmlStructure, '');
    
    return `${notesComment}<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:ns="http://schema.infor.com/InforOAGIS/2"
  exclude-result-prefixes="ns">
  <xsl:output method="xml" indent="yes"/>
  
  <xsl:template match="/">
${templates}
  </xsl:template>
</xsl:stylesheet>`;
  }
}

function generateIdentityTransformXSLT(mappings: MappingRule[], notesComment: string): string {
  // Group mappings by grandparent to add multiple parent elements
  const grandparentGroups = new Map<string, MappingRule[]>();
  
  mappings.forEach(m => {
    const pathParts = splitPathPreservingPredicates(m.outputPath);
    // Get grandparent (2 levels up)
    const grandparentPath = pathParts.slice(0, -2).join('.');
    if (!grandparentGroups.has(grandparentPath)) {
      grandparentGroups.set(grandparentPath, []);
    }
    grandparentGroups.get(grandparentPath)!.push(m);
  });
  
  const overrides = Array.from(grandparentGroups.entries()).map(([grandparentPath, rules]) => {
    const grandparentParts = splitPathPreservingPredicates(grandparentPath);
    const matchPath = grandparentParts.map(p => {
      const elementName = p.includes('[') ? p.substring(0, p.indexOf('[')) : p;
      return `ns:${elementName}`;
    }).join('/');
    
    const children = rules.map(m => {
      const pathParts = splitPathPreservingPredicates(m.outputPath);
      const parentElement = pathParts[pathParts.length - 2];
      const childElement = pathParts[pathParts.length - 1];
      
      const parentElementName = parentElement.includes('[') ? parentElement.substring(0, parentElement.indexOf('[')) : parentElement;
      const childElementName = childElement.includes('[') ? childElement.substring(0, childElement.indexOf('[')) : childElement;
      const predicate = childElement.includes('[') ? childElement.substring(childElement.indexOf('[')) : '';
      const attrString = predicate ? ' ' + convertPredicateToAttribute(predicate) : '';
      
      const xpath = m.ruleType === 'constant' ? '' : convertToXPath(m.sourcePath!);
      const value = m.ruleType === 'constant' ? m.constantValue : `<xsl:value-of select="${xpath}"/>`;
      
      return `      <xsl:element name="${parentElementName}" namespace="http://schema.infor.com/InforOAGIS/2">
        <xsl:element name="${childElementName}" namespace="http://schema.infor.com/InforOAGIS/2">
          ${attrString ? `<xsl:attribute name="${predicate.match(/@(\w+)=/)?.[1]}">${predicate.match(/='([^']+)'/)?.[1]}</xsl:attribute>` : ''}
          ${value}
        </xsl:element>
      </xsl:element>`;
    }).join('\n');
    
    const grandparentElement = grandparentParts[grandparentParts.length - 1];
    const grandparentElementName = grandparentElement.includes('[') ? grandparentElement.substring(0, grandparentElement.indexOf('[')) : grandparentElement;
    
    return `  <xsl:template match="${matchPath}">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
${children}
    </xsl:copy>
  </xsl:template>`;
  }).join('\n\n');
  
  return `${notesComment}<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:ns="http://schema.infor.com/InforOAGIS/2"
  exclude-result-prefixes="ns">
  <xsl:output method="xml" indent="yes"/>
  
  <!-- Identity transform: copy everything -->
  <xsl:template match="@*|node()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>
  
  <!-- Add/append mapped elements -->
${overrides}
</xsl:stylesheet>`;
}

interface XMLNode {
  [key: string]: XMLNode | { _value?: string; _constant?: boolean; _sourcePath?: string };
}

function buildXMLStructure(mappings: MappingRule[]): XMLNode {
  const root: XMLNode = {};
  
  mappings.forEach(m => {
    // Split path but preserve predicates with their elements
    const keys = splitPathPreservingPredicates(m.outputPath);
    let current: any = root;
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      
      // Skip array indices
      if (key.match(/^\d+$/)) continue;
      
      // Check if this key has a predicate (indicates array item)
      const hasPredicate = key.includes('[') && key.includes(']');
      
      if (i === keys.length - 1) {
        // Leaf node - store the mapping
        if (hasPredicate) {
          // For array items with predicates, create separate entries
          if (!Array.isArray(current[key])) {
            current[key] = [];
          }
          current[key].push({
            _value: m.ruleType === 'constant' ? m.constantValue : m.sourcePath,
            _constant: m.ruleType === 'constant'
          });
        } else {
          current[key] = {
            _value: m.ruleType === 'constant' ? m.constantValue : m.sourcePath,
            _constant: m.ruleType === 'constant'
          };
        }
      } else {
        // Intermediate node
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }
    }
  });
  
  return root;
}

function splitPathPreservingPredicates(path: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inPredicate = false;
  
  for (let i = 0; i < path.length; i++) {
    const char = path[i];
    
    if (char === '[') {
      inPredicate = true;
      current += char;
    } else if (char === ']') {
      inPredicate = false;
      current += char;
    } else if (char === '.' && !inPredicate) {
      if (current) parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current) parts.push(current);
  return parts;
}

function generateTemplates(node: XMLNode, indent: string): string {
  let result = '';
  
  for (const key in node) {
    const value = node[key] as any;
    
    // Handle array of items with predicates
    if (Array.isArray(value)) {
      value.forEach((item: any) => {
        const elementName = key.includes('[') ? key.substring(0, key.indexOf('[')) : key;
        const predicate = key.includes('[') ? key.substring(key.indexOf('[')) : '';
        
        result += `${indent}    <${elementName}${predicate ? ' ' + convertPredicateToAttribute(predicate) : ''}>\n`;
        if (item._value !== undefined) {
          if (item._constant) {
            result += `${indent}      ${item._value}\n`;
          } else {
            const xpath = convertToXPath(item._value);
            result += `${indent}      <xsl:value-of select="${xpath}"/>\n`;
          }
        }
        result += `${indent}    </${elementName}>\n`;
      });
    } else if (value._value !== undefined) {
      // Leaf node with value
      const elementName = key.includes('[') ? key.substring(0, key.indexOf('[')) : key;
      const predicate = key.includes('[') ? key.substring(key.indexOf('[')) : '';
      
      if (value._constant) {
        result += `${indent}    <${elementName}${predicate ? ' ' + convertPredicateToAttribute(predicate) : ''}>${value._value}</${elementName}>\n`;
      } else {
        const xpath = convertToXPath(value._value);
        result += `${indent}    <${elementName}${predicate ? ' ' + convertPredicateToAttribute(predicate) : ''}><xsl:value-of select="${xpath}"/></${elementName}>\n`;
      }
    } else {
      // Container node with children
      const elementName = key.includes('[') ? key.substring(0, key.indexOf('[')) : key;
      const predicate = key.includes('[') ? key.substring(key.indexOf('[')) : '';
      
      result += `${indent}    <${elementName}${predicate ? ' ' + convertPredicateToAttribute(predicate) : ''}>\n`;
      result += generateTemplates(value, indent + '  ');
      result += `${indent}    </${elementName}>\n`;
    }
  }
  
  return result;
}

function convertPredicateToAttribute(predicate: string): string {
  // Convert [@name='value'] to name="value"
  const match = predicate.match(/\[@(\w+)='([^']+)'\]/);
  if (match) {
    return `${match[1]}="${match[2]}"`;
  }
  return '';
}

function convertToXPath(dotPath: string): string {
  const keys = dotPath.split('.');
  let xpath = '';
  let skipNext = false;
  
  for (let i = 0; i < keys.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    
    const key = keys[i];
    
    // Handle attributes
    if (key.startsWith('@_')) {
      xpath += '/@' + key.substring(2);
      continue;
    }
    
    // Handle predicates like [\@attr='value']
    if (key.includes('[') && key.includes(']')) {
      const elementName = key.substring(0, key.indexOf('['));
      const predicate = key.substring(key.indexOf('['), key.indexOf(']') + 1);
      
      if (i === 0) {
        xpath = '/ns:' + elementName + predicate;
      } else {
        xpath += '/ns:' + elementName + predicate;
      }
      continue;
    }
    
    // Skip array indices
    if (key.match(/^\d+$/)) {
      continue;
    }
    
    // First element or regular element with namespace prefix
    if (i === 0) {
      xpath = '/ns:' + key;
    } else {
      xpath += '/ns:' + key;
    }
  }
  
  return xpath || '/';
}
