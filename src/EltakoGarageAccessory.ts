import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { EltakoMiniSafe2Platform } from './platform';
import { IUpdatableAccessory } from './IUpdatableAccessory';

export class EltakoGarageAccessory implements IUpdatableAccessory {
  private service: Service;

  constructor(
    private readonly platform: EltakoMiniSafe2Platform,
    public readonly accessory: PlatformAccessory,
  ) {

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.info.vendor)
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.info.data)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.info.address);

    // https://developers.homebridge.io/#/service/GarageDoorOpener
    const serviceType = this.platform.Service.GarageDoorOpener;
    this.service = this.accessory.getService(serviceType) || this.accessory.addService(serviceType);

    this.service.getCharacteristic(this.platform.Characteristic.CurrentDoorState)
      .onGet(this.getCurrentDoorState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetDoorState)
      .onGet(this.getTargetDoorState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.ObstructionDetected)
      .onGet(this.getObstructionDetected.bind(this));
  }

  getCurrentDoorState(): CharacteristicValue {
    const state = this.platform.deviceStateCache.find(s => s.sid === this.accessory.context.device.info.sid);
    return state?.state?.doorState === 'closed'
      ? this.platform.Characteristic.CurrentDoorState.CLOSED
      : this.platform.Characteristic.CurrentDoorState.OPEN;
  }

  getTargetDoorState(): CharacteristicValue {
    return this.getCurrentDoorState() === this.platform.Characteristic.CurrentDoorState.OPEN
      ? this.platform.Characteristic.TargetDoorState.OPEN
      : this.platform.Characteristic.TargetDoorState.CLOSED;
  }

  getObstructionDetected(): CharacteristicValue {
    return false;
  }

  update() {
    this.service.getCharacteristic(this.platform.Characteristic.CurrentDoorState).updateValue(this.getCurrentDoorState());
    this.service.getCharacteristic(this.platform.Characteristic.TargetDoorState).updateValue(this.getTargetDoorState());
    this.service.getCharacteristic(this.platform.Characteristic.ObstructionDetected).updateValue(this.getObstructionDetected());
  }
}