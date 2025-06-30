const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');
const semver = require('semver');

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
            // Get available versions from registry
            const registryBase = path.join(os.homedir(), '.gpm-registry', name);
            if (!fs.existsSync(registryBase)) {
                console.error(`❌ No registry found for ${name}`);
                continue;
            }

            const availableVersions = fs
                .readdirSync(registryBase)
                .filter(v => fs.existsSync(path.join(registryBase, v, `${name}-${v}.zip`)));

            const bestVersion = semver.maxSatisfying(availableVersions, value);

            if (!bestVersion) {
                console.error(`❌ No version of ${name} satisfies range "${value}"`);
                continue;
            }

            const zipPath = path.join(registryBase, bestVersion, `${name}-${bestVersion}.zip`);
            const zip = new AdmZip(zipPath);
            zip.getEntries().forEach((entry) => {
                if (entry.entryName === 'gpm.json') return;
                zip.extractEntryTo(entry.entryName, dest, false, true);
            });

            console.log(`📦 Installed ${name}@${bestVersion} from registry`);

            lockData.dependencies[name] = {
                version: bestVersion,
                source: "registry"
            };
        }
    }

    // Save gpm-lock.json
    fs.writeFileSync(lockPath, JSON.stringify(lockData, null, 2));
    console.log(`🔒 Lock file written to gpm-lock.json`);
};

const installOnePackage = (name, versionRange) => {
    const gpmJsonPath = path.resolve(process.cwd(), 'gpm.json');
    const lockPath = path.resolve(process.cwd(), 'gpm-lock.json');
    const modulesDir = path.resolve(process.cwd(), 'gpm_modules');

    // 1. Update gpm.json
    let config = { name: 'unnamed-project', dependencies: {} };
    if (fs.existsSync(gpmJsonPath)) {
        config = JSON.parse(fs.readFileSync(gpmJsonPath, 'utf-8'));
    }
    config.dependencies[name] = versionRange;
    fs.writeFileSync(gpmJsonPath, JSON.stringify(config, null, 2));
    console.log(`📄 Updated gpm.json with ${name}@${versionRange}`);

    // 2. Resolve version
    const registryPath = path.join(os.homedir(), '.gpm-registry', name);
    if (!fs.existsSync(registryPath)) {
        console.error(`❌ No registry found for ${name}`);
        return;
    }

    const versions = fs.readdirSync(registryPath).filter((v) =>
        fs.existsSync(path.join(registryPath, v, `${name}-${v}.zip`))
    );

    const bestVersion = semver.maxSatisfying(versions, versionRange);
    if (!bestVersion) {
        console.error(`❌ Could not find ${name}@${versionRange} in registry.`);
        return;
    }

    // 3. Install
    const dest = path.join(modulesDir, name);
    if (!fs.existsSync(modulesDir)) {
        fs.mkdirSync(modulesDir);
    }

    const zipPath = path.join(registryPath, bestVersion, `${name}-${bestVersion}.zip`);
    const zip = new AdmZip(zipPath);
    zip.getEntries().forEach((entry) => {
        if (entry.entryName === 'gpm.json') return;
        zip.extractEntryTo(entry.entryName, dest, false, true);
    });

    console.log(`📦 Installed ${name}@${bestVersion} from registry`);

    // 4. Update gpm-lock.json
    let lockData = { name: config.name || 'unnamed-project', dependencies: {} };
    if (fs.existsSync(lockPath)) {
        lockData = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
    }
    lockData.dependencies[name] = {
        version: bestVersion,
        source: "registry"
    };
    fs.writeFileSync(lockPath, JSON.stringify(lockData, null, 2));
    console.log(`🔒 Updated gpm-lock.json`);
};

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