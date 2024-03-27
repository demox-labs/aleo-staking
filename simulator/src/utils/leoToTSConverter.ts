import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const constants: Set<string> = new Set();
const inlines: string[] = [];
const importedInterfaces: { programName: string, interfaceName: string }[] = [];

export const convertLeoToTs = async (filePath: string) => {
  console.log(`Converting Leo contract from: ${filePath}`);
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  // Define the output TypeScript file path
  const directoryPath = path.dirname(filePath);
  const parentDirectoryPath = path.dirname(directoryPath);
  const parentDirectoryName = path.basename(parentDirectoryPath);
  const programAddress = `${parentDirectoryName}.aleo`;

  let tsCode = initLeoContract(parentDirectoryName);
  let collecting = false;
  let collectedLines: string[] = [];
  let nestedLevel = 0;
  let endBracketFound = false;
  for await (const line of rl) {
    const trimmedLine = line.trim();
    // Check if we're starting a record or struct
    if (trimmedLine.startsWith('record')
      || trimmedLine.startsWith('struct')
      || trimmedLine.startsWith('transition')
      || trimmedLine.startsWith('finalize')
      || trimmedLine.startsWith('function')
      || trimmedLine.startsWith('inline')) {
      nestedLevel += (line.match(/\{/g) || []).length;
      const endBrackets = (line.match(/\}/g) || []).length;
      if (endBrackets > 0) {
        endBracketFound = true;
      }
      nestedLevel -= endBrackets;
      collecting = true;
      collectedLines.push(line);
    } else if (collecting) {
      collectedLines.push(line);
      // Check if we're ending a record or struct
      // Adjust brackets count based on the current line
      nestedLevel += (line.match(/\{/g) || []).length;
      const endBrackets = (line.match(/\}/g) || []).length;
      if (endBrackets > 0) {
        endBracketFound = true;
      }
      nestedLevel -= endBrackets;
      if (nestedLevel === 0 && endBracketFound) {
        tsCode = parseAndConvertBlock(collectedLines, tsCode, programAddress);
        collecting = false;
        collectedLines = [];
        endBracketFound = false;
      }
    } else {
      // Each line in input.txt will be successively available here as `line`.
      tsCode = parseAndConvert(line, tsCode);
    }
  }

  for (const { programName, interfaceName } of importedInterfaces) {
    tsCode = `import { ${interfaceName} } from './${programName}';\n` + tsCode;
  }

  tsCode = replaceInlines(tsCode);

  const tsFilePath = path.join('./src/contracts', `${parentDirectoryName}.ts`);
  console.log(`TypeScript file will be saved to: ${tsFilePath}`);

  //Save the converted TypeScript class to a file
  fs.writeFile(tsFilePath, tsCode, err => {
    if (err) {
      console.error(`Error writing file: ${err}`);
    } else {
      console.log(`TypeScript file has been saved to ${tsFilePath}`);
    }
  });
}

const initLeoContract = (name: string) => {
  return `
import assert from 'assert';
// interfaces
export class ${name}Program {
  signer: string = "not set";
  caller: string = "not set";
  block: {
    height: bigint;
  } = { height: BigInt(0) };
  // params
  constructor(
    // constructor args
  ) {
    // constructor body
  }
  `;
}

const parseAndConvert = (leoLine: string, tsCode: string, blockName?: string, programAddress?: string) => {
  const trimmedLine = leoLine.trim();
  if (trimmedLine.startsWith('import')) {
    tsCode = convertImports(trimmedLine, tsCode);
  } else if (trimmedLine.startsWith('//')) {
    tsCode += `${trimmedLine}\n`;
  } else if (trimmedLine.startsWith('mapping')) {
    tsCode = convertMapping(trimmedLine, tsCode);
  } else if (trimmedLine.startsWith('const')) {
    tsCode = convertConst(trimmedLine, tsCode);
  } else if (trimmedLine.startsWith('program')) {
    tsCode += `${TAB}//${trimmedLine}`;
  } else {
    tsCode += `${TAB}${TAB}${generalConvert(trimmedLine, blockName, programAddress)}\n`;
  }
  // Implement the parsing and converting logic here
  // This is a placeholder for the actual conversion logic
  return tsCode;
}

