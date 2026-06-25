
import React, { useState, useEffect } from 'react';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle,
    TextField, CircularProgress, Alert, Box, Typography, CardMedia
} from '@mui/material';
import { doc, writeBatch, serverTimestamp, collection, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { sendTelegramNotification } from '../utils/notifications';

const RefillDialog = ({ open, onClose, item, displayName, category }) => {
    const [quantityToAdd, setQuantityToAdd] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (open) {
            setQuantityToAdd(1);
            setError('');
            setSuccess('');
        }
    }, [open]);

    const handleCloseDialog = () => {
        if (loading) return;
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const addQuantity = Number(quantityToAdd);
        if (addQuantity <= 0) {
            setError('จำนวนที่ต้องการเพิ่มต้องมากกว่า 0');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const itemRef = doc(db, category, item.id);
            
            const itemSnap = await getDoc(itemRef);
            if (!itemSnap.exists()) {
                throw new Error("ไม่พบรายการสินค้านี้");
            }
            const currentQuantity = itemSnap.data().quantity || 0;
            const newQuantity = currentQuantity + addQuantity;

            const batch = writeBatch(db);
            batch.update(itemRef, { quantity: newQuantity });

            const transactionRef = doc(collection(db, "transactions"));
            batch.set(transactionRef, {
                itemId: item.id,
                itemName: item.name,
                category: category,
                quantity: addQuantity,
                user: displayName,
                type: 'เติมสต็อก',
                timestamp: serverTimestamp(),
                reason: 'เติมสต็อกสินค้า'
            });

            // Commit to DB
            await batch.commit();

            // Immediate UI feedback
            setSuccess(`เติม "${item.name}" จำนวน ${addQuantity} สำเร็จ!`);

            // Send notification in the background
            sendTelegramNotification({
                type: 'restock',
                itemName: item.name,
                quantityChanged: addQuantity,
                newQuantity: newQuantity,
                user: displayName
            });

            // Close dialog after a delay
            setTimeout(handleCloseDialog, 1500);

        } catch (err) {
            setError(`เกิดข้อผิดพลาด: ${err.message}`);
            setLoading(false); // Stop loading only on error
        }
    };

    const inputStyles = {
      backgroundColor: '#2E2E2E',
      color: '#E0E0E0',
      fontFamily: 'Kanit',
      borderRadius: '8px',
      '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
        '&:hover fieldset': { borderColor: 'rgba(160, 118, 249, 0.7)' },
        '&.Mui-focused fieldset': { borderColor: '#A076F9' },
      },
      '& .MuiInputLabel-root': { color: '#9E9E9E', fontFamily: 'Kanit' },
      '& .MuiInputLabel-root.Mui-focused': { color: '#A076F9' },
    };

    if (!item) return null;

    return (
        <Dialog open={open} onClose={handleCloseDialog} PaperProps={{ component: 'form', onSubmit: handleSubmit, sx: { borderRadius: '16px', backgroundColor: '#424242', color: 'white', p: { xs: 1, sm: 2 }, fontFamily: 'Kanit, sans-serif', width: '100%', maxWidth: '550px' } }}>
            <DialogTitle sx={{ fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '1.7rem', textAlign: 'center', p: '16px' }}>
                เติมสต็อก: {item.name}
            </DialogTitle>
            <DialogContent>
                 <CardMedia component="img" image={item.imageUrl || 'https://via.placeholder.com/300'} alt={item.name} sx={{ width: '50%', maxWidth: '200px', aspectRatio: '1/1', objectFit: 'contain', mx: 'auto', mb: 2, borderRadius: '12px', backgroundColor: 'white' }} />
                <Typography sx={{ fontFamily: 'Kanit', color: '#BDBDBD', mb: 2.5, textAlign: 'center' }}>
                    ผู้ดำเนินการ: {displayName} (คงเหลือ: {item.quantity})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: {xs: 1, sm: 2} }}>
                    {error && <Alert severity="error" sx={{ borderRadius: '8px' }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ borderRadius: '8px' }}>{success}</Alert>}

                    <TextField 
                        label="จำนวนที่ต้องการเพิ่ม"
                        type="number" 
                        value={quantityToAdd}
                        onChange={(e) => setQuantityToAdd(e.target.value)} 
                        fullWidth 
                        sx={inputStyles} 
                        InputProps={{ inputProps: { min: 1 } }} 
                        required 
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: '24px', pt: 2, justifyContent: 'center' }}>
                 <Button variant="outlined" onClick={handleCloseDialog} sx={{ fontFamily: 'Kanit', color: '#E0E0E0', borderColor: 'rgba(255, 255, 255, 0.3)', borderRadius: '8px', px: 2, textTransform: 'none', flex: 1, mr: 1, '&:hover': { borderColor: 'rgba(255, 255, 255, 0.7)', bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                    ยกเลิก
                </Button>
                <Button type="submit" variant="contained" disabled={loading} sx={{ fontFamily: 'Kanit', fontWeight: 'bold', textTransform: 'none', borderRadius: '8px', px: 2, color: '#fff', backgroundColor: '#A076F9', flex: 1, '&:hover': { backgroundColor: '#8952f5' }, '&.Mui-disabled': { backgroundColor: '#555', color: '#888' } }}>
                    {loading ? <CircularProgress size={24} color="inherit"/> : 'ยืนยัน'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RefillDialog;
