import { FormattedMessage } from "react-intl";
import { Toaster } from "sonner";
import { SwapCard } from "./components/SwapCard";
import { ThemeToggle } from "./components/ThemeToggle";
import { LanguageToggle } from "./components/LanguageToggle";
import { useTheme } from "./hooks/useTheme";
import { useWidgetMode } from "./lib/widgetMode";
import { m } from "./i18n/messages";

export default function App() {
  const { theme } = useTheme();
  const mode = useWidgetMode();
  const isEmbed = mode === "embed";
  return (
    <div
      className={
        "relative flex flex-col " +
        (isEmbed
          ? "px-3 pb-4 pt-4 sm:px-5"
          : "min-h-[100dvh] px-3 pb-8 pt-4 sm:px-6 sm:pb-12 sm:pt-6")
      }
    >
      {!isEmbed && (
        <header className="hidden md:fixed md:flex top-6 right-6 mb-6 w-full items-center justify-end gap-2 sm:mb-10">
          <LanguageToggle />
          <ThemeToggle />
        </header>
      )}
      <main className="flex w-full flex-1 justify-center">
        <SwapCard />
      </main>
      {!isEmbed && (
        <footer className="mt-8 px-4 text-center text-[11px] leading-relaxed text-muted sm:mt-10 sm:text-xs">
          <p>
            <FormattedMessage {...m.appFooterMock} />
          </p>
          <p className="mt-1">
            <FormattedMessage
              {...m.appFooterPrices}
              values={{
                link: (
                  <a
                    href="https://interview.switcheo.com/prices.json"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-2 hover:underline"
                  >
                    interview.switcheo.com
                  </a>
                ),
              }}
            />
          </p>
        </footer>
      )}
      <Toaster
        position="top-center"
        theme={theme}
        toastOptions={{
          style: {
            background: "hsl(var(--surface))",
            color: "hsl(var(--fg))",
            border: "1px solid hsl(var(--border))",
          },
        }}
      />
    </div>
  );
}
