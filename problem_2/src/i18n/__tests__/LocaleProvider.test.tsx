import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormattedMessage } from 'react-intl';
import { beforeEach, describe, expect, it } from 'vitest';
import { LocaleProvider, useLocale } from '../LocaleProvider';
import { m } from '../messages';

function Sample() {
  const { locale, setLocale } = useLocale();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="title">
        <FormattedMessage {...m.appTitle} />
      </span>
      <button onClick={() => setLocale('vi')}>vi</button>
      <button onClick={() => setLocale('en')}>en</button>
    </div>
  );
}

beforeEach(() => window.localStorage.clear());

describe('LocaleProvider', () => {
  it('defaults to english when localStorage is empty', () => {
    render(
      <LocaleProvider>
        <Sample />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('title')).toHaveTextContent('Swap');
  });

  it('switches translations when setLocale is called and persists to storage', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <Sample />
      </LocaleProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'vi' }));
    expect(screen.getByTestId('locale')).toHaveTextContent('vi');
    expect(screen.getByTestId('title')).toHaveTextContent('Hoán đổi');
    expect(window.localStorage.getItem('swap:locale:v1')).toBe('vi');
  });

  it('restores the locale from localStorage on mount', () => {
    window.localStorage.setItem('swap:locale:v1', 'vi');
    render(
      <LocaleProvider>
        <Sample />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('locale')).toHaveTextContent('vi');
    expect(screen.getByTestId('title')).toHaveTextContent('Hoán đổi');
  });

  it('updates the document lang attribute', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <Sample />
      </LocaleProvider>,
    );
    expect(document.documentElement.lang).toBe('en');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'vi' }));
    });
    expect(document.documentElement.lang).toBe('vi');
  });
});
