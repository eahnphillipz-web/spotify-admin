import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { Logo } from '../../components/Logo';
import { Field } from '../../components/ui/Field';
import { colors } from '../../theme/tokens';
import { DEMO_ADMIN, SignInError, useAdminAuth } from '../AdminAuth';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

/** Mock admin sign-in. The demo credentials are shown on the page on purpose. */
export default function LoginPage() {
  const { session, signIn } = useAdminAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<{ email?: string; pw?: string }>({});
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to={from} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof err = {};
    if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address.';
    if (!pw) next.pw = 'Enter your password.';
    setErr(next);
    if (next.email || next.pw) return;
    setBusy(true);
    try {
      await signIn(email, pw);
    } catch (x) {
      setErr({
        pw: x instanceof SignInError ? x.message : 'Something went wrong. Try again.',
      });
      setBusy(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        bgcolor: '#FFFFFF',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          bgcolor: colors.ink,
          color: '#FFFFFF',
          p: 6,
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25 }}>
          <Logo size={32} />
          <Typography sx={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.04em' }}>
            harbor
          </Typography>
          <Typography
            component="span"
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(255,255,255,.72)',
              border: '1px solid rgba(255,255,255,.22)',
              borderRadius: '6px',
              px: '6px',
              lineHeight: '18px',
            }}
          >
            Admin
          </Typography>
        </Stack>
        <Box sx={{ maxWidth: 440 }}>
          <Typography
            sx={{
              fontSize: 40,
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              textWrap: 'balance',
            }}
          >
            Keep Harbor a place people trust with their friends.
          </Typography>
          <Typography
            sx={{ fontSize: 16, lineHeight: 1.5, color: 'rgba(255,255,255,.72)', mt: 2 }}
          >
            Reports, members, health and Harbor AI, for the team that runs Harbor. Members
            never see this console.
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>
          Mock console · synthetic data only
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 3, md: 6 } }}>
        <Box
          component="form"
          noValidate
          onSubmit={submit}
          sx={{ width: '100%', maxWidth: 400 }}
        >
          <Box sx={{ display: { md: 'none' }, mb: 3 }}>
            <Logo size={48} />
          </Box>
          <Typography variant="authTitle">Sign in to Harbor admin</Typography>
          <Typography variant="lead" sx={{ mt: 1, mb: 3.5 }}>
            Use your admin account. Member accounts can't sign in here.
          </Typography>
          <Stack spacing="18px">
            <Field
              label="Email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                if (err.email) setErr(x => ({ ...x, email: undefined }));
              }}
              error={err.email}
              errorIcon
            />
            <Field
              label="Password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={pw}
              onChange={e => {
                setPw(e.target.value);
                if (err.pw) setErr(x => ({ ...x, pw: undefined }));
              }}
              error={err.pw}
              errorIcon
              endAdornment={
                <InputAdornment position="end" sx={{ mr: '-8px' }}>
                  <IconButton
                    aria-label={show ? 'Hide password' : 'Show password'}
                    aria-pressed={show}
                    onClick={() => setShow(s => !s)}
                    sx={{ width: 40, height: 40, color: 'text.secondary' }}
                  >
                    <Icon name={show ? 'eye-slash' : 'eye'} size={20} />
                  </IconButton>
                </InputAdornment>
              }
            />
          </Stack>
          <Button
            type="submit"
            variant="rounded"
            fullWidth
            disabled={busy}
            sx={{ mt: 3 }}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>

          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: '16px',
              bgcolor: colors.aiSurface,
              boxShadow: `inset 0 0 0 1px ${colors.aiBorder}`,
            }}
          >
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: colors.accentInk }}>
              This is a mock console
            </Typography>
            <Typography
              sx={{ fontSize: 14, color: colors.ink2, mt: 0.5, lineHeight: 1.5 }}
            >
              Sign in with <strong>{DEMO_ADMIN.email}</strong> and{' '}
              <strong>{DEMO_ADMIN.password}</strong>. Nothing here touches real members.
            </Typography>
            <Button
              variant="ai"
              onClick={() => {
                setEmail(DEMO_ADMIN.email);
                setPw(DEMO_ADMIN.password);
                setErr({});
              }}
              sx={{ mt: 1.5 }}
            >
              Fill in the demo login
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
