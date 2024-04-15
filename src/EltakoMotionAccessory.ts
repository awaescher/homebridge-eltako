import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { EltakoMiniSafe2Platform } from './platform';
import { IUpdatableAccessory } from './IUpdatableAccessory';

export class EltakoMotionAccessory implements IUpdatableAccessory {
  private service: Service;
  private hasOnOffState: boolean;

  constructor(
    private readonly platform: EltakoMiniSafe2Platform,
    public readonly accessory: PlatformAccessory,
  ) {
    const deviceType = accessory.context.device.info.data;
    this.hasOnOffState = deviceType === 'eltako_motion' || deviceType === 'eltako_motion2'; // not eltako_tf_motion

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.info.vendor)
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.info.data)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.info.address);

    // https://developers.homebridge.io/#/service/MotionSensor
    const serviceType = this.platform.Service.MotionSensor;
    this.service = this.accessory.getService(serviceType) || this.accessory.addService(serviceType);

    this.service.getCharacteristic(this.platform.Characteristic.MotionDetected)
      .onGet(this.getMotionDetected.bind(this));

    if (this.hasOnOffState) {
      this.service.getCharacteristic(this.platform.Characteristic.StatusActive)
        .onGet(this.getStatusActive.bind(this));
    }
  }

  getMotionDetected(): CharacteristicValue {
    const state = this.platform.deviceStateCache.find(s => s.sid === this.accessory.context.device.info.sid);
    return state?.state?.motion === 'true';
  }

  getStatusActive(): CharacteristicValue {
    const state = this.platform.deviceStateCache.find(s => s.sid === this.accessory.context.device.info.sid);
    return state?.state?.state === 'on';
  }

  update() {

    this.service.getCharacteristic(this.platform.Characteristic.MotionDetected).updateValue(this.getMotionDetected());

    if (this.hasOnOffState) {
      this.service.getCharacteristic(this.platform.Characteristic.StatusActive).updateValue(this.getStatusActive());
    }
  }
}