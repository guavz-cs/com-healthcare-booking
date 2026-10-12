import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { AnnouncerProvider } from '../context/AnnouncerContext.jsx';
import BookingForm from '../components/BookingForm.jsx';

function setup() {
  const user = userEvent.setup();
  const utils = render(
    <AnnouncerProvider>
      <BookingForm />
    </AnnouncerProvider>
  );
  return { user, ...utils };
}

const polite = () => screen.getByTestId('live-polite');
const assertive = () => screen.getByTestId('live-assertive');

describe('BookingForm accessibility', () => {
  it('has no axe violations when pristine', async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('gives every input an explicit label and a linked hint', () => {
    setup();
    const name = screen.getByLabelText(/full name/i);
    expect(name).toHaveAttribute('id', 'field-name');
    expect(name).toHaveAccessibleDescription(/health card/i);
    expect(screen.getByLabelText(/email address/i)).toHaveAccessibleDescription(/name@example\.com/i);
    expect(screen.getByLabelText(/preferred date/i)).toHaveAccessibleDescription(/monday to saturday/i);
    expect(screen.getByRole('group', { name: /how urgent/i })).toBeInTheDocument();
  });

  it('flags a field with aria-invalid and a linked error after blur, and announces politely', async () => {
    const { user } = setup();
    const name = screen.getByLabelText(/full name/i);
    expect(name).not.toHaveAttribute('aria-invalid');

    await user.type(name, 'A');
    await user.tab(); // blur

    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription(/health card/i);
    expect(name).toHaveAccessibleDescription(/at least 2 characters/i);
    await waitFor(() => expect(polite()).toHaveTextContent(/Full name: .*at least 2 characters/i));
  });

  it('clears the error silently once the value is fixed', async () => {
    const { user } = setup();
    const name = screen.getByLabelText(/full name/i);
    await user.type(name, 'A');
    await user.tab();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    await user.type(name, 'bc');
    expect(name).not.toHaveAttribute('aria-invalid');
  });

  it('does not nag when a user simply tabs through an untouched field', async () => {
    const { user } = setup();
    screen.getByLabelText(/full name/i).focus();
    await user.tab();
    expect(screen.getByLabelText(/full name/i)).not.toHaveAttribute('aria-invalid');
  });

  it('on a failed submit: assertive announcement, error summary, focus on first invalid field', async () => {
    const { user, container } = setup();
    await user.click(screen.getByRole('button', { name: /submit appointment request/i }));

    await waitFor(() => expect(assertive()).toHaveTextContent('Booking not sent. 5 problems found.'));
    expect(screen.getByRole('heading', { name: /fix 5 problems/i })).toBeInTheDocument();

    const name = screen.getByLabelText(/full name/i);
    await waitFor(() => expect(name).toHaveFocus());
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription(/enter your full name/i);

    expect(await axe(container)).toHaveNoViolations(); // error state is accessible too
  });

  it('error summary buttons move focus to the field', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /submit appointment request/i }));
    await user.click(screen.getByRole('button', { name: /email address: enter your email/i }));
    expect(screen.getByLabelText(/email address/i)).toHaveFocus();
  });

  it('completes a booking, moves focus into the dialog, closes with Escape and returns focus', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/full name/i), 'Aisha Mbeki');
    await user.type(screen.getByLabelText(/email address/i), 'aisha@example.com');
    await user.selectOptions(screen.getByLabelText(/^service/i), 'diabetes-review');
    fireEvent.change(screen.getByLabelText(/preferred date/i), { target: { value: '2030-01-07' } });
    await user.click(screen.getByLabelText(/i agree/i));

    const submit = screen.getByRole('button', { name: /submit appointment request/i });
    submit.focus();
    await user.keyboard('{Enter}'); // keyboard-only submit

    const dialog = await screen.findByRole('dialog', { name: /appointment requested/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    await waitFor(() => expect(screen.getByRole('heading', { name: /appointment requested/i })).toHaveFocus());
    expect(dialog).toHaveTextContent('Diabetes review');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(submit).toHaveFocus();
  });

  it('traps Tab inside the dialog but always offers a way out', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/full name/i), 'Aisha Mbeki');
    await user.type(screen.getByLabelText(/email address/i), 'aisha@example.com');
    await user.selectOptions(screen.getByLabelText(/^service/i), 'general-checkup');
    fireEvent.change(screen.getByLabelText(/preferred date/i), { target: { value: '2030-01-07' } });
    await user.click(screen.getByLabelText(/i agree/i));
    await user.click(screen.getByRole('button', { name: /submit appointment request/i }));

    const dialog = await screen.findByRole('dialog');
    const close = screen.getByRole('button', { name: /close/i });
    await user.tab();
    expect(dialog).toContainElement(document.activeElement);
    await user.tab();
    expect(close).toHaveFocus(); // wrapped, did not escape to the page behind
    await user.tab({ shift: true });
    expect(dialog).toContainElement(document.activeElement);

    await user.click(close);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
