export type FileType = 'xml' | 'json';

export interface TreeNode {
  name: string;
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  children?: TreeNode[];
  required?: boolean;
}

export interface MappingRule {
  id: string;
  outputPath: string;
  ruleType: 'direct' | 'constant';
  sourcePath?: string;
  constantValue?: string;
}

export interface AppState {
  inputType: FileType | null;
  outputType: FileType | null;
  inputSchema: TreeNode[];
  outputSchema: TreeNode[];
  mappings: MappingRule[];
  mappingNotes: string;
  generatedCode: {
    python?: string;
    xslt?: string;
  };
  copyInputStructure: boolean;
}
