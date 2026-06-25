
import React, { useState, useEffect } from 'react';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle,
    TextField, CircularProgress, Alert, FormControl, InputLabel,
    Select, MenuItem, Box
} from '@mui/material';
import { doc, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { sendTelegramNotification } from '../utils/notifications';

const EditItemDialog = ({ open, onClose, item, category: itemCategory, displayName }) => {
    const [name, setName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (open && item) {
            setName(item.name || '');
            setImageUrl(item.imageUrl || '');
            setCategory(itemCategory);
            if (itemCategory !== 'tools') {
                setQuantity(item.quantity || 1);
            }
            setError('');
            setSuccess('');
            setLoading(false); // Reset loading state on open
        } else if (!open) {
            setName('');
            setImageUrl('');
            setQuantity(1);
            setCategory('');
        }
    }, [open, item, itemCategory]);

    const handleCloseDialog = () => {
        if (loading) return;
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) {
            setError('กรุณากรอกชื่อรายการ');
            return;
        }
        if (category !== 'tools' && Number(quantity) < 0) {
            setError('จำนวนต้องไม่ติดลบ');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const batch = writeBatch(db);

            const itemData = { name, imageUrl };
            let newQuantityForNotification;
            const details = [];

            if (category === 'tools') {
                if (item.name !== name) details.push(`ชื่อเป็น "${name}"`);
                if (item.imageUrl !== imageUrl) details.push('URL รูปภาพ');
                itemData.status = (item.status && itemCategory === 'tools') ? item.status : 'ว่าง';
            } else {
                const newQuantity = Number(quantity);
                if (item.name !== name) details.push(`ชื่อเป็น "${name}"`);
                if (item.quantity !== newQuantity) details.push(`จำนวนเป็น ${newQuantity}`);
                if (item.imageUrl !== imageUrl) details.push('URL รูปภาพ');
                itemData.quantity = newQuantity;
                newQuantityForNotification = newQuantity;
            }

            if (category !== itemCategory) {
                const oldItemRef = doc(db, itemCategory, item.id);
                batch.delete(oldItemRef);
                const newItemRef = doc(db, category, item.id);
                batch.set(newItemRef, itemData);
                details.push(`ประเภทเป็น "${category}"`);
            } else {
                const itemRef = doc(db, itemCategory, item.id);
                batch.update(itemRef, itemData);
            }

            const transactionRef = doc(collection(db, "transactions"));
            batch.set(transactionRef, { 
                itemId: item.id, itemName: name, category: category, user: displayName,
                type: 'แก้ไขรายการ', timestamp: serverTimestamp(), 
                reason: `แก้ไขข้อมูล: ${details.join(', ')}` 
            });

            // Commit to DB
            await batch.commit();

            // Immediate UI Feedback
            setSuccess(`แก้ไข "${name}" สำเร็จ!`);

            // Send notification in background
            sendTelegramNotification({
                type: 'adjust',
                itemName: name, // Send the new name
                details: details.join(', ') || 'อัปเดตข้อมูลทั่วไป',
                newQuantity: newQuantityForNotification, // Will be undefined for tools, which is fine
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
        '& .MuiSelect-icon': { color: '#9E9E9E' },
    };

    return (
        <Dialog open={open} onClose={handleCloseDialog} PaperProps={{ component: 'form', onSubmit: handleSubmit, sx: { borderRadius: '16px', backgroundColor: '#424242', color: 'white', p: { xs: 2, sm: 3 }, fontFamily: 'Kanit, sans-serif', width: '100%', maxWidth: '500px' } }}>
            <DialogTitle sx={{ fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '1.8rem', p: '8px 16px', mb: 2 }}>
                แก้ไขรายการ
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {error && <Alert severity="error" sx={{ borderRadius: '8px', mb: 1 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ borderRadius: '8px', mb: 1 }}>{success}</Alert>}

                    <FormControl fullWidth variant="outlined" sx={inputStyles}>
                        <InputLabel>ประเภท</InputLabel>
                        <Select value={category} onChange={(e) => setCategory(e.target.value)} label="ประเภท" MenuProps={{ PaperProps: { sx: { bgcolor: '#424242', color: 'white', borderRadius: '8px' } } }}>
                            <MenuItem value="parts">รายการอะไหล่</MenuItem>
                            <MenuItem value="tools">รายการเครื่องมือ</MenuItem>
                            <MenuItem value="safetys">อุปกรณ์เซฟตี้</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField label="ชื่อรายการ" value={name} onChange={(e) => setName(e.target.value)} fullWidth sx={inputStyles} required />

                    {category !== 'tools' && (
                        <TextField label="จำนวน" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} fullWidth sx={inputStyles} InputProps={{ inputProps: { min: 0 } }} required />
                    )}

                    <TextField label="URL รูปภาพ" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} fullWidth sx={inputStyles} />

                </Box>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px', pt: 3 }}>
                <Button variant="outlined" onClick={handleCloseDialog} sx={{ fontFamily: 'Kanit', color: '#E0E0E0', borderColor: 'rgba(255, 255, 255, 0.3)', borderRadius: '8px', px: 2, textTransform: 'none', '&:hover': { borderColor: 'rgba(255, 255, 255, 0.7)', bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                    ยกเลิก
                </Button>
                <Button type="submit" variant="contained" disabled={loading} sx={{ fontFamily: 'Kanit', fontWeight: 'bold', textTransform: 'none', borderRadius: '8px', px: 2, color: '#fff', backgroundColor: '#A076F9', '&:hover': { backgroundColor: '#8952f5' }, '&.Mui-disabled': { backgroundColor: '#555', color: '#888' } }}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'บันทึกการแก้ไข'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditItemDialog;
