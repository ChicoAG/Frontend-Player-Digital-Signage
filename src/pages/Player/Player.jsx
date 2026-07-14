import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import { Clock } from 'lucide-react';
import DesignViewer from '../../components/DesignViewer/DesignViewer';
import './Player.css';
import logoImg from '../../assets/NX-Logo.png';

const Player = () => {
    const navigate = useNavigate();
    const [otpCode, setOtpCode] = useState('');
    const [sn, setSn] = useState('');
    const [otpExpiresAt, setOtpExpiresAt] = useState('');
    const [socketError, setSocketError] = useState('');
    const [activeDesign, setActiveDesign] = useState(() => {
        const savedDesign = localStorage.getItem('active_design');
        if (savedDesign) {
            try { return JSON.parse(savedDesign); } catch (e) { return null; }
        }
        return null;
    });
    const [debugApi, setDebugApi] = useState('');
    const isRefreshing = useRef(false);

    useEffect(() => {
        // Ambil data OTP dan Token dari localStorage
        const token = localStorage.getItem('display_token');
        const otp = localStorage.getItem('otp_code');
        const machineSn = localStorage.getItem('machine_sn');
        const expiresAt = localStorage.getItem('otp_expires_at');

        // Jika tidak ada token (belum login), tendang kembali ke halaman login
        if (!token) {
            navigate('/login');
            return;
        }

        if (otp) {
            setOtpCode(otp);
        }
        if (machineSn) {
            setSn(machineSn);
        }
        if (expiresAt) {
            setOtpExpiresAt(expiresAt);
        }

        // Buka koneksi WebSocket ke backend
        const socket = io("http://192.168.0.160:3000", {
            transports: ["websocket"]
        });

        const fetchActiveContent = async () => {
            try {
                const response = await fetch(`http://192.168.0.160:3000/display/content?token=${token}`);
                if (response.ok) {
                    const data = await response.json();
                    setDebugApi(JSON.stringify(data));
                    if (data.active && data.design) {
                        localStorage.setItem('active_design', JSON.stringify(data.design));
                        setActiveDesign(prev => {
                            if (JSON.stringify(prev) !== JSON.stringify(data.design)) {
                                return data.design;
                            }
                            return prev;
                        });
                    } else {
                        localStorage.removeItem('active_design');
                        setActiveDesign(null);
                    }
                } else {
                    setDebugApi(`Error API: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error("Gagal mengambil konten aktif:", error);
                setDebugApi(`Network Error: ${error.message}`);
            }
        };

        socket.on("connect", () => {
            // Kirim token lewat event 'join-display' agar TV masuk ke room socket
            socket.emit("join-display", token);
            
            // Beri jeda 1.5 detik agar backend selesai meregistrasi socket sebelum kita nge-fetch status design-nya.
            // Ini mencegah race condition di mana backend membalas {active: false} sesaat sebelum mengenali socket ini.
            setTimeout(() => {
                fetchActiveContent();
            }, 1500);
        });

        socket.on('sync-content', () => {
            console.log('Ada pembaruan desain! Memuat ulang konten...');
            fetchActiveContent();
        });

        socket.on('otp-updated', (data) => {
            if (data && data.otp_code) {
                setOtpCode(data.otp_code);
                localStorage.setItem('otp_code', data.otp_code);
            }
        });

        socket.on('error', (message) => {
            if (message === 'Display token ini sedang digunakan oleh perangkat lain.') {
                socket.disconnect();
                localStorage.removeItem('display_token');
                navigate('/login', { state: { error: message } });
            }
        });

        // Auto-refresh konten setiap 30 detik agar sesuai jadwal
        const contentInterval = setInterval(() => {
            fetchActiveContent();
        }, 30000);

        return () => {
            clearInterval(contentInterval);
            socket.disconnect();
        };

    }, [navigate]);

    // Timer Auto-Refresh OTP
    useEffect(() => {
        if (!otpExpiresAt) return;

        const checkExpiration = async () => {
            if (isRefreshing.current) return;
            const now = new Date().getTime();
            const expTime = new Date(otpExpiresAt).getTime();
            const timeDiff = expTime - now;

            // Jika sisa waktu kurang dari 30 detik (30000 ms), minta OTP baru
            if (timeDiff < 30000) {
                isRefreshing.current = true;
                try {
                    const token = localStorage.getItem('display_token');
                    if (!token) return;

                    const response = await fetch(`http://192.168.0.160:3000/display/refresh-otp?token=${token}`, {
                        method: 'POST'
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.otp_code && data.otp_expires_at) {
                            setOtpCode(data.otp_code);
                            setOtpExpiresAt(data.otp_expires_at);
                            localStorage.setItem('otp_code', data.otp_code);
                            localStorage.setItem('otp_expires_at', data.otp_expires_at);
                        }
                    } else if (response.status === 401) {
                        // Jika token sudah tidak valid, logout
                        localStorage.removeItem('display_token');
                        navigate('/login');
                    }
                } catch (error) {
                    console.error("Gagal merefresh OTP:", error);
                } finally {
                    isRefreshing.current = false;
                }
            }
        };

        const intervalId = setInterval(checkExpiration, 10000); // Cek setiap 10 detik
        checkExpiration(); // Cek langsung saat mount pertama kali

        return () => clearInterval(intervalId);
    }, [otpExpiresAt, navigate]);

    return (
        <>
            {activeDesign ? (
                <DesignViewer designData={activeDesign} />
            ) : (
                <div className="player-container">
                    <div className="standby-content">
                        <h1>Mesin Siap Digunakan</h1>
                        {sn && (
                            <div style={{ marginBottom: '25px', color: '#94a3b8', fontSize: '21px' }}>
                                SN Mesin: <strong style={{ color: 'white' }}>{sn}</strong>
                            </div>
                        )}
                        
                        <div className="otp-box">
                            {otpCode || '------'}
                        </div>
                        

                        <div className="otp-timer">
                            <Clock size={18} />
                            <span>Menunggu koneksi dari server...</span>
                        </div>
                    </div>

                    <div className="status-badge">
                        <div className="status-dot"></div>
                        Online & Standby
                    </div>
                </div>
            )}
        </>
    );
};

export default Player;