const parseAndConvertBlock = (leoLines: string[], tsCode: string, programAddress: string): string => {
  // Determine if it's a record or struct and extract the name
  const firstLine = leoLines[0].trim();
  if (firstLine.startsWith('record') || firstLine.startsWith('struct')) {
    tsCode = convertToInterface(leoLines, tsCode);
  } else if (firstLine.startsWith('transition')
  || firstLine.startsWith('finalize')
  || firstLine.startsWith('function')
  || firstLine.startsWith('inline')) {
    tsCode = convertFunction(leoLines, tsCode, programAddress);
  } else {
    // console.log('Missed this line:', firstLine);
  }
  return tsCode;
}

const TAB = '  ';

const convertType = (leoType: string): string => {
  switch (leoType) {
    case 'address':
      return 'string';
    case 'u8':
    case 'u32':
    case 'u64':
    case 'u128':
    case 'i8':
    case 'i32':
    case 'i64':
    case 'i128':
      return 'bigint';
    case 'field':
      return 'string';
    case 'bool':
      return 'boolean';
    default:
      if (leoType?.includes('[')) {
        const tsArrayType = convertType(leoType.substring(leoType.indexOf('[') + 1, leoType.indexOf(';')));
        return `${tsArrayType}[]`;
      }
      if (leoType?.includes(".aleo") || leoType?.includes(".leo")) {
        const programName = leoType.substring(0, leoType.indexOf('.'));
        const interfaceEnd = leoType.indexOf(',') > 0 ? leoType.indexOf(',') : leoType.length;
        const interfaceName = leoType.substring(leoType.indexOf('/') + 1, interfaceEnd);
        if (importedInterfaces.map(({ programName, interfaceName }) => interfaceName).includes(interfaceName)) {
          return interfaceName;
        } else {
          importedInterfaces.push({ programName, interfaceName });
          return interfaceName;
        }
      }
      return leoType; // Default fallback
  }
};

const convertValue = (leoValue: string, leoType: string): string => {
  switch (leoType) {
    case 'string':
      return `"${leoValue}"`;
    case 'bigint':
      const isSigned = leoValue.includes("i");
      let numPart = leoValue.substring(0, leoValue.indexOf("u"));
      if (isSigned) {
        numPart = leoValue.substring(0, leoValue.indexOf("i"));
      }
      return `BigInt("${numPart}")`;
    case 'boolean':
      return leoValue;
    case 'array':
      return leoValue;
    default:
      return leoValue; // Default fallback
  }
};

const convertMapping = (leoLine: string, tsCode: string): string => {
  const mappingMatch = leoLine.match(/mapping\s+(\w+):\s+(\w+)\s+=>\s+(\w+);/);
  if (mappingMatch) {
    const [, name, keyType, valueType] = mappingMatch;
    // TypeScript doesn't have a direct equivalent of Leo's mapping, using Map for demonstration
    const lineToAdd = `${TAB}${name}: Map<${convertType(keyType)}, ${convertType(valueType)}> = new Map();\n`;
    return addToProperties(lineToAdd, tsCode);
  } else {
    return `// Error: Could not parse mapping: ${leoLine}\n`;
  }
}

