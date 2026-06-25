import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Select, MenuItem, InputLabel, FormControl, Box, Snackbar, Alert, Typography, Paper, IconButton, CircularProgress } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CloseIcon from '@mui/icons-material/Close';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase';

const functions = getFunctions();
const notifyTelegram = httpsCallable(functions, 'notifyTelegram');

const AdminMenu = ({ onAddItemSuccess, onShowHistory, displayName }) => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [category, setCategory] = useState('parts');
    const [imageUrl, setImageUrl] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleClickOpen = () => setOpen(true);
    const handleClose = () => {
        if (isSubmitting) return;
        setOpen(false);
        setTimeout(() => {
            setName('');
            setQuantity(1);
            setCategory('parts');
            setImageUrl('');
        }, 300);
    }

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleAddItem = async () => {
        if (!name.trim() || !category.trim()) {
            showSnackbar("กรุณากรอกข้อมูลที่จำเป็นทั้งหมด (ชื่อ, หมวดหมู่)", "error");
            return;
        }
        setIsSubmitting(true);
        try {
            const docData = {
                name,
                unit: 'ชิ้น', // Hardcoded as per user request
                imageUrl,
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                updater: displayName || 'Admin',
            };

            if (category === 'tools') {
                docData.status = 'ว่าง'; // Available
            } else {
                const numQuantity = Number(quantity);
                if (isNaN(numQuantity) || numQuantity < 0) {
                    showSnackbar("กรุณากรอกจำนวนเป็นตัวเลขที่ไม่ติดลบ", "error");
                    setIsSubmitting(false);
                    return;
                }
                docData.quantity = numQuantity;
            }

            const docRef = await addDoc(collection(db, category), docData);

            const notificationPayload = {
                type: 'add',
                itemName: name,
                category: category,
                quantity: docData.quantity, 
                status: docData.status,
                user: displayName || 'Admin'
            };
            await notifyTelegram(notificationPayload);

            showSnackbar(`เพิ่มรายการ "${name}" สำเร็จ!`, 'success');
            handleClose();
            if (onAddItemSuccess) {
                onAddItemSuccess();
            }
        } catch (error) {
            console.error("Error adding document: ", error);
            showSnackbar(`เกิดข้อผิดพลาดในการเพิ่มรายการ: ${error.message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const buttonBaseStyle = {
        fontFamily: 'Kanit, sans-serif',
        fontWeight: 'bold',
        borderRadius: '50px',
        color: 'white',
        padding: '12px 28px',
        textTransform: 'none',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        transition: 'all 0.3s ease-in-out',
    };

    const inputStyle = {
        '& .MuiInputBase-root': { 
            color: 'white', 
            fontFamily: 'Kanit', 
            backgroundColor: 'rgba(255, 255, 255, 0.09)',
            borderRadius: '8px',
        },
        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
        '& .MuiInputLabel-root': { color: '#BDBDBD', fontFamily: 'Kanit' },
        '& .MuiSelect-icon': { color: 'white' },
    };

    return (
        <>
             <Paper sx={{ p: '16px', mx: { xs: 2, md: 4 }, mt: 2, backgroundColor: '#2E2E2E', borderRadius: '16px', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.3)' }}>
                <Box sx={{display: 'flex', alignItems: 'center', mb: 2, pl: 1}}>
                     <Box sx={{width: '4px', height: '20px', backgroundColor: '#C86DFA', mr: 1.5, borderRadius: '2px'}} />
                    <Typography variant="h6" sx={{ fontFamily: 'Kanit, sans-serif', fontWeight: 'bold', color: '#f0f0f0', fontSize: '1.1rem' }}>
                        เมนูสำหรับ Admin
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center', px: 1 }}>
                    <Button 
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={handleClickOpen}
                        sx={{
                            ...buttonBaseStyle,
                            background: 'linear-gradient(45deg, #C86DFA, #913BFF)',
                            boxShadow: '0px 0px 18px 0px rgba(200, 109, 250, 0.5)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #D07FFF, #A35AFF)',
                                boxShadow: '0px 0px 25px 0px rgba(208, 127, 255, 0.7)',
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        เพิ่มรายการใหม่
                    </Button>
                    <Button 
                        startIcon={<ReceiptLongIcon />}
                        onClick={onShowHistory}
                        sx={{
                           ...buttonBaseStyle,
                            background: 'linear-gradient(45deg, #FF9A7B, #FF5733)',
                            boxShadow: '0px 0px 18px 0px rgba(255, 87, 51, 0.5)',
                             '&:hover': {
                                background: 'linear-gradient(45deg, #FFAA8B, #FF6743)',
                                boxShadow: '0px 0px 25px 0px rgba(255, 103, 67, 0.7)',
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        ประวัติการทำรายการ
                    </Button>
                </Box>
            </Paper>

            <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: "20px", backgroundColor: '#3c3c3c', color: 'white', width: '100%', maxWidth: '500px' } }}>
                <DialogTitle sx={{ fontFamily: 'Kanit', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    เพิ่มรายการใหม่
                    <IconButton onClick={handleClose} sx={{ color: 'grey' }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <TextField label="ชื่อรายการ" fullWidth margin="normal" value={name} onChange={(e) => setName(e.target.value)} sx={inputStyle} />
                    <FormControl fullWidth margin="normal" sx={inputStyle}>
                        <InputLabel>หมวดหมู่</InputLabel>
                        <Select value={category} label="หมวดหมู่" onChange={(e) => setCategory(e.target.value)}>
                            <MenuItem value="parts">อะไหล่</MenuItem>
                            <MenuItem value="tools">เครื่องมือ</MenuItem>
                            <MenuItem value="safetys">อุปกรณ์เซฟตี้</MenuItem>
                        </Select>
                    </FormControl>
                    {category !== 'tools' && (
                        <TextField label="จำนวน" type="number" fullWidth margin="normal" value={quantity} onChange={(e) => setQuantity(e.target.value)} sx={inputStyle} />
                    )}
                    <TextField label="URL รูปภาพ (ถ้ามี)" fullWidth margin="normal" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} sx={inputStyle} />
                </DialogContent>
                <DialogActions sx={{ p: '16px' }}>
                    <Button onClick={handleClose} variant="outlined" sx={{ fontFamily: 'Kanit', color: '#e0e0e0', borderColor: '#9e9e9e' }}>ยกเลิก</Button>
                    <Button onClick={handleAddItem} variant="contained" color="primary" sx={{ fontFamily: 'Kanit', fontWeight: 'bold' }} disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'ยืนยันการเพิ่ม'}
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', fontFamily: 'Kanit' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default AdminMenu;
