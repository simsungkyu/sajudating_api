import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useState } from 'react';
import { useSetAiMetaInUseMutation } from '../graphql/generated';

export interface AIMetaSetUseModalProps {
    open: boolean;
    onClose: () => void;
    metaUid: string;
    metaType: string;
    metaName: string;
    onSuccess?: () => void;
}

const AIMetaSetUseModal: React.FC<AIMetaSetUseModalProps> = ({
    open,
    onClose,
    metaUid,
    metaType,
    metaName,
    onSuccess,
}) => {
    const [error, setError] = useState<string | null>(null);
    const [setAiMetaInUse, { loading }] = useSetAiMetaInUseMutation();

    const handleConfirm = async () => {
        try {
            setError(null);
            const { data } = await setAiMetaInUse({
                variables: {
                    uid: metaUid,
                },
            });

            if (data?.setAiMetaInUse?.ok) {
                onSuccess?.();
                onClose();
            } else {
                setError(data?.setAiMetaInUse?.err || '기본설정에 실패했습니다.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        }
    };

    const handleClose = () => {
        if (!loading) {
            setError(null);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>AI 메타 기본설정</DialogTitle>
            <DialogContent>
                <Box sx={{ py: 2 }}>
                    <Typography variant="body1" gutterBottom>
                        <strong>{metaName}</strong> 을(를) <strong>{metaType}</strong> 타입의 기본 메타로 설정하시겠습니까?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        동일한 메타 타입의 다른 항목들은 자동으로 미사용 상태로 변경됩니다.
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} disabled={loading}>
                    취소
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : null}
                >
                    확인
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AIMetaSetUseModal;
