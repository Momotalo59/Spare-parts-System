import React from 'react';
import { Fab, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const AddItemFab = ({ onClick }) => {
    return (
        <Tooltip title="เพิ่มรายการใหม่">
            <Fab
                color="primary"
                aria-label="add"
                onClick={onClick}
                sx={{
                    position: 'fixed',
                    bottom: { xs: 70, sm: 30 },
                    right: { xs: 20, sm: 30 },
                    backgroundColor: '#8A2BE2',
                    '&:hover': {
                        backgroundColor: '#7B24C4',
                    },
                }}
            >
                <AddIcon />
            </Fab>
        </Tooltip>
    );
};

export default AddItemFab;
