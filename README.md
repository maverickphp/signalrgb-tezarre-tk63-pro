# SignalRGB plugin: Tezarre TK63 Pro

<p align="center">
  <img src="https://static.store-cdn.com/files/19643/Images/tezarre-tk63-pro-gaming-keyboard-price-in-pakistan-junaidtec-19643-2255195-161124081125815.jpg" alt="Tezarre TK63 Pro 60% keyboard" width="420">
  <br>
  <sub>The Tezarre TK63 Pro, a 63-key 60% keyboard with arrow keys.</sub>
</p>

Lets [SignalRGB](https://signalrgb.com) drive the lighting of the **Tezarre TK63 Pro** 60% keyboard
over its USB cable (USB `0461:4003`, reported as "ROYUAN Gaming keyboard").

## What it can do

The keyboard follows your SignalRGB effect live. In live mode its firmware takes **one color for
all keys**, so the plugin shows the average color of the effect under the keyboard; per-key
effects become a single blended color. The live color isn't saved to the keyboard, and its own
lighting modes (Fn shortcuts) still work when SignalRGB isn't running.

## Install

1. In SignalRGB, open **Addons** and add this repo's GitHub URL.
2. Quit SignalRGB from the tray icon and open it again. **Tezarre TK63 Pro** shows up under Devices.

The keyboard must be connected with the USB cable; 2.4 GHz and Bluetooth aren't supported.

## Settings

| Setting | What it does |
|---|---|
| Lighting Mode | `Canvas` follows the active effect, `Forced` uses one color |
| Forced Color | Color for `Forced` mode |
| Shutdown Color | Color sent when SignalRGB or Windows shuts down |

## Protocol

The keyboard is a ROYUAN design, like many Akko and Epomaker boards. SignalRGB's own Royuan plugin
and [OpenRGB](https://gitlab.com/CalcProgrammer1/OpenRGB)'s `RoyuanKeyboardController` use the
same commands under Royuan's vendor ID `0x3151`; Tezarre's firmware reports `0x0461` instead.

64-byte feature reports with report ID `0` on interface 0 (usage page `0x0001`, usage `0x06`).
Byte 8 is a checksum: `0xFF` minus the sum of bytes 1-7.

```text
07 15 04 04 07 00 00 D4   switch the lighting to direct (live) mode
0E RR GG BB 00 00 00 cs   set the live color
```

`tools/test_plugin.mjs` runs the plugin against a fake SignalRGB runtime
(`node tools/test_plugin.mjs`). `tools/hid_list.py` lists the keyboard's HID interfaces and report
sizes (`pip install hidapi`).

## License

[GPL-3.0](LICENSE). The protocol comes from OpenRGB (GPL-2.0-or-later) and SignalRGB's Royuan plugin.
