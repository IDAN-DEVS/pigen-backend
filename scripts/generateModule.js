#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Effect: Generates boilerplate files for a new module (model, type, service, controller, validation schema, route) and updates route registration
// Input: Module name as a command-line argument (e.g., Setting)
// Output: Creates files in src/ and updates src/routes/index.ts

// --- CONFIG ---
const SRC = path.join(__dirname, '../src');
const MODULES = {
  model: { dir: 'models', suffix: 'Model.ts' },
  type: { dir: 'types', suffix: 'Type.ts' },
  service: { dir: 'services', suffix: 'Service.ts' },
  controller: { dir: 'controllers', suffix: 'Controller.ts' },
  schema: { dir: 'validation/schemas', suffix: 'Schema.ts' },
  route: { dir: 'routes', suffix: 'Route.ts' },
};

// --- HELPERS ---
function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}
function toPascalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}
function writeFileIfNotExists(filePath, content) {
  if (fileExists(filePath)) {
    console.log(`⚠️  File exists, skipping: ${filePath}`);
    return false;
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Created: ${filePath}`);
  return true;
}

// --- TEMPLATES ---
function getModelTemplate(name) {
  return `import { I${name} } from '../types/${toCamelCase(name)}Type';
import { getBaseModel, getBaseSchema } from './baseModel';

const ${name}Schema = getBaseSchema<I${name}>({
  // TODO: Add fields
});

export const ${name}Model = getBaseModel<I${name}>('${name}', ${name}Schema);
`;
}
function getTypeTemplate(name) {
  return `import { IBaseDocument } from './baseType';

export interface I${name} extends IBaseDocument {
  // TODO: Add fields
}
`;
}
function getServiceTemplate(name) {
  return `export const ${toCamelCase(name)}Service = {
  // TODO: Add service methods
};
`;
}
function getControllerTemplate(name) {
  return `export const ${toCamelCase(name)}Controller = {
  // TODO: Add controller methods
};
`;
}
function getSchemaTemplate(name) {
  return `import Joi from 'joi';

const create${name} = Joi.object({
  // TODO: Add validation fields
});

export const ${toCamelCase(name)}ValidationSchema = {
  create${name},
};
`;
}
function getRouteTemplate(name) {
  return `import { Router } from 'express';
import { ${toCamelCase(name)}Controller } from '../controllers/${toCamelCase(name)}Controller';

export const ${toCamelCase(name)}Router = Router();

// TODO: Add routes, e.g.:
// ${toCamelCase(name)}Router.post('/', ${toCamelCase(name)}Controller.create${name});
`;
}

// --- MAIN ---
function main() {
  const rawArg = process.argv[2];
  if (!rawArg) {
    console.error(
      '❌ Please provide a module name. Example: node scripts/generateModule.js Setting',
    );
    process.exit(1);
  }
  const Name = toPascalCase(rawArg);
  const name = toCamelCase(rawArg);

  // 1. Create files
  const files = [
    { key: 'model', template: getModelTemplate(Name) },
    { key: 'type', template: getTypeTemplate(Name) },
    { key: 'service', template: getServiceTemplate(Name) },
    { key: 'controller', template: getControllerTemplate(Name) },
    { key: 'schema', template: getSchemaTemplate(Name) },
    { key: 'route', template: getRouteTemplate(Name) },
  ];
  files.forEach(({ key, template }) => {
    const { dir, suffix } = MODULES[key];
    const fileName = `${name}${suffix}`;
    const filePath = path.join(SRC, dir, fileName);
    writeFileIfNotExists(filePath, template);
  });

  // 2. Update src/routes/index.ts
  const routesIndexPath = path.join(SRC, 'routes', 'index.ts');
  if (!fileExists(routesIndexPath)) {
    console.warn('⚠️  src/routes/index.ts not found. Skipping route registration.');
    return;
  }
  let indexContent = fs.readFileSync(routesIndexPath, 'utf8');
  const importLine = `import { ${name}Router } from './${name}Route';`;
  const useLine = `router.use('/${name}', ${name}Router);`;
  if (!indexContent.includes(importLine)) {
    // Insert import after last import
    const lastImport = [...indexContent.matchAll(/^import .+;$/gm)].pop();
    if (lastImport) {
      const idx = lastImport.index + lastImport[0].length;
      indexContent = indexContent.slice(0, idx) + '\n' + importLine + indexContent.slice(idx);
    } else {
      indexContent = importLine + '\n' + indexContent;
    }
  }
  if (!indexContent.includes(useLine)) {
    // Insert use after last router.use
    const lastUse = [...indexContent.matchAll(/router\.use\(.+\);/gm)].pop();
    if (lastUse) {
      const idx = lastUse.index + lastUse[0].length;
      indexContent = indexContent.slice(0, idx) + '\n' + useLine + indexContent.slice(idx);
    } else {
      indexContent += '\n' + useLine + '\n';
    }
  }
  fs.writeFileSync(routesIndexPath, indexContent, 'utf8');
  console.log(`✅ Route registered in src/routes/index.ts`);
}

main();
