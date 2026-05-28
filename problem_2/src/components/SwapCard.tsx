import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDown,
  Settings as SettingsIcon,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { FormattedMessage, useIntl } from "react-intl";

import { TokenInput } from "./TokenInput";
import { TokenPicker } from "./TokenPicker";
import { RateInfo } from "./RateInfo";
import { Sparkline } from "./Sparkline";
import { Settings, SettingsPanel } from "./Settings";
import { History } from "./History";
import { Skeleton } from "./ui/Skeleton";
import { Button } from "./ui/Button";
import { useWidgetMode } from "@/lib/widgetMode";

import { usePrices } from "@/hooks/usePrices";
import { useDebounce } from "@/hooks/useDebounce";
import { useHistory } from "@/hooks/useHistory";
import { useSettings } from "@/hooks/useSettings";
import { useMockSwap } from "@/hooks/useMockSwap";
import { useFormatters } from "@/hooks/useFormatters";
import { quote } from "@/lib/swap";
import { parseAmount } from "@/lib/format";
import {
  swapSchema,
  validationMessage,
  type ValidationKey,
} from "@/schemas/swap";
import { m } from "@/i18n/messages";
import type { Token } from "@/lib/tokens";

const DEFAULT_FROM = "ETH";
const DEFAULT_TO = "USDC";

type PickerSide = "from" | "to" | null;

