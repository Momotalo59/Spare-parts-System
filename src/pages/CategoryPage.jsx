
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, IconButton, CircularProgress } from '@mui/material';
import { Close } from '@mui/icons-material';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext'; // <-- Import useAuth to get user role
import ItemGrid from '../components/ItemGrid'; // <-- Import the correct grid component

const CategoryPage = ({ setOpenCategory, setOpenItemDetails }) => {
    const [selectedCategory, setSelectedCategory] = useState('parts');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const { userProfile } = useAuth(); // <-- Get user profile, which contains the role

    const handleCategoryClick = async (category) => {
        if (!category) return;
        setLoading(true);
        setSelectedCategory(category);
        try {
            const querySnapshot = await getDocs(collection(db, category));
            const itemsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setItems(itemsList);
        } catch (error) {
            console.error("Error fetching items from Firestore: ", error);
            setItems([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        handleCategoryClick(selectedCategory);
    }, [selectedCategory]);

    // This function will be passed to the ItemCard, but it's not used here directly.
    // The ItemCard itself will handle its own click events.
    const handleItemClick = (itemId) => {
        // This might be useful for a future details page, but for now, ItemGrid handles display.
        console.log("Item clicked in CategoryPage, but navigation is handled by cards.");
    };

    return (
        <Paper sx={{ p: 3, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1300, overflowY: 'auto', bgcolor: '#1e1e1e', color: 'white' }}>
            <IconButton onClick={() => setOpenCategory(false)} sx={{ position: 'absolute', top: 16, right: 16, color: 'white' }}>
                <Close />
            </IconButton>

            <Typography variant="h4" sx={{ fontFamily: 'Kanit', textAlign: 'center', mb: 2, fontWeight: 'bold' }}>
                เลือกหมวดหมู่
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Button onClick={() => setSelectedCategory('parts')} sx={{ color: 'white', borderBottom: selectedCategory === 'parts' ? '2px solid #9c27b0' : 'none', borderRadius: 0, padding: '16px', fontWeight: selectedCategory === 'parts' ? 'bold' : 'normal', flex: 1, fontFamily:'Kanit' }}>
                    รายการอะไหล่
                </Button>
                <Button onClick={() => setSelectedCategory('tools')} sx={{ color: 'white', borderBottom: selectedCategory === 'tools' ? '2px solid #9c27b0' : 'none', borderRadius: 0, padding: '16px', fontWeight: selectedCategory === 'tools' ? 'bold' : 'normal', flex: 1, fontFamily:'Kanit' }}>
                    รายการเครื่องมือ
                </Button>
                <Button onClick={() => setSelectedCategory('safetys')} sx={{ color: 'white', borderBottom: selectedCategory === 'safetys' ? '2px solid #9c27b0' : 'none', borderRadius: 0, padding: '16px', fontWeight: selectedCategory === 'safetys' ? 'bold' : 'normal', flex: 1, fontFamily:'Kanit' }}>
                    อุปกรณ์เซฟตี้
                </Button>
            </Box>

            {/* --- THIS IS THE MAJOR CHANGE: USING ItemGrid INSTEAD OF List --- */}
            <ItemGrid 
                items={items} 
                loading={loading} 
                userRole={userProfile?.role} // Pass the user's role down to the grid and cards
            />
        </Paper>
    );
};

export default CategoryPage;
