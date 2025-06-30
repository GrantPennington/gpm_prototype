#!/usr/bin/env node

const { installPackages, installOnePackage } = require('../lib/install');
const { publishPackage } = require('../lib/publish');

const command = process.argv[2];

if(command === 'install'){
    const pkgArg = process.argv[3];

    if (pkgArg) {
        const [name, version] = pkgArg.split('@');

        if (!name || !version) {
            console.error('❌ Use: gpm install <name>@<version>');
            process.exit(1);
        }

        installOnePackage(name, version);
    } else {
        installPackages();
    }

} else if(command === 'publish') {
    publishPackage();
} else {
    console.log('Unknown command. Try: gpm install or gpm publish');
}