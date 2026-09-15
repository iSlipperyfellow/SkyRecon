import paho.mqtt.client as mqtt
import subprocess
import json
import logging
import sys

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "skyrecon/host/commands"

running_processes = {}

def on_connect(client, userdata, flags, rc):
    logging.info(f"Connected to MQTT broker with code {rc}")
    client.subscribe(MQTT_TOPIC)
    logging.info(f"Subscribed to {MQTT_TOPIC}")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        action = payload.get("action")
        script = payload.get("script")
        
        logging.info(f"Received command: action={action}, script={script}")
        
        script_path = None
        if script == "airsim_client.py":
            script_path = "client/airsim_client.py"
        elif script == "drone_simulator.py":
            script_path = "client/drone_simulator.py"
        else:
            logging.error("Unknown script requested.")
            return

        if action == "start":
            if script in running_processes and running_processes[script].poll() is None:
                logging.info(f"{script} is already running.")
            else:
                logging.info(f"Starting {script_path}...")
                process = subprocess.Popen([sys.executable, script_path])
                running_processes[script] = process
                logging.info(f"Started with PID {process.pid}")
                
        elif action == "stop":
            if script in running_processes and running_processes[script].poll() is None:
                logging.info(f"Terminating {script} (PID {running_processes[script].pid})...")
                running_processes[script].terminate()
                running_processes[script].wait()
                logging.info(f"{script} terminated.")
            else:
                logging.info(f"{script} is not running.")
    except Exception as e:
        logging.error(f"Error processing message: {e}")

if __name__ == "__main__":
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    
    logging.info("Starting SkyRecon Host Agent...")
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_forever()
    except KeyboardInterrupt:
        logging.info("Shutting down Host Agent...")
        for script, proc in running_processes.items():
            if proc.poll() is None:
                proc.terminate()
