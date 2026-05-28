import { Moon, Sun } from "lucide-react";
import { useIntl } from "react-intl";
import { useTheme } from "@/hooks/useTheme";
import { m } from "@/i18n/messages";

export function ThemeToggle() {
  const intl = useIntl();
  const { theme, toggle } = useTheme();
  const label = intl.formatMessage(
    theme === "dark" ? m.a11yThemeToLight : m.a11yThemeToDark,
  );
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-border bg-surface/80 p-2 text-muted backdrop-blur transition-colors hover:bg-surface-2 hover:text-fg"
      aria-label={label}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
