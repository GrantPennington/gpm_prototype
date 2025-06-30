const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');

const installPackages = () => {
    const gpmJsonPath = path.resolve(process.cwd(), 'gpm.json');
    const lockPath = path.resolve(process.cwd(), 'gpm-lock.json'); // lock file

    if (!fs.existsSync(gpmJsonPath)) {
        console.error('No gpm.json found in this directory.');
        process.exit(1);
    }
    // get dependencies from gpm.json
    const { dependencies } = JSON.parse(fs.readFileSync(gpmJsonPath, 'utf-8'));
    const modulesDir = path.resolve(process.cwd(), 'gpm_modules');
    const lockData = { name: path.basename(process.cwd()), dependencies: {} };

    if (!fs.existsSync(modulesDir)) {
        fs.mkdirSync(modulesDir);
    }

    for (const [name, value] of Object.entries(dependencies)) {
        const dest = path.join(modulesDir, name);

        if (fs.existsSync(dest)) {
            console.log(`${name} already installed.`);
            continue;
        }

        // Case 1: Local path (starts with ./ or ../)
        if (value.startsWith('.') || value.startsWith('/')) {
            const src = path.resolve(process.cwd(), value);
            copyFolderRecursiveSync(src, dest);
            console.log(`📁 Installed ${name} from local path`);

            // Add to lock file
            lockData.dependencies[name] = {
                version: "local",
                source: src
            };
        }
        // Case 2: Version string → fetch from registry
        else {
            const zipPath = path.join(
                os.homedir(),
                '.gpm-registry',
                name,
                value,
                `${name}-${value}.zip`
            );

            if (!fs.existsSync(zipPath)) {
                console.error(`❌ Could not find ${name}@${value} in local registry.`);
                continue;
            }

            const zip = new AdmZip(zipPath);
            zip.getEntries().forEach((entry) => {
                if (entry.entryName === 'gpm.json') return; // skip metadata
                zip.extractEntryTo(entry.entryName, dest, false, true);
            })
            console.log(`📦 Installed ${name}@${value} from registry`);

            // Add to lock file
            lockData.dependencies[name] = {
                version: value,
                source: "registry"
            };
        }
    }

    // Save gpm-lock.json
    fs.writeFileSync(lockPath, JSON.stringify(lockData, null, 2));
    console.log(`🔒 Lock file written to gpm-lock.json`);
};

const installOnePackage = (name, version) => {
    const gpmJsonPath = path.resolve(process.cwd(), 'gpm.json');

    let config = { name: 'unamed-project', dependencies: {} };
    if (fs.existsSync(gpmJsonPath)) {
        config = JSON.parse(fs.readFileSync(gpmJsonPath, 'utf-8'));
    }

    // 1. Add to gpm.json
    config.dependencies[name] = version;
    fs.writeFileSync(gpmJsonPath, JSON.stringify(config, null, 2));

    console.log(`📄 Updated gpm.json with ${name}@${version}`);

    // 2. Install it
    const dest = path.join(process.cwd(), 'gpm_modules', name);
    const zipPath = path.join(
        os.homedir(),
        '.gpm-registry',
        name,
        version,
        `${name}-${version}.zip`
    );

    if (!fs.existsSync(zipPath)) {
        console.error(`❌ Could not find ${name}@${version} in registry.`);
        return;
    }

    if (!fs.existsSync(path.dirname(dest))) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
    }

    const zip = new AdmZip(zipPath);
    zip.getEntries().forEach((entry) => {
        if (entry.entryName === 'gpm.json') return; // skip metadata
        zip.extractEntryTo(entry.entryName, dest, false, true);
    });

    console.log(`📦 Installed ${name}@${version} from registry`);

    // Update gpm-lock.json
    const lockPath = path.resolve(process.cwd(), 'gpm-lock.json');
    let lockData = { name: path.basename(process.cwd()), dependencies: {} };

    if (fs.existsSync(lockPath)) {
        lockData = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
    }

    lockData.dependencies[name] = {
        version,
        source: "registry"
    };

    fs.writeFileSync(lockPath, JSON.stringify(lockData, null, 2));
    console.log(`🔒 Updated gpm-lock.json`);
}

const copyFolderRecursiveSync = (src, dest) => {
    if (!fs.existsSync(src)) return;

    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    for (const file of fs.readdirSync(src)) {
        if (file === 'gpm.json') continue;

        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        if (fs.lstatSync(srcPath).isDirectory()) {
            copyFolderRecursiveSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
};

module.exports = { installPackages, installOnePackage };