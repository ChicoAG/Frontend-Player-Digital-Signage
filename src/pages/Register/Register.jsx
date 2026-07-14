import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Monitor, Lock, User, PlusCircle, Server } from 'lucide-react';
import '../Login/Login.css'; // Meminjam CSS Login
import logoImg from '../../assets/NX-Logo.png';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        machineName: '',
        sn: '',
        password: '',
        adminUsername: '',
        adminPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        
        try {
            const response = await fetch('https://polite-times-fold.loca.lt/machine/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({
                    name_machine: formData.machineName,
                    type_machine: formData.type,
                    sn_machine: formData.sn,
                    password_machine: formData.password,
                    account_name: formData.adminUsername,
                    account_password: formData.adminPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registrasi gagal, silakan periksa kembali data Anda.');
            }

            navigate('/login', { state: { message: 'Registrasi mesin berhasil! Silakan login.' } });
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
                <h1>Registrasi Mesin</h1>
                <p>Daftarkan Digital Banner ke Sistem</p>
            </div>
            
            <div className="login-card">
                <form onSubmit={handleRegister}>
                    {errorMsg && (
                        <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '15px', textAlign: 'center', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px' }}>
                            {errorMsg}
                        </div>
                    )}
                    <div className="form-row">
                        <div className="input-group">
                            <label>Nama Mesin:</label>
                            <div className="input-wrapper">
                                <PlusCircle size={18} className="input-icon" />
                                <input 
                                    type="text" 
                                    name="machineName"
                                    placeholder="Nama Mesin" 
                                    value={formData.machineName}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Tipe Mesin:</label>
                            <div className="input-wrapper">
                                <Server size={18} className="input-icon" />
                                <input 
                                    type="text" 
                                    name="type"
                                    placeholder="Tipe Mesin" 
                                    value={formData.type}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="form-row">
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
                            <label>Password Mesin (Baru):</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input 
                                    type="password" 
                                    name="password"
                                    placeholder="Password" 
                                    value={formData.password}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </div>
                    </div>

                    <hr style={{ border: '1px solid #e2e8f0', margin: '20px 0' }} />
                    <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '10px', textAlign: 'center' }}>Otorisasi Admin CMS:</p>

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

                    <div className="input-group">
                        <label>Password Admin:</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input 
                                type="password" 
                                name="adminPassword"
                                placeholder="Password Admin" 
                                value={formData.adminPassword}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                    </div>

                    <div className="submit-button">
                        <button type="submit" disabled={loading}>
                            {loading ? 'Memproses...' : 'Daftarkan Mesin'}
                        </button>
                    </div>
                </form>

                <div className="auth-links">
                    Sudah terdaftar? <Link to="/login">Login di sini</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