const generalConvert = (leoLine: string, blockName?: string, programAddress?: string): string => {
  leoLine = replaceCasts(leoLine);
  leoLine = replaceAssignment(leoLine);
  leoLine = replaceAsserts(leoLine);
  leoLine = replaceSelfCaller(leoLine);
  leoLine = replaceSelfSigner(leoLine);
  leoLine = replaceForLoop(leoLine);
  leoLine = replaceArrayAccess(leoLine);
  leoLine = replaceHashFieldToToString(leoLine);
  leoLine = removeInterfaceAssignment(leoLine);
  leoLine = replaceMapping(leoLine);
  leoLine = replaceCalls(leoLine, programAddress);
  leoLine = replaceMathOperations(leoLine);
  leoLine = replaceLeoNums(leoLine);
  leoLine = replaceThenFinalize(leoLine, blockName);
  leoLine = replaceBlockHeight(leoLine);
  leoLine = replaceTupleReturn(leoLine);
  leoLine = replaceConsts(leoLine);
  return leoLine;
}

const replaceAssignment = (leoLine: string): string => {
 // Regex to match the pattern "let <name>: <type> = <initialization>" with a complex type
  const regex = /let (\w+):\s*([\w\.\/]+)\s*=\s*(.+)/;
  const match = leoLine.match(regex);

  if (match) {
    const [, name, type, initialization] = match;
    // Assuming convertType is a function you have that converts types
    leoLine = `let ${name}: ${convertType(type)} = ${initialization}`;
  }

  return leoLine;
}

const replaceBlockHeight = (leoLine: string): string => {
  return leoLine.replace("block.height", "this.block.height");
}

const replaceSelfCaller = (leoLine: string): string => {
  return leoLine.replace('self.caller', 'this.caller');
}

const replaceSelfSigner = (leoLine: string): string => {
  return leoLine.replace('self.signer', 'this.signer');
}

const replaceHashFieldToToString = (leoLine: string): string => {
  //BHP256::hash_to_field(approve)
  // Regular expression to match "BHP256::hash_to_field(variableName);"
  const regex = /BHP256::hash_to_field\((\w+)\)/;

  // Replace the matched pattern with "variableName.toString();"
  return leoLine.replace(regex, (match, variableName) => `${variableName}.toString()`);
}

const replaceCasts = (leoLine: string): string => {
  /// This regex matches the "as" keyword followed by any whitespace and then "i128", "u64", or "u32"
  const regex = /\s+as\s+(i128|i64|i32|i8|u128|u64|u32|u8)/g;

  // Replace the matched pattern (the cast) with an empty string
  return leoLine.replace(regex, '');
}

const replaceTupleReturn = (leoLine: string): string => {
  // Matches a return statement with a tuple, capturing the tuple contents
  const regex = /return\s+\(([^)]+)\);/;
  return leoLine.replace(regex, (match, tupleContents) => {
      // Replace the captured tuple with an array notation
      return `return [${tupleContents}];`;
  });
}

const replaceLeoNums = (leoLine: string): string => {
  const numericLiteralRegex = /(\d+)[ui]\d+/g;
  leoLine = leoLine.replace(numericLiteralRegex, (match, num) => `BigInt("${num}")`);

  return leoLine;
}

