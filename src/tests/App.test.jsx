import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import App, { parseHash } from '../App.jsx';
import { slotToDate } from '../data/clinic.js';

beforeEach(() => {
  window.location.hash = '';
});

describe('App shell and focus management', () => {
  it('parseHash handles views and query strings', () => {
    expect(parseHash('')).toEqual({ view: 'home', service: '', practitioner: '', slot: '' });
    expect(parseHash('#/services')).toEqual({ view: 'services', service: '', practitioner: '', slot: '' });
    expect(parseHash('#/book?service=counselling&practitioner=khumalo&slot=Friday%2010%3A00')).toEqual({
      view: 'book', service: 'counselling', practitioner: 'khumalo', slot: 'Friday 10:00',
    });
    expect(parseHash('#/nope').view).toBe('home');
  });

  it('exposes the required landmarks and a skip link as the first tab stop', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /main/i })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toBeInTheDocument();

    await user.tab();
    const skip = screen.getByRole('link', { name: /skip to main content/i });
    expect(skip).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('moves focus to the new <h1> and updates the title on view change', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');

    await user.click(within(screen.getByRole('navigation', { name: /main/i })).getByRole('link', { name: 'Find a service' }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: /find a service/i })).toHaveFocus());
    expect(document.title).toMatch(/^Find a service/);
    expect(within(screen.getByRole('navigation', { name: /main/i })).getByRole('link', { name: 'Find a service' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('"Book <service>" links pre-select the service in the form', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/services';
    render(<App />);
    await user.click(screen.getByRole('link', { name: /book counselling session/i }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: /book an appointment/i })).toHaveFocus());
    expect(screen.getByLabelText(/^service/i)).toHaveValue('counselling');
  });

  it('lets a keyboard user pick an availability slot and carries it through to confirmation', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/services';
    render(<App />);

    const slot = screen.getByRole('link', { name: /wednesday 11:00 with nurse dlamini, book this appointment/i });
    slot.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: /book an appointment/i })).toHaveFocus());
    expect(screen.getByRole('heading', { name: /your selected appointment/i })).toBeInTheDocument();
    expect(screen.getByText(/wednesday 11:00/i, { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^service/i)).toHaveValue('diabetes-review');

    await user.type(screen.getByLabelText(/full name/i), 'Aisha Mbeki');
    await user.type(screen.getByLabelText(/email address/i), 'aisha@example.com');
    fireEvent.change(screen.getByLabelText(/preferred date/i), { target: { value: '2030-01-07' } });
    await user.click(screen.getByLabelText(/i agree/i));
    await user.click(screen.getByRole('button', { name: /submit appointment request/i }));

    const dialog = await screen.findByRole('dialog', { name: /appointment requested/i });
    expect(dialog).toHaveTextContent('Wednesday 11:00 with Nurse Dlamini');
  });

  it('pre-fills the preferred date from the chosen appointment time', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/services';
    render(<App />);
    await user.click(screen.getByRole('link', { name: /friday 10:00 with counsellor khumalo/i }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: /book an appointment/i })).toHaveFocus());
    expect(screen.getByLabelText(/preferred date/i)).toHaveValue(slotToDate('Friday 10:00'));
    expect(screen.getByLabelText(/preferred date/i)).toHaveAccessibleDescription(/filled in from your selected appointment/i);
  });

  it('"Back to main content" moves focus to <main> without changing the page', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/services';
    render(<App />);
    await user.click(screen.getByRole('link', { name: /back to main content/i }));
    expect(screen.getByRole('main')).toHaveFocus();
    expect(window.location.hash).toBe('#/services');
    expect(screen.getByRole('heading', { level: 1, name: /find a service/i })).toBeInTheDocument();
  });

  it.each([
    ['home', ''],
    ['services', '#/services'],
    ['book', '#/book'],
  ])('has no axe violations on the %s view', async (_name, hash) => {
    window.location.hash = hash;
    const { container } = render(<App />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
