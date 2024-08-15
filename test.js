const Logger = require("./Logger");
const Poller = require("./Poller");

if (process.env.LOGLEVEL) {
    Logger.setLogLevel(process.env.LOGLEVEL);
}

const poller = new Poller();

poller.onData((data) => {
    Logger.info(`Data: ${JSON.stringify(data)}`)
})

poller.initialize().then(() => {
    Logger.info("Initialized");
})