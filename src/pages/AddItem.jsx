
import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Box, Typography, Button, Paper, IconButton, TextField, Select, MenuItem, InputLabel, FormControl, CircularProgress } from '@mui/material';
import { Close, PhotoCamera } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

const AddItem = ({ setOpenAddItem }) => {
    const [category, setCategory] = useState('spare-parts');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !description) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        setLoading(true);

        try {
            let imageUrl = '';
            if (image) {
                const imageRef = ref(storage, `images/${image.name + Date.now()}`);
                const snapshot = await uploadBytes(imageRef, image);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(db, category), {
                name,
                description,
                quantity: Number(quantity),
                status: 'available',
                imageUrl,
                createdAt: serverTimestamp(),
                history: [],
            });

            toast.success('เพิ่มรายการสำเร็จ!');
            setOpenAddItem(false);

        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการเพิ่มรายการ');
            console.error("Error adding document: ", error);
        }
        setLoading(false);
    };

    return (
        <Paper sx={{ p: 3, position: 'relative', maxWidth: 500, width: '90%', maxHeight: '90vh', overflowY: 'auto', borderRadius: 3, bgcolor: '#2c2c2c', color: 'white' }}>
            <IconButton onClick={() => setOpenAddItem(false)} sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}>
                <Close />
            </IconButton>

            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                เพิ่มพัสดุใหม่
            </Typography>
            
            <form onSubmit={handleSubmit}>
                <FormControl fullWidth margin="normal">
                    <InputLabel id="category-select-label" sx={{color: 'white'}}>หมวดหมู่</InputLabel>
                    <Select
                        labelId="category-select-label"
                        value={category}
                        label="หมวดหมู่"
                        onChange={(e) => setCategory(e.target.value)}
                        sx={{color: 'white', '& .MuiOutlinedInput-notchedOutline': {borderColor: 'gray'}, '& .MuiSvgIcon-root': {color: 'white'}}}
                    >
                        <MenuItem value="spare-parts">พัสดุและอะไหล่</MenuItem>
                        <MenuItem value="tools">เครื่องมือ</MenuItem>
                        <MenuItem value="safety-items">อุปกรณ์เซฟตี้</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    margin="normal"
                    label="ชื่อพัสดุ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    InputLabelProps={{ sx: { color: 'white' } }}
                    InputProps={{ sx: { color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'gray' } } }}
                />

                <TextField
                    fullWidth
                    margin="normal"
                    label="รายละเอียด"
                    multiline
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    InputLabelProps={{ sx: { color: 'white' } }}
                    InputProps={{ sx: { color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'gray' } } }}
                />

                <TextField
                    fullWidth
                    margin="normal"
                    label="จำนวน"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    InputLabelProps={{ sx: { color: 'white' } }}
                    InputProps={{ inputProps: { min: 1 }, sx: { color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'gray' } } }}
                />

                <Box sx={{ my: 2, textAlign: 'center' }}>
                    <Button variant="outlined" component="label" startIcon={<PhotoCamera />}>
                        อัพโหลดรูปภาพ
                        <input type="file" hidden onChange={handleImageChange} accept="image/*" />
                    </Button>
                    {imagePreview && <img src={imagePreview} alt="Preview" style={{ marginTop: '10px', maxWidth: '100%', height: 'auto' }} />}
                </Box>

                <Button type="submit" fullWidth variant="contained" color="primary" disabled={loading} sx={{ mt: 2 }}>
                    {loading ? <CircularProgress size={24} /> : 'บันทึก'}
                </Button>
            </form>
        </Paper>
    );
};

export default AddItem;
