#!/usr/bin/env node

const { installPackages } = require('../lib/install');

const command = process.argv[2];

if(command === 'install'){
    installPackages();
} else {
    console.log('Unknown command. Try: gpm install');
}