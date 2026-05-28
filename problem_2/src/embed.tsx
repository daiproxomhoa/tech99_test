/**
 * Custom-element entry: registers <swap-widget> globally. Drop this script
 * tag on any page and the widget can be embedded with a single HTML tag.
 *
 *   <script src="https://your-cdn/swap.iife.js"></script>
 *   <swap-widget theme="auto"></swap-widget>
 *
 * Attributes:
 *  - theme="auto|dark|light"  default = "auto"
 *
 * Locale is auto-detected from navigator.language (en / vi).
 *
 * Why a Web Component: shadow root isolates Tailwind CSS so the host page
 * can't accidentally style us, and we can't bleed into the host.
 */
import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { LocaleProvider } from "./i18n/LocaleProvider";
import { ThemeRootContext } from "./hooks/useTheme";
import { PortalRootContext } from "./components/ui/Dialog";
import { WidgetModeContext } from "./lib/widgetMode";
// Vite ?inline imports the compiled CSS as a string so we can inject it
// into the shadow root without leaking to document.
import bundledCss from "./styles/globals.css?inline";

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap";

/**
 * Shadow-root-scoped overrides. The compiled Tailwind CSS targets `:root`,
 * `html`, `body`, and `#root` — none of which exist inside a shadow tree.
 * Re-bind the CSS variables and base styles onto our wrapper instead.
 */
/**
 * Theme contract for host CSS overrides.
 *
 * The widget reads its colors from `--bg`, `--surface`, etc. inside the
 * shadow root, with default values that fall back to host-page CSS variables
 * (`--swap-bg`, `--swap-surface`, …). To retheme from outside:
 *
 *   swap-widget {
 *     --swap-accent: 0 84% 60%;          // HSL triplet, NO hsl() wrapper
 *     --swap-bg: 220 20% 95%;
 *     --swap-radius: 20px;
 *     --swap-font-family: "Geist", sans-serif;
 *   }
 *
 *   swap-widget.dark, swap-widget[theme="dark"] {
 *     --swap-accent-dark: 280 90% 70%;   // separate dark override
 *   }
 *
 * Outer layout (width, height, margin, border-radius, box-shadow, etc.)
 * works directly — `swap-widget` is a plain block element on the host page.
 */
const SHADOW_BASE_CSS = `
:host {
  display: block;
  width: 100%;
}
.swap-widget-root {
  /* Light defaults — each var falls back to a host-settable --swap-* var */
  --bg: var(--swap-bg, 220 30% 98%);
  --surface: var(--swap-surface, 0 0% 100%);
  --surface-2: var(--swap-surface-2, 220 20% 96%);
  --border: var(--swap-border, 220 16% 90%);
  --fg: var(--swap-fg, 222 25% 12%);
  --muted: var(--swap-muted, 222 10% 46%);
  --accent: var(--swap-accent, 252 95% 65%);
  --accent-fg: var(--swap-accent-fg, 0 0% 100%);
  --danger: var(--swap-danger, 0 84% 60%);
  --success: var(--swap-success, 152 70% 42%);

  background: hsl(var(--bg));
  color: hsl(var(--fg));
  font-family: var(--swap-font-family, Inter, system-ui, sans-serif);
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  -webkit-font-smoothing: antialiased;
  position: relative;
  min-height: var(--swap-min-height, 640px);
  border-radius: var(--swap-radius, inherit);
  overflow: hidden;
}
.swap-widget-root.dark {
  /* Dark defaults — same fallback pattern with -dark variants */
  --bg: var(--swap-bg-dark, 222 28% 6%);
  --surface: var(--swap-surface-dark, 222 22% 10%);
  --surface-2: var(--swap-surface-2-dark, 222 18% 14%);
  --border: var(--swap-border-dark, 222 14% 20%);
  --fg: var(--swap-fg-dark, 220 20% 96%);
  --muted: var(--swap-muted-dark, 220 12% 64%);
  --accent: var(--swap-accent-dark, 258 95% 70%);
  --accent-fg: var(--swap-accent-fg-dark, 0 0% 100%);
  --danger: var(--swap-danger-dark, 0 84% 65%);
  --success: var(--swap-success-dark, 152 70% 50%);
}
.swap-widget-root::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(900px 600px at 20% -10%, hsl(var(--accent) / 0.18), transparent 60%),
    radial-gradient(700px 500px at 100% 100%, hsl(190 90% 60% / 0.12), transparent 60%);
}
.swap-widget-root > * {
  position: relative;
  z-index: 1;
}
`;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false },
  },
});

