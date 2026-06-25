
import React, { useState } from 'react';
import { Box, Paper, InputBase, IconButton, Grid, CircularProgress, Typography } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import ItemCard from '../components/ItemCard'; 

const HomePage = ({ items, loading, userRole }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: '#1e1e1e', minHeight: 'calc(100vh - 70px)' }}>
            {/* Search Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <Paper component="form" sx={{ 
                    p: '4px 8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    width: '100%', 
                    maxWidth: '800px',
                    backgroundColor: '#3c3c3c',
                    borderRadius: '50px'
                }}>
                    <InputBase
                        sx={{ ml: 2, flex: 1, color: 'white', fontFamily: 'Kanit' }}
                        placeholder="ค้นหารายการพัสดุและเครื่องมือ..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    <IconButton type="submit" sx={{ p: '10px', color: '#A076F9' }} aria-label="search">
                        <SearchIcon />
                    </IconButton>
                </Paper>
            </Box>

            {/* Loading or No Items Message */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                    <CircularProgress color="secondary" />
                </Box>
            ) : filteredItems.length === 0 ? (
                <Typography sx={{ textAlign: 'center', fontFamily: 'Kanit', color: '#888', mt: 10 }}>
                    ไม่พบรายการที่ค้นหา
                </Typography>
            ) : (
                /* Corrected Items Grid */
                <Grid container spacing={2.5}>
                    {filteredItems.map((item) => (
                        <Grid item key={item.id} xs={12} sm={6} md={4} lg={2.4}>
                           <ItemCard item={item} userRole={userRole} />
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default HomePage;
