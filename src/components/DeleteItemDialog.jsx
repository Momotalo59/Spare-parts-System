
import React, { useState } from 'react';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle,
    Typography, Box, CircularProgress, Divider
} from '@mui/material';
import { WarningAmber } from '@mui/icons-material';
import { doc, deleteDoc, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { sendTelegramNotification } from '../utils/notifications'; // Import

const DeleteItemDialog = ({ open, onClose, item, category, displayName, onConfirm }) => {
    const [loading, setLoading] = useState(false);

    const handleConfirmDelete = async () => {
        setLoading(true);
        try {
            const batch = writeBatch(db);

            const itemRef = doc(db, category, item.id);
            batch.delete(itemRef);

            const transactionRef = doc(collection(db, "transactions"));
            batch.set(transactionRef, {
                itemId: item.id,
                itemName: item.name,
                category: category,
                user: displayName,
                type: 'ลบรายการ',
                timestamp: serverTimestamp(),
                reason: `ลบรายการออกจากระบบ`
            });

            await batch.commit();

            // --- Send Telegram Notification ---
            sendTelegramNotification({
                type: 'delete',
                itemName: item.name,
                user: displayName
            });
            // ----------------------------------
            
            onConfirm();
            onClose();
        } catch (error) {
            console.error("Error deleting item:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!item) return null;

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '16px', backgroundColor: '#3c3c3c', color: 'white', p: { xs: 1, sm: 2 }, fontFamily: 'Kanit, sans-serif', width: '100%', maxWidth: '480px', textAlign: 'center' } }}>
            <DialogContent sx={{ p: 3 }}>
                <WarningAmber sx={{ fontSize: 60, color: '#f44336', mb: 2 }} />
                <Typography variant="h4" component="h2" sx={{ fontFamily: 'Kanit', fontWeight: 'bold', mb: 1 }}>
                    ยืนยันการลบ
                </Typography>
                <Typography sx={{ fontFamily: 'Kanit', color: '#BDBDBD', mb: 2.5 }}>
                    ผู้ดำเนินการ: {displayName}
                </Typography>
                <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />
                <Typography sx={{ fontFamily: 'Kanit', fontSize: '1rem', mb: 1 }}>
                    คุณแน่ใจหรือไม่ว่าต้องการลบรายการ
                </Typography>
                <Typography sx={{ fontFamily: 'Kanit', fontSize: '1.2rem', fontWeight: 'bold', color: '#ffc107', mb: 1.5 }}>
                    {item.name}
                </Typography>
                <Typography sx={{ fontFamily: 'Kanit', fontSize: '0.9rem', fontWeight: 'bold', color: '#dc3545' }}>
                    การกระทำนี้ไม่สามารถย้อนกลับได้
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px', justifyContent: 'center', gap: 2 }}>
                <Button variant="contained" onClick={onClose} sx={{ fontFamily: 'Kanit', fontWeight: 'bold', textTransform: 'none', borderRadius: '8px', px: 5, py: 1, fontSize: '1rem', color: '#fff', backgroundColor: '#6c757d', '&:hover': { backgroundColor: '#5a6268' } }}>
                    ยกเลิก
                </Button>
                <Button variant="contained" onClick={handleConfirmDelete} disabled={loading} sx={{ fontFamily: 'Kanit', fontWeight: 'bold', textTransform: 'none', borderRadius: '8px', px: 5, py: 1, fontSize: '1rem', color: '#fff', backgroundColor: '#dc3545', '&:hover': { backgroundColor: '#c82333' }, '&.Mui-disabled': { backgroundColor: '#555', color: '#888', cursor: 'not-allowed'} }}>
                    {loading ? <CircularProgress size={24} color="inherit"/> : 'ยืนยันการลบ'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteItemDialog;
