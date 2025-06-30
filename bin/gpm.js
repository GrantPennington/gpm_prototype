#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { installPackages, installOnePackage } = require('../lib/install');
const { uninstallPackage } = require('../lib/uninstall');
const { publishPackage } = require('../lib/publish');

const command = process.argv[2];

if(command === 'install'){
    const pkgArg = process.argv[3];

    if (pkgArg) {
        let name, version;

        if (pkgArg.includes('@')) {
            [name, version] = pkgArg.split('@');
        } else {
            name = pkgArg;
            // Try to resolve latest version from registry
            const registryPath = path.join(os.homedir(), '.gpm-registry', name);

            if (!fs.existsSync(registryPath)) {
                console.error(`❌ No registry found for ${name}`);
                process.exit(1);
            }

            const versions = fs.readdirSync(registryPath).filter((v) =>
                fs.existsSync(path.join(registryPath, v, `${name}-${v}.zip`))
            );

            if (versions.length === 0) {
                console.error(`❌ No versions available for ${name}`);
                process.exit(1);
            }

            // Get latest version
            const semver = require('semver');
            version = '^' + semver.maxSatisfying(versions, '*');

            console.log(`📄 Defaulted to ${name}@${version}`);
        }

        installOnePackage(name, version);
    } else {
        installPackages(); // install from gpm.json
    }
} else if(command === 'publish') {
    publishPackage();
} else if (command === 'uninstall') {
    const pkgName = process.argv[3];
    if (!pkgName) {
        console.error('❌ Use: gpm uninstall <package-name>');
        process.exit(1);
    }
    uninstallPackage(pkgName);
} else {
    console.log('Unknown command. Try: gpm install or gpm publish');
}