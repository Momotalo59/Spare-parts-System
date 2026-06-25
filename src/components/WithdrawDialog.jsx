
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, 
    Button, Typography, Box, CircularProgress, TextField, CardMedia, Alert
} from '@mui/material';
import { doc, writeBatch, serverTimestamp, collection, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { sendTelegramNotification } from '../utils/notifications';

const WithdrawDialog = ({ open, onClose, item, displayName, category, user }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [reason, setReason] = useState('');
    const [quantityToWithdraw, setQuantityToWithdraw] = useState(1);
    const [success, setSuccess] = useState('');

    const isTool = category === 'tools';

    useEffect(() => {
        if (open) {
            setLoading(false);
            setError('');
            setSuccess('');
            setReason('');
            setQuantityToWithdraw(1);
        }
    }, [open]);

    const handleCloseDialog = () => {
        if (loading) return; 
        onClose();
    };

    const handleConfirm = async (e) => {
        if(e) e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const batch = writeBatch(db);
            const itemRef = doc(db, category, item.id);
            const transactionRef = doc(collection(db, "transactions"));

            let notificationPayload = {};

            if (isTool) {
                if (item.status !== 'ว่าง') throw new Error("เครื่องมือนี้ถูกยืมไปแล้ว");

                const newBorrowedCount = (item.borrowed || 0) + 1;
                batch.update(itemRef, {
                    status: 'ไม่ว่าง',
                    borrowed: newBorrowedCount,
                    borrowedBy: arrayUnion(user.uid)
                });
                batch.set(transactionRef, { type: 'ยืม', itemId: item.id, itemName: item.name, quantity: 1, user: user.displayName, userId: user.uid, timestamp: serverTimestamp() });
                
                notificationPayload = {
                    type: 'borrow',
                    itemName: item.name,
                    borrower: user.displayName,
                    user: user.displayName,
                    quantity: 1,
                    newAvailable: (item.quantity || 1) - newBorrowedCount, 
                    total: (item.quantity || 1),
                    newBorrowed: newBorrowedCount
                };

            } else {
                if (!reason.trim()) throw new Error('กรุณากรอกเหตุผลในการเบิก');
                const withdrawAmount = Number(quantityToWithdraw);
                if (withdrawAmount <= 0) throw new Error('จำนวนที่เบิกต้องมากกว่า 0');
                if (withdrawAmount > item.quantity) throw new Error('จำนวนที่เบิกมากกว่าจำนวนที่มีอยู่');
                
                const newQuantity = item.quantity - withdrawAmount;
                batch.update(itemRef, { quantity: newQuantity });
                batch.set(transactionRef, { type: 'เบิก', itemId: item.id, itemName: item.name, category: category, quantity: withdrawAmount, user: displayName, reason: reason.trim(), timestamp: serverTimestamp() });
                
                notificationPayload = {
                    type: 'withdraw',
                    itemName: item.name,
                    quantityChanged: withdrawAmount,
                    newQuantity: newQuantity,
                    user: displayName,
                    reason: reason.trim()
                };
            }

            // Commit to DB
            await batch.commit();
            
            // Immediate UI feedback
            setSuccess(`ทำรายการสำเร็จ!`);
            
            // Send notification in the background
            sendTelegramNotification(notificationPayload);

            // Close dialog after a delay
            setTimeout(handleCloseDialog, 1200);

        } catch (err) {
            setError(err.message || 'เกิดข้อผิดพลาด');
            setLoading(false); // Stop loading only on error
        }
    };

    if (!item) return null;

    if (isTool) {
        return (
            <Dialog open={open} onClose={handleCloseDialog} PaperProps={{sx: { backgroundColor: '#333', color: 'white', borderRadius: '20px', width: '100%', maxWidth: '480px' } }}>
                <DialogTitle sx={{ fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '1.5rem', borderBottom: '1px solid #4f4f4f', pb: 1.5, textAlign: 'center' }}>
                    ยืม: <Typography component="span" sx={{ color: 'inherit', fontFamily: 'Kanit', fontWeight: 'bold' }}>{item.name}</Typography>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center', p: {xs: 2, sm: 4}, my: 2 }}>
                    <CardMedia component="img" image={item.imageUrl || 'https://via.placeholder.com/300'} alt={item.name} sx={{ width: '60%', maxWidth: '250px', aspectRatio: '1/1', objectFit: 'contain', mx: 'auto', mb: 3, borderRadius: '12px', backgroundColor: 'white' }} />
                    <Typography sx={{ fontFamily: 'Kanit', fontSize: '1.1rem' }}>ยืนยันการยืม **{item.name}**?</Typography>
                    {error && <Alert severity="error" variant="filled" sx={{ mt: 2, borderRadius: '8px' }}>{error}</Alert>}
                    {success && <Alert severity="success" variant="filled" sx={{ mt: 2, borderRadius: '8px' }}>{success}</Alert>}
                </DialogContent>
                <DialogActions sx={{ p: '16px 24px', borderTop: '1px solid #4f4f4f', justifyContent: 'space-between' }}>
                    <Button variant="outlined" onClick={handleCloseDialog} sx={{ fontFamily: 'Kanit', color: '#ccc', borderColor: '#777', borderRadius: '8px', textTransform: 'none', px: 3, '&:hover': {borderColor: '#999', backgroundColor: 'rgba(255,255,255,0.08)'} }}>ยกเลิก</Button>
                    <Button onClick={handleConfirm} variant="contained" sx={{ fontFamily: 'Kanit', fontWeight: 'bold', backgroundColor: '#8e44ad', '&:hover': { backgroundColor: '#9b59b6' }, borderRadius: '8px', px: 4, textTransform: 'none' }} disabled={loading}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'ยืนยัน'}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    const inputStyles = { backgroundColor: '#2E2E2E', color: '#E0E0E0', fontFamily: 'Kanit', borderRadius: '8px', '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }, '&:hover fieldset': { borderColor: 'rgba(160, 118, 249, 0.7)' }, '&.Mui-focused fieldset': { borderColor: '#A076F9' }, }, '& .MuiInputLabel-root': { color: '#9E9E9E', fontFamily: 'Kanit' }, '& .MuiInputLabel-root.Mui-focused': { color: '#A076F9' }, };
    return (
        <Dialog open={open} onClose={handleCloseDialog} PaperProps={{ component: 'form', onSubmit: handleConfirm, sx: { borderRadius: '16px', backgroundColor: '#424242', color: 'white', p: { xs: 1, sm: 2 }, fontFamily: 'Kanit, sans-serif', width: '100%', maxWidth: '550px' } }}>
            <DialogTitle sx={{ fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '1.7rem', textAlign: 'center', p: '16px' }}>เบิก: {item.name}</DialogTitle>
            <DialogContent>
                <CardMedia component="img" image={item.imageUrl || 'https://via.placeholder.com/300'} alt={item.name} sx={{ width: '50%', maxWidth: '200px', aspectRatio: '1/1', objectFit: 'contain', mx: 'auto', mb: 2, borderRadius: '12px', backgroundColor: 'white' }} />
                <Typography sx={{ fontFamily: 'Kanit', color: '#BDBDBD', mb: 2.5, textAlign: 'center' }}>ผู้ดำเนินการ: {displayName} (คงเหลือ: {item.quantity})</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: {xs: 1, sm: 2} }}>
                    {error && <Alert severity="error" sx={{ borderRadius: '8px' }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ borderRadius: '8px' }}>{success}</Alert>}
                    <TextField label="จำนวนที่ต้องการเบิก" type="number" value={quantityToWithdraw} onChange={(e) => setQuantityToWithdraw(e.target.value)} fullWidth sx={inputStyles} InputProps={{ inputProps: { min: 1, max: item.quantity } }} required />
                    <TextField label="เหตุผล *" value={reason} onChange={(e) => setReason(e.target.value)} fullWidth multiline rows={3} sx={inputStyles} required error={!!(error && !reason.trim())} />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: '24px', pt: 2 }}>
                 <Button variant="outlined" onClick={handleCloseDialog} sx={{ fontFamily: 'Kanit', color: '#E0E0E0', borderColor: 'rgba(255, 255, 255, 0.3)', borderRadius: '8px', px: 2, textTransform: 'none', flex: 1, '&:hover': { borderColor: 'rgba(255, 255, 255, 0.7)', bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>ยกเลิก</Button>
                <Button type="submit" variant="contained" disabled={loading || !reason.trim()} sx={{ fontFamily: 'Kanit', fontWeight: 'bold', textTransform: 'none', borderRadius: '8px', px: 2, color: '#fff', backgroundColor: '#A076F9', flex: 1, ml: 1, '&:hover': { backgroundColor: '#8952f5' }, '&.Mui-disabled': { backgroundColor: '#555', color: '#888' } }}>
                    {loading ? <CircularProgress size={24} color="inherit"/> : 'ยืนยัน'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WithdrawDialog;
