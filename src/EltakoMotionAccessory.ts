import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { EltakoMiniSafe2Platform } from './platform';
import { IUpdatableAccessory } from './IUpdatableAccessory';

export class EltakoMotionAccessory implements IUpdatableAccessory {
  private service: Service;
  private hasBrightnessSensor: boolean;

  constructor(
    private readonly platform: EltakoMiniSafe2Platform,
    public readonly accessory: PlatformAccessory,
  ) {

    const deviceType = accessory.context.device.info.data;
    this.hasBrightnessSensor = deviceType === 'eltako_motion' || deviceType === 'eltako_motion2';

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.info.vendor)
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.info.data)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.info.address);

    // https://developers.homebridge.io/#/service/MotionSensor
    const serviceType = this.platform.Service.MotionSensor;
    this.service = this.accessory.getService(serviceType) || this.accessory.addService(serviceType);

    this.service.getCharacteristic(this.platform.Characteristic.MotionDetected)
      .onGet(this.getMotionDetected.bind(this));

    if (this.hasBrightnessSensor) {
      this.service.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
        .onGet(this.getCurrentAmbientLightLevel.bind(this));
    }
  }

  getMotionDetected(): CharacteristicValue {
    const state = this.platform.deviceStateCache.find(s => s.sid === this.accessory.context.device.info.sid);

    // eltako_tf_motion uses motion=true
    // eltako_motion and eltako_motion2 use state=on
    return state?.state?.motion === 'true' || state?.state?.state === 'on';
  }

  getCurrentAmbientLightLevel(): CharacteristicValue {
    const state = this.platform.deviceStateCache.find(s => s.sid === this.accessory.context.device.info.sid);
    return state?.state?.illumination ?? 0;
  }

  update() {
    this.service.getCharacteristic(this.platform.Characteristic.MotionDetected).updateValue(this.getMotionDetected());
    if (this.hasBrightnessSensor) {
      this.service.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel).updateValue(this.getCurrentAmbientLightLevel());
    }
  }
}