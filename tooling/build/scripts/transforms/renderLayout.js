const fs = require('fs');
const path = require('path');

// Read the schema analysis results
const analysisPath = path.join(__dirname, '..', '..', 'schema-analysis.json');
let usedLayouts = [];
try {
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
  usedLayouts = analysis.layouts || [];
} catch (error) {
  throw new Error(`Error reading schema-analysis.json: ${error.message}`);
}

// Read LAYOUT_MAPPINGS from the library
const layoutMappingsPath = path.join(__dirname, '..', '..', 'node_modules', '@opengovsg', 'isomer-components', 'dist', 'esm', 'constants', 'layoutMappings.js');
let layoutToComponent = {};
try {
  const mappingsContent = fs.readFileSync(layoutMappingsPath, 'utf8');
  // Extract the object from: export const LAYOUT_MAPPINGS = { ... };
  const objectMatch = mappingsContent.match(/export\s+const\s+LAYOUT_MAPPINGS\s*=\s*({[\s\S]*?});/);
  if (objectMatch) {
    // Safely evaluate the object (it's from our own node_modules)
    layoutToComponent = eval(`(${objectMatch[1]})`);
  }
} catch (error) {
  throw new Error(`Error reading LAYOUT_MAPPINGS: ${error.message}`);
}

// Determine which layouts are used
const usedLayoutComponents = new Set();
const usedLayoutCases = new Set();

usedLayouts.forEach(layout => {
  if (layoutToComponent[layout]) {
    usedLayoutComponents.add(layoutToComponent[layout]);
    usedLayoutCases.add(layout);
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

  // Remove unused import statements
  root.find(j.ImportDeclaration).forEach(importPath => {
    const importDecl = importPath.value;
    if (importDecl.source && importDecl.source.value.includes('../layouts/')) {
      const specifiers = importDecl.specifiers || [];
      const usedSpecifiers = specifiers.filter(spec => {
        if (spec.type === 'ImportSpecifier' && spec.imported) {
          return usedLayoutComponents.has(spec.imported.name);
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
    
    if (caseNode.test.type === 'Literal') {
      const caseValue = caseNode.test.value;
      return usedLayoutCases.has(caseValue);
    }
    
    return false;
  });

  return root.toSource();
};