class SwapWidgetElement extends HTMLElement {
  private root: Root | null = null;
  private container: HTMLDivElement | null = null;
  private mediaQuery: MediaQueryList | null = null;
  private mqListener: ((e: MediaQueryListEvent) => void) | null = null;

  static get observedAttributes() {
    return ["theme"];
  }

  connectedCallback() {
    if (this.root) return;

    const shadow = this.attachShadow({ mode: "open" });

    // Inject Google Fonts (CSS @import works inside shadow stylesheets)
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = FONT_LINK;
    shadow.appendChild(fontLink);

    // Inject compiled Tailwind CSS + shadow-root scoped overrides. The
    // bundled CSS targets :root/html/body — none exist here, so SHADOW_BASE_CSS
    // re-binds the theme variables onto our wrapper.
    const style = document.createElement("style");
    style.textContent = `${bundledCss}\n${SHADOW_BASE_CSS}`;
    shadow.appendChild(style);

    // Wrapper acts as both the theme root (for `.dark` class) and portal
    // root (for Dialog). It lives inside the shadow tree.
    const container = document.createElement("div");
    container.className = "swap-widget-root";
    // Reset some host-leaking defaults — shadow DOM already isolates most
    container.style.colorScheme = "normal";
    shadow.appendChild(container);
    this.container = container;

    this.applyTheme(this.getAttribute("theme"));

    this.root = createRoot(container);
    this.root.render(
      <StrictMode>
        <WidgetModeContext.Provider value="embed">
          <ThemeRootContext.Provider value={container}>
            <PortalRootContext.Provider value={container}>
              <LocaleProvider>
                <QueryClientProvider client={queryClient}>
                  <App />
                </QueryClientProvider>
              </LocaleProvider>
            </PortalRootContext.Provider>
          </ThemeRootContext.Provider>
        </WidgetModeContext.Provider>
      </StrictMode>,
    );
  }

  disconnectedCallback() {
    this.root?.unmount();
    this.root = null;
    this.container = null;
    if (this.mediaQuery && this.mqListener) {
      this.mediaQuery.removeEventListener("change", this.mqListener);
    }
    this.mediaQuery = null;
    this.mqListener = null;
  }

  attributeChangedCallback(
    name: string,
    _old: string | null,
    next: string | null,
  ) {
    if (name === "theme") this.applyTheme(next);
  }

  private applyTheme(value: string | null) {
    const container = this.container;
    if (!container) return;

    // Clean previous prefers-color-scheme listener
    if (this.mediaQuery && this.mqListener) {
      this.mediaQuery.removeEventListener("change", this.mqListener);
      this.mediaQuery = null;
      this.mqListener = null;
    }

    const setDark = (isDark: boolean) => {
      container.classList.toggle("dark", isDark);
    };

    if (value === "dark") {
      setDark(true);
      return;
    }
    if (value === "light") {
      setDark(false);
      return;
    }
    // auto / unset → follow OS
    if (typeof window.matchMedia === "function") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      setDark(mq.matches);
      const listener = (e: MediaQueryListEvent) => setDark(e.matches);
      mq.addEventListener("change", listener);
      this.mediaQuery = mq;
      this.mqListener = listener;
    } else {
      setDark(true);
    }
  }
}

if (!customElements.get("swap-widget")) {
  customElements.define("swap-widget", SwapWidgetElement);
}
