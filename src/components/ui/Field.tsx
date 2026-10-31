import {
  FormControl,
  FormHelperText,
  FormLabel,
  OutlinedInput,
  Stack,
  type OutlinedInputProps,
} from '@mui/material';
import React, { forwardRef, useId } from 'react';
import { Icon } from '../Icon';

/**
 * Form field (SPEC 5 `TextField`): label 13/600 #3F3F46 above an outlined
 * 52px #F4F4F5 input whose 1.5px border turns red on error; the error row
 * optionally leads with `warning-circle`. The input styling itself comes
 * from the theme's MuiOutlinedInput override.
 */
export const Field = forwardRef<
  HTMLInputElement,
  Omit<OutlinedInputProps, 'error'> & {
    label: string;
    error?: string;
    errorIcon?: boolean;
    helper?: string;
  }
>(function Field({ label, error, errorIcon, helper, id, ...input }, ref) {
  const autoId = useId();
  const inputId = id ?? `f-${autoId}`;
  const describedBy = error
    ? `${inputId}-error`
    : helper
      ? `${inputId}-helper`
      : undefined;
  return (
    <FormControl fullWidth error={!!error}>
      <FormLabel htmlFor={inputId} sx={{ mb: 1 }}>
        {label}
      </FormLabel>
      <OutlinedInput
        {...input}
        id={inputId}
        inputRef={ref}
        error={!!error}
        inputProps={{
          ...input.inputProps,
          'aria-describedby': describedBy,
          'aria-invalid': !!error || undefined,
        }}
      />
      {error ? (
        <FormHelperText id={`${inputId}-error`} role="alert" component="div">
          <Stack
            direction="row"
            spacing="6px"
            component="span"
            sx={{ alignItems: 'center' }}
          >
            {errorIcon ? <Icon name="warning-circle" size={13} /> : null}
            <span>{error}</span>
          </Stack>
        </FormHelperText>
      ) : helper ? (
        <FormHelperText id={`${inputId}-helper`}>{helper}</FormHelperText>
      ) : null}
    </FormControl>
  );
});

export type FieldChange = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
