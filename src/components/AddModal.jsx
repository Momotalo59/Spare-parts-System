
import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, CircularProgress, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { db } from '../firebase';
import { writeBatch, doc, collection, serverTimestamp, addDoc } from 'firebase/firestore';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 500,
    bgcolor: '#343a40',
    border: '1px solid #555',
    boxShadow: 24,
    p: { xs: 2, sm: 3, md: 4 },
    borderRadius: '16px',
    color: '#fff',
    fontFamily: 'Kanit, sans-serif',
};

const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: '#2b2b2b',
        '& input, & textarea': { color: 'white', fontFamily: 'Kanit' },
        '& fieldset': { borderColor: '#555' },
        '&:hover fieldset': { borderColor: '#777' },
        '&.Mui-focused fieldset': { borderColor: '#A076F9' },
    },
    '& .MuiInputLabel-root': { color: '#aaa', fontFamily: 'Kanit' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#A076F9' },
};

const selectStyles = {
    ...textFieldStyles,
    '& .MuiSelect-select': { color: 'white', fontFamily: 'Kanit' },
    '& .MuiSvgIcon-root': { color: '#aaa' },
};

const AddModal = ({ open, onClose, userDisplayName }) => {
    const initialFormState = {
        name: '',
        category: 'parts',
        quantity: 1,
        imageUrl: '',
    };
    const [formData, setFormData] = useState(initialFormState);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (open) {
            setFormData(initialFormState);
            setIsProcessing(false);
        }
    }, [open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleConfirm = async () => {
        if (isProcessing || !formData.name || !formData.category) {
            alert('กรุณากรอกชื่อและประเภทของรายการ');
            return;
        }
        setIsProcessing(true);

        try {
            const batch = writeBatch(db);
            
            // 1. Create a new document reference in the target category
            const newDocRef = doc(collection(db, formData.category));
            
            const newItemData = {
                name: formData.name,
                quantity: Number(formData.quantity),
                imageUrl: formData.imageUrl,
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
            };

            batch.set(newDocRef, newItemData);

            // 2. Create a transaction log
            const transactionRef = doc(collection(db, "transactions"));
            batch.set(transactionRef, {
                itemId: newDocRef.id,
                itemName: newItemData.name,
                category: formData.category,
                quantity_change: newItemData.quantity, 
                new_quantity: newItemData.quantity,
                reason: 'เพิ่มรายการใหม่เข้าระบบ',
                operator: userDisplayName,
                type: 'add',
                timestamp: serverTimestamp(),
            });

            await batch.commit();
            onClose();

        } catch (error) {
            console.error("Error adding new item: ", error);
            alert("เกิดข้อผิดพลาดในการเพิ่มรายการใหม่");
            setIsProcessing(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <Typography sx={{ fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '1.5rem', mb: 3 }}>เพิ่มรายการใหม่</Typography>
                
                <TextField label="ชื่อรายการ" name="name" value={formData.name} onChange={handleChange} fullWidth sx={textFieldStyles} required />

                <FormControl fullWidth sx={{ ...textFieldStyles, mt: 2.5 }}>
                    <InputLabel>ประเภท *</InputLabel>
                    <Select label="ประเภท *" name="category" value={formData.category} onChange={handleChange} sx={selectStyles}>
                        <MenuItem value="parts">รายการอะไหล่</MenuItem>
                        <MenuItem value="tools">รายการเครื่องมือ</MenuItem>
                        <MenuItem value="safetys">อุปกรณ์เซฟตี้</MenuItem>
                    </Select>
                </FormControl>

                <TextField label="จำนวน" name="quantity" type="number" value={formData.quantity} onChange={handleChange} fullWidth sx={{ ...textFieldStyles, mt: 2.5 }} InputProps={{ inputProps: { min: 0 } }} />
                <TextField label="URL รูปภาพ" name="imageUrl" value={formData.imageUrl} onChange={handleChange} fullWidth sx={{ ...textFieldStyles, mt: 2.5 }} />

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                    <Button variant="outlined" onClick={onClose} disabled={isProcessing} sx={{ fontFamily: 'Kanit', fontWeight: 'bold', color: '#ccc', borderColor: '#777', px: 2.5, '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>ยกเลิก</Button>
                    <Button variant="contained" onClick={handleConfirm} disabled={isProcessing || !formData.name} sx={{ fontFamily: 'Kanit', fontWeight: 'bold', px: 3.5, minWidth: 100, backgroundColor: '#A076F9', '&:hover': { backgroundColor: '#8952f5' }, '&.Mui-disabled': { backgroundColor: '#555', color: '#888'} }}>
                        {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'บันทึก'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default AddModal;