const replaceForLoop = (leoLine: string): string => {
  // Define the regex pattern to capture the variable name, start value, and end value
  const regex = /for\s+(\w+):\s*u8\s+in\s+(\d+)u8\.\.(\d+)u8\s+\{/;

  // Replace the matched pattern with TypeScript for loop syntax
  // Capturing groups are used to format the replacement string
  const replacedLine = leoLine.replace(regex, (match, variableName, startValue, endValue) => {
    // Convert the captured values into the TypeScript for loop syntax
    return `for (let ${variableName}: number = ${startValue}; ${variableName} < ${endValue}; ${variableName}++) {`;
  });

  return replacedLine;
}

const replaceMapping = (leoLine: string): string => {
  // if (leoLine.includes("residual_delegator")) {
  //   console.log(leoLine);
  // }

  const originalLine = leoLine;
  const get = /(\w+)\.get\((\w+)\)/;
  const getMatch = leoLine.match(get);
  if (getMatch) {
    const [mappingName, keyName ] = getMatch;
    // Construct the TypeScript equivalent line using captured values
    leoLine = leoLine.replace(get, (match, mappingName, keyName) => `this.${mappingName}.get(${keyName})!`);
  }

  const remove = /(\w+)\.remove\((\w+)\)/;
  const removeMatch = leoLine.match(remove);
  if (removeMatch) {
    const [ mappingName, keyName ] = removeMatch;
    // Construct the TypeScript equivalent line using captured values
    leoLine = leoLine.replace(remove, (match, mappingName, keyName) => `this.${mappingName}.delete(${keyName})`);
  }

  const containsRegex = /(\w+)\.contains\((\w+)\)/;
  const containsMatch = leoLine.match(containsRegex);
  if (containsMatch) {
    const [ mappingName, keyName ] = containsMatch;
    // Construct the TypeScript equivalent line using captured values
    leoLine = leoLine.replace(containsRegex, (match, mappingName, keyName) => `this.${mappingName}.has(${keyName})`);
  }

  const getOrUseRegex = /(\w+)\.get_or_use\((\w+),\s*(\w+)\)(\.\w+)*/;
  const getOrUseMatch = leoLine.match(getOrUseRegex);
  if (getOrUseMatch) {
    const [, mappingName, keyName, defaultValue, propertyName] = getOrUseMatch;
    const propertyAccess = propertyName ? `?${propertyName}` : '';
    // Adjust to use the correct TypeScript equivalent, considering the "||" for default value
    leoLine = leoLine.replace(getOrUseRegex, `this.${mappingName}.get(${keyName})${propertyAccess} || ${defaultValue}${propertyAccess}`);
  }

  const setRegex = /(\w+)\.set\(([^,]+),\s*(.+)\);/;
  const setMatch = leoLine.match(setRegex);

  if (setMatch) {
    // Correctly destructuring the match array
    const [, mappingName, keyName, setValue] = setMatch;

    // Using template literals to construct the TypeScript equivalent line
    leoLine = leoLine.replace(setRegex, `this.${mappingName}.set(${keyName}, ${setValue});`);
  }

  const mappingGet = /\s*Mapping::get\((\w+),\s*(\w+)\)/;
  const mappingGetMatch = leoLine.match(mappingGet);

  if (mappingGetMatch) {
    const [mappingName, keyName ] = mappingGetMatch;
    // Construct the TypeScript equivalent line using captured values
    leoLine = leoLine.replace(mappingGet, (match, mappingName, keyName) => ` this.${mappingName}.get(${keyName})!`);
  }

  // Regular expression to match the line format and capture necessary parts
  const mappingGetOrUse = /\s*Mapping::get_or_use\((\w+),\s*(\w+),\s*(\w+)\)/;
  const mappingGetOrUseMatch = leoLine.match(mappingGetOrUse);

  if (mappingGetOrUseMatch) {
    const [mappingName, keyName, defaultValue ] = mappingGetOrUseMatch;
    // Construct the TypeScript equivalent line using captured values
    leoLine = leoLine.replace(mappingGetOrUse, (match, mappingName, keyName, defaultValue) => ` this.${mappingName}.get(${keyName}) || ${defaultValue}`);
  }

  const mappingSet = /\s*Mapping::set\((\w+),\s*(\w+),\s*(\w+)\)/;
  const mappingSetMatch = leoLine.match(mappingSet);

  if (mappingSetMatch) {
    const [mappingName, keyName, setValue ] = mappingSetMatch;
    // Construct the TypeScript equivalent line using captured values
    leoLine = leoLine.replace(mappingSet, (match, mappingName, keyName, setValue) => `this.${mappingName}.set(${keyName}, ${setValue})`);
  }

  // If there was an external mapping, after the replacements above,
  // this regex will match the pattern "namespace.aleo/this.mapping.method(args)"
  // and captures "namespace" as $1 and "this" as $2
  const externalMappingRegex = /(\w+)\.aleo\/(\w+)/;
  const externalMappingMatch = leoLine.match(externalMappingRegex);

  // Check if we matched any of the mapping methods so this doesn't conflict with external function calls
  if (externalMappingMatch && leoLine !== originalLine) {
    const [, namespace] = externalMappingMatch;
    // Replace the matched pattern with "$1.$2"
    leoLine = leoLine.replace(externalMappingRegex, `this.${namespace}`);
  }

  return leoLine; // Return the original line if it doesn't match the pattern
}

const removeInterfaceAssignment = (leoLine: string): string => {
  // Regular expression to match and capture parts of the line
  const regex = /(let\s+\w+\s*:\s*[\w\.\/]+\s*=\s*)[\w\.\/]+\s*\{/;
  if (leoLine.includes("let")) {
    leoLine = leoLine.replace(regex, '$1{');
  }

  // Replace the matched line by removing the second occurrence of the word before the bracket
  return leoLine;
}

const replaceAsserts = (leoLine: string): string => {
  const assertEqRegex = /assert_eq\(([^,]+),\s*([^\)]+)\);/;

  // Replace matched lines with the "assert(arg1 === arg2);" format
  leoLine = leoLine.replace(assertEqRegex, (match, arg1, arg2) => {
    // Optionally, convert numeric literals to their TypeScript representation
    // This step can be customized or expanded based on specific needs
    return `assert(${arg1} === ${arg2});`;
  });

  const assertNeqRegex = /assert_neq\(([^,]+),\s*([^)]+)\);/;

  // Replace matched lines with the "assert(arg1 === arg2);" format
  leoLine = leoLine.replace(assertNeqRegex, (match, arg1, arg2) => {
    // Optionally, convert numeric literals to their TypeScript representation
    // This step can be customized or expanded based on specific needs
    return `assert(${arg1} !== ${arg2});`;
  });

  return leoLine;
}

