const Logger = require("./Logger");
const mqtt = require("mqtt");


class MqttClient {
    /**
     *
     * @param {import("./Poller")} poller
     */
    constructor(poller) {
        this.poller = poller;

        this.identifier = process.env.IDENTIFIER || "Garden";

        this.autoconfTimestamp = {};

        this.poller.onData((data) => {
            this.handleData(data);
        });
    }

    initialize() {
        const options = {
            clientId: `wittboy2mqtt_${this.identifier}_${Math.random().toString(16).slice(2, 9)}`,  // 23 characters allowed
        };

        if (process.env.MQTT_USERNAME) {
            options.username = process.env.MQTT_USERNAME;

            if (process.env.MQTT_PASSWORD) {
                options.password = process.env.MQTT_PASSWORD;
            }
        } else if (process.env.MQTT_PASSWORD) {
            // MQTT_PASSWORD is set but MQTT_USERNAME is not
            Logger.error("MQTT_PASSWORD is set but MQTT_USERNAME is not. MQTT_USERNAME must be set if MQTT_PASSWORD is set.");
            process.exit(1);
        }

        this.client = mqtt.connect(process.env.MQTT_BROKER_URL, options);

        this.client.on("connect", () => {
            Logger.info("Connected to MQTT broker");
        });

        this.client.on("error", (e) => {
            if (e && e.message === "Not supported") {
                Logger.info("Connected to non-standard-compliant MQTT Broker.");
            } else {
                Logger.error("MQTT error:", e.toString());
            }
        });

        this.client.on("reconnect", () => {
            Logger.info("Attempting to reconnect to MQTT broker");
        });
    }

    handleData(data) {
        this.ensureAutoconf(this.identifier);

        const baseTopic = `${MqttClient.TOPIC_PREFIX}/${this.identifier}`;

        const stringData = {}

        Object.entries(data).forEach(([key, value]) => {
            stringData[key] = `${value}`;
        })

        this.client.publish(`${baseTopic}/light`, stringData.LIGHT);
        this.client.publish(`${baseTopic}/uv_index`, stringData.UV);
        this.client.publish(`${baseTopic}/temperature`, stringData.TEMP);
        this.client.publish(`${baseTopic}/humidity`, stringData.HUM);
        this.client.publish(`${baseTopic}/wind_speed`, stringData.WIND);
        this.client.publish(`${baseTopic}/gust_speed`, stringData.GUST);
        this.client.publish(`${baseTopic}/wind_direction`, stringData.WIND_DIRECTION);
        this.client.publish(`${baseTopic}/rain`, stringData.RAIN);
        this.client.publish(`${baseTopic}/pressure`, stringData.PRESSURE);
    }

    ensureAutoconf(identifier) {
        // (Re-)publish every 4 hours
        if (Date.now() - (this.autoconfTimestamp ?? 0) <= 4 * 60 * 60 * 1000) {
            return;
        }
        const baseTopic = `${MqttClient.TOPIC_PREFIX}/${identifier}`;
        const discoveryTopic = "homeassistant/sensor/wittboy2mqtt";
        const device = {
            "manufacturer":"Ecowitt",
            "model":"WN90LP",
            "name":`Ecowitt Wittboy WN90LP ${identifier}`,
            "identifiers":[
                `wittboy2mqtt_${identifier}`
            ]
        };

        this.client.publish(
            `${discoveryTopic}/light/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/light`,
                "name": "Light",
                "unit_of_measurement": "lx",
                "device_class": "illuminance",
                "state_class": "measurement",
                "object_id": `wittboy2mqtt_${identifier}_light`,
                "unique_id": `wittboy2mqtt_${identifier}_light`,
                "expire_after": 300,
                "enabled_by_default": true,
                "device": device
            }),
            { retain: true }
        );

        this.client.publish(
            `${discoveryTopic}/uv_index/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/uv_index`,
                "name": "UV Index",
                "state_class": "measurement",
                "object_id": `wittboy2mqtt_${identifier}_uv_index`,
                "unique_id": `wittboy2mqtt_${identifier}_uv_index`,
                "expire_after": 300,
                "enabled_by_default": true,
                "device": device
            }),
            { retain: true }
        );

        this.client.publish(
            `${discoveryTopic}/temperature/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/temperature`,
                "name": "Temperature",
                "unit_of_measurement": "°C",
                "device_class": "temperature",
                "state_class": "measurement",
                "object_id": `wittboy2mqtt_${identifier}_temperature`,
                "unique_id": `wittboy2mqtt_${identifier}_temperature`,
                "expire_after": 300,
                "enabled_by_default": true,
                "device": device
            }),
            { retain: true }
        );

        this.client.publish(
            `${discoveryTopic}/humidity/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/humidity`,
                "name": "Humidity",
                "unit_of_measurement": "%",
                "device_class": "humidity",
                "state_class": "measurement",
                "object_id": `wittboy2mqtt_${identifier}_humidity`,
                "unique_id": `wittboy2mqtt_${identifier}_humidity`,
                "expire_after": 300,
                "enabled_by_default": true,
                "device": device
            }),
            { retain: true }
        );

        this.client.publish(
            `${discoveryTopic}/wind_speed/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/wind_speed`,
                "name": "Wind Speed",
                "unit_of_measurement": "m/s",
                "device_class": "wind_speed",
                "state_class": "measurement",
                "object_id": `wittboy2mqtt_${identifier}_wind_speed`,
                "unique_id": `wittboy2mqtt_${identifier}_wind_speed`,
                "expire_after": 300,
                "enabled_by_default": true,
                "device": device
            }),
            { retain: true }
        );

        this.client.publish(
            `${discoveryTopic}/gust_speed/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/gust_speed`,
                "name": "Gust Speed",
                "unit_of_measurement": "m/s",
                "device_class": "wind_speed",
                "state_class": "measurement",
                "object_id": `wittboy2mqtt_${identifier}_gust_speed`,
                "unique_id": `wittboy2mqtt_${identifier}_gust_speed`,
                "expire_after": 300,
                "enabled_by_default": true,
                "device": device
            }),
            { retain: true }
        );

        this.client.publish(
            `${discoveryTopic}/wind_direction/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/wind_direction`,
                "name": "Wind Direction",
                "unit_of_measurement": "°",
                "state_class": "measurement",
                "object_id": `wittboy2mqtt_${identifier}_wind_direction`,
                "unique_id": `wittboy2mqtt_${identifier}_wind_direction`,
                "expire_after": 300,
                "enabled_by_default": true,
                "device": device
            }),
            { retain: true }
        );

        this.client.publish(
            `${discoveryTopic}/rain/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/rain`,
                "name": "Rain",
                "unit_of_measurement": "mm",
                "device_class": "precipitation",
                "state_class": "measurement",
                "object_id": `wittboy2mqtt_${identifier}_rain`,
                "unique_id": `wittboy2mqtt_${identifier}_rain`,
                "expire_after": 300,
                "enabled_by_default": true,
                "device": device
            }),
            { retain: true }
        );

        this.client.publish(
            `${discoveryTopic}/pressure/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/pressure`,
                "name": "Pressure",
                "unit_of_measurement": "hPa",
                "device_class": "pressure",
                "state_class": "measurement",
                "object_id": `wittboy2mqtt_${identifier}_pressure`,
                "unique_id": `wittboy2mqtt_${identifier}_pressure`,
                "expire_after": 300,
                "enabled_by_default": true,
                "device": device
            }),
            { retain: true }
        );

        this.autoconfTimestamp = Date.now();
    }
}

MqttClient.TOPIC_PREFIX = "wittboy2mqtt";

module.exports = MqttClient;
