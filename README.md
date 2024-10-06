# Nodebot

### .env settings
There are `.env` file settings per robot implementation. These are located at `robots/<robot-name>/.env`.

#### Required settings

**TELEMETRY_PUBLIC_FOLDER**

This should point to the `dist` directory of the locally installed `nodebot-telemetry-dashboard`.

#### Optional settings
**ENABLE_OBSERVATIONS**

This will enable the observations controller which takes lidar and odometry sensor data to show lidar data from the pose point of view.

**ENABLE_IMU**

This will enable the IMU for the `nodebot-differential-drive` package.

**ENABLE_ICP**

This does nothing at the moment.

### Prerequisites
- A wireless network (as configured on the Raspberry Pi) is available (it doesn't have to be connected to the internet)
- A browser on an external device (i.e. laptop or smartphone) is available to navigate to the telemetry dashboard running on `<device-name>.local:3000`.

### Start commands

To start any of the pre-configured robots use the following commands:

- `cd robots/<robot-name>`
- `node index.js`