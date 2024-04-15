export class DeviceState {
  rssiPercentage?: number;
  pos?: number;
  sync?: boolean;
  rv?: number;
  rt?: number;
  lock?: boolean;
  type?: string;
  timeout?: boolean;
  illumination?: number;
  temperature?: number;
  humidity?: number;
  wind?: number;
  rain_state?: boolean;
  s1?: number;
  s2?: number;
  s3?: number;
  setpoint?: number;
  actualSetpoint?: number;
  level?: number;
  state?: string;
  operation_mode?: string;
  contact?: string;
  motion?: string;
}

export interface Device {
  type: string;
  sid: string;
  adr: string;
  deviceProtocol: string;
  senderID?: string;
  virtual: boolean;
  data: string;
  state: DeviceState;
}

export interface DeviceResponse {
  XC_SUC: Device[];
}


export interface Room {
  name: string;
  type: string;
  _pctImport?: boolean;
  index: number;
}

export interface DeviceInfo {
  op: number;
  sys: string;
  type: string;
  data: string;
  vendor: string;
  address: string;
  gateway: number;
  virtual: boolean;
  senderID?: string;
  sid: string;
  _target: string;
  deviceText?: string;
  br?: number | string;
}

export interface DeviceCloud {
  enabled: boolean;
}

export interface Device {
  name: string;
  room: number;
  info: DeviceInfo;
  index: number;
  cloud: DeviceCloud;
}

export interface GatewayInfo {
  ip: string;
  mac: string;
  hwv: string;
  vid: string;
  sys: string;
  name: string;
  server: string;
  version: string;
  gateway_vendor: string;
  password: string;
  firmware: string;
  sid: string;
  _token: string;
  _cloudAccessActive: boolean;
  _primary: boolean;
  _rcs?: boolean;
}

export interface GatewayDetailInfo {
  name: string;
  mhv: string;
  mfv: string;
  msv: string;
  hwv: string;
  vid: string;
  mem: number;
  ip: string;
  sn: string;
  gw: string;
  dns: string;
  mac: string;
  ntp: string;
  start: number;
  time: number;
  loc: string;
  serial: string;
  io: string;
  cfg: string;
  server: string;
  locked: boolean;
  wifi: string;
  rssi: number;
}

export interface Gateway {
  name: string;
  index: number;
  info: GatewayInfo;
}

export interface SystemConfig {
  rooms: Room[];
  devices: Device[];
  gateways: Gateway[];
  qrcodes: string[];
  actionlists: string[];
  schedules: string[];
  actions: string[];
}