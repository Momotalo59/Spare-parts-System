import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from '../firebase';
import { setDoc, doc } from "firebase/firestore"; 
import { 
    Box, 
    TextField, 
    Button, 
    Typography, 
    Paper, 
    CircularProgress,
    Alert
} from '@mui/material';

const SignupPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!displayName) {
            setError('กรุณาใส่ชื่อที่ต้องการแสดง');
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update user profile in Firebase Auth
            await updateProfile(user, { displayName });

            // Create user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                displayName: displayName,
                email: user.email,
                role: 'user', // Default role
                createdAt: new Date()
            });

            setLoading(false);
            navigate('/'); // Navigate to dashboard after successful signup

        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 2, width: '100%', maxWidth: 400, bgcolor: 'background.paper' }}>
                <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold">
                    สร้างบัญชีใหม่
                </Typography>
                <Box component="form" onSubmit={handleSignup} noValidate>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="displayName"
                        label="ชื่อที่แสดง"
                        name="displayName"
                        autoComplete="name"
                        autoFocus
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="อีเมล"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="รหัสผ่าน"
                        type="password"
                        id="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'ลงทะเบียน'}
                    </Button>
                    <Typography align="center">
                        มีบัญชีอยู่แล้ว? <Link to="/login" style={{ color: '#A076F9' }}>เข้าสู่ระบบ</Link>
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default SignupPage;
