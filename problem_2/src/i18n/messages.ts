import { defineMessages } from "react-intl";

/**
 * Central message registry. Each entry uses `defaultMessage` (the source
 * text) plus a `description` hint for translators. `babel-plugin-formatjs`
 * rewrites `id` to a stable hash at build time, and `@formatjs/cli extract`
 * picks these calls up.
 *
 * Why one big object instead of inline FormattedMessage:
 *  - lets us share keys between JSX and `intl.formatMessage` callsites
 *  - keeps every translatable string in one searchable file
 *  - lint rule `enforce-default-message` still applies inside JSX
 */
export const m = defineMessages({
  appTitle: {
    defaultMessage: "Swap",
    id: "rwN8Rs",

    description: "App heading",
  },
  appSubtitle: {
    defaultMessage: "Trade tokens instantly",
    id: "sMlSSp",

    description: "Tagline under the app heading",
  },
  appFooterMock: {
    defaultMessage: "Mock swap — no funds will be transferred.",
    id: "mRTCJQ",

    description: "Disclaimer in the footer",
  },
  appFooterPrices: {
    defaultMessage: "Prices via {link}.",
    id: "Omgb2y",

    description: "Footer credit pointing at the price feed",
  },

  inputYouPay: {
    defaultMessage: "You pay",
    id: "llgjmr",

    description: "Label of the from-amount field",
  },
  inputYouReceive: {
    defaultMessage: "You receive",
    id: "rQzqho",

    description: "Label of the to-amount field",
  },
  inputSelectToken: {
    defaultMessage: "Select",
    id: "JY46nI",

    description:
      "Placeholder text on the token chip before any token is chosen",
  },
  inputPriceOf: {
    defaultMessage: "1 {symbol} = {price}",
    id: "E0N3yR",

    description: "Inline current USD price next to a token field",
  },

  pickerTitle: {
    defaultMessage: "Select a token",
    id: "JE84NV",

    description: "Dialog title",
  },
  pickerSearch: {
    defaultMessage: "Search by symbol...",
    id: "zykBLk",

    description: "Placeholder of the picker search field",
  },
  pickerSearchLabel: {
    defaultMessage: "Search tokens",
    id: "+tURWE",

    description: "Accessible name for the picker search field",
  },
  pickerEmpty: {
    defaultMessage: "No tokens match.",
    id: "DmFZvt",

    description: "Empty state",
  },
  pickerUsdPrice: {
    defaultMessage: "USD price",
    id: "6mZ6+5",

    description: "Subtitle on each token row showing the field is USD",
  },
  pickerClose: {
    defaultMessage: "Close",
    id: "PyDwDF",

    description: "Close button label",
  },

  rateInvert: {
    defaultMessage: "Invert exchange rate",
    id: "Y9S7ro",

    description: "A11y label for the rate-flip button",
  },
  rateFee: {
    defaultMessage: "Fee",
    id: "BFUV0K",

    description: "Row label for the protocol fee",
  },
  rateSlippage: {
    defaultMessage: "Slippage tolerance",
    id: "6w0yi5",

    description: "Row label",
  },
  rateMinReceived: {
    defaultMessage: "Minimum received",
    id: "cQvhkk",

    description: "Row label for the floor the user will receive",
  },
  rateOutputValue: {
    defaultMessage: "Output value",
    id: "i1e5WZ",

    description: "Row label in USD",
  },
  rateFeeValue: {
    defaultMessage: "{pct}% ({amount} {symbol})",
    id: "aAX6Iu",

    description: "Composite fee row value: percent and absolute fee",
  },

  submitConfirm: {
    defaultMessage: "Confirm swap",
    id: "vbOeak",

    description: "Idle submit button",
  },
  submitConfirming: {
    defaultMessage: "Confirming swap...",
    id: "t165/R",

    description: "Loading state",
  },
  submitSuccess: {
    defaultMessage: "Swap successful",
    id: "PSQbpp",

    description: "Success state",
  },

  toastSuccessTitle: {
    defaultMessage: "Swap confirmed",
    id: "b7Olly",

    description: "Toast title",
  },
  toastSuccessDesc: {
    defaultMessage: "{fromAmount} {fromSymbol} → {toAmount} {toSymbol}",
    id: "OG/iZT",

    description: "Toast description for a successful swap",
  },
  toastErrorTitle: {
    defaultMessage: "Swap failed",
    id: "KyBgJH",

    description: "Error toast title",
  },

  validationSelectFrom: {
    defaultMessage: "Select a token to swap from",
    id: "fv+SSM",

    description: "Validation error",
  },
  validationSelectTo: {
    defaultMessage: "Select a token to swap to",
    id: "wUK/Ox",

    description: "Validation error",
  },
  validationEnterAmount: {
    defaultMessage: "Enter an amount",
    id: "Ui9+S8",

    description: "Validation error",
  },
  validationPositive: {
    defaultMessage: "Amount must be greater than zero",
    id: "9pUh2P",

    description: "Validation error",
  },
  validationNumber: {
    defaultMessage: "Amount must be a number",
    id: "qY91ta",

    description: "Validation error",
  },
  validationDiffer: {
    defaultMessage: "From and To tokens must differ",
    id: "IN2y+L",

    description: "Validation error when the user picks the same token twice",
  },

  settingsTitle: {
    defaultMessage: "Swap settings",
    id: "4a8Exf",

    description: "Settings dialog title",
  },
  settingsSlippage: {
    defaultMessage: "Slippage tolerance",
    id: "IIXwk3",

    description: "Field label",
  },
  settingsCustomSlippage: {
    defaultMessage: "Custom slippage percent",
    id: "CNGZdo",

    description: "A11y label for the custom slippage number input",
  },
  settingsFee: {
    defaultMessage: "Protocol fee",
    id: "r4sRni",

    description: "Field label",
  },
  settingsFeeBpsLabel: {
    defaultMessage: "Fee basis points",
    id: "SSXB4O",

    description: "A11y label for the fee slider",
  },
  settingsHighSlippage: {
    defaultMessage: "High slippage. Your transaction may be front-run.",
    id: "4uh7QL",

    description: "Warning shown when slippage ≥ 5%",
  },
  settingsDone: {
    defaultMessage: "Done",
    id: "oUk+sA",

    description: "Confirm/close button",
  },

  historyTitle: {
    defaultMessage: "Recent swaps",
    id: "Wz3U7N",

    description: "Section heading",
  },
  historyClear: {
    defaultMessage: "Clear",
    id: "KVLPB6",

    description: "Button to clear history",
  },
  historyEmpty: {
    defaultMessage: "No swaps yet. Your recent activity will appear here.",
    id: "6SZ0YD",

    description: "Empty state",
  },
  historyJustNow: {
    defaultMessage: "just now",
    id: "+ItHkV",

    description: "Relative time, <1m",
  },
  historyMinutesAgo: {
    defaultMessage: "{n}m ago",
    id: "4HC6yK",

    description: "Relative time in minutes",
  },
  historyHoursAgo: {
    defaultMessage: "{n}h ago",
    id: "ilqowM",

    description: "Relative time in hours",
  },
  historyDaysAgo: {
    defaultMessage: "{n}d ago",
    id: "wG1pth",

    description: "Relative time in days",
  },

  errorPricesFailed: {
    defaultMessage: "Failed to load token prices.",
    id: "DnCaMe",

    description: "Shown when the price feed fetch errors",
  },
  errorRetry: {
    defaultMessage: "Retry",
    id: "AHzvcj",

    description: "Retry button",
  },

  a11ySwapDirection: {
    defaultMessage: "Swap direction",
    id: "0tv7cX",

    description: "A11y label for the flip-direction button",
  },
  a11yOpenSettings: {
    defaultMessage: "Open settings",
    id: "GqLgsv",

    description: "A11y label for the gear icon",
  },
  a11yThemeToLight: {
    defaultMessage: "Switch to light mode",
    id: "sFtvym",

    description: "A11y label when current theme is dark",
  },
  a11yThemeToDark: {
    defaultMessage: "Switch to dark mode",
    id: "USR5Zf",

    description: "A11y label when current theme is light",
  },
  a11yLanguage: {
    defaultMessage: "Language",
    id: "vd+yX/",

    description: "A11y group label",
  },
  a11yBack: {
    defaultMessage: "Back",
    id: "TBB26c",
    description: "A11y label for the back button in embed mode settings",
  },
});
