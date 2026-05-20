import mqtt from 'mqtt';

// IoT Expert Note: 
// Use these settings for ESP32 configuration.
// Default Broker: public hivemq (Change to local IP for production)
// Trigger GPIO on ESP32: GPIO 13 (Standard Relay)

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com';
const GATE_COMMAND_TOPIC = 'sociosmart/gate/command';
const SIREN_COMMAND_TOPIC = 'sociosmart/siren/command';

class MqttService {
  constructor() {
    this.client = mqtt.connect(MQTT_BROKER, {
      reconnectPeriod: 5000, // Wait 5 seconds between retries to avoid DNS hammering
      connectTimeout: 30 * 1000,
    });

    this.client.on('connect', () => {
      console.log(`[IoT Service] MQTT Connected to ${MQTT_BROKER}`);
    });

    this.client.on('error', (err) => {
      if (err.code === 'EAI_AGAIN') {
        console.warn(`[IoT Service] MQTT DNS Lookup failed (Transient). Retrying in 5s...`);
      } else {
        console.error('[IoT Service] MQTT Critical Error:', err);
      }
    });
  }

  publishGateCommand(action = 'OPEN') {
    const payload = JSON.stringify({
      action: action,
      timestamp: Date.now(),
      origin: 'SocioSmart_Backend'
    });

    this.client.publish(GATE_COMMAND_TOPIC, payload, { qos: 1 });

    // Sync to Firebase gateControl/command path
    try {
      import('axios').then(({ default: axios }) => {
        const cmd = action.toLowerCase();
        axios.put('https://car-scaning-default-rtdb.firebaseio.com/gateControl.json', { command: cmd })
          .catch(e => console.log('[Firebase RTDB Sync] Error:', e.message));
      });
    } catch (e) {}

    return { topic: GATE_COMMAND_TOPIC, payload: action };
  }

  publishSirenCommand(status = 'ON') {
    const payload = JSON.stringify({
      status: status,
      timestamp: Date.now(),
      origin: 'SocioSmart_Emergency_Hub'
    });

    this.client.publish(SIREN_COMMAND_TOPIC, payload, { qos: 2 }, (err) => {
      if (err) {
        console.error('[IoT SOS] Siren Trigger Failed:', err);
      } else {
        console.log(`[IoT SOS] Siren [${status}] sent to topic: ${SIREN_COMMAND_TOPIC}`);
      }
    });

    return { topic: SIREN_COMMAND_TOPIC, payload: status };
  }
}

export default new MqttService();
