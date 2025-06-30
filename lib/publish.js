const fs = require('fs');
const path = require('path');
const os = require('os');
const archiver = require('archiver');

const publishPackage = () => {
    const packagePath = process.cwd();
    const gpmJsonPath = path.join(packagePath, 'gpm.json');

    if (!fs.existsSync(gpmJsonPath)) {
        console.error('No gpm.json found. Are you in the root of the package?');
        process.exit(1);
    }

    const pkg = JSON.parse(fs.readFileSync(gpmJsonPath, 'utf-8'));
    const { name, version } = pkg;

    if (!name || !version) {
        console.error('gpm.json must include "name" and "version".');
        process.exit(1);
    }
    // create hidden folder for local registry
    const registryPath = path.join(os.homedir(), '.gpm-registry', name, version);

    fs.mkdirSync(registryPath, { recursive: true });

    const outPath = path.join(registryPath, `${name}-${version}.zip`);
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        console.log(`📦 Published ${name}@${version} to local registry`);
    });

    archive.on('error', (err) => {
        throw err;
    });

    archive.pipe(output);

    // Include everything except gpm_modules and node_modules
    archive.glob('**/*', {
        cwd: packagePath,
        ignore: ['gpm_modules/**', 'node_modules/**']
    });

    archive.finalize();
};

module.exports = { publishPackage };
