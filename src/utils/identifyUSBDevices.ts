import { SerialPort } from 'serialport';
import { Transform } from 'stream';
import { IConfig } from '../config';

const cobs = require('cobs');

interface IKnownDevicePort {
  id: string
  path: string
}

interface ISerialPortPort {
  path: string
  manufacturer?: string
  serialNumber?: string
  pnpId?: string
  locationId?: string
  vendorId?: string
  productId?: string
}

type IInitFunction = (device: IDevice, config: IConfig) => Promise<Object> | undefined

export interface IDevice {
  id: string,
  path: string
  lib: Function
  init: IInitFunction
  options: {}
}

export interface IDevices {
  [key: string]: IDevice
}

export interface IExpectedDevice {
  id: string
  lib: Function
  init: IInitFunction
  options?: {}
}

export interface IKnownDevice {
  id: string
  manufacturer: string
  vendorId: string
  productId: string
}

export interface IUSBDevices {
  expectedDevices: IExpectedDevice[]
  knownDevices: IKnownDevice[]
  ignoredPorts: string[]
}

class Parser extends Transform {
  buffer: Buffer;

  constructor() {
    super();

    this.buffer = Buffer.alloc(0);
  }

  _transform(chunk: Buffer, encoding: string, callback: () => void) {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    const decodedPacket = cobs.decode(this.buffer).slice(0, -1);
    const identifier = decodedPacket.toString();

    this.buffer = Buffer.alloc(0);
    this.emit('data', identifier);

    callback();
  }
}

const identify = (path: string): Promise<string> => {
  console.log(`Attempting to identify device on ${path} ...`);

  return new Promise((resolve, reject) => {
    const port = new SerialPort({ path, baudRate: 115200 });
    const parser = port.pipe(new Parser());
    const timeout = setTimeout(() => {
      if (port.isOpen) {
        port.close();
      }

      reject(`Unable to get device identifier for ${path}`);
    }, 5000);

    parser.on('data', (identifier: string) => {
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

const filterIgnoredPorts = (ignorePorts: string[], ports: ISerialPortPort[]): ISerialPortPort[] => {
  return ports.filter(({ path }) => ignorePorts.indexOf(path) === -1);
}

const getPortsKnownDevices = (knownDevices: IKnownDevice[], ports: ISerialPortPort[]): IKnownDevicePort[] => {
  return ports.map(port => {
    const device = knownDevices.find(({ vendorId, productId }) => vendorId === port.vendorId && productId === port.productId);

    return {
      id: device?.id || '',
      path: port.path,
    }
  })
}

const identifyUnknownDevices = async (expectedDevices: IExpectedDevice[], devices: IKnownDevicePort[]): Promise<IDevice[]> => {
  const knownExpectedDevices: IDevice[] = devices
    .filter(device => expectedDevices.find(({ id }) => id === device.id))
    .map(device => {
      const knownExpectedDevice = expectedDevices.find(({ id }) => id === device.id);

      return {
        ...device,
        lib: knownExpectedDevice!.lib,
        init: knownExpectedDevice!.init,
        options: knownExpectedDevice!.options || {},
      }
    });

  const unknownDevices = devices.filter(device => !knownExpectedDevices.find(({ id }) => id === device.id))
  const unknownExpectedDevices: IDevice[] = [];

  for (let i = 0; i < unknownDevices.length; i += 1) {
    const device = unknownDevices[i];

    try {
      const deviceIdentifier = await identify(device.path);
      const unknownExpectedDevice = expectedDevices.find(({ id }) => id === deviceIdentifier);

      if (unknownExpectedDevice) {
        unknownExpectedDevices.push({
          ...device,
          lib: unknownExpectedDevice.lib,
          init: unknownExpectedDevice.init,
          options: unknownExpectedDevice.options || {},
        })
      }
    } catch(error) {
      console.log(`Failed to identify device on path ${device.path}`);
    }
  }

  return [
    ...knownExpectedDevices,
    ...unknownExpectedDevices,
  ];
}

const convertDeviceArrayToObject = (devices: IDevice[]): IDevices => {
  return devices.reduce((acc: IDevices, device) => {
    acc[device.id] = { ...device };

    return acc;
  }, {});
}

export default ({ expectedDevices, knownDevices, ignoredPorts }: IUSBDevices): Promise<IDevices> => {
  return new Promise(resolve => {
    SerialPort.list()
      .then(filterIgnoredPorts.bind(null, ignoredPorts))
      .then(getPortsKnownDevices.bind(null, knownDevices))
      .then(identifyUnknownDevices.bind(null, expectedDevices))
      .then(convertDeviceArrayToObject)
      .then(resolve);
  });
};