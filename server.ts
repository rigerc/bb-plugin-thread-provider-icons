// Thread Provider Icons is a frontend-only feature — the sidebar marks are
// drawn entirely in app.tsx from data the host already hands the plugin. BB
// still requires a server entry, so this one defines the settings schema
// (read in app.tsx via useSettings()) and reports for duty.
import type { BbPluginApi } from "@get-bb/plugin-sdk";

export default async function plugin(bb: BbPluginApi) {
  bb.settings.define({
    iconColor: {
      type: "select",
      label: "Icon color",
      description:
        "Brand uses each provider's own color. Monochrome uses a single muted tone. Accent uses BB's accent color. Theme follows the sidebar text color.",
      options: ["brand", "monochrome", "accent", "theme"],
      default: "brand",
    },
    iconLeftSpacing: {
      type: "number",
      label: "Left spacing",
      description: "Pixels of space before the provider mark (0-32).",
      default: 0,
    },
    iconRightSpacing: {
      type: "number",
      label: "Right spacing",
      description:
        "Pixels of space between the provider mark and the thread title (0-32).",
      default: 4,
    },
    selectedIconColor: {
      type: "select",
      label: "Selected thread color",
      description:
        "Color of the provider mark on the currently open thread. Match follows the Icon color setting.",
      options: ["match", "brand", "monochrome", "accent", "theme"],
      default: "match",
    },
  });
  bb.log.info("loaded — sidebar provider marks are drawn by the app bundle");
}
