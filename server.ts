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
  });
  bb.log.info("loaded — sidebar provider marks are drawn by the app bundle");
}
