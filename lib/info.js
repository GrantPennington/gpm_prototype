const fs = require('fs');
const path = require('path');
const os = require('os');

const showPackageInfo = (name) => {
    const registryPath = path.join(os.homedir(), '.gpm-registry', name);

    if (!fs.existsSync(registryPath)) {
        console.error(`❌ No registry found for ${name}`);
        return;
    }

    const versions = fs
        .readdirSync(registryPath)
        .filter((v) =>
            fs.existsSync(path.join(registryPath, v, `${name}-${v}.zip`))
        );

    if (versions.length === 0) {
        console.warn(`⚠️ No published versions found for ${name}`);
        return;
    }

    console.log(`📦 Package: ${name}`);
    console.log(`📂 Found in registry: ${registryPath}`);
    console.log(`🔢 Available versions:\n  - ${versions.sort().join('\n  - ')}`);
};

module.exports = { showPackageInfo };