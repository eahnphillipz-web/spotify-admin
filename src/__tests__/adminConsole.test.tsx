import {
  act as rtlAct,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type React from 'react';
import App from '../App';
import { AdminStoreProvider, useAdmin } from '../admin/AdminStore';

// Page loads are lazy chunks plus the store's simulated first load; allow for slow CI.
const slow = { timeout: 10000 };

beforeEach(() => {
  sessionStorage.clear();
});

describe('mock admin sign-in and route guard', () => {
  test('a deep link while signed out goes to sign-in, then opens after a valid sign-in', async () => {
    window.history.pushState({}, '', '/members');
    render(<App />);

    const submit = await screen.findByRole('button', { name: 'Sign in' }, slow);
    expect(screen.queryByRole('heading', { name: 'Members' })).not.toBeInTheDocument();

    // Validation on submit.
    fireEvent.click(submit);
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();

    // Wrong password: the error names the problem.
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'admin@harbor.test' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'nope' } });
    fireEvent.click(submit);
    expect(
      await screen.findByText(
        "That email and password don't match an admin account.",
        undefined,
        slow,
      ),
    ).toBeInTheDocument();

    // The demo login lands on the page that was asked for.
    fireEvent.click(screen.getByRole('button', { name: 'Fill in the demo login' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(
      await screen.findByRole('heading', { name: 'Members' }, slow),
    ).toBeInTheDocument();
  }, 30000);

  test('a signed-in session survives a reload', async () => {
    sessionStorage.setItem(
      'harbor.admin.session',
      JSON.stringify({ name: 'Lena Brandt', email: 'admin@harbor.test', role: 'Admin' }),
    );
    window.history.pushState({}, '', '/audit');
    render(<App />);
    expect(
      await screen.findByRole('heading', { name: 'Audit log' }, slow),
    ).toBeInTheDocument();
  }, 30000);
});

describe('admin store', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AdminStoreProvider>{children}</AdminStoreProvider>
  );

  test('acting resolves the case, changes the account, logs it, and Undo restores both', () => {
    const { result } = renderHook(() => useAdmin(), { wrapper });
    const sunny = () => result.current.members.find(m => m.id === 'sunny')!;
    expect(sunny().status).toBe('limited');

    let auditId = '';
    rtlAct(() => {
      auditId = result.current.act('c-1044', 'suspend')!.id;
    });
    expect(result.current.cases.find(c => c.id === 'c-1044')!.status).toBe('resolved');
    expect(sunny().status).toBe('suspended');
    expect(result.current.audit[0].text).toBe('Suspended @sunny.deals.');

    rtlAct(() => result.current.undo(auditId));
    expect(result.current.cases.find(c => c.id === 'c-1044')!.status).toBe('open');
    expect(sunny().status).toBe('limited');
    expect(result.current.audit[0].text).toBe('Undid: Suspended @sunny.deals.');
  });

  test('only the latest change to the same thing can be undone', () => {
    const { result } = renderHook(() => useAdmin(), { wrapper });
    rtlAct(() => {
      result.current.updateFlag('f2', { rollout: 60 });
    });
    rtlAct(() => {
      result.current.updateFlag('f2', { rollout: 80 });
    });
    const [latest, older] = result.current.audit;
    expect(result.current.canUndo(latest)).toBe(true);
    expect(result.current.canUndo(older)).toBe(false);
    rtlAct(() => result.current.undo(latest.id));
    expect(result.current.flags.find(f => f.id === 'f2')!.rollout).toBe(60);
  });

  test('open cases rank critical first', () => {
    const { result } = renderHook(() => useAdmin(), { wrapper });
    expect(result.current.openCases[0].severity).toBe('critical');
  });
});

test('the Brief resolves a line in place and Undo brings it back', async () => {
  sessionStorage.setItem(
    'harbor.admin.session',
    JSON.stringify({ name: 'Lena Brandt', email: 'admin@harbor.test', role: 'Admin' }),
  );
  window.history.pushState({}, '', '/');
  render(<App />);
  const brief = await screen.findByRole(
    'region',
    { name: 'What needs a decision' },
    slow,
  );
  const hide = await within(brief).findByRole(
    'button',
    { name: 'Hide: Comment reported as harassment' },
    slow,
  );

  fireEvent.click(hide);
  expect(
    await within(brief).findByText("Hid wren.c's comment. Only wren.c can still see it."),
  ).toBeInTheDocument();

  fireEvent.click(within(brief).getByRole('button', { name: 'Undo' }));
  await waitFor(() =>
    expect(
      within(brief).getByRole('button', { name: 'Hide: Comment reported as harassment' }),
    ).toBeInTheDocument(),
  );
}, 30000);
