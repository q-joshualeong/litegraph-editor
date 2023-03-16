module.exports = {
    launch: {
        headless: true,
        args: [ "--window-size=1366,768", "--ignore-certificate-errors"],
        product: "chrome"
    },
    browserContext: "default",
    server: {
        command: "node src/server.js",
        port: 8000
    }
}