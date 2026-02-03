import { MappingRule, FileType } from './types';

export function generatePython(
  mappings: MappingRule[],
  inputType: FileType,
  outputType: FileType,
  notes: string
): string {
  const imports = generateImports(inputType, outputType);
  const parseInput = generateInputParser(inputType);
  const transform = generateTransform(mappings, outputType);
  const notesComment = notes ? `"""\nMapping Notes:\n${notes}\n"""\n\n` : '';

  return `${notesComment}${imports}\n\n${parseInput}\n\n${transform}\n\n# Execute transformation
data = parse_input(input_var_1)
output_var_1 = transform(data)
`;
}

function generateImports(inputType: FileType, outputType: FileType): string {
  const imports = [];
  if (inputType === 'xml' || outputType === 'xml') {
    imports.push('import xml.etree.ElementTree as ET');
  }
  imports.push('import json');
  return imports.join('\n');
}

function generateInputParser(inputType: FileType): string {
  if (inputType === 'xml') {
    return `def parse_input(input_var_1):
    root = ET.fromstring(input_var_1.strip())
    return root`;
  }
  return `def parse_input(input_var_1):
    return json.loads(input_var_1)`;
}

function generateTransform(mappings: MappingRule[], outputType: FileType): string {
  const mappingLines = mappings.map(m => {
    if (m.ruleType === 'constant') {
      return `    set_nested_value(output, "${m.outputPath}", "${m.constantValue}")`;
    }
    return `    set_nested_value(output, "${m.outputPath}", get_value(data, "${m.sourcePath}"))`;
  }).join('\n');

  const getValueFunction = `def get_value(data, path):
    keys = path.split('.')
    value = data
    
    # Extract namespace from root element if present
    namespace = ''
    if hasattr(data, 'tag') and '}' in data.tag:
        namespace = data.tag.split('}')[0] + '}'
    
    for i, key in enumerate(keys):
        if isinstance(value, dict):
            value = value.get(key)
        elif hasattr(value, 'find'):
            # Check if this is an attribute access (starts with @_)
            if key.startswith('@_'):
                attr_name = key[2:]  # Remove @_ prefix
                return value.attrib.get(attr_name)
            
            # Check for predicate like [@attr='value']
            if '[' in key and ']' in key:
                element_name = key[:key.index('[')]
                predicate = key[key.index('[')+1:key.index(']')]
                
                # Parse predicate: @attr='value'
                if predicate.startswith('@'):
                    attr_parts = predicate.split('=')
                    if len(attr_parts) == 2:
                        attr_name = attr_parts[0][1:]  # Remove @
                        attr_value = attr_parts[1].strip('"\\'')
                        
                        # Find all matching elements
                        children = value.findall(namespace + element_name) if namespace else value.findall(element_name)
                        for child in children:
                            if child.attrib.get(attr_name) == attr_value:
                                value = child
                                break
                        else:
                            return None
                        continue
            
            # XML Element - try to find child element
            # Skip the root element name if it's the first key
            if i == 0 and hasattr(data, 'tag'):
                root_name = data.tag.split('}')[-1] if '}' in data.tag else data.tag
                if key == root_name:
                    continue
            
            # Try with namespace first, then without
            child = value.find(namespace + key) if namespace else value.find(key)
            if child is None and namespace:
                child = value.find(key)
            
            if child is not None:
                value = child
            else:
                return None
        elif hasattr(value, key):
            value = getattr(value, key)
        else:
            return None
    
    # If final value is an XML Element, get its text content
    if hasattr(value, 'text'):
        return value.text
    return value`;

  const setNestedValueFunction = `def set_nested_value(obj, path, value):
    keys = path.split('.')
    for i, key in enumerate(keys[:-1]):
        if key.isdigit():
            continue
        
        if key not in obj:
            next_key = keys[i + 1] if i + 1 < len(keys) else None
            if next_key and next_key.isdigit():
                obj[key] = []
            else:
                obj[key] = {}
        
        if isinstance(obj[key], list):
            next_key = keys[i + 1]
            if next_key.isdigit():
                idx = int(next_key)
                while len(obj[key]) <= idx:
                    obj[key].append({})
                obj = obj[key][idx]
        else:
            obj = obj[key]
    
    final_key = keys[-1]
    if not final_key.isdigit():
        obj[final_key] = value`;

  const transformFunction = `def transform(data):
    output = {}
    
${mappingLines}
    
    return json.dumps(output, indent=2)`;

  return `${getValueFunction}\n\n${setNestedValueFunction}\n\n${transformFunction}`;
}
