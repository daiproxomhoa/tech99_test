import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageToggle } from '../LanguageToggle';
import { LocaleProvider } from '@/i18n/LocaleProvider';

beforeEach(() => window.localStorage.clear());

describe('LanguageToggle', () => {
  it('renders EN and VI buttons with aria-pressed reflecting the current locale', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <LanguageToggle />
      </LocaleProvider>,
    );
    const en = screen.getByRole('button', { name: /^en$/i });
    const vi = screen.getByRole('button', { name: /^vi$/i });
    expect(en).toHaveAttribute('aria-pressed', 'true');
    expect(vi).toHaveAttribute('aria-pressed', 'false');
    await user.click(vi);
    expect(vi).toHaveAttribute('aria-pressed', 'true');
    expect(en).toHaveAttribute('aria-pressed', 'false');
    expect(window.localStorage.getItem('swap:locale:v1')).toBe('vi');
  });
});
