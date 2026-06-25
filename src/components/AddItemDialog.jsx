
import React, { useState, useEffect } from 'react';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle, 
    TextField, CircularProgress, Alert, FormControl, InputLabel, 
    Select, MenuItem, Box
} from '@mui/material';
import { doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { sendTelegramNotification } from '../utils/notifications';

const AddItemDialog = ({ open, onClose, category: initialCategory, userData }) => {
    const [name, setName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [category, setCategory] = useState(initialCategory);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (open) {
            setCategory(initialCategory);
            setError('');
            setSuccess('');
            setName('');
            setImageUrl('');
            setQuantity(1);
            setLoading(false);
        }
    }, [open, initialCategory]);

    const handleCloseDialog = () => {
        if (loading) return; 
        onClose();
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!userData || !userData.displayName) {
            setError('ไม่พบข้อมูลผู้ใช้ (ชื่อ) กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง');
            return;
        }

        if (!name || !category) {
            setError('กรุณากรอกข้อมูลให้ครบถ้วน: ชื่อ และ ประเภท');
            return;
        }
        if (category !== 'tools' && Number(quantity) <= 0) {
            setError('จำนวนต้องมากกว่า 0');
            return;
        }

        setLoading(true);

        try {
            const batch = writeBatch(db);
            const newItemRef = doc(collection(db, category));

            const isTool = category === 'tools';
            const finalQuantity = isTool ? 1 : Number(quantity);

            const itemData = {
                name,
                imageUrl,
                ...(isTool
                    ? { status: 'ว่าง', borrowed: 0, borrowedBy: [] }
                    : { quantity: finalQuantity })
            };
            batch.set(newItemRef, itemData);

            const transactionRef = doc(collection(db, "transactions"));
            const transactionData = {
                itemId: newItemRef.id,
                itemName: name,
                category: category,
                quantity: finalQuantity,
                user: userData.displayName, // Use displayName from userData prop
                type: 'add',
                timestamp: serverTimestamp(),
                reason: 'เพิ่มรายการใหม่เข้าสู่ระบบ'
            };
            batch.set(transactionRef, transactionData);

            await batch.commit();

            setSuccess(`เพิ่ม "${name}" สำเร็จ!`);

            sendTelegramNotification({
                type: 'add_new_item',
                itemName: name,
                quantity: finalQuantity,
                user: userData.displayName // Use displayName from userData prop
            });

            setTimeout(() => {
                handleCloseDialog();
            }, 1200);

        } catch (err) {
            setError(`เกิดข้อผิดพลาด: ${err.message}`);
            setLoading(false);
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
        <Dialog
            open={open}
            onClose={handleCloseDialog}
            PaperProps={{
                component: 'form',
                onSubmit: handleSubmit,
                sx: {
                    borderRadius: '16px',
                    backgroundColor: '#424242',
                    color: 'white',
                    p: { xs: 2, sm: 3 },
                    fontFamily: 'Kanit, sans-serif',
                    width: '100%',
                    maxWidth: '500px'
                }
            }}
        >
            <DialogTitle sx={{ fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '1.8rem', p: '8px 16px', mb: 2 }}>
                เพิ่มรายการใหม่
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {error && <Alert severity="error" sx={{ borderRadius: '8px', mb: 1 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ borderRadius: '8px', mb: 1 }}>{success}</Alert>}

                    <FormControl fullWidth variant="outlined" sx={inputStyles}>
                        <InputLabel>ประเภท</InputLabel>
                        <Select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            label="ประเภท"
                            MenuProps={{ PaperProps: { sx: { bgcolor: '#424242', color: 'white', borderRadius: '8px' } } }}
                        >
                            <MenuItem value="parts">รายการอะไหล่</MenuItem>
                            <MenuItem value="tools">รายการเครื่องมือ</MenuItem>
                            <MenuItem value="safetys">อุปกรณ์เซฟตี้</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField label="ชื่อรายการ" value={name} onChange={(e) => setName(e.target.value)} fullWidth sx={inputStyles} required />

                    {category !== 'tools' && (
                        <TextField label="จำนวน" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} fullWidth sx={inputStyles} InputProps={{ inputProps: { min: 1 } }} required />
                    )}

                    <TextField label="URL รูปภาพ" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} fullWidth sx={inputStyles} />

                </Box>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px', pt: 3 }}>
                 <Button 
                    variant="outlined" 
                    onClick={handleCloseDialog} 
                    sx={{ 
                        fontFamily: 'Kanit',
                        color: '#E0E0E0',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        px: 2,
                        textTransform: 'none',
                        '&:hover': { 
                            borderColor: 'rgba(255, 255, 255, 0.7)', 
                            bgcolor: 'rgba(255, 255, 255, 0.05)' 
                        } 
                    }}
                >
                    ยกเลิก
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{
                        fontFamily: 'Kanit',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        borderRadius: '8px',
                        px: 2,
                        color: '#fff',
                        backgroundColor: '#A076F9',
                        '&:hover': { backgroundColor: '#8952f5' },
                        '&.Mui-disabled': {
                            backgroundColor: '#555',
                            color: '#888',
                        }
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'เพิ่มรายการ'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddItemDialog;
