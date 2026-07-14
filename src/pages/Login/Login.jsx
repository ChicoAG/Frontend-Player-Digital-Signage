import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Monitor, Lock, User } from 'lucide-react';
import './Login.css';
import logoImg from '../../assets/NX-Logo.png';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        sn: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const location = useLocation();

    // Cek apakah ada pesan error dari redirect halaman lain, atau jika sudah login
    React.useEffect(() => {
        if (location.state?.error) {
            setErrorMsg(location.state.error);
        }
        if (location.state?.message) {
            setSuccessMsg(location.state.message);
        }

        // Jika sudah punya token dan tidak sedang menampilkan error dari socket, langsung masuk
        const token = localStorage.getItem('display_token');
        if (token && !location.state?.error) {
            navigate('/player');
        }
    }, [location.state, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        
        try {
            const response = await fetch('http://192.168.0.160:3000/machine/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sn_machine: formData.sn,
                    password_machine: formData.password,
                    account_name: formData.adminUsername
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login gagal, silakan periksa data Anda.');
            }

            // Simpan token dan data mesin
            localStorage.setItem('display_token', data.display_token);
            localStorage.setItem('otp_code', data.otp_code);
            localStorage.setItem('otp_expires_at', data.otp_expires_at);
            localStorage.setItem('machine_sn', formData.sn);
            
            navigate('/player');
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="brand-header">
                <img src={logoImg} alt="Logo Norxel" />
                <h1>Selamat Datang</h1>
                <p>Silahkan Lakukan Login pada Mesin</p>
            </div>
            
            <div className="login-card">
                <form onSubmit={handleLogin}>
                    {errorMsg && (
                        <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '15px', textAlign: 'center', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px' }}>
                            {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div style={{ color: '#22c55e', fontSize: '13px', marginBottom: '15px', textAlign: 'center', backgroundColor: '#dcfce7', padding: '10px', borderRadius: '6px' }}>
                            {successMsg}
                        </div>
                    )}
                    <div className="input-group">
                        <label>Serial Number (SN):</label>
                        <div className="input-wrapper">
                            <Monitor size={18} className="input-icon" />
                            <input 
                                type="text" 
                                name="sn"
                                placeholder="SN Mesin" 
                                value={formData.sn}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                    </div>
                    
                    <div className="input-group">
                        <label>Password Mesin:</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input 
                                type="password" 
                                name="password"
                                placeholder="Password Mesin" 
                                value={formData.password}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Username Admin:</label>
                        <div className="input-wrapper">
                            <User size={18} className="input-icon" />
                            <input 
                                type="text" 
                                name="adminUsername"
                                placeholder="Username Admin" 
                                value={formData.adminUsername}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                    </div>

                    <div className="submit-button">
                        <button type="submit" disabled={loading}>
                            {loading ? 'Memproses...' : 'Mulai Tampilkan (Login)'}
                        </button>
                    </div>
                </form>

                <div className="auth-links">
                    Belum Terdaftar? <Link to="/register">Daftar di sini</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
