
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, runTransaction, collection } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase';
import useAuth from '../hooks/useAuth';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, 
    TextField, CircularProgress, Alert, Box, IconButton, Backdrop
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const functions = getFunctions();
const notifyTelegram = httpsCallable(functions, 'notifyTelegram');

const ItemPage = () => {
    const { category, id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        const fetchItem = async () => {
            if (!category || !id) return;
            setLoading(true);
            try {
                const docRef = doc(db, category, id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setItem({ id: docSnap.id, ...docSnap.data() });
                    setOpen(true);
                } else {
                    setError("No such document!");
                    setTimeout(() => navigate('/'), 3000);
                }
            } catch (err) {
                setError("Error fetching document.");
                console.error(err);
                setTimeout(() => navigate('/'), 3000);
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [category, id, navigate]);

    const handleClose = () => {
        if (isSubmitting) return;
        setOpen(false);
        // Allow dialog to close before navigating
        setTimeout(() => navigate(-1), 300);
    };

    const validateFields = () => {
        const newErrors = {};
        const isTool = category === 'tools';
        if (!isTool) {
            if (!quantity || quantity <= 0) {
                newErrors.quantity = 'จำนวนต้องมากกว่า 0';
            }
            if (quantity > item.quantity) {
                newErrors.quantity = `เบิกได้ไม่เกินจำนวนคงเหลือ (${item.quantity} ชิ้น)`;
            }
        }
        if (!reason.trim()) {
            newErrors.reason = 'กรุณาระบุเหตุผล';
        }
        setFieldErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateFields()) return;

        setIsSubmitting(true);
        setError('');
        
        const isBorrow = category === 'tools';
        const actionType = isBorrow ? 'ยืม' : 'เบิก';

        try {
            await runTransaction(db, async (transaction) => {
                const itemRef = doc(db, category, id);
                const logRef = doc(collection(db, 'transactions'));

                const itemDoc = await transaction.get(itemRef);
                if (!itemDoc.exists()) throw new Error('ไม่พบรายการนี้ในระบบ');

                const currentData = itemDoc.data();
                const notificationPayload = { user: currentUser?.displayName || 'ไม่ระบุตัวตน', itemName: item.name, reason: reason, unit: item.unit || 'ชิ้น' };

                if (isBorrow) {
                    if (currentData.status !== 'ว่าง') throw new Error('เครื่องมือนี้ถูกยืมไปแล้ว');
                    transaction.update(itemRef, { status: 'ยืม', borrower: currentUser?.displayName || 'N/A', borrowDate: serverTimestamp() });
                    Object.assign(notificationPayload, { type: 'borrow', newAvailable: 0, newBorrowed: 1, total: 1 });
                } else {
                    const numQuantity = Number(quantity);
                    const newQuantity = currentData.quantity - numQuantity;
                    if (newQuantity < 0) throw new Error('จำนวนที่เบิกมีมากกว่าของคงเหลือ');
                    transaction.update(itemRef, { quantity: newQuantity });
                    Object.assign(notificationPayload, { type: 'withdraw', quantityChanged: -numQuantity, newQuantity: newQuantity });
                }
                
                transaction.set(logRef, {
                    type: actionType,
                    itemName: item.name,
                    itemId: item.id,
                    itemCategory: category,
                    quantity: isBorrow ? 1 : Number(quantity),
                    user: currentUser.displayName || currentUser.email,
                    userId: currentUser.uid,
                    details: reason,
                    timestamp: serverTimestamp(),
                });

                await notifyTelegram(notificationPayload);
            });

            handleClose();
        } catch (e) {
            console.error(`Transaction failed: `, e);
            setError(e.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}><CircularProgress color="inherit" /></Backdrop>;
    }

    const isTool = category === 'tools';
    const titleAction = isTool ? 'ยืม' : 'เบิก';

    return (
        <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { 
            borderRadius: '24px', 
            backgroundColor: 'rgb(45, 45, 45)',
            color: 'white', 
            width: '90%', 
            maxWidth: '520px',
            border: '1px solid #555'
        } }}>
            {item && (
                <>
                    <DialogTitle sx={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'Kanit', pt: 4, pb: 1 }}>
                        {titleAction}: {item.name}
                        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 16, top: 16, color: '#999' }}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ px: 4, pt: 1, fontFamily: 'Kanit' }}>
                        <Typography variant="body1" sx={{ textAlign: 'center', color: '#ccc', mb: 3.5, fontFamily: 'Kanit' }}>
                            {`ผู้ดำเนินการ: ${currentUser?.displayName || 'N/A'}`}
                            {!isTool && ` | จำนวนปัจจุบัน: ${item.quantity} ${item.unit || 'ชิ้น'}`}
                        </Typography>
                        
                        <Box component="form" noValidate sx={{ mt: 1 }}>
                            {!isTool && <>
                                <Typography sx={{ color: '#ddd', mb: 1, fontFamily: 'Kanit', fontSize: '1rem' }}>จำนวนที่ต้องการ{titleAction}</Typography>
                                <TextField
                                    required fullWidth autoFocus type="number" id="quantity"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                    error={!!fieldErrors.quantity}
                                    helperText={fieldErrors.quantity}
                                    InputProps={{ style: { color: 'white', backgroundColor: '#3a3a3a', borderRadius: '12px', fontFamily: 'Kanit' } }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: 'transparent' },
                                            '&:hover fieldset': { borderColor: '#777' },
                                            '&.Mui-focused fieldset': { borderColor: '#8A2BE2' },
                                        },
                                        '& .MuiFormHelperText-root': { color: '#ff7961', fontFamily: 'Kanit' }
                                    }}
                                />
                            </>}
                            <Typography sx={{ color: '#ddd', mt: 2.5, mb: 1, fontFamily: 'Kanit', fontSize: '1rem' }}>เหตุผล *</Typography>
                            <TextField
                                required fullWidth multiline rows={4} id="reason"
                                placeholder="ระบุสถานที่หรือเหตุผลในการเบิก..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                error={!!fieldErrors.reason}
                                helperText={fieldErrors.reason}
                                InputProps={{ style: { color: 'white', backgroundColor: '#3a3a3a', borderRadius: '12px', padding: '12px', fontFamily: 'Kanit' } }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'transparent' },
                                        '&:hover fieldset': { borderColor: '#777' },
                                        '&.Mui-focused fieldset': { borderColor: '#8A2BE2' },
                                    },
                                    '& .MuiFormHelperText-root': { color: '#ff7961', fontFamily: 'Kanit' }
                                }}
                            />
                        </Box>
                        {error && <Alert severity="error" sx={{ mt: 2, backgroundColor: '#5e2a2a', color: 'white', fontFamily: 'Kanit' }}>{error}</Alert>}
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 2, display: 'flex', gap: 1.5 }}>
                        <Button variant="outlined" onClick={handleClose} sx={{ flex: 1, py: 1.2, borderRadius: '12px', color: '#ccc', borderColor: '#666', fontFamily: 'Kanit', '&:hover': { borderColor: '#888', backgroundColor: 'rgba(255, 255, 255, 0.05)' } }} disabled={isSubmitting}>ยกเลิก</Button>
                        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting} sx={{ flex: 1, py: 1.2, borderRadius: '12px', backgroundColor: '#8A2BE2', fontFamily: 'Kanit', fontWeight: 'bold', '&:hover': { backgroundColor: '#7b26c7' }, '&.Mui-disabled': { backgroundColor: '#5a5a5a' } }}>
                            {isSubmitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : `ยืนยันการ${titleAction}`}
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
};

export default ItemPage;
