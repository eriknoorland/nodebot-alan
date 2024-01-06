const { Transform } = require('stream');
const { SerialPort } = require('serialport');
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

    this.buffer = Buffer.alloc(0);
    this.emit('data', identifier);

    callback();
  }
}

function filterIgnoredPorts(unwantedPorts, ports) {
  const filteredPorts = ports.filter(({ path }) => unwantedPorts.indexOf(path) === -1);

  return Promise.resolve(filteredPorts);
}

function getPortsKnownDevices(knownDevices, ports) {
  const returnArray = [];

  ports.forEach(port => {
    const { path } = port;
    const device = knownDevices.find(({ vendorId, productId }) => vendorId === port.vendorId && productId === port.productId);
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
    const knownExpectedDevice = expectedDevices.find(({ id }) => id === device.id);

    if (device.id) {
      device.package = knownExpectedDevice.package;
      device.init = knownExpectedDevice.init;
      device.options = knownExpectedDevice.options;
      continue;
    }

    try {
      const deviceIdentifier = await identify(device.path);
      const unknownExpectedDevice = expectedDevices.find(({ id }) => id === deviceIdentifier);

      if (unknownExpectedDevice) {
        device.id = deviceIdentifier;
        device.package = unknownExpectedDevice.package;
        device.init = unknownExpectedDevice.init;
        device.options = unknownExpectedDevice.options;
      }
    } catch(error) {
      console.log(error);
      devices.splice(i, 1);
      i -= 1;
    }
  }

  return Promise.resolve(devices);
}

function identify(path) {
  console.log(`Attempting to identify device on ${path}`);

  return new Promise((resolve, reject) => {
    const port = new SerialPort(path, { baudRate: 115200 });
    const parser = port.pipe(new Parser());
    const timeout = setTimeout(() => {
      if (port.isOpen) {
        port.close();
      }

      reject(`Unable to get device identifier for ${path}`);
    }, 5000);

    parser.on('data', identifier => {
      console.log(`Device "${identifier}" identified on ${path}`);
      port.close();
      clearTimeout(timeout);
      resolve(identifier);
    });

    port.on('open', () => {
      setTimeout(() => {
        if (port.isOpen) {
          port.write(cobs.encode(Buffer.from([0xAA, 0xAA, 0xAA, 0xAA]), true));
        }
      }, 2000);
    });
  });
}

function convertDeviceArrayToObject(devices) {
  const returnObject = devices.reduce((acc, device) => {
    acc[device.id] = {
      path: device.path,
      package: device.package,
      init: device.init,
      options: device.options,
    };

    return acc;
  }, {});

  return Promise.resolve(returnObject);
}

module.exports = ({ expectedDevices, knownDevices, ignoredPorts }) => {
  return new Promise(resolve => {
    SerialPort.list()
      .then(filterIgnoredPorts.bind(null, ignoredPorts))
      .then(getPortsKnownDevices.bind(null, knownDevices))
      .then(identifyUnknownDevices.bind(null, expectedDevices))
      .then(convertDeviceArrayToObject)
      .then(resolve);
  });
};