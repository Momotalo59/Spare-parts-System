import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom'; // Use Link
import './AuthComponent.css'; // We will reuse the same CSS for consistency
import { Mail, Lock } from 'lucide-react';

const AuthComponent = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // On successful login, Firebase automatically handles the user session.
            // You might navigate to a dashboard or home page here.
            // navigate('/dashboard'); // Example
        } catch (err) {
            setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        }
    };

    return (
        <div className="page-container">
            <div className="auth-container">
                <div className="welcome-section">
                    <img src="https://img2.pic.in.th/pic/LOGO-OVERBROOK-2023-02_03c4ebbf7ce6b3bcc.png" alt="Logo" className="logo" />
                    <h1>ยินดีต้อนรับสู่ คลังพัสดุและเครื่องมือ</h1>
                    <p>ระบบบริหารสต็อกสำหรับแผนกช่างเทคนิคควบคุมระบบ<br />โรงพยาบาลโอเวอร์บรุ๊คเชียงราย</p>
                </div>

                <div className="auth-section">
                    <div className="auth-form-container">
                        <h2>เข้าสู่ระบบ</h2>
                        <p className="form-subtitle">กรุณากรอกข้อมูลของคุณเพื่อเข้าใช้งาน</p>
                        
                        {error && <p className="error-message">{error}</p>}
                        
                        <form onSubmit={handleLogin}>
                            <div className="input-group">
                                <Mail className="input-icon" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="อีเมล"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <Lock className="input-icon" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="รหัสผ่าน"
                                    required
                                />
                            </div>
                            <button type="submit">เข้าสู่ระบบ</button>
                        </form>
                        
                        <div className="switch-auth">
                            <p>
                                ยังไม่มีบัญชี? <Link to="/signup">ลงทะเบียน</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="copyright-footer">
                Copyright © 2025 แผนกช่างเทคนิคควบคุมระบบ โรงพยาบาลโอเวอร์บรุ๊คเชียงราย All Rights reserved.
            </div>
        </div>
    );
};

export default AuthComponent;
