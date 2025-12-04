import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resourcesDir = path.join(__dirname, '../viewer/public/resources');
const manifestPath = path.join(resourcesDir, 'manifest.json');

function getResourceIds(dir: string): number[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir)
    .filter(file => /^\d+\.agi/.test(file))
    .map(file => parseInt(file.split('.')[0], 10))
    .sort((a, b) => a - b);
}

const manifest = {
  pics: getResourceIds(path.join(resourcesDir, 'pic')),
  views: getResourceIds(path.join(resourcesDir, 'view')),
  sounds: getResourceIds(path.join(resourcesDir, 'sound')),
  logics: getResourceIds(path.join(resourcesDir, 'logic')),
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
log.success('Created manifest.json');
log.step(`${manifest.pics.length} pictures`);
log.step(`${manifest.views.length} views`);
log.step(`${manifest.sounds.length} sounds`);
log.step(`${manifest.logics.length} logic scripts`);
