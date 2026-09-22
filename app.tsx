import { useEffect, useRef } from "react";
import {
  definePluginApp,
  experimental_useProviders,
  experimental_useSidebarThreads,
} from "@get-bb/plugin-sdk/app";
import {
  isCanvasDark,
  providerLabel,
  providerMarkSvg,
  resolveMarkColor,
  resolveMarkFilter,
  type ProviderIconTint,
} from "./lib/provider-marks";

const ICON_SIZE = 14;

type ProviderTintSource = {
  id: string;
  strings?: { iconTint?: ProviderIconTint };
};

function providerTint(
  providers: readonly ProviderTintSource[],
  providerId: string,
): ProviderIconTint | undefined {
  return providers.find((provider) => provider.id === providerId)?.strings?.iconTint;
}

function injectProviderIcons(
  threads: readonly { id: string; providerId: string }[],
  providers: readonly ProviderTintSource[],
) {
  const byId = new Map(threads.map((thread) => [thread.id, thread.providerId]));
  const dark = isCanvasDark();
  for (const target of Array.from(document.querySelectorAll("[data-sidebar-thread-id]"))) {
    const id = target.getAttribute("data-sidebar-thread-id");
    if (!id) continue;
    const providerId = byId.get(id);
    if (!providerId) continue;

    // [data-sidebar-thread-id] is an `absolute inset-0` click overlay covering
    // the whole row, so anything drawn inside it stacks on top of the title.
    // The row itself is the flex line; its first <span> child is the title
    // container (`flex min-w-0 flex-1 items-center gap-1.5`), which centers and
    // spaces the mark for us.
    const row = target.parentElement;
    if (!row) continue;
    const container = row.querySelector(":scope > span") as HTMLElement | null;
    if (!container) continue;

    let icon = row.querySelector("[data-thread-provider-icon]") as HTMLElement | null;
    if (icon && icon.parentElement !== container) {
      icon.remove();
      icon = null;
    }
    if (!icon) {
      icon = document.createElement("span");
      icon.dataset.threadProviderIcon = "1";
      icon.style.cssText = `display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;width:${ICON_SIZE}px;height:${ICON_SIZE}px`;
      container.insertBefore(icon, container.firstChild);
    }

    const label = providerLabel(providerId);
    const color = resolveMarkColor(providerId, providerTint(providers, providerId), dark);
    icon.style.color = color;
    icon.style.filter = resolveMarkFilter(providerId, dark);
    if (icon.dataset.threadProvider !== providerId) {
      icon.dataset.threadProvider = providerId;
      icon.innerHTML = providerMarkSvg(providerId, ICON_SIZE);
    }
    if (icon.title !== label) icon.title = label;
  }
}

function SidebarProviderIcons() {
  const { threads } = experimental_useSidebarThreads();
  const { providers } = experimental_useProviders();
  const threadsRef = useRef(threads);
  const providersRef = useRef(providers as readonly ProviderTintSource[]);
  threadsRef.current = threads;
  providersRef.current = providers as readonly ProviderTintSource[];
  const signature = [
    threads.map((thread) => `${thread.id}:${thread.providerId}`).join(","),
    (providers as readonly ProviderTintSource[])
      .map((provider) => {
        const tint = provider.strings?.iconTint;
        return `${provider.id}:${tint?.light ?? ""}:${tint?.dark ?? ""}`;
      })
      .join(","),
  ].join("|");

  useEffect(() => {
    let frame = 0;
    let disposed = false;
    const options: MutationObserverInit = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    };

    // injectProviderIcons writes into the observed tree. Detach while writing
    // and coalesce on a frame so a burst of sidebar updates yields to the event
    // loop; otherwise the observer re-triggers itself forever.
    const apply = () => {
      frame = 0;
      if (disposed) return;
      observer.disconnect();
      try {
        injectProviderIcons(threadsRef.current, providersRef.current);
      } finally {
        if (!disposed) observer.observe(document.documentElement, options);
      }
    };

    const schedule = () => {
      if (frame || disposed) return;
      frame = window.requestAnimationFrame(apply);
    };

    const observer = new MutationObserver(schedule);
    schedule();
    observer.observe(document.documentElement, options);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [signature]);
  return null;
}

export default definePluginApp((app) => {
  // Overlay, not experimental_threadList: the list slot is exclusive, and in
  // bb 0.42 experimental_Original is a no-props shim. Rendering it crashes the
  // replacement, bb falls back to the native list, and the injector unmounts.
  app.slots.experimental_appOverlay({
    id: "thread-provider-icons",
    component: SidebarProviderIcons,
  });
});
