import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { EltakoBlindsAccessory } from './EltakoBlindsAccessory';
import { EltakoContactAccessory } from './EltakoContactAccessory';
import { EltakoMotionAccessory } from './EltakoMotionAccessory';
import { EltakoDimmerAccessory } from './EltakoDimmerAccessory';
import { EltakoLightSensorAccessory } from './EltakoLightSensorAccessory';
import { EltakoSwitchAccessory } from './EltakoSwitchAccessory';
import { EltakoTemperatureAndHumiditySensorAccessory } from './EltakoTemperatureAndHumiditySensorAccessory';
import { MiniSafe2Api } from './MiniSafe2Api';
import { Device } from './models';
import { getChangedDeviceAddresses } from './StateChangeDetector';
import { IUpdatableAccessory } from './IUpdatableAccessory';
import { EltakoThermostatAccessory } from './EltakoThermostatAccessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class EltakoMiniSafe2Platform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];
  public readonly accessoryInstances: IUpdatableAccessory[] = [];

  public miniSafe!: MiniSafe2Api;
  public deviceStateCache: Device[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {

    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', async () => {

      this.log.info('Connecting to Eltako MiniSafe2 on ' + this.config.ip);

      try {
        this.miniSafe = new MiniSafe2Api(this.config.ip, this.config.password, this.config.accessToken);
        await this.updateDeviceStateCache();
        await this.discoverDevices();
      } catch (e) {
        if (typeof e === 'string') {
          this.log.error(e);
        } else if (e instanceof Error) {
          this.log.error(e.message);
        }
      }

      while (this.miniSafe) {

        await this.delay(this.config.queryLoopDelay * 1000);

        try {
          await this.updateDeviceStateCache();
        } catch (e) {
          if (typeof e === 'string') {
            this.log.error(e);
          } else if (e instanceof Error) {
            this.log.error(e.message);
          }
        }
      }
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  async updateDeviceStateCache() {
    this.log.info('Updating device state cache ...');

    const oldCache = this.deviceStateCache;
    const newCache = await this.miniSafe.getStates();

    this.deviceStateCache = newCache;

    // find the changed devices and force them to update
    const changedAddresses = getChangedDeviceAddresses(oldCache, newCache);

    for (const changedAddress of changedAddresses) {

      this.log.info(`Device ${changedAddress} did change`);

      const uuid = this.api.hap.uuid.generate(changedAddress);
      const existingAccessory = this.accessoryInstances.find(accessory => accessory.accessory.UUID === uuid);

      if (existingAccessory) {
        this.log.info(`Forcing update ${existingAccessory.accessory.displayName}`);
        existingAccessory.update();
      }
    }
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {

    this.log.info('Discovering devices ...');

    let systemConfig;

    try {
      systemConfig = await this.miniSafe.getSystems();
    } catch (e) {
      if (typeof e === 'string') {
        this.log.error(e);
      } else if (e instanceof Error) {
        this.log.error(e.message);
      }
    }

    if (!systemConfig) {
      return;
    }

    this.log.info('Found ' + systemConfig.devices.length + ' device(s)');

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of systemConfig.devices) {

      const deviceType = device.info.data;

      if (device.info.address === '' || deviceType === '') {
        this.log.warn('Could not find the unique address or device type for device: ' + JSON.stringify(device));
        break;
      }

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device.info.address);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`

        let instance: IUpdatableAccessory | null = null;

        switch (deviceType) {
          case 'a5-04-01':
          case 'a5-04-02':
          case 'a5-04-03': {
            instance = new EltakoTemperatureAndHumiditySensorAccessory(this, existingAccessory);
            break;
          }
          case 'eltako_blind':
          case 'eltako_tf_blind': {
            instance = new EltakoBlindsAccessory(this, existingAccessory);
            break;
          }
          case 'a5-14-09':
          case 'eltako_contact':
          case 'eltako_tf_contact': {
            instance = new EltakoContactAccessory(this, existingAccessory);
            break;
          }
          case 'eltako_motion':
          case 'eltako_tf_motion':
          case 'eltako_motion2': {
            instance = new EltakoMotionAccessory(this, existingAccessory);
            break;
          }
          case 'eltako_switch':
          case 'eltako_tf_switch':
          case 'eltako_fsr14': {
            instance = new EltakoSwitchAccessory(this, existingAccessory);
            break;
          }
          case 'eltako_dimmer':
          case 'eltako_tf_dimmer': {
            instance = new EltakoDimmerAccessory(this, existingAccessory);
            break;
          }
          case 'eltako_tf_lux': {
            instance = new EltakoLightSensorAccessory(this, existingAccessory);
            break;
          }
          case 'a5-20-04':
          case 'eltako_fhk':
          case 'eltako_ftaf':
          case 'eltako_futh_old':
          case 'eltako_futh':
          case 'eltako_tf_thermo': {
            instance = new EltakoThermostatAccessory(this, existingAccessory);
            break;
          }
        }

        if (instance) {
          this.accessoryInstances.push(instance);
        }

        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
        // create a new accessory
        const accessory = new this.api.platformAccessory(device.name, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;

        let instance: IUpdatableAccessory | null = null;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        switch (deviceType) {
          case 'a5-04-01':
          case 'a5-04-02':
          case 'a5-04-03': {
            instance = new EltakoTemperatureAndHumiditySensorAccessory(this, accessory);
            break;
          }
          case 'eltako_blind':
          case 'eltako_tf_blind': {
            instance = new EltakoBlindsAccessory(this, accessory);
            break;
          }
          case 'a5-14-09':
          case 'eltako_contact':
          case 'eltako_tf_contact': {
            instance = new EltakoContactAccessory(this, accessory);
            break;
          }
          case 'eltako_motion':
          case 'eltako_tf_motion':
          case 'eltako_motion2': {
            instance = new EltakoMotionAccessory(this, accessory);
            break;
          }
          case 'eltako_switch':
          case 'eltako_tf_switch':
          case 'eltako_fsr14': {
            instance = new EltakoSwitchAccessory(this, accessory);
            break;
          }
          case 'eltako_dimmer':
          case 'eltako_tf_dimmer': {
            instance = new EltakoDimmerAccessory(this, accessory);
            break;
          }
          case 'eltako_tf_lux': {
            instance = new EltakoLightSensorAccessory(this, accessory);
            break;
          }
          case 'a5-20-04':
          case 'eltako_fhk':
          case 'eltako_ftaf':
          case 'eltako_futh_old':
          case 'eltako_futh':
          case 'eltako_tf_thermo': {
            instance = new EltakoThermostatAccessory(this, accessory);
            break;
          }
        }

        if (instance) {
          this.accessoryInstances.push(instance);
        }

        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.name);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