const replaceMathOperations = (leoLine: string): string => {
  const addRegex = /(\w+)\.add\((\w+)\)/;
  leoLine = leoLine.replace(addRegex, '$1 + $2');

  // Matches "variable.sub(otherVariable)" and replaces it with "variable - otherVariable"
  const subRegex = /(\w+)\.sub\((\w+)\)/;
  leoLine = leoLine.replace(subRegex, '$1 - $2');

  return leoLine;
}

const replaceCalls = (leoLine: string, programAddress?: string): string => {
  // This regex matches the pattern "namespace.object/method(args)"
  // and captures "object" as $1 and "method(args)" as $2
  const regex = /(\w+)\.aleo\/(\w+\(.*?\))/;
  const match = leoLine.match(regex);

  if (match) {
    const [, object, methodWithArgs] = match;
    // Replace the matched pattern with "this.$1.$2"
    leoLine = leoLine.replace(regex, `this.${object}.${methodWithArgs}`);
    // TODO: replace with appropriate address of calling contract
    leoLine = `this.${object}.caller = "${programAddress}";\n${TAB}${TAB}${leoLine}`;
  }
  return leoLine;

  // Replace the matched pattern with "this.$1.$2"
  // return leoLine.replace(regex, (match, object, methodWithArgs) => `this.${object}.caller = "contract";\n${TAB}${TAB}this.${object}.${methodWithArgs}`);
}

const replaceArrayAccess = (leoLine: string): string => {
  // This regex matches the pattern "array[index]" and captures "array" as $1 and "index" as $2
  // It has been adjusted to match any number followed by optional 'u' and any number of digits
  const regex = /(\w+)\[(\d+)u?\d*\]/g;

  // Replace the matched pattern with "array[index]" where index is just the numeric part
  // Here, the assumption is to remove the 'u' and any number after 'u' to just use the digit(s) before 'u'
  // If you want to keep the full unsigned integer literal as is, you can adjust the replacement pattern accordingly
  return leoLine.replace(regex, '$1[$2]');
}

