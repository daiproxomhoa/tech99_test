import { useIntl } from "react-intl";
import { Languages } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { m } from "@/i18n/messages";
import { cn } from "@/lib/cn";

export function LanguageToggle() {
  const intl = useIntl();
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label={intl.formatMessage(m.a11yLanguage)}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/80 p-1 backdrop-blur"
    >
      <Languages size={14} className="ml-1.5 text-muted" aria-hidden />
      {LOCALES.map((l: Locale) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          title={LOCALE_LABELS[l]}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition-colors",
            locale === l
              ? "bg-accent text-accent-fg"
              : "text-muted hover:bg-surface-2 hover:text-fg",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
