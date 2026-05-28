import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { ArrowLeft, X } from "lucide-react";
import { Dialog } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { m } from "@/i18n/messages";
import type { SwapSettings } from "@/lib/storage";
import { useWidgetMode } from "@/lib/widgetMode";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: SwapSettings;
  onChange: (patch: Partial<SwapSettings>) => void;
}

const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0];

interface SettingsFormProps {
  settings: SwapSettings;
  onCommit: (data: SwapSettings) => void;
  onCancel: () => void;
  /** When true, suppresses the X button — header has its own back button. */
  hideHeaderClose?: boolean;
  /** When true, lifts the title row out (parent renders its own). */
  hideTitleRow?: boolean;
  /** When true, always show the language + theme toggles regardless of viewport. */
  alwaysShowToggles?: boolean;
}

/**
 * Stateful form body — shared by both the dialog wrapper and the embed
 * inline panel. Keeps draft in react-hook-form; nothing leaks out until
 * the user presses "Done", which calls `onCommit` then `onCancel` style
 * is handled by parents.
 */
function SettingsForm({
  settings,
  onCommit,
  onCancel,
  hideHeaderClose,
  hideTitleRow,
  alwaysShowToggles,
}: SettingsFormProps) {
  const intl = useIntl();
  const { control, handleSubmit, watch, setValue, reset } =
    useForm<SwapSettings>({
      defaultValues: settings,
      mode: "onChange",
    });

  // Re-seed every time the parent reopens us with new committed settings.
  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const slippagePct = watch("slippagePct");
  const feeBps = watch("feeBps");

  const onSubmit = handleSubmit((data) => onCommit(data));

  return (
    <>
      {!hideTitleRow && (
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 id="settings-title" className="text-lg font-semibold">
            <FormattedMessage {...m.settingsTitle} />
          </h2>
          {!hideHeaderClose && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
              aria-label={intl.formatMessage(m.pickerClose)}
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}

      <div
        className={
          "flex items-center justify-between gap-2 px-5 pt-4 " +
          (alwaysShowToggles ? "" : "md:hidden")
        }
      >
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <form onSubmit={onSubmit} className="space-y-5 px-5 pb-5 pt-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            <FormattedMessage {...m.settingsSlippage} />
          </legend>
          <div className="flex flex-wrap items-center gap-2">
            {SLIPPAGE_PRESETS.map((v) => (
              <button
                type="button"
                key={v}
                onClick={() =>
                  setValue("slippagePct", v, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                aria-pressed={slippagePct === v}
                className={
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors " +
                  (slippagePct === v
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border bg-surface-2 hover:border-accent/40")
                }
              >
                {v}%
              </button>
            ))}
            <div className="relative ml-auto">
              <Controller
                control={control}
                name="slippagePct"
                rules={{
                  required: true,
                  min: 0,
                  max: 50,
                  validate: (v) => Number.isFinite(v),
                }}
                render={({ field }) => (
                  <input
                    type="number"
                    min={0}
                    max={50}
                    step={0.1}
                    value={field.value}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n) && n >= 0 && n <= 50)
                        field.onChange(n);
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    className="h-9 w-24 rounded-lg border border-border bg-surface-2 pl-3 pr-7 text-right font-mono text-sm"
                    aria-label={intl.formatMessage(m.settingsCustomSlippage)}
                  />
                )}
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">
                %
              </span>
            </div>
          </div>
          {slippagePct >= 5 && (
            <p className="mt-2 text-xs text-danger">
              <FormattedMessage {...m.settingsHighSlippage} />
            </p>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            <FormattedMessage {...m.settingsFee} />
          </legend>
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="feeBps"
              rules={{ required: true, min: 0, max: 100 }}
              render={({ field }) => (
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  className="flex-1 accent-[hsl(var(--accent))]"
                  aria-label={intl.formatMessage(m.settingsFeeBpsLabel)}
                />
              )}
            />
            <span className="w-20 text-right font-mono text-sm tabular-nums">
              {(feeBps / 100).toFixed(2)}%
            </span>
          </div>
        </fieldset>

        <Button type="submit" className="w-full" size="lg">
          <FormattedMessage {...m.settingsDone} />
        </Button>
      </form>
    </>
  );
}

export function Settings({ open, onClose, settings, onChange }: Props) {
  const mode = useWidgetMode();

  if (mode === "embed") {
    // Embed: rendered inline by SwapCard (not as a dialog). This wrapper
    // becomes a no-op so the existing Dialog path stays out of the tree.
    return null;
  }

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} labelledBy="settings-title">
      <SettingsForm
        settings={settings}
        onCommit={(data) => {
          onChange(data);
          onClose();
        }}
        onCancel={onClose}
      />
    </Dialog>
  );
}

interface PanelProps {
  settings: SwapSettings;
  onBack: () => void;
  onChange: (patch: Partial<SwapSettings>) => void;
}

/**
 * Embed-mode Settings: full-card inline view that replaces the swap card.
 * Header has a back arrow; body is the same shared `SettingsForm`.
 */
export function SettingsPanel({ settings, onBack, onChange }: PanelProps) {
  const intl = useIntl();
  return (
    <div className="glass relative overflow-hidden rounded-2xl border border-border shadow-card sm:rounded-3xl">
      <div className="flex items-center gap-2 px-4 pt-4 sm:px-5 sm:pt-5">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
          aria-label={intl.formatMessage(m.a11yBack)}
        >
          <ArrowLeft size={18} />
        </button>
        <h2 id="settings-title" className="text-lg font-semibold">
          <FormattedMessage {...m.settingsTitle} />
        </h2>
      </div>
      <SettingsForm
        settings={settings}
        onCommit={(data) => {
          onChange(data);
          onBack();
        }}
        onCancel={onBack}
        hideTitleRow
        alwaysShowToggles
      />
    </div>
  );
}
