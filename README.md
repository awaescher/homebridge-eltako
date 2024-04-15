<p align="center">

<img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

# Homebridge Eltako Plugin for MiniSafe2

This plugin adds the devices from your [Eltako MiniSafe2](https://www.eltako.com/en/product/professional-smart-home-en/controllers-and-gateways-enocean-zigbee-knx-dali-mqtt-and-much-more/minisafe2/) to Apple HomeKit.

> If you like this plugin, please leave a star ⭐

![GFA5 and HomeKit app](docs/Header.png)
Background image by [R Architecture on Unsplash](https://unsplash.com/de/fotos/brauner-holzsitz-neben-weissem-holztisch-TRCJ-87Yoh0)

# Why?

Bringing your devices to HomeKit will open up the door to a lot of features without any additional effort:
- control your devices from anywhere in the world without using a VPN and without opening any router ports
- control your devices with Siri on your iPhone, iPad, Mac, Apple Watch, HomePod, Apple TV etc.
- control your devices with HomeKit scenes and combine them with other HomeKit devices
- control your devices from [widgets](https://support.apple.com/en-us/HT207122) and [shortcuts](https://support.apple.com/en-us/guide/shortcuts/welcome/ios)
- control your devices in logical groups, like _"turn off all lights in the living room"_ or _"lock every door"_

# Requirements

If you have your home setup up and running in the [Eltako GFA5](https://apps.apple.com/app/eltako-gfa5/id1555852467) app and you want to control your devices with Apple HomeKit, this is the right plugin for you.

If you are not sure yet, here's what you need:
 - The devices you want to control need to be calibrated
 - The devices you want to control need to be known to an [Eltako MiniSafe2](https://www.eltako.com/en/product/professional-smart-home-en/controllers-and-gateways-enocean-zigbee-knx-dali-mqtt-and-much-more/minisafe2/) in your local network
   - The home setup you are using in your GFA5 app has to be saved to the MiniSafe2 [(see here)](<docs/GFA5 Controller Settings.png>)
- The plugin needs the HomeSafe2 [ip address](<docs/GFA5 Controller Settings.png>) and the password to access it

If you don't have a MiniSafe2 in your network, this plugin won't be able to control any devices. Ask your electrician how to get a MiniSafe2 up and running in your environment.

# Supported devices

Right now, the following devices are supported:

|Device (tag "data")|HomeKit service|State|Comment
|-|-|-|-|
|`eltako_blind` `eltako_tf_blind`| [Window Covering](https://developers.homebridge.io/#/service/WindowCovering)|🟢||
|`eltako_contact` `eltako_tf_contact` `a5-14-09`|[Contact Sensor](https://developers.homebridge.io/#/service/ContactSensor)|🟢||
|`eltako_dimmer` `eltako_tf_dimmer`|[Lightbulb](https://developers.homebridge.io/#/service/Lightbulb)|🟢||
|`eltako_switch` `eltako_tf_switch` `eltako_fsr14`|[Switch](https://developers.homebridge.io/#/service/Switch) or [Lightbulb](https://developers.homebridge.io/#/service/Lightbulb)|🟢|HomeKit service depending on the devices' `target`, which can be configured in the GFA5 app|
|`a5-04-01` `a5-04-02` `a5-04-03`|[TemperatureSensor](https://developers.homebridge.io/#/service/TemperatureSensor) and [HumiditySensor](https://developers.homebridge.io/#/service/HumiditySensor)|🟢|[a5-04-02 tested successfully](https://github.com/awaescher/homebridge-eltako-minisafe2/issues/3#issuecomment-1872514207)
|`eltako_tf_lux`|[Light sensor](https://developers.homebridge.io/#/service/LightSensor)|🟢|
|`eltako_fhk` `eltako_ftaf` `eltako_futh` `eltako_futh_old`|[Thermostat](https://developers.homebridge.io/#/service/Thermostat)|🟢| Only `eltako_fhk` has a heating/cooling state. `eltako_futh` and `eltako_futh_old` also expose humidity values
|`eltako_weather`|-|⚪|Eltako uses weather data from [openweathermap.org](https://openweathermap.org). Use [homebridge-weather-plus](https://www.npmjs.com/package/homebridge-weather-plus) instead, as it makes use of the same data but offers many more features|

I don't have any other devices to test. Donations welcome 😉

# FAQ

## Can I rename devices in HomeKit?

Yes, this plugin uses the [devices' unique addresses](https://github.com/awaescher/homebridge-eltako-minisafe2/blob/e5a77008cca516e5d79038ba9dc688a794019892/src/platform.ts#L149) to reference them. This means that the name in the Eltako- and in the HomeKit-app can be changed at any time with no side effects. When the plugin adds the device to HomeKit for the very first time, the name from the MiniSafe2 config is used but you can change it at any time in HomeKit.

## Is this plugin compatible with other gateways?

As far as I could find out, the [Mediola V6 Mini](https://www.mediola.com/wp-content/uploads/datenblatt_V6-Mini_V6-Mini_E_Rev1_2019.pdf) is using the same design as the MiniSafe2 internally and should therefore work. Mediola has other gateways available which might not be compatible. 

While it looks pretty much the same on first sight, I was told that the [wibutler](https://shop.wibutler.com/zentrale/) is not compatible to the MiniSafe2 design.

If you have a gateway from Mediola, wibutler or any other manufacturer I don't know yet, I'd be happy to hear your feedback.

# Limitations

## Constant polling

The MiniSafe2 does not support active change notifications, that's why values have to be polled regularly. In addition to this, the MiniSafe2 does not allow to poll the state of specific devices but returns the state of every single device for every poll. These polls can get really huge and take up to a few seconds, which leads to a small delay to recognize state changes from outside of HomeKit.

The official GFA5 app is not faster, though. According to the network traffic it causes, it has to rely on these heavy polls, too.

## Slow mass operations ([#4](https://github.com/awaescher/homebridge-eltako-minisafe2/issues/4))

If the MiniSafe2 manages a lot of devices, setting the states of many devices at once can be slow. For example, "Hey Siri, turn off all the lights" might take a while to be fully processed if your home setup contains many lights. It seems that the MiniSafe2 has to process all incoming request sequentially.

## Uncommunicative blinds 

Blinds will only report their absolute position once they stopped. They won't provide any target values or their current state (going up, going down, stopped).

# Endpoints

I managed to reverse engineer some api endpoints the GFA5 app is using. The complete URL is always the IP address of the MiniSafe2, a route from the table below plus either the device password with &`XC_PASS=...` or an access token with `&at=...`. 

Example:
```
http://192.168.178.123/cmd?XC_FNC=GetStates&XC_PASS=MyKillerPassword 
```

The GFA5 app is using the access token instead of the password. You can sniff your network traffic for the access token but I don't know how long it will be valid.

|Route|Function|
|-|-|
|`/cmd?XC_FNC=GetStates`|All devices with their full state|
|`/cmd?XC_FNC=GetSI`|Any kind of system data + location and weather data|
|`/info`|Information about the MiniSafe2|
|`/file/config/iqpro/systems.json`|The configuration saved on the MiniSafe2: All rooms, devices, tasks, etc.|
|`/file/config/iqpro/config.json`|Unknown|
|`/file/config/iqpro/macros.json`|Unknown, maybe scenes|

The file and folder structure under `/file` can be explored by shortening the path accordingly. In this structure, I found some sound files too.

You can control devices via `POST` to the `/cmd` endpoint with a json body like this:

```
{
  "XC_FNC": "SendGenericCmd",
  "id": "DEVICE-SID-FROM-SYSTEMS.JSON",
  "data":
  {
    "cmd": "COMMAND",
  },
};
```

For switches, the GFA5 app always sends the `toggle` command. However, `on` and `off` also work to send defined states. For shutters/blinds, the command `moveToXXX` can be sent, where XXX stands for the target position (0-100). These also support `up` and `down`.

# Helping out

Everything I know about the MiniSafe2 api comes entirely from reverse engineering. That way I can only provide the information that my setup delivers. This means that neither the API endpoints nor the parameters are complete. Please let me know if you find official resources or get answers from Eltako. 

It would also be very helpful if you could provide me with data from your setups (anonymized of course, be careful with access tokens in the URLs). I could collect these next to [my dumps in this repository](https://github.com/awaescher/homebridge-eltako-minisafe2/tree/latest/dumps).

# Disclaimer

This plugin brings inofficial HomeKit support for some Eltako devices. It is not affiliated with Eltako GmbH or any other person except myself.

Everything this plugin is able to do was reverse engineered. This way, this plugin will never support 100% of the devices and commands. Any help finding API resources is highly welcome.

I wrote this plugin for fun, use it at your own risk.

# Building

``` bash
npm version patch/minor/major
npm run build
npm publish
git push 
git push --tags
```