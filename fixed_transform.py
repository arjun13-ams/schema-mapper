import xml.etree.ElementTree as ET
import json

def parse_input(input_var_1):
    root = ET.fromstring(input_var_1.strip())
    return root

def get_value(data, path):
    keys = path.split('.')
    value = data
    
    namespace = ''
    if hasattr(data, 'tag') and '}' in data.tag:
        namespace = data.tag.split('}')[0] + '}'
    
    for i, key in enumerate(keys):
        if isinstance(value, dict):
            value = value.get(key)
        elif hasattr(value, 'find'):
            if key.startswith('@_'):
                attr_name = key[2:]
                return value.attrib.get(attr_name)
            
            if '[' in key and ']' in key:
                element_name = key[:key.index('[')]
                predicate = key[key.index('[')+1:key.index(']')]
                
                if predicate.startswith('@'):
                    attr_parts = predicate.split('=')
                    if len(attr_parts) == 2:
                        attr_name = attr_parts[0][1:]
                        attr_value = attr_parts[1].strip("'\"")
                        
                        children = value.findall(namespace + element_name) if namespace else value.findall(element_name)
                        for child in children:
                            if child.attrib.get(attr_name) == attr_value:
                                value = child
                                break
                        else:
                            return None
                        continue
            
            if i == 0 and hasattr(data, 'tag'):
                root_name = data.tag.split('}')[-1] if '}' in data.tag else data.tag
                if key == root_name:
                    continue
            
            child = value.find(namespace + key) if namespace else value.find(key)
            if child is None and namespace:
                child = value.find(key)
            
            if child is not None:
                value = child
            else:
                return None
        else:
            return None
    
    if hasattr(value, 'text'):
        return value.text
    return value

def transform(data):
    output = {}
    
    # Basic mappings
    load_number = get_value(data, "ProcessTMSShipperLoadPlan.DataArea.TMSShipperLoadPlan.LeanXML.ShipperLoadPlan.LoadNumber")
    output["externalid"] = load_number
    output["loadid"] = load_number
    output["route"] = "123"
    output["trailertype"] = get_value(data, "ProcessTMSShipperLoadPlan.DataArea.TMSShipperLoadPlan.LeanXML.ShipperLoadPlan.Equipment")
    
    # Handle stops as array
    stop_number = get_value(data, "ProcessTMSShipperLoadPlan.DataArea.TMSShipperLoadPlan.LeanXML.ShipperLoadPlan.Stops.Stop.StopNumber")
    order_num = get_value(data, "ProcessTMSShipperLoadPlan.DataArea.TMSShipperLoadPlan.LeanXML.ShipperLoadPlan.Stops.Stop.OrderNums.OrderNum")
    
    output["stops"] = [{
        "stop": stop_number,
        "loadorderdetails": {
            "shipmentorderid": order_num
        }
    }]
    
    return json.dumps(output, indent=2)

# Execute transformation
data = parse_input(input_var_1)
output_var_1 = transform(data)