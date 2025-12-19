import { useState } from 'react';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import { Box, Dialog, IconButton, Tooltip, type BoxProps, type DialogProps } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export interface DialogWrapProps extends DialogProps {
  allowMaximize?: boolean;
  defaultMaximized?: boolean;
  maximized?: boolean;
  onMaximizedChange?: (maximized: boolean) => void;
  maximizeButtonSx?: BoxProps['sx'];
}

const DialogWrap = ({
  allowMaximize = true,
  defaultMaximized = false,
  maximized,
  onMaximizedChange,
  PaperProps,
  fullScreen,
  children,
  maximizeButtonSx,
  ...rest
}: DialogWrapProps) => {
  const isControlled = typeof maximized === 'boolean';
  const [internalMaximized, setInternalMaximized] = useState(defaultMaximized);
  const resolvedMaximized = isControlled ? maximized : internalMaximized;
  const resolvedFullScreen = Boolean(fullScreen) || resolvedMaximized;

  const handleToggle = () => {
    const next = !resolvedMaximized;
    if (!isControlled) {
      setInternalMaximized(next);
    }
    onMaximizedChange?.(next);
  };

  const mergedPaperSx = PaperProps?.sx
    ? Array.isArray(PaperProps.sx)
      ? [{ position: 'relative' }, ...PaperProps.sx]
      : [{ position: 'relative' }, PaperProps.sx]
    : [{ position: 'relative' }];

  const toggleButtonSx: SxProps<Theme> = [
    { position: 'absolute', top: 16, right: 18, zIndex: 1 },
    ...(Array.isArray(maximizeButtonSx)
      ? maximizeButtonSx
      : maximizeButtonSx
        ? [maximizeButtonSx]
        : []),
  ];

  return (
    <Dialog {...rest} fullScreen={resolvedFullScreen} PaperProps={{ ...PaperProps, sx: mergedPaperSx }}>
      {allowMaximize && (
        <Box sx={toggleButtonSx}>
          <Tooltip title={resolvedMaximized ? '화면 원복' : '화면 최대화'}>
            <IconButton
              size="small"
              onClick={handleToggle}
              aria-label="dialog-maximize-toggle"
            >
              {resolvedMaximized ? <FullscreenExitRoundedIcon /> : <FullscreenRoundedIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
      {children}
    </Dialog>
  );
};

export default DialogWrap;
