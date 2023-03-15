// Default behavior is to look for jest-puppeteer config in the root directory. This is to override
process.env.JEST_PUPPETEER_CONFIG = require.resolve('./jest-puppeteer.config.js');

module.exports = {
    preset: 'jest-puppeteer',
    roots: [ 'specs' ]
}