const replaceThenFinalize = (leoLine: string, blockName?: string): string => {
  leoLine = leoLine.replace("then finalize", `this.finalize_${blockName}`);
  return leoLine;
}

const replaceConsts = (leoLine: string): string => {
  constants.forEach(constant => {
    if (leoLine.includes(constant)) {
      // Use a regular expression with word boundaries to match the constant
      const regex = new RegExp(`\\b${constant}\\b`, 'g');
      leoLine = leoLine.replace(regex, `this.${constant}`);
    }
  });
  return leoLine;
}

const replaceInlines = (leoLine: string): string => {
  inlines.forEach(inline => {
    if (leoLine.includes(inline)) {
      // Use a regular expression with word boundaries to match the constant
      const regex = new RegExp(`\\b${inline}\\b`, 'g');
      leoLine = leoLine.replace(regex, `this.inline_${inline}`);
    }
  });
  return leoLine;
}

const convertToInterface = (leoLines: string[], tsCode: string): string => {
  // Determine if it's a record or struct and extract the name
  const firstLine = leoLines[0].trim();
  let name = '';
  if (firstLine.startsWith('record')) {
    name = (firstLine.match(/record\s+(\w+)/))![1];
  } else if (firstLine.startsWith('struct')) {
    name = (firstLine.match(/struct\s+(\w+)/))![1];
  }

  let interfaceCode = '';
  // Start TypeScript interface
  interfaceCode += `export interface ${name} {\n`;

  // Convert each field
  leoLines.slice(1, -1).forEach(line => { // Exclude the first and last line
    if (line.trim().startsWith('//')) {
      interfaceCode += `${TAB}${line}\n`;
    } else {
      const [field, type] = line.trim().split(':').map(part => part.trim());
      interfaceCode += `${TAB}${field}: ${convertType(type.replace(',', ''))};\n`; // Remove commas and convert types
    }
  });

  // Close TypeScript interface
  interfaceCode += '}\n';
  return addToInterfaces(interfaceCode, tsCode);
}

const convertFunction = (leoLines: string[], tsCode: string, programAddress: string): string => {
  const match = leoLines[0].trim().match(/(transition|finalize|function|inline)\s+(\w+)/);
  const keyword = match![1]; // The keyword (transition, finalize, etc.)
  const name = match![2]; // The function/method name
  if (keyword === 'inline') {
    inlines.push(name);
  }
  let transitionTs = "";
  let argsString = "";
  let collectingArgs = true;
  for (let i = 0; i < leoLines.length; i++) {
    const line = leoLines[i];
    const regex = /return\s+(.*?)\s+then/;
    const match = line.match(regex);
    if (match) {
      const returnStatement = match[1]; // Returns the captured group which is the content between 'return' and 'then'
      leoLines[i] = line.substring(line.indexOf('then'));
      leoLines[leoLines.length - 1] = `return ${returnStatement};${TAB}\n}`;
    }
  }
  for (let i = 0; i < leoLines.length; i++) {
    const line = leoLines[i];
    if (collectingArgs) {
      if (line.trim().startsWith('//')) {
        continue;
      }
      if (line.includes(')')) {

        collectingArgs = false;
        const lastIndex = line.indexOf(')') > 0 ? line.indexOf(')') : line.length;
        const firstIndex = line.indexOf('(') < lastIndex ? line.indexOf('(') + 1 : 0;
        const argsPart = line.substring(firstIndex, lastIndex);
        argsString += argsPart;
        // Split arguments by comma and trim each argument
        const args = argsString.split(',').map(arg => arg.trim());
        const argsTS = convertArgs(args);
        let updatedName = name;
        switch (keyword) {
          case 'finalize':
            updatedName = `finalize_${name}`;
            break;
          case 'inline':
            updatedName = `inline_${name}`;
            break;
          default:
            break;
        }
        transitionTs = `${TAB}${updatedName}(\n${argsTS}${TAB}) {\n`;
        continue;
      }

      if (line.indexOf('(') + 1 === line.length) {
        continue;
      }
      const lastIndex = line.indexOf(')') > 0 ? line.indexOf(')') : line.length;
      const firstIndex = line.indexOf('(') + 1 < lastIndex ? line.indexOf('(') + 1 : 0;

      argsString += line.substring(firstIndex, lastIndex);
    }

    transitionTs = parseAndConvert(line, transitionTs, name, programAddress);
  }

  return tsCode += transitionTs;
}

