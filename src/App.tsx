import React, { useState } from 'react';
import { AppState, MappingRule, TreeNode } from './types';
import ActionBar from './ActionBar';
import SchemaTree from './SchemaTree';
import MappingPanel from './MappingPanel';
import CodeViewer from './CodeViewer';
import ResizablePanel from './ResizablePanel';
import ResizablePanelVertical from './ResizablePanelVertical';
import { parseXML, parseJSON } from './schemaParser';
import { generatePython } from './pythonGenerator';
import { generateXSLT } from './xsltGenerator';

export default function App() {
  const [state, setState] = useState<AppState>({
    inputType: null,
    outputType: null,
    inputSchema: [],
    outputSchema: [],
    mappings: [],
    mappingNotes: '',
    generatedCode: {},
    copyInputStructure: false
  });

  const [selectedInput, setSelectedInput] = useState<TreeNode | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const handleInputFile = async (file: File) => {
    const text = await file.text();
    const schema = state.inputType === 'xml' ? parseXML(text) : parseJSON(text);
    setState({ ...state, inputSchema: schema, mappings: [], generatedCode: {} });
    setSelectedInput(null);
    setFileInputKey(prev => prev + 1);
  };

  const handleOutputFile = async (file: File) => {
    const text = await file.text();
    const schema = state.outputType === 'xml' ? parseXML(text) : parseJSON(text);
    setState({ ...state, outputSchema: schema, mappings: [], generatedCode: {} });
    setFileInputKey(prev => prev + 1);
  };

  const getAttributeSuggestions = (path: string, schema: TreeNode[]): string[] => {
    const parts = path.split('.');
    let current: TreeNode[] = schema;
    
    // Navigate to the parent array to find attributes
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const node = current.find(n => n.name === part);
      if (!node || !node.children) return [];
      current = node.children;
    }
    
    // Find attributes (keys starting with @_)
    const attributes = current
      .filter(node => node.name.startsWith('@_'))
      .map(node => node.name.substring(2)); // Remove @_ prefix
    
    return attributes;
  };

  const getPredicateExample = (path: string, schema: TreeNode[], isForConstant: boolean = false): string => {
    const attributes = getAttributeSuggestions(path, schema);
    
    if (attributes.length > 0) {
      const firstAttr = attributes[0];
      return isForConstant 
        ? `Enter array filter predicate (e.g., @${firstAttr}='value' or leave empty):`
        : `Enter array filter predicate (e.g., @${firstAttr}='value' or leave empty):`;
    }
    
    return isForConstant
      ? "Enter array filter predicate (e.g., @attribute='value' or leave empty):"
      : "Enter array filter predicate (e.g., @attribute='value' or leave empty):";
  };

  const handleInputNodeClick = (node: TreeNode) => {
    // Only show attribute popup for XML output (XSLT generation)
    if (state.outputType === 'xml') {
      // Check if this node's parent path contains an array by looking at the schema
      const isChildOfArray = isNodeChildOfArray(node.path, state.inputSchema);
      
      if (isChildOfArray) {
        const promptText = getPredicateExample(node.path, state.inputSchema);
        const predicate = prompt(promptText);
        if (predicate !== null && predicate.trim()) {
          // Insert predicate into the path at the array level
          const pathWithPredicate = insertPredicateInPath(node.path, predicate);
          setSelectedInput({ ...node, path: pathWithPredicate });
        } else if (predicate !== null) {
          setSelectedInput(node);
        }
      } else {
        setSelectedInput(node);
      }
    } else {
      // For JSON output, no attribute popup needed
      setSelectedInput(node);
    }
  };

  const handleOutputNodeClick = (node: TreeNode) => {
    if (!selectedInput) {
      // For constant values, only show attribute popup for XML output
      if (state.outputType === 'xml') {
        const isChildOfArray = isNodeChildOfArray(node.path, state.outputSchema);
        
        if (isChildOfArray) {
          const promptText = getPredicateExample(node.path, state.outputSchema, true);
          const predicate = prompt(promptText);
          if (predicate !== null && predicate.trim()) {
            const outputPath = insertPredicateInPath(node.path, predicate);
            const value = prompt('Enter constant value:');
            if (value) {
              const mapping: MappingRule = {
                id: Date.now().toString(),
                outputPath: outputPath,
                ruleType: 'constant',
                constantValue: value
              };
              setState(s => ({ ...s, mappings: [...s.mappings, mapping] }));
            }
          } else if (predicate !== null) {
            const value = prompt('Enter constant value:');
            if (value) {
              const mapping: MappingRule = {
                id: Date.now().toString(),
                outputPath: node.path,
                ruleType: 'constant',
                constantValue: value
              };
              setState(s => ({ ...s, mappings: [...s.mappings, mapping] }));
            }
          }
        } else {
          const value = prompt('Enter constant value:');
          if (value) {
            const mapping: MappingRule = {
              id: Date.now().toString(),
              outputPath: node.path,
              ruleType: 'constant',
              constantValue: value
            };
            setState(s => ({ ...s, mappings: [...s.mappings, mapping] }));
          }
        }
      } else {
        // For JSON output, no attribute popup needed
        const value = prompt('Enter constant value:');
        if (value) {
          const mapping: MappingRule = {
            id: Date.now().toString(),
            outputPath: node.path,
            ruleType: 'constant',
            constantValue: value
          };
          setState(s => ({ ...s, mappings: [...s.mappings, mapping] }));
        }
      }
    } else {
      let outputPath = node.path;
      
      // Only show attribute popup for XML output
      if (state.outputType === 'xml') {
        const isChildOfArray = isNodeChildOfArray(node.path, state.outputSchema);
        
        if (isChildOfArray) {
          const promptText = getPredicateExample(node.path, state.outputSchema);
          const predicate = prompt(promptText);
          if (predicate !== null && predicate.trim()) {
            outputPath = insertPredicateInPath(node.path, predicate);
          }
        }
      }
      
      const mapping: MappingRule = {
        id: Date.now().toString(),
        outputPath: outputPath,
        ruleType: 'direct',
        sourcePath: selectedInput.path
      };
      setState(s => ({ ...s, mappings: [...s.mappings, mapping] }));
      setSelectedInput(null);
    }
  };

  const isNodeChildOfArray = (path: string, schema: TreeNode[]): boolean => {
    const parts = path.split('.');
    let current: TreeNode[] = schema;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const node = current.find(n => n.name === part);
      
      if (!node) return false;
      
      // If we find an array in the path before reaching the end, this is a child of array
      if (node.type === 'array' && i < parts.length - 1) {
        return true;
      }
      
      if (node.children) {
        current = node.children;
      }
    }
    
    return false;
  };

  const insertPredicateInPath = (path: string, predicate: string): string => {
    // Simply append predicate to the end of the path (the selected element)
    return `${path}[${predicate}]`;
  };

  const canGeneratePython = state.inputType && state.outputType && state.mappings.length > 0 &&
    ((state.inputType === 'xml' && state.outputType === 'json') ||
     (state.inputType === 'json' && state.outputType === 'json') ||
     (state.inputType === 'json' && state.outputType === 'xml'));

  const canGenerateXSLT = state.inputType === 'xml' && state.outputType === 'xml' && state.mappings.length > 0;

  const handleGeneratePython = () => {
    const code = generatePython(state.mappings, state.inputType!, state.outputType!, state.mappingNotes, state.outputSchema);
    setState(s => ({ ...s, generatedCode: { ...s.generatedCode, python: code } }));
  };

  const handleGenerateXSLT = () => {
    const code = generateXSLT(state.mappings, state.mappingNotes, state.copyInputStructure);
    setState(s => ({ ...s, generatedCode: { ...s.generatedCode, xslt: code } }));
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ 
        padding: '24px 32px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderBottom: '1px solid #e5e5e7',
        color: '#ffffff'
      }}>
        <h1 style={{ 
          margin: 0,
          fontSize: '28px',
          fontWeight: '700',
          letterSpacing: '-0.5px'
        }}>Schema Mapper → Code Generator</h1>
      </div>
      
      <ActionBar
        inputType={state.inputType}
        outputType={state.outputType}
        onInputTypeChange={type => setState(s => ({ ...s, inputType: type }))}
        onOutputTypeChange={type => setState(s => ({ ...s, outputType: type }))}
        onInputFileUpload={handleInputFile}
        onOutputFileUpload={handleOutputFile}
        onGeneratePython={handleGeneratePython}
        onGenerateXSLT={handleGenerateXSLT}
        canGeneratePython={!!canGeneratePython}
        canGenerateXSLT={!!canGenerateXSLT}
        fileInputKey={fileInputKey}
        copyInputStructure={state.copyInputStructure}
        onCopyInputStructureChange={checked => setState(s => ({ ...s, copyInputStructure: checked }))}
      />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {(state.generatedCode.python || state.generatedCode.xslt) ? (
          <>
            <ResizablePanelVertical defaultHeight={50}>
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <ResizablePanel defaultWidth={30}>
                  <SchemaTree 
                    nodes={state.inputSchema} 
                    title="Input Schema" 
                    onNodeClick={handleInputNodeClick}
                    selectedNode={selectedInput}
                  />
                </ResizablePanel>
                <ResizablePanel defaultWidth={30}>
                  <MappingPanel 
                    mappings={state.mappings}
                    onDeleteMapping={id => setState(s => ({ ...s, mappings: s.mappings.filter(m => m.id !== id) }))}
                  />
                </ResizablePanel>
                <div style={{ flex: 1 }}>
                  <SchemaTree 
                    nodes={state.outputSchema} 
                    title="Output Schema"
                    onNodeClick={handleOutputNodeClick}
                  />
                </div>
              </div>
              <div style={{ 
                borderTop: '1px solid #e5e5e7', 
                padding: '16px 24px',
                background: '#fafafa'
              }}>
                <textarea
                  placeholder="Optional mapping notes... for future development/considerations"
                  value={state.mappingNotes}
                  onChange={e => setState(s => ({ ...s, mappingNotes: e.target.value }))}
                  style={{ 
                    width: '100%', 
                    height: '60px', 
                    padding: '12px 16px',
                    border: '1px solid #d2d2d7',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    background: '#ffffff'
                  }}
                />
              </div>
            </ResizablePanelVertical>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <CodeViewer 
                code={state.generatedCode.python || state.generatedCode.xslt || ''}
                language={state.generatedCode.python ? 'python' : 'xml'}
              />
            </div>
          </>
        ) : (
          <>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <ResizablePanel defaultWidth={30}>
                <SchemaTree 
                  nodes={state.inputSchema} 
                  title="Input Schema" 
                  onNodeClick={handleInputNodeClick}
                  selectedNode={selectedInput}
                />
              </ResizablePanel>
              <ResizablePanel defaultWidth={30}>
                <MappingPanel 
                  mappings={state.mappings}
                  onDeleteMapping={id => setState(s => ({ ...s, mappings: s.mappings.filter(m => m.id !== id) }))}
                />
              </ResizablePanel>
              <div style={{ flex: 1 }}>
                <SchemaTree 
                  nodes={state.outputSchema} 
                  title="Output Schema"
                  onNodeClick={handleOutputNodeClick}
                />
              </div>
            </div>
            <div style={{ 
              borderTop: '1px solid #e5e5e7', 
              padding: '16px 24px',
              background: '#fafafa'
            }}>
              <textarea
                placeholder="Optional mapping notes... for future development/considerations"
                value={state.mappingNotes}
                onChange={e => setState(s => ({ ...s, mappingNotes: e.target.value }))}
                style={{ 
                  width: '100%', 
                  height: '60px', 
                  padding: '12px 16px',
                  border: '1px solid #d2d2d7',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  background: '#ffffff'
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
