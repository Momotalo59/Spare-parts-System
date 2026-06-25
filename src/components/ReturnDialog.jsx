
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, 
    Button, Typography, Box, CircularProgress, CardMedia, Alert
} from '@mui/material';
import { doc, writeBatch, serverTimestamp, collection, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { sendTelegramNotification } from '../utils/notifications';

const ReturnDialog = ({ open, onClose, item, user }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (open) {
            setLoading(false);
            setError('');
            setSuccess('');
        }
    }, [open]);

    const handleCloseDialog = () => {
        if (loading) return;
        onClose();
    };

    const handleReturn = async () => {
        if (!user || !item) {
            setError("ข้อมูลผู้ใช้หรือรายการไม่ถูกต้อง");
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const batch = writeBatch(db);
            const itemRef = doc(db, 'tools', item.id);
            const transactionRef = doc(collection(db, "transactions"));

            if (!item.borrowedBy || !item.borrowedBy.includes(user.uid)) {
                throw new Error("คุณไม่ได้เป็นผู้ยืมเครื่องมือชิ้นนี้");
            }

            const newBorrowedCount = (item.borrowed || 1) - 1;
            batch.update(itemRef, {
                status: 'ว่าง',
                borrowed: newBorrowedCount,
                borrowedBy: arrayRemove(user.uid)
            });

            batch.set(transactionRef, {
                itemId: item.id,
                itemName: item.name,
                type: 'คืน',
                quantity: 1,
                user: user.displayName || 'N/A',
                userId: user.uid,
                timestamp: serverTimestamp(),
            });

            // Commit to DB
            await batch.commit();

            // Immediate UI feedback
            setSuccess("คืนเครื่องมือสำเร็จ!");

            // --- Send Telegram Notification in the background ---
            sendTelegramNotification({
                type: 'return',
                itemName: item.name,
                borrower: user.displayName,
                user: user.displayName,
                quantity: 1,
                newAvailable: (item.quantity || 1) - newBorrowedCount,
                total: (item.quantity || 1),
                newBorrowed: newBorrowedCount
            });

            // Close dialog after a delay
            setTimeout(handleCloseDialog, 1200);

        } catch (err) {
            console.error("Error returning item: ", err);
            setError(err.message || 'เกิดข้อผิดพลาดระหว่างการคืน');
            setLoading(false); // Stop loading only on error
        }
    };

    if (!item) return null;

    return (
        <Dialog open={open} onClose={handleCloseDialog} PaperProps={{ sx: { backgroundColor: '#333', color: 'white', borderRadius: '20px', width: '100%', maxWidth: '480px' } }}>
            <DialogTitle sx={{ fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '1.5rem', borderBottom: '1px solid #4f4f4f', pb: 1.5, textAlign: 'center' }}>
                คืน: <Typography component="span" sx={{ color: 'inherit', fontFamily: 'Kanit', fontWeight: 'bold' }}>{item.name}</Typography>
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center', p: {xs: 2, sm: 4}, my: 2 }}>
                <CardMedia
                    component="img"
                    image={item.imageUrl || 'https://via.placeholder.com/300'}
                    alt={item.name}
                    sx={{ width: '60%', maxWidth: '250px', aspectRatio: '1/1', objectFit: 'contain', mx: 'auto', mb: 3, borderRadius: '12px', backgroundColor: 'white' }}
                />
                <Typography sx={{ fontFamily: 'Kanit', fontSize: '1.1rem' }}>ยืนยันการคืน **{item.name}**?</Typography>
                {error && <Alert severity="error" variant="filled" sx={{ mt: 2, borderRadius: '8px' }}>{error}</Alert>}
                {success && <Alert severity="success" variant="filled" sx={{ mt: 2, borderRadius: '8px' }}>{success}</Alert>}
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px', borderTop: '1px solid #4f4f4f', justifyContent: 'space-between' }}>
                <Button variant="outlined" onClick={handleCloseDialog} sx={{ fontFamily: 'Kanit', color: '#ccc', borderColor: '#777', borderRadius: '8px', textTransform: 'none', px: 3, '&:hover': {borderColor: '#999', backgroundColor: 'rgba(255,255,255,0.08)'} }}>ยกเลิก</Button>
                <Button onClick={handleReturn} variant="contained" sx={{ fontFamily: 'Kanit', fontWeight: 'bold', backgroundColor: '#8e44ad', '&:hover': { backgroundColor: '#9b59b6' }, borderRadius: '8px', px: 4, textTransform: 'none' }} disabled={loading}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'ยืนยันการคืน'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReturnDialog;
