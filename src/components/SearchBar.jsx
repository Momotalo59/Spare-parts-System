
import React from 'react';
import { Paper, InputBase, IconButton } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const SearchBar = ({ onSearchChange }) => {
  return (
    <Paper 
      component="form"
      elevation={3}
      sx={{
        p: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        marginBottom: '24px',
        borderRadius: '12px',
        backgroundColor: '#2c2c2c'
      }}
    >
      <IconButton sx={{ p: '10px', color: '#ccc' }} aria-label="search">
        <SearchIcon />
      </IconButton>
      <InputBase
        sx={{ ml: 1, flex: 1, color: '#fff', fontFamily: 'Kanit' }}
        placeholder="ค้นหาในรายการอะไหล่..."
        inputProps={{ 'aria-label': 'search items' }}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </Paper>
  );
};

export default SearchBar;
