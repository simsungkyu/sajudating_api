// Shared birth date/time input with yyyy-MM-dd HH:mm auto-formatting (Data Cards menu).
import { TextField, type TextFieldProps } from '@mui/material';
import { normalizeBirthDateTimeInput } from '../utils/birthDateTime';

export type BirthDateTimeFieldProps = Omit<TextFieldProps, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
};

export function BirthDateTimeField({
  value,
  onChange,
  label = '생일·시간',
  placeholder = 'yyyy-MM-dd HH:mm',
  onBlur,
  onPaste,
  ...rest
}: BirthDateTimeFieldProps) {
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const normalized = normalizeBirthDateTimeInput(value);
    if (normalized !== value) onChange(normalized);
    onBlur?.(e);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement | HTMLDivElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted) {
      const normalized = normalizeBirthDateTimeInput(pasted);
      if (normalized !== pasted || normalized !== value) {
        e.preventDefault();
        onChange(normalized);
      }
    }
    onPaste?.(e);
  };

  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={handleBlur}
      onPaste={handlePaste}
      placeholder={placeholder}
      size="small"
      {...rest}
    />
  );
}
