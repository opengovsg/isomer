const fs = require('fs');
const path = require('path');

// Read the schema analysis results
const analysisPath = path.join(__dirname, '..', '..', 'schema-analysis.json');
let usedComponentTypes = [];
try {
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
  usedComponentTypes = analysis.componentTypes || [];
} catch (error) {
  throw new Error(`Error reading schema-analysis.json: ${error.message}`);
}

// Read COMPONENT_MAPPINGS from the library
const componentMappingsPath = path.join(__dirname, '..', '..', 'node_modules', '@opengovsg', 'isomer-components', 'dist', 'esm', 'constants', 'componentMappings.js');
let typeToComponent = {};
try {
  const mappingsContent = fs.readFileSync(componentMappingsPath, 'utf8');
  // Extract the object from: export const COMPONENT_MAPPINGS = { ... };
  const objectMatch = mappingsContent.match(/export\s+const\s+COMPONENT_MAPPINGS\s*=\s*({[\s\S]*?});/);
  if (objectMatch) {
    // Safely evaluate the object (it's from our own node_modules)
    typeToComponent = eval(`(${objectMatch[1]})`);
  }
} catch (error) {
  throw new Error(`Error reading COMPONENT_MAPPINGS: ${error.message}`);
}

// Determine which components are used
const usedComponents = new Set();
const usedCases = new Set();

usedComponentTypes.forEach(type => {
  const componentName = typeToComponent[type];
  if (componentName) {
    usedComponents.add(componentName);
    usedCases.add(type);
  }
});

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Find the switch statement
  const switchStatements = root.find(j.SwitchStatement);
  
  if (switchStatements.length === 0) {
    return root.toSource();
  }

  // Remove unused import statements (except jsx-runtime)
  root.find(j.ImportDeclaration).forEach(importPath => {
    const importDecl = importPath.value;
    const source = importDecl.source.value;
    
    // Skip jsx-runtime imports
    if (source.includes('jsx-runtime')) {
      return;
    }
    
    if (source.includes('../components/')) {
      const specifiers = importDecl.specifiers || [];
      const usedSpecifiers = specifiers.filter(spec => {
        if (spec.type === 'ImportDefaultSpecifier') {
          // Handle default import (Prose)
          return usedComponents.has('Prose');
        }
        if (spec.type === 'ImportSpecifier' && spec.imported) {
          return usedComponents.has(spec.imported.name);
        }
        return false;
      });
      
      if (usedSpecifiers.length === 0) {
        // Remove entire import if no specifiers left
        j(importPath).remove();
      } else if (usedSpecifiers.length < specifiers.length) {
        // Update import with only used specifiers
        importPath.value.specifiers = usedSpecifiers;
      }
    }
  });

  // Remove unused case statements
  const switchPath = switchStatements.paths()[0];
  const switchNode = switchPath.value;
  switchNode.cases = switchNode.cases.filter(caseNode => {
    if (caseNode.test === null) {
      // Keep default case
      return true;
    }
    
    // Handle string literal cases
    if (caseNode.test.type === 'Literal') {
      return usedCases.has(caseNode.test.value);
    }
    
    return false;
  });

  return root.toSource();
};
