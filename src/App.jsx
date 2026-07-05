import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Shield, Cpu, Zap, Users, ArrowUpRight, ArrowDownLeft, Lock, 
  Unlock, Send, RefreshCw, Layers, CheckCircle2, AlertTriangle, Monitor,
  Smartphone, Plus, PhoneCall, Copy, Eye, EyeOff, Check, X, ShieldAlert, Award,
  Handshake, Info, Headphones
} from 'lucide-react';

import energyBanner from './assets/energy_banner.png';
import refineryBanner from './assets/refinery_banner.png';
import metalsBanner from './assets/metals_banner.png';

const API_BASE = '/api';

export default function App() {
  // Global States
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nex_token') || null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('nex_admin_token') || null);
  const [adminData, setAdminData] = useState(null);

  // View States
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [landingMode, setLandingMode] = useState(true); // true = landing page, false = app portal
  const [activeTab, setActiveTab] = useState('dashboard'); // desktop portal tab
  const [mobileTab, setMobileTab] = useState('dashboard'); // simulated mobile screen tab
  const [isCopied, setIsCopied] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPartnershipModal, setShowPartnershipModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide banner carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Tickers & Social Simulation
  const [tickers, setTickers] = useState({ gold: 2341.20, lithium: 13420.50, solar: 1.45 });
  const [telegramFeed, setTelegramFeed] = useState([]);
  const [mobileNotifications, setMobileNotifications] = useState([]);

  // Forms
  const [signupForm, setSignupForm] = useState({ phone: '', password: '', referredByCode: '' });
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [isRegistering, setIsRegistering] = useState(false); // toggle register vs login in portal
  
  const [depositForm, setDepositForm] = useState({ amount: '', channel: 'bKash', trxId: '' });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', channel: 'Direct Mobile Wallet', destination: '' });
  const [vaultAmount, setVaultAmount] = useState('');
  
  // Status feedback
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' }); // type: 'success' | 'error'
  const [isMining, setIsMining] = useState(false);
  const [miningPercent, setMiningPercent] = useState(0);

  // Lists
  const [contracts, setContracts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Reference for notification stack timer
  const notificationIdRef = useRef(0);

  // Adjust live price tickers randomly
  useEffect(() => {
    const timer = setInterval(() => {
      setTickers(prev => ({
        gold: Math.round((prev.gold + (Math.random() - 0.5) * 2.5) * 100) / 100,
        lithium: Math.round((prev.lithium + (Math.random() - 0.5) * 15) * 100) / 100,
        solar: Math.round((prev.solar + (Math.random() - 0.5) * 0.02) * 100) / 100
      }));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Telegram feeds periodically
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch(`${API_BASE}/telegram/feed`);
        if (res.ok) {
          const data = await res.json();
          setTelegramFeed(data);
          
          // Trigger a simulated push notification on mobile emulator occasionally
          if (data.length > 0 && Math.random() > 0.6) {
            triggerMobilePushNotification(data[0].text);
          }
        }
      } catch (err) {
        // Silent catch
      }
    };
    fetchFeed();
    const interval = setInterval(fetchFeed, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch User/Admin profiles on load or token updates
  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchUserContracts();
      fetchUserTxHistory();
      setLandingMode(false);
    } else {
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    if (adminToken) {
      setIsAdmin(true);
      fetchAdminData();
    } else {
      setIsAdmin(false);
    }
  }, [adminToken]);

  // Utility logic: Push notification simulator
  const triggerMobilePushNotification = (text) => {
    const id = notificationIdRef.current++;
    setMobileNotifications(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setMobileNotifications(prev => prev.filter(n => n.id !== id));
    }, 5500);
  };

  const showStatus = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 5000);
  };

  // Auth Operations
  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus("Registration successful! Please log in.");
      setIsRegistering(false);
      setLoginForm({ phone: signupForm.phone, password: signupForm.password });
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('nex_token', data.token);
      setToken(data.token);
      showStatus("Login successful! Welcome to Nexora.");
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('nex_admin_token', data.token);
      setAdminToken(data.token);
      setIsAdmin(true);
      setShowAdminLogin(false);
      showStatus("Admin Session Authenticated.");
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nex_token');
    setToken(null);
    setUser(null);
    setLandingMode(true);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('nex_admin_token');
    setAdminToken(null);
    setIsAdmin(false);
    setAdminData(null);
  };

  // Data Fetching
  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) handleLogout();
        throw new Error(data.error);
      }
      setUser(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserContracts = async () => {
    try {
      const res = await fetch(`${API_BASE}/invest/contracts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContracts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserTxHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/transact/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminData = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // User Actions
  const buyContract = async (tierId) => {
    try {
      const res = await fetch(`${API_BASE}/invest/activate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tierId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(data.message);
      fetchUserProfile();
      fetchUserContracts();
      fetchUserTxHistory();
      triggerMobilePushNotification(`Contract Activated: ${data.contract.tierName}!`);
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const harvestEnergy = async (contractId) => {
    setIsMining(true);
    setMiningPercent(0);
    
    // Animate mining progress indicator (gamified)
    const interval = setInterval(() => {
      setMiningPercent(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/invest/claim`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ contractId })
        });
        const data = await res.json();
        setIsMining(false);
        if (!res.ok) throw new Error(data.error);

        showStatus(data.message);
        fetchUserProfile();
        fetchUserContracts();
        fetchUserTxHistory();
        triggerMobilePushNotification(`Harvest Successful: ROI credited.`);
      } catch (err) {
        setIsMining(false);
        showStatus(err.message, 'error');
      }
    }, 1600);
  };

  const lockInVault = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/vault/lock`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: vaultAmount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(data.message);
      setVaultAmount('');
      fetchUserProfile();
      fetchUserTxHistory();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const unlockVault = async () => {
    try {
      const res = await fetch(`${API_BASE}/vault/unlock`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(data.message);
      fetchUserProfile();
      fetchUserTxHistory();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/transact/deposit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(depositForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(data.message);
      setDepositForm({ amount: '', channel: user?.currency === 'BDT' ? 'bKash' : 'UPI', trxId: '' });
      fetchUserTxHistory();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/transact/withdraw`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(withdrawForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(data.message);
      setWithdrawForm({ amount: '', channel: user?.currency === 'BDT' ? 'Direct Mobile Wallet' : 'UPI ID', destination: '' });
      fetchUserProfile();
      fetchUserTxHistory();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  // Admin Actions
  const adminApproveTx = async (txId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/transactions/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ transactionId: txId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus("Transaction approved!");
      fetchAdminData();
      if (user) {
        fetchUserProfile();
        fetchUserTxHistory();
      }
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const adminRejectTx = async (txId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/transactions/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ transactionId: txId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus("Transaction rejected.");
      fetchAdminData();
      if (user) {
        fetchUserProfile();
        fetchUserTxHistory();
      }
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const adminUpdateSettings = async (settingsPayload) => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(settingsPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus("System settings updated successfully.");
      fetchAdminData();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const adminEditUserBalance = async (userId, newBalance) => {
    try {
      const res = await fetch(`${API_BASE}/admin/user/edit-balance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ userId, newBalance })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus("User balance adjusted.");
      fetchAdminData();
      if (user && user.id === userId) fetchUserProfile();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const adminToggleUserFreeze = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'frozen' ? 'active' : 'frozen';
    try {
      const res = await fetch(`${API_BASE}/admin/user/toggle-status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ userId, status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(`User account ${nextStatus === 'frozen' ? 'frozen' : 'unfrozen'}.`);
      fetchAdminData();
      if (user && user.id === userId && nextStatus === 'frozen') handleLogout();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Helper renderers for regional currency symbol & names
  const fmtVal = (val) => {
    const symbol = user?.currency === 'INR' ? '₹' : '৳';
    return `${symbol}${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Render Ticker Header
  const renderTickerBar = () => (
    <div style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '8px 24px',
      fontSize: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 100,
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="live-dot"></span>
        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>LIVE COMMODITY INDEX:</span>
      </div>
      <div style={{ display: 'flex', gap: '20px', fontWeight: 600 }}>
        <span style={{ color: 'var(--text-main)' }}>
          GOLD/oz: <span style={{ color: 'var(--accent-gold)' }}>${tickers.gold.toFixed(2)}</span>
        </span>
        <span style={{ color: 'var(--text-main)' }}>
          LITHIUM/t: <span style={{ color: 'var(--accent-blue)' }}>${tickers.lithium.toFixed(2)}</span>
        </span>
        <span style={{ color: 'var(--text-main)' }}>
          SOLAR CELL/W: <span style={{ color: 'var(--accent-green)' }}>${tickers.solar.toFixed(2)}</span>
        </span>
      </div>
      {isAdmin ? (
        <button onClick={handleAdminLogout} style={{
          background: '#ef4444',
          color: 'var(--text-main)',
          border: 'none',
          padding: '4px 10px',
          fontSize: '11px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 600
        }}>Logout Admin</button>
      ) : (
        <button onClick={() => setShowAdminLogin(true)} style={{
          background: 'transparent',
          color: 'var(--text-muted)',
          border: 'none',
          cursor: 'pointer',
          fontSize: '11px'
        }}>Admin Access</button>
      )}
    </div>
  );

  // Render Interactive SVG Chart
  const renderMockChart = () => (
    <svg viewBox="0 0 500 150" style={{ width: '100%', height: 'auto', marginTop: '15px' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Grid Lines */}
      <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      
      {/* Area */}
      <path d="M0,150 L0,110 Q50,70 100,85 T200,50 T300,90 T400,35 T500,20 L500,150 Z" fill="url(#chartGrad)" />
      
      {/* Path Line */}
      <path d="M0,110 Q50,70 100,85 T200,50 T300,90 T400,35 T500,20" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" />
      
      {/* Glowing Nodes */}
      <circle cx="200" cy="50" r="4" fill="var(--accent-green)" />
      <circle cx="400" cy="35" r="4" fill="var(--accent-green)" />
      <circle cx="500" cy="20" r="5" fill="#fff" />
    </svg>
  );

  // Render Portal App Tabs
  const renderDesktopDashboardTab = () => {
    if (!user) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Main Wallet</span>
              <Award size={18} style={{ color: 'var(--accent-green)' }} />
            </div>
            <h2 style={{ fontSize: '28px', color: 'var(--text-main)' }}>{fmtVal(user.balance)}</h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Locked Country Currency: {user.currency}</span>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Compound Vault</span>
              <Lock size={18} style={{ color: 'var(--accent-blue)' }} />
            </div>
            <h2 style={{ fontSize: '28px', color: 'var(--text-main)' }}>{fmtVal(user.vault_balance)}</h2>
            {user.vault_locked_until ? (
              <span style={{ fontSize: '11px', color: 'var(--accent-blue)' }}>
                Locked until: {new Date(user.vault_locked_until).toLocaleDateString()}
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No locked deposits</span>
            )}
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Active Assets</span>
              <Cpu size={18} style={{ color: 'var(--accent-gold)' }} />
            </div>
            <h2 style={{ fontSize: '28px', color: 'var(--text-main)' }}>{user.stats.activeContracts} Units</h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Invested: {fmtVal(user.stats.totalInvested)}</span>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Invite Revenue</span>
              <Users size={18} style={{ color: 'var(--accent-green)' }} />
            </div>
            <h2 style={{ fontSize: '28px', color: 'var(--text-main)' }}>{fmtVal(user.stats.totalEarned)}</h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Direct Invites (L1): {user.stats.teamBreakdown.level1}</span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Corporate Grid Yield Analytics</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Real-time solar mining node generation output indexes (MWh/s)</p>
            </div>
            <div className="badge badge-green">GRID SYNCED</div>
          </div>
          {renderMockChart()}
        </div>

        {/* Project Contracts Summary */}
        <div className="glass-card">
          <h3>Your Funded Infrastructures</h3>
          <div style={{ marginTop: '15px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 0' }}>Asset Project</th>
                  <th>Value</th>
                  <th>Daily Yield</th>
                  <th>Timeline</th>
                  <th>Claim status</th>
                </tr>
              </thead>
              <tbody>
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px 0', textColor: 'var(--text-muted)', textAlign: 'center' }}>
                      No active contracts. Fund a Clean Energy/Commodity project to begin harvesting.
                    </td>
                  </tr>
                ) : (
                  contracts.map(c => {
                    const isClaimedToday = c.last_claimed_at && 
                      new Date(c.last_claimed_at).toDateString() === new Date().toDateString();
                    
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 0', fontWeight: 600 }}>{c.tier_name}</td>
                        <td>{user.currency === 'INR' ? '₹' : '৳'}{c.price}</td>
                        <td style={{ color: 'var(--accent-green)' }}>+{user.currency === 'INR' ? '₹' : '৳'}{(c.price * c.daily_roi).toFixed(2)}/day</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px' }}>{c.days_elapsed} / {c.duration_days} Days</span>
                            <div style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${(c.days_elapsed / c.duration_days) * 100}%`, height: '100%', background: 'var(--accent-green)' }}></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {c.status === 'completed' ? (
                            <span className="badge badge-gray">COMPLETED</span>
                          ) : isClaimedToday ? (
                            <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={10} /> CLAIMED
                            </span>
                          ) : (
                            <button onClick={() => {
                              setActiveTab('mining');
                              setMobileTab('mining');
                            }} style={{
                              background: 'var(--accent-green)',
                              border: 'none',
                              padding: '4px 8px',
                              fontSize: '11px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: '#000'
                            }}>HARVEST NOW</button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDesktopInvestTab = () => {
    const userCurrency = user?.currency || 'BDT';
    const activeTiers = INVESTMENT_TIERS[userCurrency];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2>Asset Unit Infrastructure Contracts</h2>
          <p style={{ color: 'var(--text-muted)' }}>Lease clean power nodes or heavy metal refining infrastructure. Lock duration for structural yields.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {activeTiers.map(t => (
            <div key={t.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: t.id === 'deep_vip' ? '4px solid var(--accent-gold)' : '1px solid var(--border-color)' }}>
              <div>
                <span className={`badge ${t.id === 'solar' ? 'badge-green' : t.id === 'lithium' ? 'badge-blue' : 'badge-gold'}`}>
                  {t.id === 'solar' ? 'ENERGY INFRA' : t.id === 'lithium' ? 'COMMODITY REFINING' : 'PREMIUM CORE VIP'}
                </span>
                <h3 style={{ marginTop: '10px', fontSize: '18px' }}>{t.name}</h3>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Purchase cost:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{userCurrency === 'INR' ? '₹' : '৳'}{t.price}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Daily harvest Yield:</span>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>+{(t.dailyRoi * 100).toFixed(2)}% ({userCurrency === 'INR' ? '₹' : '৳'}{(t.price * t.dailyRoi).toFixed(2)})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
                  <span style={{ color: 'var(--text-main)' }}>{t.duration} Days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Net return:</span>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{(t.dailyRoi * t.duration * 100).toFixed(0)}% ({userCurrency === 'INR' ? '₹' : '৳'}{(t.price * t.dailyRoi * t.duration)})</span>
                </div>
              </div>

              <button 
                onClick={() => buyContract(t.id)} 
                className="btn-primary" 
                style={{ 
                  width: '100%', 
                  justifyContent: 'center',
                  background: t.id === 'deep_vip' ? 'linear-gradient(135deg, var(--accent-gold) 0%, #ff6d00 100%)' : undefined
                }}
              >
                Fund Contract Unit
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDesktopMiningTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}>
      <div style={{ textAlign: 'center', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Zap size={40} style={{ color: 'var(--accent-green)', alignSelf: 'center', animation: isMining ? 'spinSlow 1s infinite linear' : 'float 4s infinite ease-in-out' }} />
        <h2>Gamified Energy Harvesting Hub</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          To trigger payouts, you must manually run our energy grid harvesting turbines every day. Missing a day skips that day's asset yield!
        </p>
      </div>

      <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '30px' }}>
        {contracts.filter(c => c.status === 'active').length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            No active project nodes found. Buy an Asset Unit first.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4 style={{ color: 'var(--text-muted)' }}>ACTIVE TURBINES AVAILABLE:</h4>
            {contracts.filter(c => c.status === 'active').map(c => {
              const isClaimedToday = c.last_claimed_at && 
                new Date(c.last_claimed_at).toDateString() === new Date().toDateString();

              return (
                <div key={c.id} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '16px',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ color: 'var(--text-main)' }}>{c.tier_name}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--accent-green)' }}>
                      Accumulated: {user.currency === 'INR' ? '₹' : '৳'}{(c.price * c.daily_roi).toFixed(2)}
                    </span>
                  </div>

                  {isClaimedToday ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)', fontSize: '13px', fontWeight: 600 }}>
                      <CheckCircle2 size={16} /> Grid Synced (Claimed)
                    </div>
                  ) : (
                    <button 
                      disabled={isMining}
                      onClick={() => harvestEnergy(c.id)}
                      style={{
                        background: 'linear-gradient(135deg, var(--accent-green) 0%, #00e676 100%)',
                        color: '#000',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {isMining ? `HARVESTING (${miningPercent}%)` : 'Collect Energy Units'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderDesktopVaultTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2>Nexora Vault (Compound Lockup)</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Hedge against volatility. Transfer your daily earnings into our Vault for 7 extra days to accrue an additional 3% to 5% compounding interest bonuses.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Lock form */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3>Lock Daily Yields</h3>
          <form onSubmit={lockInVault} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Wallet Balance: {fmtVal(user?.balance || 0)}</label>
              <input 
                type="number" 
                placeholder="Enter lockup amount" 
                value={vaultAmount} 
                onChange={(e) => setVaultAmount(e.target.value)} 
                className="glass-input" 
                required 
              />
            </div>
            <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
              <Lock size={16} /> Lock Funds (7 Days)
            </button>
          </form>
        </div>

        {/* Release / Status */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3>Vault Status Ledger</h3>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Vault Stash:</span>
              <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--accent-blue)' }}>{fmtVal(user?.vault_balance || 0)}</span>
            </div>
            {user?.vault_locked_until ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Lock expires:</span>
                  <span style={{ color: 'var(--text-main)' }}>{new Date(user.vault_locked_until).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Unlock status:</span>
                  {new Date() >= new Date(user.vault_locked_until) ? (
                    <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>RELEASE READY</span>
                  ) : (
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>LOCKED</span>
                  )}
                </div>
                <button 
                  onClick={unlockVault} 
                  style={{
                    marginTop: '10px',
                    background: new Date() >= new Date(user.vault_locked_until) ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                    color: new Date() >= new Date(user.vault_locked_until) ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: new Date() >= new Date(user.vault_locked_until) ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  disabled={new Date() < new Date(user.vault_locked_until)}
                >
                  <Unlock size={16} /> Unlock Vault & Harvest Compound Bonus
                </button>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>No active lock period exists. Submit yields to lock.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesktopReferralsTab = () => {
    const inviteLink = `${window.location.origin}?ref=${user?.referral_code}`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>3-Tier Affiliate Commission Tree</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Level 1 (Direct): <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>10%</span> | Level 2 (Indirect): <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>4%</span> | Level 3 (Generational): <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>1%</span>
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>YOUR REFERRAL CODE</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent-gold)' }}>{user?.referral_code}</span>
              <button onClick={() => copyToClipboard(user?.referral_code)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {isCopied ? <Check size={14} style={{ color: 'var(--accent-green)' }} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Tree graphic */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3>Network Structure</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '20px 0', position: 'relative' }}>
            <div style={{ textAlign: 'center', width: '30%', zIndex: 2 }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--accent-green-glow)', border: '2px solid var(--accent-green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>1</span>
              </div>
              <h4>Level 1 (Direct)</h4>
              <p style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0' }}>{user?.stats.teamBreakdown.level1}</p>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>10% Direct yield</span>
            </div>

            <div style={{ textAlign: 'center', width: '30%', zIndex: 2 }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--accent-blue-glow)', border: '2px solid var(--accent-blue)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>2</span>
              </div>
              <h4>Level 2 (Indirect)</h4>
              <p style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0' }}>{user?.stats.teamBreakdown.level2}</p>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>4% Indirect yield</span>
            </div>

            <div style={{ textAlign: 'center', width: '30%', zIndex: 2 }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--accent-gold-glow)', border: '2px solid var(--accent-gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>3</span>
              </div>
              <h4>Level 3 (Generations)</h4>
              <p style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0' }}>{user?.stats.teamBreakdown.level3}</p>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>1% Generational yield</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDesktopWalletTab = () => {
    const isBD = user?.currency === 'BDT';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* Deposit slip */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3>Manual Deposit Submission</h3>
            
            {/* Pay info */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>TRANSFER METHOD INSTRUCTIONS:</span>
              {isBD ? (
                <>
                  <p>Send BDT to our official Merchant Mobile accounts via Cash-Out or Send-Money:</p>
                  <div>bKash Merchant: <strong>+8801700998822</strong></div>
                  <div>Nagad Merchant: <strong>+8801988443322</strong></div>
                </>
              ) : (
                <>
                  <p>Transfer INR directly using standard UPI identifiers / Bank IMPS:</p>
                  <div>UPI VPA: <strong>nexora.pay@ybl</strong></div>
                  <div>IMPS Bank: IFSC <strong>ICIC0000102</strong> / A/C <strong>998800112233</strong></div>
                </>
              )}
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enter your manual Transaction ID (TrxID) below after completing payment. Duplicated IDs will trigger an anti-fraud security lock.</p>
            </div>

            <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deposit Amount ({user?.currency})</label>
                  <input type="number" placeholder="Amount" value={depositForm.amount} onChange={e => setDepositForm({...depositForm, amount: e.target.value})} className="glass-input" required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Channel</label>
                  <select value={depositForm.channel} onChange={e => setDepositForm({...depositForm, channel: e.target.value})} className="glass-input" style={{ appearance: 'none' }}>
                    {isBD ? (
                      <>
                        <option value="bKash">bKash Mobile Wallet</option>
                        <option value="Nagad">Nagad Mobile Wallet</option>
                        <option value="Rocket">Rocket Mobile Wallet</option>
                      </>
                    ) : (
                      <>
                        <option value="UPI">UPI String (PhonePe/GPay/Paytm)</option>
                        <option value="IMPS">Direct Bank IMPS Transfer</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Transaction ID (TrxID)</label>
                <input type="text" placeholder="e.g. TXN100234900" value={depositForm.trxId} onChange={e => setDepositForm({...depositForm, trxId: e.target.value})} className="glass-input" required />
              </div>
              <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>Submit Receipt</button>
            </form>
          </div>

          {/* Withdrawal slip */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3>Request Payout Cashout</h3>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: 600, color: '#ef4444' }}>WITHDRAWAL CONFIGURATIONS:</span>
              <div>Minimum Payout: <strong>{isBD ? '৳500.00' : '₹400.00'}</strong></div>
              <div>Standard Service Fee: <strong>10%</strong> (applied to gross amount)</div>
              <div>Processing timeline: instant automated routing</div>
            </div>

            <form onSubmit={handleWithdrawal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Withdraw Amount ({user?.currency})</label>
                  <input type="number" placeholder="Amount" value={withdrawForm.amount} onChange={e => setWithdrawForm({...withdrawForm, amount: e.target.value})} className="glass-input" required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Payout Channel</label>
                  <select value={withdrawForm.channel} onChange={e => setWithdrawForm({...withdrawForm, channel: e.target.value})} className="glass-input" style={{ appearance: 'none' }}>
                    {isBD ? (
                      <>
                        <option value="Direct Mobile Wallet">bKash/Nagad Payout Wallet</option>
                      </>
                    ) : (
                      <>
                        <option value="UPI ID">UPI ID Transfer (VPA)</option>
                        <option value="Bank Account">Bank Wire Transfer Account</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Payout Destination Wallet / UPI ID / Account Details</label>
                <input type="text" placeholder="e.g. +8801700... or name@okaxis" value={withdrawForm.destination} onChange={e => setWithdrawForm({...withdrawForm, destination: e.target.value})} className="glass-input" required />
              </div>
              <button type="submit" className="btn-primary" style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #ef4444 0%, #ff5252 100%)', color: 'var(--text-main)' }}>Request Payout</button>
            </form>
          </div>
        </div>

        {/* Tx Ledger History */}
        <div className="glass-card">
          <h3>Your Transaction History</h3>
          <div style={{ marginTop: '15px', maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 0' }}>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Method / Detail</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No transfers logged yet.</td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 0', color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>{t.type.toUpperCase()}</td>
                      <td style={{ color: t.type === 'deposit' || t.type === 'referral_comm' || t.type === 'claim' ? 'var(--accent-green)' : '#ef4444' }}>
                        {t.type === 'deposit' || t.type === 'referral_comm' || t.type === 'claim' ? '+' : '-'}{t.currency === 'INR' ? '₹' : '৳'}{t.amount}
                      </td>
                      <td>{t.channel || 'System Wallet'} - {t.trx_id || t.details || 'Internal Transfer'}</td>
                      <td>
                        <span className={`badge ${
                          t.status === 'approved' ? 'badge-green' : 
                          t.status === 'pending' ? 'badge-blue' : 'badge-red'
                        }`}>{t.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render Mobile Screen Content (Simulated APK Wrapper UI)
  const renderMobileScreen = () => {
    // If not logged in, render mobile login/signup
    if (!user) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0', justifyContent: 'center', height: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ color: 'var(--accent-green)', letterSpacing: '1px', fontFamily: 'var(--font-display)' }}>NEXORA</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Clean Energy & Commodities Leasing Platform</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            {isRegistering ? (
              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '16px', color: 'var(--text-main)' }}>Nexora Workspace Signup</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <input type="text" placeholder="Phone Number (e.g. +88017... / +91...)" value={signupForm.phone} onChange={e => setSignupForm({...signupForm, phone: e.target.value})} className="glass-input" required />
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Locks BDT (+880) or INR (+91)</span>
                </div>
                <input type="password" placeholder="Secure Password" value={signupForm.password} onChange={e => setSignupForm({...signupForm, password: e.target.value})} className="glass-input" required />
                <input type="text" placeholder="Referral Code (Optional)" value={signupForm.referredByCode} onChange={e => setSignupForm({...signupForm, referredByCode: e.target.value})} className="glass-input" />
                <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '10px' }}>Register Node</button>
                <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Already have an account? <span onClick={() => setIsRegistering(false)} style={{ color: 'var(--accent-green)', cursor: 'pointer' }}>Login</span>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '16px', color: 'var(--text-main)' }}>Nexora Portal Sign In</h3>
                <input type="text" placeholder="Registered Phone" value={loginForm.phone} onChange={e => setLoginForm({...loginForm, phone: e.target.value})} className="glass-input" required />
                <input type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="glass-input" required />
                <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '10px' }}>Sign In</button>
                <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  New client? <span onClick={() => setIsRegistering(true)} style={{ color: 'var(--accent-green)', cursor: 'pointer' }}>Register</span>
                </div>
              </form>
            )}
          </div>
        </div>
      );
    }

    // Inside Mobile Dashboard Tabs
    switch (mobileTab) {
      case 'dashboard':
        const slides = [
          {
            title: "INVEST IN CLEAN ENERGY",
            highlight: "BUILD A SUSTAINABLE TOMORROW",
            desc: "Secure Returns. Positive Impact.",
            img: energyBanner,
            action: () => setMobileTab('invest')
          },
          {
            title: "RENEWABLE ENERGY",
            highlight: "Powering a Sustainable Future",
            desc: "Clean Energy, Bright Future.",
            img: refineryBanner,
            action: () => setMobileTab('invest')
          },
          {
            title: "PRECIOUS METALS REFLECTION",
            highlight: "Mining Value, Building Tomorrow",
            desc: "Secure daily ROI and audited currency limits.",
            img: metalsBanner,
            action: () => setMobileTab('invest')
          }
        ];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Top welcome back */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Welcome Back</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{user.phone}</div>
              </div>
              <span className="badge badge-green" style={{ fontSize: '9px', padding: '2px 6px' }}>MOBILE APK OK</span>
            </div>

            {/* High-quality sliding banners */}
            <div className="banner-container">
              <div className="banner-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {slides.map((s, i) => (
                  <div key={i} className="banner-slide" style={{ backgroundImage: `url(${s.img})` }}>
                    <div className="banner-overlay"></div>
                    <div className="banner-content">
                      <span style={{ fontSize: '7px', color: 'var(--accent-gold)', fontWeight: 800, letterSpacing: '0.5px' }}>{s.title}</span>
                      <h3 className="banner-title" style={{ fontSize: '12px', fontWeight: 800 }}>{s.highlight}</h3>
                      <span className="banner-desc" style={{ fontSize: '8px' }}>{s.desc}</span>
                      <button className="banner-btn" onClick={s.action} style={{ padding: '2px 6px', fontSize: '8px' }}>
                        Explore Projects <ArrowUpRight size={8} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="banner-dots">
                {slides.map((_, i) => (
                  <div key={i} className={`banner-dot ${currentSlide === i ? 'active' : ''}`} onClick={() => setCurrentSlide(i)}></div>
                ))}
              </div>
            </div>

            {/* Scrolling marquee text ticker */}
            <div className="marquee-wrapper" style={{ padding: '4px 8px', borderRadius: '6px' }}>
              <div className="marquee-content">
                {[
                  `User 017*** withdrew ${user.currency === 'INR' ? '₹' : '৳'}2,500!`,
                  `User 019*** invested ${user.currency === 'INR' ? '₹' : '৳'}5,000!`,
                  `User 016*** withdrew ${user.currency === 'INR' ? '₹' : '৳'}1,800!`,
                  `User 015*** invested ${user.currency === 'INR' ? '₹' : '৳'}20,000!`,
                  `User 018*** withdrew ${user.currency === 'INR' ? '₹' : '৳'}3,200!`,
                  `User 017*** invested ${user.currency === 'INR' ? '₹' : '৳'}1,000!`,
                  `User 013*** withdrew ${user.currency === 'INR' ? '₹' : '৳'}4,500!`,
                  `User 017*** withdrew ${user.currency === 'INR' ? '₹' : '৳'}2,500!`,
                  `User 019*** invested ${user.currency === 'INR' ? '₹' : '৳'}5,000!`,
                  `User 016*** withdrew ${user.currency === 'INR' ? '₹' : '৳'}1,800!`,
                  `User 015*** invested ${user.currency === 'INR' ? '₹' : '৳'}20,000!`,
                  `User 018*** withdrew ${user.currency === 'INR' ? '₹' : '৳'}3,200!`,
                  `User 017*** invested ${user.currency === 'INR' ? '₹' : '৳'}1,000!`,
                  `User 013*** withdrew ${user.currency === 'INR' ? '₹' : '৳'}4,500!`
                ].map((item, index) => {
                  const isWithdraw = item.includes('withdrew');
                  return (
                    <span key={index} className="marquee-item" style={{ fontSize: '9px', marginRight: '24px' }}>
                      <span style={{ color: 'var(--accent-gold)' }}>🔊</span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.split(' ')[0]}</span>{' '}
                      <span style={{ color: isWithdraw ? '#ef4444' : 'var(--accent-green)' }}>
                        {isWithdraw ? 'withdrew' : 'invested'}
                      </span>{' '}
                      <strong style={{ color: 'var(--accent-gold)' }}>
                        {item.split(' ').slice(2).join(' ')}
                      </strong>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions 2x3 grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button onClick={() => setMobileTab('wallet')} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '10px 4px', borderRadius: '10px', fontSize: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <ArrowUpRight size={16} style={{ color: 'var(--accent-gold)' }} />
                <span>Deposit</span>
              </button>
              <button onClick={() => setMobileTab('wallet')} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '10px 4px', borderRadius: '10px', fontSize: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <ArrowDownLeft size={16} style={{ color: 'var(--accent-gold)' }} />
                <span>Withdraw</span>
              </button>
              <button onClick={() => setShowAboutModal(true)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '10px 4px', borderRadius: '10px', fontSize: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Info size={16} style={{ color: 'var(--accent-gold)' }} />
                <span>About Us</span>
              </button>
              <button onClick={() => setMobileTab('referrals')} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '10px 4px', borderRadius: '10px', fontSize: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Users size={16} style={{ color: 'var(--accent-gold)' }} />
                <span>Invite Friends</span>
              </button>
              <button onClick={() => setShowPartnershipModal(true)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '10px 4px', borderRadius: '10px', fontSize: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Handshake size={16} style={{ color: 'var(--accent-gold)' }} />
                <span>Partnership</span>
              </button>
              <button onClick={() => setShowSupportModal(true)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '10px 4px', borderRadius: '10px', fontSize: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Headphones size={16} style={{ color: 'var(--accent-gold)' }} />
                <span>Support</span>
              </button>
            </div>

            {/* Team Leader Event highly motivating card */}
            <div style={{ background: 'radial-gradient(circle at 10% 20%, rgba(255, 215, 0, 0.08) 0%, rgba(15, 19, 31, 0.95) 90%)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: '14px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 8px 20px rgba(255, 215, 0, 0.03)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '7px', color: 'var(--accent-gold)', fontWeight: 800, letterSpacing: '0.5px' }}>TEAM LEADER PROGRAM</span>
                  <h4 style={{ fontSize: '11px', color: '#fff', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>
                    Become a Nexora Official Team Leader!
                  </h4>
                  <p style={{ fontSize: '8.5px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                    Grow your grid network to secure fixed monthly salaries & bonuses.
                  </p>
                </div>
                <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '10px', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                  <Award size={20} style={{ color: 'var(--accent-gold)', animation: 'float 3s infinite ease-in-out' }} />
                </div>
              </div>

              {/* Milestones grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.01)', padding: '4px', borderRadius: '4px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#cd7f32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: '#000', fontWeight: 900 }}>B</div>
                  <div>
                    <span style={{ fontWeight: 700, color: '#fff' }}>BRONZE</span>: {user.currency === 'INR' ? '₹' : '৳'}100k
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.01)', padding: '4px', borderRadius: '4px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#c0c0c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: '#000', fontWeight: 900 }}>S</div>
                  <div>
                    <span style={{ fontWeight: 700, color: '#fff' }}>SILVER</span>: {user.currency === 'INR' ? '₹' : '৳'}500k
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.01)', padding: '4px', borderRadius: '4px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffd700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: '#000', fontWeight: 900 }}>G</div>
                  <div>
                    <span style={{ fontWeight: 700, color: '#fff' }}>GOLD</span>: {user.currency === 'INR' ? '₹' : '৳'}1.0M
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.01)', padding: '4px', borderRadius: '4px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#e5e4e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: '#000', fontWeight: 900 }}>D</div>
                  <div>
                    <span style={{ fontWeight: 700, color: '#fff' }}>DIAMOND</span>: {user.currency === 'INR' ? '₹' : '৳'}2.5M
                  </div>
                </div>
              </div>

              <button onClick={() => setShowPartnershipModal(true)} style={{ background: 'linear-gradient(135deg, var(--accent-gold) 0%, #ffab00 100%)', color: '#000', border: 'none', borderRadius: '6px', padding: '4px', fontSize: '9px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                LEARN MORE <ArrowUpRight size={8} />
              </button>
            </div>

            {/* Grid yield micro index */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h4 style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2px' }}>Live Market Overview</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '8px', color: 'var(--accent-green)' }}>
                  <span className="live-dot" style={{ width: '5px', height: '5px', animation: 'liveIndicator 1.5s infinite' }}></span> LIVE
                </div>
              </div>
              {renderMockChart()}
            </div>
          </div>
        );

      case 'invest':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '15px' }}>Purchase Asset Units</h3>
            {INVESTMENT_TIERS[user.currency].map(t => (
              <div key={t.id} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>{t.name.split(' Nexora ')[1] || t.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ROI: {(t.dailyRoi*100).toFixed(1)}% | {t.duration} Days</span>
                  <strong style={{ fontSize: '13px', color: 'var(--accent-gold)' }}>{user.currency === 'INR' ? '₹' : '৳'}{t.price}</strong>
                </div>
                <button onClick={() => buyContract(t.id)} style={{
                  background: 'var(--accent-green)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '11px',
                  cursor: 'pointer',
                  color: '#000'
                }}>Lease</button>
              </div>
            ))}
          </div>
        );

      case 'mining':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', alignSelf: 'flex-start' }}>Collect Energy Units</h3>
            
            <div style={{ width: '80px', height: '80px', background: 'var(--accent-green-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--accent-green)', animation: isMining ? 'spinSlow 1s infinite linear' : 'none', margin: '20px 0' }}>
              <Zap size={32} style={{ color: 'var(--accent-green)' }} />
            </div>

            {contracts.filter(c => c.status === 'active').length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No active infrastructure contracts found. Visit invest tab.</p>
            ) : (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {contracts.filter(c => c.status === 'active').map(c => {
                  const isClaimedToday = c.last_claimed_at && 
                    new Date(c.last_claimed_at).toDateString() === new Date().toDateString();

                  return (
                    <div key={c.id} style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      padding: '10px',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontSize: '11px' }}>
                        <div style={{ fontWeight: 600 }}>{c.tier_name.split(' Nexora ')[1] || c.tier_name}</div>
                        <div style={{ color: 'var(--accent-green)' }}>Yield: {user.currency === 'INR' ? '₹' : '৳'}{(c.price * c.daily_roi).toFixed(2)}</div>
                      </div>

                      {isClaimedToday ? (
                        <span style={{ color: 'var(--accent-green)', fontSize: '11px', fontWeight: 600 }}>Collected</span>
                      ) : (
                        <button 
                          disabled={isMining}
                          onClick={() => harvestEnergy(c.id)}
                          style={{
                            background: 'var(--accent-green)',
                            border: 'none',
                            color: '#000',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          {isMining ? 'Harvesting...' : 'Collect'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'vault':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '15px' }}>Nexora Vault Lockup</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Move daily ROI profits to lockup vault for 7 days. Compounding bonus of +3% to 5% is added upon release.</p>

            <form onSubmit={lockInVault} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="number" placeholder="Stash amount to Lock" value={vaultAmount} onChange={e => setVaultAmount(e.target.value)} className="glass-input" required />
              <button type="submit" className="btn-primary" style={{ padding: '8px', justifyContent: 'center', fontSize: '12px' }}>
                <Lock size={12} /> Lock in Vault
              </button>
            </form>

            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Vault Balance:</span>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{fmtVal(user.vault_balance)}</span>
              </div>
              {user.vault_locked_until ? (
                <>
                  <div>Status: {new Date() >= new Date(user.vault_locked_until) ? 'Unlock Ready' : 'Locked'}</div>
                  <div>Expiry: {new Date(user.vault_locked_until).toLocaleDateString()}</div>
                  <button onClick={unlockVault} style={{
                    marginTop: '4px',
                    background: new Date() >= new Date(user.vault_locked_until) ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                    color: 'var(--text-main)',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '4px',
                    cursor: new Date() >= new Date(user.vault_locked_until) ? 'pointer' : 'not-allowed'
                  }}>Unlock & Credit Main</button>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No locked deposits active.</div>
              )}
            </div>
          </div>
        );

      case 'referrals':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '15px' }}>Affiliate Invites</h3>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Code: <strong>{user.referral_code}</strong></span>
              <button onClick={() => copyToClipboard(user.referral_code)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Copy size={10} /> Copy Link
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center', fontSize: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '8px', borderRadius: '6px' }}>
                <div>Level 1</div>
                <strong style={{ fontSize: '14px', color: 'var(--accent-green)' }}>{user.stats.teamBreakdown.level1}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '8px', borderRadius: '6px' }}>
                <div>Level 2</div>
                <strong style={{ fontSize: '14px', color: 'var(--accent-blue)' }}>{user.stats.teamBreakdown.level2}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '8px', borderRadius: '6px' }}>
                <div>Level 3</div>
                <strong style={{ fontSize: '14px', color: 'var(--accent-gold)' }}>{user.stats.teamBreakdown.level3}</strong>
              </div>
            </div>
          </div>
        );

      case 'wallet':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '15px' }}>Financial Engine</h3>
            
            {/* Deposit Section */}
            <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ fontSize: '12px' }}>Submit Deposit receipt</h4>
              <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="number" placeholder="Amount" value={depositForm.amount} onChange={e => setDepositForm({...depositForm, amount: e.target.value})} className="glass-input" style={{ flex: 1, padding: '8px' }} required />
                  <input type="text" placeholder="TrxID Code" value={depositForm.trxId} onChange={e => setDepositForm({...depositForm, trxId: e.target.value})} className="glass-input" style={{ flex: 1, padding: '8px' }} required />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '6px', justifyContent: 'center', fontSize: '11px' }}>Submit Deposit</button>
              </form>
            </div>

            {/* Withdraw Section */}
            <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ fontSize: '12px' }}>Request cashout</h4>
              <form onSubmit={handleWithdrawal} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input type="number" placeholder="Amount" value={withdrawForm.amount} onChange={e => setWithdrawForm({...withdrawForm, amount: e.target.value})} className="glass-input" style={{ padding: '8px' }} required />
                <input type="text" placeholder="Payout Destination" value={withdrawForm.destination} onChange={e => setWithdrawForm({...withdrawForm, destination: e.target.value})} className="glass-input" style={{ padding: '8px' }} required />
                <button type="submit" className="btn-primary" style={{ padding: '6px', justifyContent: 'center', background: '#ef4444', color: 'var(--text-main)', fontSize: '11px' }}>Request cashout</button>
              </form>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render Master Admin Control Dashboard Overlay Panel
  const renderAdminDashboard = () => {
    if (!adminData) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Loading admin logs...</div>;

    const { summary, users: uList, pendingTransactions: ptList, settings: sysSettings } = adminData;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Master Admin Control Terminal</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Modify balances, toggle global freezes, and approve deposit slips.</p>
          </div>
          <button onClick={handleAdminLogout} style={{ background: '#ef4444', color: 'var(--text-main)', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Disconnect Admin</button>
        </div>

        {/* Totals Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL CLIENTS</span>
            <h3>{summary.totalUsers}</h3>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ACTIVE LEASES</span>
            <h3>{summary.activeContractsCount}</h3>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ACTIVE INVESTMENT VOLUME</span>
            <h3 style={{ color: 'var(--accent-gold)' }}>{summary.activeVolume} Units</h3>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>APPROVED DEPOSITS</span>
            <h3 style={{ color: 'var(--accent-green)' }}>{summary.depositsVolume} Credits</h3>
          </div>
        </div>

        {/* Global Settings & Freeze switch */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3>Global System Configurations</h3>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Global Freeze Switch:</span>
              <button 
                onClick={() => adminUpdateSettings({ global_freeze: sysSettings.global_freeze === '1' ? '0' : '1' })}
                style={{
                  background: sysSettings.global_freeze === '1' ? '#ef4444' : 'var(--accent-green)',
                  color: '#000',
                  fontWeight: 700,
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {sysSettings.global_freeze === '1' ? 'LOCKED (FREEZE ACTIVE)' : 'SYSTEM HEALTHY'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Fee (%):</span>
              <input type="number" defaultValue={sysSettings.withdrawal_fee_pct} onBlur={(e) => adminUpdateSettings({ withdrawal_fee_pct: e.target.value })} style={{ width: '60px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Min BDT Payout:</span>
              <input type="number" defaultValue={sysSettings.min_withdrawal_bdt} onBlur={(e) => adminUpdateSettings({ min_withdrawal_bdt: e.target.value })} style={{ width: '80px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Min INR Payout:</span>
              <input type="number" defaultValue={sysSettings.min_withdrawal_inr} onBlur={(e) => adminUpdateSettings({ min_withdrawal_inr: e.target.value })} style={{ width: '80px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px' }} />
            </div>
          </div>
        </div>

        {/* Pending Transactions approval desk */}
        <div className="glass-card">
          <h3>Client Deposits & Withdrawal Queue</h3>
          <div style={{ marginTop: '10px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 0' }}>Client</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Channel / Details</th>
                  <th>TrxID / Target</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ptList.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '20px 0', textColor: 'var(--text-muted)', textAlign: 'center' }}>No transactions requiring attention in the queue.</td>
                  </tr>
                ) : (
                  ptList.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 0', fontWeight: 600 }}>{tx.phone}</td>
                      <td>
                        <span className={`badge ${tx.type === 'deposit' ? 'badge-green' : 'badge-red'}`}>{tx.type}</span>
                      </td>
                      <td>{tx.currency} {tx.amount}</td>
                      <td>{tx.channel}</td>
                      <td>{tx.trx_id || tx.details || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => adminApproveTx(tx.id)} style={{ background: 'var(--accent-green)', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>APPROVE</button>
                          <button onClick={() => adminRejectTx(tx.id)} style={{ background: '#ef4444', color: 'var(--text-main)', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>REJECT</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Balance Editor / freezing table */}
        <div className="glass-card">
          <h3>User Management Accounts Ledger</h3>
          <div style={{ marginTop: '10px', maxHeight: '350px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 0' }}>Client Phone</th>
                  <th>IP Address</th>
                  <th>Currency</th>
                  <th>Balance</th>
                  <th>Vault</th>
                  <th>Status</th>
                  <th>Edit Wallet</th>
                </tr>
              </thead>
              <tbody>
                {uList.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 0', fontWeight: 600 }}>{u.phone}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.created_ip}</td>
                    <td>{u.currency}</td>
                    <td>{u.balance.toFixed(2)}</td>
                    <td>{u.vault_balance.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${u.status === 'frozen' ? 'badge-red' : 'badge-green'}`}>{u.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
                          type="number" 
                          placeholder="New Bal" 
                          onBlur={(e) => {
                            if (e.target.value !== '') adminEditUserBalance(u.id, e.target.value);
                          }} 
                          style={{ width: '70px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '4px', borderRadius: '4px' }} 
                        />
                        <button 
                          onClick={() => adminToggleUserFreeze(u.id, u.status)}
                          style={{
                            background: u.status === 'frozen' ? 'var(--accent-green)' : '#ef4444',
                            color: u.status === 'frozen' ? '#000' : '#fff',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          {u.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render Homepage Corporate Landing Page
  const renderLandingPage = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', padding: '40px 0' }}>
      {/* Hero section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="badge badge-green" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={12} /> SECURED & CERTIFIED COMMODITIES CUSTODIAN
          </div>
          <h1 style={{ fontSize: '56px', lineHeight: 1.1, fontFamily: 'var(--font-display)' }}>
            Lease Physical Projects. <br />
            <span style={{ color: 'transparent', WebkitTextStroke: '1px #ffd700', background: 'linear-gradient(90deg, #ffd700, #00e676)', WebkitBackgroundClip: 'text' }}>Harvest Yields.</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.6, maxWidth: '540px' }}>
            Nexora bridges private investment with tangible infrastructural assets. Rent renewable solar grid units or lease heavy metal lithium and gold refining operations globally. Fully verified double-currency auditing mechanism.
          </p>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={() => setLandingMode(false)} className="btn-primary" style={{ fontSize: '15px' }}>
              Enter Nexora Workspace <ArrowUpRight size={16} />
            </button>
            <button onClick={() => {
              const el = document.getElementById('tiers');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }} className="btn-secondary">
              Review Asset Projects
            </button>
          </div>
        </div>

        {/* Visual Graphic card */}
        <div className="glass-card animate-float" style={{ border: '1px solid var(--accent-gold-glow)', display: 'flex', flexDirection: 'column', gap: '20px', background: 'radial-gradient(circle at 10% 20%, rgba(255, 215, 0, 0.05) 0%, rgba(0,0,0,0) 90%), rgba(15, 19, 31, 0.65)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <TrendingUp style={{ color: 'var(--accent-gold)' }} />
              <strong style={{ fontFamily: 'var(--font-display)' }}>NEXORA METALS FUND</strong>
            </div>
            <span className="badge badge-gold">GRADE AAA</span>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>LITHIUM MINERAL COMMODITY LEASE</span>
            <h2 style={{ fontSize: '32px', color: 'var(--text-main)', marginTop: '4px' }}>+$14,230.90/t</h2>
          </div>
          <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '15px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Yield Target: </span>
              <strong style={{ color: 'var(--accent-green)' }}>+189%</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Grid Index: </span>
              <strong style={{ color: 'var(--text-main)' }}>99.2% Sync</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Grid info stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Cpu size={32} style={{ color: 'var(--accent-green)' }} />
          <h3>Renewable Energy Turbines</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
            Fund solar arrays globally. Energy production units feed local regional networks, converting immediate generation directly into daily cash distributions.
          </p>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Layers size={32} style={{ color: 'var(--accent-blue)' }} />
          <h3>Locked Vault Compounder</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
            Secure earnings in the Nexora Vault. Short 7-day compound intervals provide visual hedge mechanisms with high yield bonuses, avoiding sudden system panic payouts.
          </p>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Shield size={32} style={{ color: 'var(--accent-gold)' }} />
          <h3>Regional Dual Currencies</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
            Audit parameters locked directly by regional country code indicators. Instant BDT and INR localized routing networks allow manual bKash/Nagad and UPI channels.
          </p>
        </div>
      </div>

      {/* Static packages tiers grid */}
      <div id="tiers" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Global Infrastructure Asset Units</h2>
          <p style={{ color: 'var(--text-muted)' }}>Institutional contract nodes open for client leasing configurations.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span className="badge badge-green" style={{ alignSelf: 'flex-start' }}>Tier 1 - Eco-Solar Unit</span>
            <h3>Nexora Eco-Solar Unit 1</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Fund solar mining infrastructure for energy distributions.</p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>Purchase: <strong>৳1,000 / ₹800</strong></div>
              <div>Daily Return: <strong>3.50%</strong></div>
              <div>Duration: <strong>40 Days</strong></div>
              <div style={{ color: 'var(--accent-green)' }}>Total return: <strong>140%</strong></div>
            </div>
            <button onClick={() => setLandingMode(false)} className="btn-secondary" style={{ marginTop: '10px' }}>Access Portal & Purchase</button>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span className="badge badge-blue" style={{ alignSelf: 'flex-start' }}>Tier 2 - Metal Refinery</span>
            <h3>Nexora Lithium Refining</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Lease industrial chemical reactors to process high-grade battery materials.</p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>Purchase: <strong>৳5,000 / ₹4,000</strong></div>
              <div>Daily Return: <strong>4.20%</strong></div>
              <div>Duration: <strong>45 Days</strong></div>
              <div style={{ color: 'var(--accent-blue)' }}>Total return: <strong>189%</strong></div>
            </div>
            <button onClick={() => setLandingMode(false)} className="btn-secondary" style={{ marginTop: '10px' }}>Access Portal & Purchase</button>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span className="badge badge-gold" style={{ alignSelf: 'flex-start' }}>Tier 3 - Deep Venture VIP</span>
            <h3>Nexora Deep-Venture VIP</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Fund commercial commodity extraction projects across gold and rare earth leases.</p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>Purchase: <strong>৳20,000 / ₹16,000</strong></div>
              <div>Daily Return: <strong>5.00%</strong></div>
              <div>Duration: <strong>50 Days</strong></div>
              <div style={{ color: 'var(--accent-gold)' }}>Total return: <strong>250%</strong></div>
            </div>
            <button onClick={() => setLandingMode(false)} className="btn-secondary" style={{ marginTop: '10px' }}>Access Portal & Purchase</button>
          </div>
        </div>
      </div>
    </div>
  );

  // MAIN WORKSPACE INTERACTIVE GRID
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      
      {/* Price Ticker header */}
      {renderTickerBar()}

      {/* Global Status messages */}
      {statusMsg.text && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: statusMsg.type === 'error' ? '#ef4444' : 'var(--accent-green)',
          color: statusMsg.type === 'error' ? '#fff' : '#000',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          {statusMsg.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {statusMsg.text}
        </div>
      )}

      {/* Admin Login Dialog overlay */}
      {showAdminLogin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="glass-card" style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Admin Console Login</h3>
              <X size={18} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowAdminLogin(false)} />
            </div>
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Username" value={adminForm.username} onChange={e => setAdminForm({...adminForm, username: e.target.value})} className="glass-input" required />
              <input type="password" placeholder="Password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="glass-input" required />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Demo: admin / admin123</span>
              <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>Connect Terminal</button>
            </form>
          </div>
        </div>
      )}

      {/* Main Workspace Frame split into Desktop Dashboard & Simulated Android Device */}
      <div className="workspace-wrapper">
        
        {/* Left Side: Desktop Viewport */}
        <div className="desktop-viewport">
          
          {/* Header Portal Nav */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--accent-green-glow)', padding: '6px', borderRadius: '8px' }}>
                <Cpu style={{ color: 'var(--accent-green)' }} size={24} />
              </div>
              <h2 style={{ fontSize: '24px', letterSpacing: '1px', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>
                NEXORA <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>DESKTOP HUB</span>
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {landingMode ? (
                <button onClick={() => setLandingMode(false)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>Portal Login</button>
              ) : (
                <>
                  <button onClick={() => setLandingMode(true)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>Home Landing</button>
                  <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Disconnect</button>
                </>
              )}
            </div>
          </div>

          {/* Desktop workspace body switcher */}
          {isAdmin ? (
            renderAdminDashboard()
          ) : landingMode ? (
            renderLandingPage()
          ) : !user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '500px', padding: '20px 0' }}>
              <div className="glass-card" style={{ width: '420px', padding: '30px' }}>
                {renderMobileScreen()}
              </div>
            </div>
          ) : (
            // Render logged in tabs
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                {['dashboard', 'invest', 'mining', 'vault', 'referrals', 'wallet'].map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => {
                      setActiveTab(tab);
                      setMobileTab(tab); // sync 1:1 tab click to the mobile emulator!
                    }}
                    style={{
                      background: activeTab === tab ? 'var(--bg-tertiary)' : 'transparent',
                      border: 'none',
                      color: activeTab === tab ? 'var(--accent-green)' : 'var(--text-muted)',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'dashboard' && renderDesktopDashboardTab()}
              {activeTab === 'invest' && renderDesktopInvestTab()}
              {activeTab === 'mining' && renderDesktopMiningTab()}
              {activeTab === 'vault' && renderDesktopVaultTab()}
              {activeTab === 'referrals' && renderDesktopReferralsTab()}
              {activeTab === 'wallet' && renderDesktopWalletTab()}
            </div>
          )}

          {/* Social Proof Alerts simulator ticker panel bottom */}
          <div className="glass-card" style={{ marginTop: '40px', padding: '16px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent-gold)' }}>
              <Send size={14} /> LIVE NEXORA TELEGRAM VERIFICATION TELECAST
            </h4>
            <div style={{ height: '80px', overflowY: 'auto', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              {telegramFeed.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>Awaiting node verification telecasts...</div>
              ) : (
                telegramFeed.map(feed => (
                  <div key={feed.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ color: 'var(--text-main)' }}>{feed.text}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{new Date(feed.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Simulated Android Device */}
        {user && (
          <div className="mobile-emulator-viewport">
            <div className="phone-mockup" style={{ backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
              
              {/* Phone Status Bar */}
              <div className="phone-status-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px 4px 16px', background: 'transparent' }}>
                <span>9:41</span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '10px' }}>
                  <TrendingUp size={10} style={{ color: 'var(--accent-green)' }} />
                  <span>100%</span>
                </div>
              </div>

              {/* Phone Screen App Container */}
              <div className="phone-screen" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '8px 12px 20px 12px' }}>
                
                {/* Mobile Notification Toast Overlay inside Phone Screen */}
                {mobileNotifications.map(notif => (
                  <div key={notif.id} className="notification-toast">
                    <ShieldAlert size={16} style={{ color: 'var(--accent-blue)', marginTop: '2px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 700, fontSize: '11px' }}>System Alert</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{notif.text}</span>
                    </div>
                  </div>
                ))}

                {/* Mobile App Header (Logo, Currency, Notification) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '15px', color: 'var(--text-main)', letterSpacing: '0.5px', fontFamily: 'var(--font-display)' }}>
                      NEXORA
                    </h2>
                    <span style={{ fontSize: '7px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                      Powering A Greener Future
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                      <span style={{ color: 'var(--accent-gold)' }}>{user.currency === 'INR' ? '₹' : '৳'}</span>
                      <span>{user.balance.toFixed(2)}</span>
                    </div>
                    <div style={{ position: 'relative', cursor: 'pointer' }}>
                      <Award size={16} style={{ color: 'var(--text-main)' }} />
                      <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '6px', height: '6px', backgroundColor: 'orange', borderRadius: '50%' }}></span>
                    </div>
                  </div>
                </div>

                {/* Render current tab content */}
                {renderMobileScreen()}

                {/* About Modal */}
                {showAboutModal && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,16,0.95)', zIndex: 1001, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <h3 style={{ fontSize: '14px', color: 'var(--accent-gold)' }}>About Nexora Group</h3>
                      <X size={16} onClick={() => setShowAboutModal(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                      <p><strong>Nexora</strong> is a premier global commodities custodian and renewable energy funding platform.</p>
                      <p>We enable micro-leases for utility-scale physical infrastructures including eco-solar arrays, heavy-metal lithium chemical refineries, and certified precious gold extraction pipelines.</p>
                      <p>By connecting digital fractional leasing structures with high-yield regional utility contracts, clients participate directly in daily ROI settlements verified by regional auditing networks.</p>
                      <p style={{ color: 'var(--accent-green)' }}>✓ Zero-emission energy yields</p>
                      <p style={{ color: 'var(--accent-blue)' }}>✓ Double-currency financial channels</p>
                      <p style={{ color: 'var(--accent-gold)' }}>✓ Certified real-world asset backings</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowAboutModal(false)} style={{ padding: '8px', fontSize: '11px', justifyContent: 'center', marginTop: 'auto' }}>Close Info</button>
                  </div>
                )}

                {/* Partnership Modal */}
                {showPartnershipModal && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,16,0.95)', zIndex: 1001, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <h3 style={{ fontSize: '14px', color: 'var(--accent-green)' }}>Agent Partnership</h3>
                      <X size={16} onClick={() => setShowPartnershipModal(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                      <p>Nexora partners with active community builders to scale local green grids.</p>
                      <p><strong>Benefits of Official Nexora Agent status:</strong></p>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div>• <strong>Fixed Monthly Salaries</strong>: {user.currency === 'INR' ? '₹' : '৳'}10,000 - {user.currency === 'INR' ? '₹' : '৳'}50,000 based on network scale.</div>
                        <div>• <strong>Enhanced Referral Cuts</strong>: Instant +15% / 5% / 3% multi-tier commissions.</div>
                        <div>• <strong>Direct Support Lines</strong>: Dedicated regional managers.</div>
                      </div>
                      <p>To apply, invite active users to fund projects and contact official customer support channels.</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowPartnershipModal(false)} style={{ padding: '8px', fontSize: '11px', justifyContent: 'center', marginTop: 'auto', background: 'var(--accent-green)' }}>Got It</button>
                  </div>
                )}

                {/* Support Modal */}
                {showSupportModal && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,16,0.95)', zIndex: 1001, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <h3 style={{ fontSize: '14px', color: 'var(--accent-blue)' }}>24/7 Client Desk</h3>
                      <X size={16} onClick={() => setShowSupportModal(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                      <p>Have inquiries regarding your solar leases, deposits, or withdraw clearances?</p>
                      <p>Our global auditing desk is active round-the-clock for verification requests.</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                        <a href="https://t.me/nexora_official" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: 'rgba(41, 121, 255, 0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(41, 121, 255, 0.2)', padding: '10px', borderRadius: '6px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>
                          Join Nexora Telegram Channel
                        </a>
                        <a href="mailto:support@nexora.vip" style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.02)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px', textAlign: 'center', fontWeight: 600, fontSize: '12px' }}>
                          Send Email Ticket
                        </a>
                      </div>
                    </div>
                    <button className="btn-primary" onClick={() => setShowSupportModal(false)} style={{ padding: '8px', fontSize: '11px', justifyContent: 'center', marginTop: 'auto', background: 'var(--accent-blue)' }}>Close Help</button>
                  </div>
                )}
              </div>

              {/* Bottom Nav Bar */}
              <div className="phone-nav-bar">
                <div className={`phone-nav-item ${mobileTab === 'dashboard' ? 'active' : ''}`} onClick={() => setMobileTab('dashboard')}>
                  <Zap size={16} />
                  <span>Home</span>
                </div>
                <div className={`phone-nav-item ${mobileTab === 'invest' ? 'active' : ''}`} onClick={() => setMobileTab('invest')}>
                  <Layers size={16} />
                  <span>Invest</span>
                </div>
                <div className={`phone-nav-item ${mobileTab === 'mining' ? 'active' : ''}`} onClick={() => setMobileTab('mining')}>
                  <Cpu size={16} />
                  <span>Mining</span>
                </div>
                <div className={`phone-nav-item ${mobileTab === 'wallet' ? 'active' : ''}`} onClick={() => setMobileTab('wallet')}>
                  <Send size={16} />
                  <span>Wallet</span>
                </div>
                <div className={`phone-nav-item ${mobileTab === 'referrals' ? 'active' : ''}`} onClick={() => setMobileTab('referrals')}>
                  <Users size={16} />
                  <span>Team</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Packages specifications schema
const INVESTMENT_TIERS = {
  BDT: [
    { id: 'solar', name: "Nexora Eco-Solar Unit 1", price: 1000, dailyRoi: 0.035, duration: 40 },
    { id: 'lithium', name: "Nexora Lithium Refining", price: 5000, dailyRoi: 0.042, duration: 45 },
    { id: 'deep_vip', name: "Nexora Deep-Venture VIP", price: 20000, dailyRoi: 0.05, duration: 50 }
  ],
  INR: [
    { id: 'solar', name: "Nexora Eco-Solar Unit 1", price: 800, dailyRoi: 0.035, duration: 40 },
    { id: 'lithium', name: "Nexora Lithium Refining", price: 4000, dailyRoi: 0.042, duration: 45 },
    { id: 'deep_vip', name: "Nexora Deep-Venture VIP", price: 16000, dailyRoi: 0.05, duration: 50 }
  ]
};
