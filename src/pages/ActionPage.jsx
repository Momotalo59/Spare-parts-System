
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import {
    Container, CircularProgress, Typography, Box,
    ThemeProvider, createTheme, CssBaseline, Button
} from '@mui/material';

// Import Dialogs
import WithdrawDialog from '../components/WithdrawDialog';
import ReturnDialog from '../components/ReturnDialog';

// Custom Dark Theme
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
        text: {
            primary: '#ffffff',
            secondary: '#b3b3b3',
        },
    },
    typography: {
        fontFamily: 'Kanit, sans-serif',
    },
});

const ActionPage = () => {
    const { category, itemId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [item, setItem] = useState(null);
    const [userData, setUserData] = useState(null);
    const [action, setAction] = useState(null); // e.g., 'withdraw', 'borrow', 'return'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in, fetch their full data
                const userRef = doc(db, "users", user.uid);
                getDoc(userRef).then(docSnap => {
                    if (docSnap.exists()) {
                        setUserData({ uid: user.uid, ...docSnap.data() });
                    } else {
                        setError("ไม่พบข้อมูลผู้ใช้");
                        setLoading(false);
                    }
                }).catch(err => {
                    setError(`เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้: ${err.message}`);
                    setLoading(false);
                });
            } else {
                // No user is signed in. Redirect to login.
                navigate('/login', { state: { from: location }, replace: true });
            }
        });
        return () => unsubscribe();
    }, [navigate, location]);

    useEffect(() => {
        if (!userData) {
            // Wait for user data to be loaded
            return;
        }

        const fetchItemAndSetAction = async () => {
            if (!loading) setLoading(true);
            if (!category || !itemId) {
                setError('ข้อมูล URL ไม่ถูกต้อง');
                setLoading(false);
                return;
            }
            try {
                const itemRef = doc(db, category, itemId);
                const itemSnap = await getDoc(itemRef);

                if (itemSnap.exists()) {
                    const fetchedItem = { id: itemSnap.id, ...itemSnap.data() };
                    setItem(fetchedItem);

                    // Determine the correct action based on item category and user
                    if (category === 'tools') {
                        const isBorrowedByCurrentUser = fetchedItem.borrowedBy && fetchedItem.borrowedBy.includes(userData.uid);
                        if (isBorrowedByCurrentUser) {
                            setAction('return');
                        } else {
                            setAction('borrow');
                        }
                    } else { // 'parts' or 'safetys'
                        setAction('withdraw');
                    }
                    setDialogOpen(true); // Set to open the dialog

                } else {
                    setError('ไม่พบรายการที่ต้องการ');
                }
            } catch (err) {
                setError(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchItemAndSetAction();
    }, [userData, category, itemId]);

    const handleCloseDialog = () => {
        setDialogOpen(false);
        // Navigate to the main page after closing the dialog
        navigate('/');
    };
    
    // Loading state screen
    if (loading) {
        return (
            <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <Container sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>กำลังตรวจสอบและโหลดข้อมูล...</Typography>
                </Container>
            </ThemeProvider>
        );
    }

    // Error state screen
    if (error) {
        return (
            <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <Container sx={{ textAlign: 'center', mt: 5 }}>
                    <Typography variant="h5" color="error">{error}</Typography>
                    <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>กลับหน้าหลัก</Button>
                </Container>
            </ThemeProvider>
        );
    }
    
    // Main render: just the theme provider and the correct dialog
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Box sx={{ width: '100vw', height: '100vh', bgcolor: 'background.default' }}>
                {(action === 'withdraw' || action === 'borrow') && item && userData && (
                    <WithdrawDialog
                        open={isDialogOpen}
                        onClose={handleCloseDialog}
                        item={item}
                        displayName={userData.displayName || 'ผู้ใช้'}
                        category={category}
                        isExternalScan={true}
                    />
                )}
                {action === 'return' && item && userData && (
                    <ReturnDialog
                        open={isDialogOpen}
                        onClose={handleCloseDialog}
                        item={item}
                        user={userData}
                        isExternalScan={true}
                    />
                )}
            </Box>
        </ThemeProvider>
    );
};

export default ActionPage;
