const Transform = require('stream').Transform;
const SerialPort = require('serialport');
const cobs = require('cobs');

class Parser extends Transform {
  constructor() {
    super();

    this.buffer = Buffer.alloc(0);
  }

  _transform(chunk, encoding, callback) {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    const decodedPacket = cobs.decode(this.buffer).slice(0, -1);
    const identifier = decodedPacket.toString();

    this.emit('data', identifier);

    callback();
  }
}

function filterUnwantedPorts(unwantedPorts, ports) {
  const filteredPorts = ports.filter(({ path }) => unwantedPorts.indexOf(path) === -1);

  return Promise.resolve(filteredPorts);
}

function getPortsKnownDevices(knownDevices, ports) {
  const returnArray = [];

  ports.forEach(port => {
    const device = knownDevices.find(({ vendorId, productId }) => vendorId === port.vendorId && productId === port.productId);
    const { path } = port;
    let id = null;

    if (device) {
      id = device.id;
    }

    returnArray.push({ id, path });
  });

  return Promise.resolve(returnArray);
}

async function identifyUnknownDevices(expectedDevices, devices) {
  for (let i = 0; i < devices.length; i += 1) {
    const device = devices[i];

    if (device.id) {
      continue;
    }

    try {
      const deviceIdentifier = await identify(device.path);

      if (expectedDevices.indexOf(deviceIdentifier) !== -1) {
        device.id = deviceIdentifier;
      }
    } catch(error) {
      console.log(error);
      devices.splice(i, 1);
    }
  }

  return Promise.resolve(devices);
}

function identify(path) {
  return new Promise((resolve, reject) => {
    const port = new SerialPort(path, { baudRate: 115200 });
    const parser = port.pipe(new Parser());
    const timeout = setTimeout(() => {
      port.close();
      reject(`Unable to get device identifier for ${path}`);
    }, 5000);

    parser.on('data', identifier => {
      port.close();
      clearTimeout(timeout);
      resolve(identifier);
    });

    port.on('open', () => {
      setTimeout(() => {
        port.write(cobs.encode(Buffer.from([0xAA, 0xAA, 0xAA, 0xAA]), true));
      }, 2000);
    });
  });
}

function convertDeviceArrayToObject(devices) {
  const returnObject = devices.reduce((acc, device) => {
    acc[device.id] = device.path;

    return acc;
  }, {});

  return Promise.resolve(returnObject);
}

module.exports = (expectedDevices, knownDevices) => {
  const unwantedPorts = ['/dev/tty.Bluetooth-Incoming-Port'];

  return new Promise(resolve => {
    SerialPort.list()
      .then(filterUnwantedPorts.bind(null, unwantedPorts))
      .then(getPortsKnownDevices.bind(null, knownDevices))
      .then(identifyUnknownDevices.bind(null, expectedDevices))
      .then(convertDeviceArrayToObject)
      .then(resolve);
  });
};