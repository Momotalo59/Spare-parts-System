
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    CircularProgress,
    Typography,
    Box,
    InputAdornment,
} from '@mui/material';

const BorrowReturnDialog = ({ item, open, onClose, onSuccess, user, actionType }) => {
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const dialogTitle = actionType === 'borrow' ? (item.category === 'tools' ? 'ยืม' : 'เบิก') : 'คืน';
    const quantityLabel = actionType === 'borrow' ? 'จำนวนที่ต้องการ' : 'จำนวนที่คืน';
    const buttonLabel = actionType === 'borrow' ? 'ยืนยันการเบิก/ยืม' : 'ยืนยันการคืน';

    // CORRECT: Use the reliable user.displayName passed down from App.jsx
    const userName = user?.displayName || 'N/A';

    const handleConfirm = async () => {
        const numQuantity = Number(quantity);

        if (!Number.isInteger(numQuantity) || numQuantity <= 0) {
            setError('กรุณากรอกจำนวนเป็นเลขจำนวนเต็มบวก');
            return;
        }
        if (actionType === 'borrow' && numQuantity > item.quantity) {
            setError('จำนวนที่เบิก/ยืม เกินกว่าจำนวนคงเหลือ');
            return;
        }
        if (actionType === 'borrow' && !reason) {
            setError('กรุณาระบุเหตุผลในการเบิก/ยืม');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const itemRef = doc(db, item.category, item.id);
            const batch = writeBatch(db);

            let newQuantity;
            let updateData = {};

            if (actionType === 'borrow') {
                newQuantity = item.quantity - numQuantity;
                updateData = {
                    quantity: newQuantity,
                    lastUpdated: serverTimestamp(),
                    updater: userName,
                };
                if (item.category === 'tools') {
                    updateData.status = 'ไม่ว่าง';
                    updateData.borrower = userName;
                    updateData.borrowDate = serverTimestamp();
                }
            } else { // Return
                newQuantity = item.quantity + numQuantity;
                updateData = {
                    quantity: newQuantity,
                    lastUpdated: serverTimestamp(),
                    updater: userName,
                };
                if (item.category === 'tools') {
                    updateData.status = 'ว่าง';
                    updateData.borrower = null;
                    updateData.borrowDate = null;
                }
            }
            
            batch.update(itemRef, updateData);

            // Create a history record
            const historyRef = doc(collection(db, 'history'));
            const historyData = {
                itemId: item.id,
                itemName: item.name,
                category: item.category,
                type: dialogTitle, // เบิก, ยืม, คืน
                quantity: numQuantity,
                reason: reason || 'N/A',
                user: userName,
                timestamp: serverTimestamp(),
                stockBefore: item.quantity,
                stockAfter: newQuantity,
            };
            batch.set(historyRef, historyData);
            
            await batch.commit();

            if (onSuccess) {
                onSuccess({ 
                    type: dialogTitle,
                    itemName: item.name,
                    quantity: numQuantity,
                    user: userName,
                    details: reason
                });
            }
            handleClose();

        } catch (e) {
            console.error("Error processing transaction: ", e);
            setError('เกิดข้อผิดพลาดในการทำรายการ');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        setQuantity(1);
        setReason('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: '20px', backgroundColor: '#333', color: '#fff', width: '100%', maxWidth: '500px' } }}>
            <DialogTitle sx={{ fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '1.5rem', borderBottom: '1px solid #555', px:3, py: 2 }}>
                {dialogTitle}: {item.name}
            </DialogTitle>
            <DialogContent sx={{ pt: '20px !important', px: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                     <Typography sx={{ fontFamily: 'Kanit' }}>
                        ผู้ดำเนินการ: <Typography component="span" sx={{ fontWeight: 'bold', color: '#8A2BE2' }}>{userName}</Typography>
                    </Typography>
                    <Typography sx={{ fontFamily: 'Kanit' }}>
                        จำนวนปัจจุบัน: {item.quantity} {item.unit}
                    </Typography>
                </Box>

                <Typography sx={{ fontFamily: 'Kanit', fontWeight: 500, mb: 1 }}>{quantityLabel}</Typography>
                <TextField
                    autoFocus
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    fullWidth
                    InputProps={{
                        sx: { fontFamily: 'Kanit', backgroundColor: '#444', color: '#fff', borderRadius: '8px' },
                        endAdornment: <InputAdornment position="end"><Typography sx={{color: '#aaa'}}>{item.unit}</Typography></InputAdornment>,
                    }}
                    inputProps={{ min: 1, max: actionType === 'borrow' ? item.quantity : undefined }}
                />

                {actionType === 'borrow' && (
                    <Box sx={{mt: 2}}>
                        <Typography sx={{ fontFamily: 'Kanit', fontWeight: 500, mb: 1 }}>เหตุผล *</Typography>
                        <TextField
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="ระบุสถานที่หรือเหตุผลในการเบิก..."
                            InputProps={{ sx: { fontFamily: 'Kanit', backgroundColor: '#444', color: '#fff', borderRadius: '8px' } }}
                        />
                    </Box>
                )}

                {error && <Typography color="error" sx={{ mt: 2, fontFamily: 'Kanit' }}>{error}</Typography>}
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid #555' }}>
                <Button onClick={handleClose} sx={{ fontFamily: 'Kanit', color: '#ccc', borderRadius: '8px', px: 2 }}>ยกเลิก</Button>
                <Button onClick={handleConfirm} disabled={isSubmitting} sx={{ 
                    fontFamily: 'Kanit', 
                    fontWeight: 'bold',
                    color: 'white', 
                    backgroundColor: '#8A2BE2', 
                    borderRadius: '8px', 
                    px: 3, 
                    '&:hover': { backgroundColor: '#7B1FA2' },
                    '&.Mui-disabled': { backgroundColor: '#555' }
                }}>
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : buttonLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BorrowReturnDialog;
