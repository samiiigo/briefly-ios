const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fewer parallel workers avoids jest-worker OOM on memory-constrained machines (Windows).
config.maxWorkers = 2;

module.exports = config;
