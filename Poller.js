const EventEmitter = require("events").EventEmitter;
const ModbusRTU = require("modbus-serial");
const Logger = require("./Logger");

const NORTH_OFFSET = process.env.NORTH_OFFSET ? parseInt(process.env.NORTH_OFFSET, 10) : 0;

class Poller {
    constructor() {
        this.eventEmitter = new EventEmitter();
        this.client = new ModbusRTU();

        this.interval = undefined;
    }

    async initialize() {
        if (!process.env.SERIALPORT) {
            Logger.error("SERIALPORT is not set.");

            process.exit(1);
        }

        const interval = process.env.POLL_INTERVAL || 5_000;

        await this.client.connectRTU(process.env.SERIALPORT, { baudRate: 9600 });
        this.client.setID(0x90);

        this.interval = setInterval(() => {
            this.poll().catch((err) => {
                Logger.warn("Error during poll", err);
            });
        }, interval);

        this.poll().catch(err => {
            Logger.warn("Error during initial poll", err)
        });
    }

    async poll() {
        let data;
        try {
            data = await this.client.readHoldingRegisters(0x0165, 9);
        } catch(err) {
            Logger.warn("Error while polling", err)
        }

        if (!data) {
            return;
        }

        const output = {
            LIGHT: data.buffer.readUInt16BE(0) * 10,
            UV: data.buffer.readUInt16BE(2) / 10,
            TEMP: (data.buffer.readUInt16BE(4) - 400) / 10,
            HUM: data.buffer.readUInt16BE(6),
            WIND: data.buffer.readUInt16BE(8) / 10,
            GUST: data.buffer.readUInt16BE(10) / 10,
            WIND_DIRECTION: data.buffer.readUInt16BE(12),
            RAIN: data.buffer.readUInt16BE(14) / 10,
            PRESSURE: data.buffer.readUInt16BE(16) / 10,
        };

        output.WIND_DIRECTION = (output.WIND_DIRECTION + NORTH_OFFSET + 360) % 360;

        this.emitData(output);
    }

    emitData(data) {
        this.eventEmitter.emit(Poller.EVENTS.Data, data);
    }

    onData(listener) {
        this.eventEmitter.on(Poller.EVENTS.Data, listener);
    }
}

Poller.EVENTS = {
    Data: "Data"
}

module.exports = Poller;
