const fs = require('fs');
const path = require('path');

const uninstallPackage = (name) => {
    const modulesDir = path.resolve(process.cwd(), 'gpm_modules');
    const gpmJsonPath = path.resolve(process.cwd(), 'gpm.json');
    const lockPath = path.resolve(process.cwd(), 'gpm-lock.json');

    const packagePath = path.join(modulesDir, name);

    // 1. Delete from gpm_modules/
    if (fs.existsSync(packagePath)) {
        fs.rmSync(packagePath, { recursive: true, force: true });
        console.log(`🗑️ Removed ${name} from gpm_modules`);
    } else {
        console.warn(`⚠️ ${name} not found in gpm_modules`);
    }

    // 2. Remove from gpm.json
    if (fs.existsSync(gpmJsonPath)) {
        const json = JSON.parse(fs.readFileSync(gpmJsonPath, 'utf-8'));
        if (json.dependencies && json.dependencies[name]) {
            delete json.dependencies[name];
            fs.writeFileSync(gpmJsonPath, JSON.stringify(json, null, 2));
            console.log(`📄 Removed ${name} from gpm.json`);
        }
    }

    // 3. Remove from gpm-lock.json
    if (fs.existsSync(lockPath)) {
        const lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
        if (lock.dependencies && lock.dependencies[name]) {
            delete lock.dependencies[name];
            fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));
            console.log(`🔒 Removed ${name} from gpm-lock.json`);
        }
    }
};

module.exports = { uninstallPackage };