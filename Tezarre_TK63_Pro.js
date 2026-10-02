export function Name() { return "Tezarre TK63 Pro"; }
export function VendorId() { return 0x0461; }
export function ProductId() { return 0x4003; }
export function Publisher() { return "Community"; }
export function Size() { return [15, 5]; }
export function DefaultPosition() { return [40, 140]; }
export function DefaultScale() { return 8.0; }
export function Type() { return "Hid"; }
export function DeviceType() { return "keyboard"; }
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters() {
	return [
		{property:"shutdownColor", group:"lighting", label:"Shutdown Color", description:"Color applied when SignalRGB or the system shuts down", min:"0", max:"360", type:"color", default:"#000000"},
		{property:"LightingMode", group:"lighting", label:"Lighting Mode", description:"Canvas follows the active effect, Forced uses one color", type:"combobox", values:["Canvas", "Forced"], default:"Canvas"},
		{property:"forcedColor", group:"lighting", label:"Forced Color", description:"Color used in Forced mode", min:"0", max:"360", type:"color", default:"#009bde"},
	];
}

export function DeviceMessages() {
	return [{ property: "Single Zone", message: "Single Zone", tooltip: "In live mode this keyboard's firmware takes one color for all keys; it shows the average color of the effect under it." }];
}

// Protocol: the keyboard is a ROYUAN design (as are many Akko/Epomaker boards); SignalRGB's own
// Royuan plugin and OpenRGB's RoyuanKeyboardController use the same commands, under VID 0x3151.
// 64-byte feature reports (report ID 0) on interface 0; byte 8 is a checksum, 0xFF minus the sum
// of bytes 1-7.
//   07 15 04 04 07 00 00   switch the lighting to direct (live) mode
//   0E RR GG BB 00 00 00   set the live color
// The live color isn't saved by the keyboard.
const REPORT_SIZE = 65;
const MIN_FRAME_MS = 30;
const KEEPALIVE_MS = 1000;  // resend an unchanged color now and then, in case the keyboard reset

// Points across the key area whose colors are averaged.
const SAMPLE_POINTS = [];
for (let y = 0; y < 5; y++) {
	for (let x = 0; x < 15; x += 2) { SAMPLE_POINTS.push([x, y]); }
}

export function LedNames() { return ["Keyboard"]; }
export function LedPositions() { return [[7, 2]]; }

export function Validate(endpoint) {
	return endpoint.interface === 0 && endpoint.usage === 0x0006 && endpoint.usage_page === 0x0001;
}

export function ImageUrl() {
	return "https://raw.githubusercontent.com/maverickphp/signalrgb-tezarre-tk63-pro/main/assets/tezarre-tk63-pro.png";
}

function command(bytes) {
	const packet = new Array(REPORT_SIZE).fill(0);
	let sum = 0;
	for (let i = 0; i < 7; i++) {
		packet[1 + i] = bytes[i] || 0;
		sum += packet[1 + i];
	}
	packet[8] = (0xFF - (sum & 0xFF)) & 0xFF;
	device.send_report(packet, REPORT_SIZE);
}

function directMode() {
	command([0x07, 0x15, 0x04, 0x04, 0x07, 0x00, 0x00]);
}

function sendColor(color) {
	command([0x0E, color[0], color[1], color[2], 0x00, 0x00, 0x00]);
}

function averageCanvasColor() {
	let r = 0, g = 0, b = 0;
	for (const [x, y] of SAMPLE_POINTS) {
		const c = device.color(x, y);
		r += c[0]; g += c[1]; b += c[2];
	}
	const n = SAMPLE_POINTS.length;
	return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

let lastFrame = 0;
let lastSent = null;
let lastSentAt = 0;

export function Initialize() {
	device.setName("Tezarre TK63 Pro");
	device.setImageFromUrl(ImageUrl());
	directMode();
}

export function Render() {
	const now = Date.now();
	if (now - lastFrame < MIN_FRAME_MS) {
		return;
	}
	lastFrame = now;
	const color = LightingMode === "Forced" ? hexToRgb(forcedColor) : averageCanvasColor();
	const changed = !lastSent || color.some((v, i) => v !== lastSent[i]);
	if (changed || now - lastSentAt > KEEPALIVE_MS) {
		sendColor(color);
		lastSent = color;
		lastSentAt = now;
	}
}

export function Shutdown(SystemSuspending) {
	sendColor(hexToRgb(SystemSuspending ? "#000000" : shutdownColor));
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}
