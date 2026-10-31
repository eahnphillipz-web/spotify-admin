import { Button, Snackbar, SnackbarContent } from '@mui/material';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { colors } from '../theme/tokens';

/**
 * App-level toast: one MUI Snackbar; a new toast replaces the current one.
 * Plain confirmations hold 2.2 s; a toast carrying an action (Undo) holds
 * 6 s so there is time to reach it.
 */

type ToastIcon = 'check-circle' | 'warning-circle';
type ToastOptions = { icon?: ToastIcon; action?: { label: string; onClick: () => void } };
type Toast = { key: number; text: string } & ToastOptions;

type ToastValue = { show: (text: string, options?: ToastOptions) => void };

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [open, setOpen] = useState(false);

  const show = useCallback((text: string, options?: ToastOptions) => {
    setToast({ key: Date.now() + Math.random(), text, ...options });
    setOpen(true);
  }, []);
  const value = useMemo(() => ({ show }), [show]);
  const warn = toast?.icon === 'warning-circle';

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        key={toast?.key}
        open={open && !!toast}
        autoHideDuration={toast?.action ? 6000 : 2200}
        onClose={(_e, reason) => reason !== 'clickaway' && setOpen(false)}
        sx={{
          bottom: { xs: 'calc(20px + env(safe-area-inset-bottom))', md: 28 },
          zIndex: 1500,
        }}
      >
        <SnackbarContent
          role="status"
          aria-live="polite"
          message={
            <>
              <Icon
                name={warn ? 'warning-circle' : 'check-circle'}
                weight="fill"
                size={18}
                color={warn ? '#FCA5A5' : colors.toastIcon}
              />
              <span>{toast?.text}</span>
            </>
          }
          action={
            toast?.action ? (
              <Button
                variant="text"
                onClick={() => {
                  toast.action?.onClick();
                  setOpen(false);
                }}
                sx={{
                  color: colors.toastIcon,
                  height: 30,
                  px: 1,
                  fontSize: 14,
                  '&:hover': { bgcolor: 'rgba(255,255,255,.08)', color: '#FFFFFF' },
                }}
              >
                {toast.action.label}
              </Button>
            ) : undefined
          }
        />
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