const convertArgs = (leoArgs: string[]): string => {
  return leoArgs.map(arg => {
    if (arg.trim().startsWith("//")) {
      return arg;
    }
    // Remove the 'private' or 'public' identifier and trim any leading/trailing whitespace
    const cleanArg = arg.replace(/(private|public)\s+/, '').trim();

    // Split the cleaned argument into name and type
    const [name, type] = cleanArg.split(':').map(part => part.trim());
    if (name.length === 0) {
      return '';
    }
    const tsType = convertType(type);

    return `${TAB}${TAB}${name}: ${tsType},\n`;
  }).join('');

}

const convertConst = (leoLine: string, tsCode: string): string => {
  const constantMatch = leoLine.match(/const\s+(\w+):\s+(\w+)\s+=\s+(.+);/);
  if (constantMatch) {
    let [, name, valueType, value] = constantMatch;
    const lineToAdd = `${TAB}${name} = ${convertValue(value, convertType(valueType))};\n`;
    constants.add(name);
    return addToProperties(lineToAdd, tsCode);
  } else {
    return `// Error: Could not parse constant: ${leoLine}\n`;
  }
}

const convertImports = (leoLine: string, tsCode: string): string => {
  const regex = /import\s+([^.]+)\.aleo/;
  const match = leoLine.match(regex);
  const programName = match ? match[1] : 'unknown';
  const tsProgramImport = `import { ${programName}Program } from './${programName}';\n`;
  tsCode = tsProgramImport + tsCode;
  const constructorKey = '// constructor args\n';
  const constructorLocationStart = tsCode.indexOf(constructorKey) + constructorKey.length;
  const tsProgramArg = `${TAB}${TAB}${programName}Contract: ${programName}Program,\n`;
  tsCode = tsCode.slice(0, constructorLocationStart) + tsProgramArg + tsCode.slice(constructorLocationStart);
  const constructorBodyKey = '// constructor body\n';
  const constructorBodyLocation = tsCode.indexOf(constructorBodyKey) + constructorBodyKey.length;
  const tsProgramAssignment = `${TAB}${TAB}this.${programName} = ${programName}Contract;\n`;
  tsCode = tsCode.slice(0, constructorBodyLocation) + tsProgramAssignment + tsCode.slice(constructorBodyLocation);
  const propertyLine = `${TAB}${programName}: ${programName}Program;\n`
  tsCode = addToProperties(propertyLine, tsCode);
  return tsCode;
}

const addToProperties = (lineToAdd: string, tsCode: string): string => {
  const propertyKey = '// params\n';
  const propertyLocation = tsCode.indexOf(propertyKey) + propertyKey.length;
  tsCode = tsCode.slice(0, propertyLocation) + lineToAdd + tsCode.slice(propertyLocation);
  return tsCode;
}

const addToInterfaces = (linesToAdd: string, tsCode: string): string => {
  const interfaceKey = '// interfaces\n';
  const interfaceLocation = tsCode.indexOf(interfaceKey) + interfaceKey.length;
  tsCode = tsCode.slice(0, interfaceLocation) + linesToAdd + tsCode.slice(interfaceLocation);
  return tsCode;
}

// // Expected to be called with: node leoToTsConverter.js <path-to-leo-file>
// const filePath = process.argv[2];
// if (!filePath) {
//   console.error('Please provide the path to the Leo contract file.');
//   process.exit(1);
// }

// convertLeoToTs(filePath);