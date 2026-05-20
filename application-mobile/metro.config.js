const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Contournement du bug "Error: spawn UNKNOWN" sous Windows avec Node.js 24
// En définissant maxWorkers à 1 et en activant les worker threads, Metro n'utilise pas child_process.fork()
config.maxWorkers = 1;
config.transformer.unstable_workerThreads = true;

module.exports = config;
