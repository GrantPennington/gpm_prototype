const fs = require('fs');
const path = require('path');

const installPackages = () => {
    const gpmJsonPath = path.resolve(process.cwd(), 'gpm.json');
    if (!fs.existsSync(gpmJsonPath)) {
        console.error('No gpm.json found in this directory.');
        process.exit(1);
    }

    const { dependencies } = JSON.parse(fs.readFileSync(gpmJsonPath, 'utf-8'));
    const modulesDir = path.resolve(process.cwd(), 'gpm_modules');

    if (!fs.existsSync(modulesDir)) {
        fs.mkdirSync(modulesDir);
    }

    for (const [name, sourcePath] of Object.entries(dependencies)) {
        const src = path.resolve(process.cwd(), sourcePath);
        const dest = path.join(modulesDir, name);

        copyFolderRecursiveSync(src, dest);
        console.log(`Installed ${name}`);
    }
};

const copyFolderRecursiveSync = (src, dest) => {
    if (!fs.existsSync(src)) return;

    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    for (const file of fs.readdirSync(src)) {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        if (fs.lstatSync(srcPath).isDirectory()) {
            copyFolderRecursiveSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
};

module.exports = { installPackages };