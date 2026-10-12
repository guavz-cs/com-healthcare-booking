import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { AnnouncerProvider } from '../context/AnnouncerContext.jsx';
import Services from '../pages/Services.jsx';

function setup() {
  const user = userEvent.setup();
  const utils = render(
    <AnnouncerProvider>
      <Services />
    </AnnouncerProvider>
  );
  return { user, ...utils };
}
const polite = () => screen.getByTestId('live-polite');

describe('Services directory ARIA state', () => {
  it('has no axe violations', async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('accordion header keeps aria-expanded in sync with the panel', async () => {
    const { user } = setup();
    const btn = screen.getByRole('button', { name: /filters/i });
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(btn).toHaveAttribute('aria-controls', 'filter-panel');
    expect(document.getElementById('filter-panel')).toBeVisible();

    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('filter-panel')).not.toBeVisible();

    btn.focus();
    await user.keyboard(' '); // Space
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Enter}');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('category chips toggle aria-pressed and filter the list', async () => {
    const { user } = setup();
    const chip = screen.getByRole('button', { name: /mental health/i });
    expect(chip).toHaveAttribute('aria-pressed', 'false');

    await user.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/showing 1 of 8 services/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /counselling session/i })).toBeInTheDocument();

    await user.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/showing 8 of 8 services/i)).toBeInTheDocument();
  });

  it('same-day triage toggle uses aria-pressed', async () => {
    const { user } = setup();
    const toggle = screen.getByRole('button', { name: /same-day appointments only/i });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/showing 4 of 8 services/i)).toBeInTheDocument();
  });

  it('searches by text and announces the count once, politely, after typing pauses', async () => {
    const { user } = setup();
    expect(polite()).toHaveTextContent(''); // nothing announced on load
    await user.type(screen.getByLabelText(/search by service name/i), 'vacc');
    expect(screen.getByText(/showing 1 of 8 services/i)).toBeInTheDocument();
    await waitFor(() => expect(polite()).toHaveTextContent('1 service found.'), { timeout: 3000 });
  });

  it('shows an empty state with a way to recover', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/search by service name/i), 'zzzz');
    expect(screen.getByText(/no services match your search/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^clear search and filters$/i }));
    expect(screen.getByText(/showing 8 of 8 services/i)).toBeInTheDocument();
  });

  it('refreshing availability sets aria-busy, then announces the update', async () => {
    const { user } = setup();
    const region = screen.getByRole('region', { name: /practitioner availability/i });
    expect(region).toHaveAttribute('aria-busy', 'false');
    const btn = screen.getByRole('button', { name: /refresh availability/i });
    await user.click(btn);
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(btn).not.toBeDisabled(); // stays focusable so keyboard focus is not lost
    await waitFor(() => expect(region).toHaveAttribute('aria-busy', 'false'), { timeout: 3000 });
    await waitFor(() => expect(polite()).toHaveTextContent(/availability updated/i), { timeout: 3000 });
    expect(within(region).getByRole('table', { name: /next available appointments/i })).toBeInTheDocument();
  });
});
