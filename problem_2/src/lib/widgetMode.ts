import { createContext, useContext } from 'react';

/**
 * 'page' (default): full-screen single-page app — Settings is a Dialog.
 * 'embed': running as <swap-widget> inside a host page — Settings is an
 * inline screen that replaces the swap card view (no modal overlay).
 */
export type WidgetMode = 'page' | 'embed';

export const WidgetModeContext = createContext<WidgetMode>('page');

export function useWidgetMode(): WidgetMode {
  return useContext(WidgetModeContext);
}
