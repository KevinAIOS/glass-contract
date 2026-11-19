import type {Command, CommandName, Header, Result} from "../src/index.js"

export function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error.code)
  return result.value
}

export const header: Header = {
  schema_version: 1,
  device_session: "session-1",
  generation: 2,
  sequence: 1,
  timestamp: 1788600000000,
  correlation_id: "request-1",
}
export const device = {id: "device-1", name: "Reference", profile: "aios.device.camera-audio-reference" as const}
export const commands = {
  "aios.device.cancel": {},
  "aios.display.dashboard": {},
  "aios.display.enabled": {enabled: true},
  "aios.microphone.preferred": {source: "device"},
  "aios.microphone.vad": {enabled: false},
  "aios.microphone.loudness": {enabled: true},
  "aios.speaker.playback-state": {playing: false},
  "aios.photo.field-of-view": {degrees: 118, vertical: "center"},
  "aios.photo.tuning": {noise_reduction: true, gain: true},
  "aios.photo.warmup": {request_id: "warmup-1", size: "high", duration_ms: 15000},
  "aios.photo.warmup-stop": {request_id: "warmup-1"},
  "aios.video.defaults": {width: 1280, height: 720, fps: 30},
  "aios.video.duration": {minutes: 5},
  "aios.status.clock": {timestamp_ms: 1788600000000},
  "aios.status.ping": {},
  "aios.link.inspect": {},
  "aios.ready.inspect": {},
  "aios.discovery.start": {profile: device.profile},
  "aios.discovery.stop": {},
  "aios.device.pair": {device},
  "aios.device.reconnect": {},
  "aios.device.disconnect": {},
  "aios.device.forget": {},
  "aios.input.observe": {enabled: true},
  "aios.display.present": {text: "你好，AIOS", x: 0, y: 1, font_size: 16},
  "aios.display.clear": {},
  "aios.microphone.configure": {enabled: true, source: "device", encoding: "lc3"},
  "aios.speaker.volume": {level: 1},
  "aios.speaker.route": {enabled: true},
  "aios.photo.capture": {size: "medium", save: true, sound: true, compression: "none"},
  "aios.gallery.list": {},
  "aios.gallery.sync": {},
  "aios.gallery.cancel": {},
  "aios.gallery.inspect": {},
  "aios.gallery.configure": {enabled: true},
  "aios.video.start": {recording_id: "recording-1", save: true, sound: true, width: 1280, height: 720, fps: 30},
  "aios.video.stop": {recording_id: "recording-1"},
  "aios.video.inspect": {},
  "aios.stream.start": {destination: "rtmp://192.168.1.20/live/local", capture_audio: true},
  "aios.stream.stop": {},
  "aios.wifi.scan": {},
  "aios.wifi.connect": {ssid: "本地网络", password: "local-only-password"},
  "aios.wifi.forget": {ssid: "本地网络"},
  "aios.wifi.hotspot": {enabled: true},
  "aios.led.set": {enabled: true, color: "green", on_ms: 100, off_ms: 200, repetitions: 2},
  "aios.status.inspect": {},
  "aios.version.inspect": {},
  "aios.ota.inspect": {},
  "aios.ota.start": {manifest_uri: "http://192.168.1.20/manifest.json"},
  "aios.imu.configure": {enabled: true},
} satisfies {[K in CommandName]: Extract<Command, {name: K}>["payload"]}

export const command = (name: CommandName): Command =>
  ({...header, kind: "aios.command", name, payload: commands[name]} as Command)