export function SwapCard() {
  const intl = useIntl();
  const mode = useWidgetMode();
  const { formatAmount } = useFormatters();
  const { data: tokens, isLoading, error, refetch } = usePrices();
  const { settings, update: updateSettings } = useSettings();
  const {
    entries: history,
    add: addHistory,
    clear: clearHistory,
  } = useHistory();
  const swap = useMockSwap();

  const [fromSymbol, setFromSymbol] = useState<string>(DEFAULT_FROM);
  const [toSymbol, setToSymbol] = useState<string>(DEFAULT_TO);
  const [amount, setAmount] = useState<string>("1");
  const [picker, setPicker] = useState<PickerSide>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    if (!tokens || tokens.length === 0) return;
    const has = (s: string) => tokens.some((t) => t.symbol === s);
    if (!has(fromSymbol)) setFromSymbol(tokens[0].symbol);
    if (!has(toSymbol)) setToSymbol(tokens[1]?.symbol ?? tokens[0].symbol);
  }, [tokens, fromSymbol, toSymbol]);

  const fromToken: Token | null = useMemo(
    () => tokens?.find((t) => t.symbol === fromSymbol) ?? null,
    [tokens, fromSymbol],
  );
  const toToken: Token | null = useMemo(
    () => tokens?.find((t) => t.symbol === toSymbol) ?? null,
    [tokens, toSymbol],
  );

  const debouncedAmount = useDebounce(amount, 120);
  const parsedAmount = parseAmount(debouncedAmount);

  const currentQuote = useMemo(() => {
    if (!fromToken || !toToken) {
      return {
        rate: 0,
        outputGross: 0,
        outputNet: 0,
        feeAmount: 0,
        minReceived: 0,
      };
    }
    return quote({
      from: fromToken,
      to: toToken,
      amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
      feeBps: settings.feeBps,
      slippagePct: settings.slippagePct,
    });
  }, [fromToken, toToken, parsedAmount, settings.feeBps, settings.slippagePct]);

  const formError = useMemo(() => {
    const result = swapSchema.safeParse({ fromSymbol, toSymbol, amount });
    if (result.success) return null;
    const issue = result.error.issues[0];
    return {
      path: issue.path[0] as string,
      key: issue.message as ValidationKey,
    };
  }, [fromSymbol, toSymbol, amount]);

  const fromUsd =
    fromToken && Number.isFinite(parsedAmount)
      ? parsedAmount * fromToken.price
      : 0;
  const toUsd = toToken ? currentQuote.outputNet * toToken.price : 0;

  const flip = useCallback(() => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setFlipKey((k) => k + 1);
  }, [fromSymbol, toSymbol]);

  const handleSelectToken = useCallback(
    (token: Token) => {
      if (picker === "from") {
        if (token.symbol === toSymbol) setToSymbol(fromSymbol);
        setFromSymbol(token.symbol);
      } else if (picker === "to") {
        if (token.symbol === fromSymbol) setFromSymbol(toSymbol);
        setToSymbol(token.symbol);
      }
    },
    [picker, fromSymbol, toSymbol],
  );

  const handleSubmit = async () => {
    if (formError || !fromToken || !toToken) return;
    try {
      const result = await swap.submit({
        fromSymbol: fromToken.symbol,
        toSymbol: toToken.symbol,
        fromAmount: parsedAmount,
        toAmount: currentQuote.outputNet,
        rate: currentQuote.rate,
      });
      addHistory({
        fromSymbol: result.fromSymbol,
        toSymbol: result.toSymbol,
        fromAmount: result.fromAmount,
        toAmount: result.toAmount,
        rate: result.rate,
      });
      toast.success(intl.formatMessage(m.toastSuccessTitle), {
        description: intl.formatMessage(m.toastSuccessDesc, {
          fromAmount: formatAmount(result.fromAmount),
          fromSymbol: result.fromSymbol,
          toAmount: formatAmount(result.toAmount),
          toSymbol: result.toSymbol,
        }),
      });
      setAmount("");
      window.setTimeout(swap.reset, 1500);
    } catch (e) {
      toast.error(intl.formatMessage(m.toastErrorTitle), {
        description: (e as Error).message,
      });
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-danger/40 bg-danger/10 p-6 text-center">
        <AlertTriangle className="mx-auto mb-2 text-danger" />
        <p className="mb-3 text-sm">
          <FormattedMessage {...m.errorPricesFailed} />
        </p>
        <Button onClick={() => refetch()} variant="subtle">
          <FormattedMessage {...m.errorRetry} />
        </Button>
      </div>
    );
  }

  const amountErrorMsg =
    formError?.path === "amount" ? validationMessage[formError.key] : undefined;
  const toErrorMsg =
    formError?.path === "toSymbol"
      ? validationMessage[formError.key]
      : undefined;
  const submitDisabled = !!formError || swap.status === "submitting";

  const submitLabel =
    swap.status === "submitting"
      ? intl.formatMessage(m.submitConfirming)
      : swap.status === "success"
        ? intl.formatMessage(m.submitSuccess)
        : formError
          ? intl.formatMessage(validationMessage[formError.key])
          : intl.formatMessage(m.submitConfirm);

  // Embed mode: settings replaces the card view instead of opening as a dialog.
  if (mode === "embed" && settingsOpen) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4">
        <SettingsPanel
          settings={settings}
          onBack={() => setSettingsOpen(false)}
          onChange={updateSettings}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <div className="glass relative overflow-hidden rounded-2xl border border-border shadow-card sm:rounded-3xl">
        <header className="flex items-center justify-between px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">
              <FormattedMessage {...m.appTitle} />
            </h1>
            <p className="truncate text-xs text-muted">
              <FormattedMessage {...m.appSubtitle} />
            </p>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="shrink-0 rounded-xl p-2 text-muted hover:bg-surface-2 hover:text-fg"
            aria-label={intl.formatMessage(m.a11yOpenSettings)}
          >
            <SettingsIcon size={18} />
          </button>
        </header>

        <div className="relative space-y-1.5 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
          {isLoading || !tokens ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            <>
              <TokenInput
                inputId="amount-from"
                label={m.inputYouPay}
                token={fromToken}
                amount={amount}
                onAmountChange={setAmount}
                onPickToken={() => setPicker("from")}
                usdValue={fromUsd}
                error={amountErrorMsg}
              />

              <div className="relative my-1 flex justify-center">
                <motion.button
                  onClick={flip}
                  type="button"
                  aria-label={intl.formatMessage(m.a11ySwapDirection)}
                  animate={{ rotate: flipKey * 180 }}
                  transition={{ type: "spring", stiffness: 360, damping: 24 }}
                  className="rounded-xl border border-border bg-surface p-2 text-fg shadow-sm hover:border-accent hover:text-accent"
                >
                  <ArrowDown size={16} />
                </motion.button>
              </div>

              <TokenInput
                inputId="amount-to"
                label={m.inputYouReceive}
                token={toToken}
                amount={
                  currentQuote.outputNet > 0
                    ? currentQuote.outputNet.toFixed(6).replace(/\.?0+$/, "")
                    : ""
                }
                onPickToken={() => setPicker("to")}
                readOnly
                usdValue={toUsd}
                error={toErrorMsg}
              />
            </>
          )}

          {fromToken &&
            toToken &&
            currentQuote.rate > 0 &&
            parsedAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <RateInfo
                  from={fromToken}
                  to={toToken}
                  quote={currentQuote}
                  slippagePct={settings.slippagePct}
                  feeBps={settings.feeBps}
                />
              </motion.div>
            )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitDisabled}
            loading={swap.status === "submitting"}
            size="lg"
            className="mt-2 w-full"
          >
            {submitLabel}
          </Button>
        </div>
      </div>

      {fromToken && toToken && (
        <div className="grid grid-cols-2 gap-3">
          <TokenStatCard token={fromToken} />
          <TokenStatCard token={toToken} />
        </div>
      )}

      <History entries={history} onClear={clearHistory} />

      <TokenPicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        tokens={tokens ?? []}
        excludeSymbol={picker === "from" ? toSymbol : fromSymbol}
        onSelect={handleSelectToken}
      />

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={updateSettings}
      />
    </div>
  );
}

function TokenStatCard({ token }: { token: Token }) {
  const { formatUsd } = useFormatters();
  return (
    <div className="flex items-center justify-between gap-2 overflow-hidden rounded-2xl border border-border bg-surface px-3 py-3">
      <div className="min-w-0">
        <div className="text-xs text-muted">{token.symbol}</div>
        <div className="truncate font-mono text-sm tabular-nums">
          {formatUsd(token.price)}
        </div>
      </div>
      <Sparkline
        symbol={token.symbol}
        price={token.price}
        className="shrink-0"
      />
    </div>
  );
}
