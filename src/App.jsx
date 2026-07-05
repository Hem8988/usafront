import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Shield, Cpu, Layers, Users, ArrowUpRight, ArrowDownLeft, Lock, 
  Unlock, Send, RefreshCw, CheckCircle2, AlertTriangle, Plus, Copy, 
  Eye, EyeOff, Check, X, Award, Handshake, Info, Headphones, Settings, 
  FileText, Mail, Key, UserCheck, Share2, LogOut
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

  // Layout View States
  const [landingMode, setLandingMode] = useState(true); // true = landing page, false = app portal
  const [mobileTab, setMobileTab] = useState('dashboard'); // 'dashboard' (Home), 'invest' (Projects), 'mining', 'team', 'me'
  
  // Interaction & Modals
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPartnershipModal, setShowPartnershipModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedAgreementProject, setSelectedAgreementProject] = useState(null);
  
  // Clipboard
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Forms
  const [signupForm, setSignupForm] = useState({ phone: '', password: '', referredByCode: '' });
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Transaction Forms
  const [depositForm, setDepositForm] = useState({ amount: '', channel: 'bKash', trxId: '' });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', channel: 'bKash Mobile', destination: '', source: 'earnings' });
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [txHistoryModalOpen, setTxHistoryModalOpen] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  
  // Vault Form
  const [vaultAmount, setVaultAmount] = useState('');
  const [vaultDuration, setVaultDuration] = useState('60');

  // Profile Settings Forms
  const [securityForm, setSecurityForm] = useState({ fullName: '', email: '', password: '' });

  // Status Feedback
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' }); // type: 'success' | 'error' | 'info'
  const [isMining, setIsMining] = useState(false);
  const [miningPercent, setMiningPercent] = useState(0);

  // Live Lists
  const [contracts, setContracts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [vaultLocks, setVaultLocks] = useState([]);
  const [telegramFeed, setTelegramFeed] = useState([]);

  // Auto-slide banner
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Telegram feeds & general simulations
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch(`${API_BASE}/telegram/feed`);
        if (res.ok) {
          const data = await res.json();
          setTelegramFeed(data);
        }
      } catch (err) {
        // Silent error
      }
    };
    fetchFeed();
    const interval = setInterval(fetchFeed, 12000);
    return () => clearInterval(interval);
  }, []);

  // Fetch profiles on load or state updates
  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchUserContracts();
      fetchUserTxHistory();
      fetchVaultLocks();
      setLandingMode(false);
    } else {
      setUser(null);
      setContracts([]);
      setTransactions([]);
      setVaultLocks([]);
    }
  }, [token]);

  useEffect(() => {
    if (adminToken) {
      setIsAdmin(true);
      fetchAdminData();
    } else {
      setIsAdmin(false);
      setAdminData(null);
    }
  }, [adminToken]);

  const showStatus = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 5000);
  };

  // Profile refresh
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
      setSecurityForm({
        fullName: data.full_name || '',
        email: data.email || '',
        password: ''
      });
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

  const fetchVaultLocks = async () => {
    try {
      const res = await fetch(`${API_BASE}/vault/locks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVaultLocks(data);
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

  // Auth Functions
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

      showStatus("Registration successful! Please sign in.");
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
      showStatus("Welcome to Nexora. Workspace logged in.");
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
      showStatus("Master Admin session connected.");
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nex_token');
    setToken(null);
    setUser(null);
    setLandingMode(true);
    setMobileTab('dashboard');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('nex_admin_token');
    setAdminToken(null);
    setIsAdmin(false);
    setAdminData(null);
  };

  // Client Operations
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
      setSelectedAgreementProject(null);
      setAgreementChecked(false);
      fetchUserProfile();
      fetchUserContracts();
      fetchUserTxHistory();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  // Gamified Manual Daily Energy Harvesting Tapping
  const harvestAllContracts = async () => {
    // Collect daily payouts from active contracts not yet claimed today
    const claimable = contracts.filter(c => {
      if (c.status !== 'active') return false;
      if (!c.last_claimed_at) return true;
      const lastClaim = new Date(c.last_claimed_at);
      const now = new Date();
      const isSameDay = lastClaim.getUTCDate() === now.getUTCDate() &&
                        lastClaim.getUTCMonth() === now.getUTCMonth() &&
                        lastClaim.getUTCFullYear() === now.getUTCFullYear();
      return !isSameDay;
    });

    if (claimable.length === 0) {
      showStatus("All your turbines are fully claimed for today! Return in 24 hours.", "info");
      return;
    }

    setIsMining(true);
    setMiningPercent(0);

    // Simulated progress duration
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setMiningPercent(progress);
      if (progress >= 100) clearInterval(interval);
    }, 150);

    setTimeout(async () => {
      let successCount = 0;
      for (const contract of claimable) {
        try {
          const res = await fetch(`${API_BASE}/invest/claim`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ contractId: contract.id })
          });
          if (res.ok) successCount++;
        } catch (err) {
          // Ignore individual node failures in loop
        }
      }

      setIsMining(false);
      if (successCount > 0) {
        showStatus(`Yield claimed successfully from ${successCount} turbine arrays!`);
      } else {
        showStatus("Yield collection failed.", "error");
      }
      fetchUserProfile();
      fetchUserContracts();
      fetchUserTxHistory();
    }, 1600);
  };

  // Locked Vault Stashing
  const handleVaultLock = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/vault/lock`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: vaultAmount, durationDays: vaultDuration })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(`Locked BDT ৳${vaultAmount} in the vault for ${vaultDuration} days.`);
      setVaultAmount('');
      fetchUserProfile();
      fetchVaultLocks();
      fetchUserTxHistory();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleVaultUnlock = async (lockId) => {
    try {
      const res = await fetch(`${API_BASE}/vault/unlock`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ lockId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(data.message);
      fetchUserProfile();
      fetchVaultLocks();
      fetchUserTxHistory();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  // 1-Click Commission Claiming
  const claimTeamCommissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/team/claim-commission`, {
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

  // Deposit Submission
  const handleDepositSubmit = async (e) => {
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

      showStatus("Deposit slip submitted. Approval pending.");
      setDepositForm({ amount: '', channel: 'bKash', trxId: '' });
      setDepositModalOpen(false);
      fetchUserTxHistory();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  // Payout submission
  const handleWithdrawSubmit = async (e) => {
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

      showStatus("Cashout withdrawal requested successfully.");
      setWithdrawForm({ amount: '', channel: 'bKash Mobile', destination: '', source: 'earnings' });
      setWithdrawModalOpen(false);
      fetchUserProfile();
      fetchUserTxHistory();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  // Security updating
  const handleSecurityUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/user/update-security`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(securityForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus("Account security updated successfully.");
      fetchUserProfile();
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

      showStatus("Deposit credited to client wallet.");
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

      showStatus("Transaction rejected. Refunded if withdrawal.");
      fetchAdminData();
      if (user) {
        fetchUserProfile();
        fetchUserTxHistory();
      }
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  // Global settings update
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

      showStatus("System configuration variables saved.");
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

      showStatus(`User status changed to ${nextStatus}.`);
      fetchAdminData();
      if (user && user.id === userId && nextStatus === 'frozen') handleLogout();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  // Clipboard Copiers
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const copyRefLink = (text) => {
    navigator.clipboard.writeText(text);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  // Bangladeshi Flat returns projects definitions
  const LEASE_PROJECTS = [
    {
      id: 'solar',
      name: "Solar Power Grid",
      description: "Lease solar energy nodes generating daily electric payloads into the regional Bangladeshi network. Managed infrastructure with complete storm insurance.",
      price: 1000,
      dailyProfit: 30,
      duration: 180,
      totalProfit: 5400,
      bgGradient: "linear-gradient(135deg, #00e676 0%, #00b0ff 100%)",
      category: "RENEWABLE SOLAR"
    },
    {
      id: 'wind',
      name: "Wind Turbine Project",
      description: "Lease a share of high-efficiency coastal wind turbines feeding the power network. Optimized for low-maintenance vertical axis offshore generations.",
      price: 5000,
      dailyProfit: 160,
      duration: 180,
      totalProfit: 28800,
      bgGradient: "linear-gradient(135deg, #2979ff 0%, #a012f3 100%)",
      category: "WIND UTILITY"
    },
    {
      id: 'biomass',
      name: "Biomass Energy Plant",
      description: "Lease bio-waste treatment arrays converting agricultural leftovers into utility gas payloads. Highly reliable 24/7 baseload generation network.",
      price: 15000,
      dailyProfit: 510,
      duration: 180,
      totalProfit: 91800,
      bgGradient: "linear-gradient(135deg, #ff9100 0%, #ff3d00 100%)",
      category: "BIO-POWER NODE"
    },
    {
      id: 'lithium',
      name: "Lithium Battery Refinery",
      description: "Rent processing refinery reactors yielding chemical lithium battery inputs. Secured by international industrial hardware delivery contracts.",
      price: 45000,
      dailyProfit: 1620,
      duration: 180,
      totalProfit: 291600,
      bgGradient: "linear-gradient(135deg, #00e5ff 0%, #2979ff 100%)",
      category: "COMMODITY CHEMICALS"
    },
    {
      id: 'gold',
      name: "Gold Refining Facility",
      description: "Rent precious metal refining pipelines processing raw bullion. Standard high-level custodial security audited by physical asset certificates.",
      price: 100000,
      dailyProfit: 3800,
      duration: 180,
      totalProfit: 684000,
      bgGradient: "linear-gradient(135deg, #ffd700 0%, #ff6d00 100%)",
      category: "CUSTODIAL GOLD"
    }
  ];

  // Helper renderers for dynamic seals & QR
  const renderCorporateStamp = () => (
    <div style={{ position: 'relative', width: '90px', height: '90px', margin: '10px auto' }}>
      <svg width="90" height="90" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255, 215, 0, 0.4)" strokeWidth="1.5" strokeDasharray="3,3" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 215, 0, 0.7)" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(255, 215, 0, 0.3)" strokeWidth="1" />
        <path id="sealPath" d="M50,16 A34,34 0 1,1 49.9,16" fill="none" />
        <text fill="rgba(255, 215, 0, 0.8)" fontSize="6.5" fontWeight="bold" letterSpacing="0.8">
          <textPath href="#sealPath" startOffset="0%">
            NEXORA GLOBAL TRUST • DIGITAL LEASE SECURITY SEAL •
          </textPath>
        </text>
        <polygon points="50,34 40,48 48,48 46,64 60,48 50,48" fill="#ffd700" />
      </svg>
    </div>
  );

  const renderMockQRCode = (link) => (
    <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', display: 'inline-block', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      <svg width="110" height="110" viewBox="0 0 100 100">
        <rect x="0" y="0" width="22" height="22" fill="#0c101d" />
        <rect x="3" y="3" width="16" height="16" fill="#fff" />
        <rect x="6" y="6" width="10" height="10" fill="#0c101d" />

        <rect x="78" y="0" width="22" height="22" fill="#0c101d" />
        <rect x="81" y="3" width="16" height="16" fill="#fff" />
        <rect x="84" y="6" width="10" height="10" fill="#0c101d" />

        <rect x="0" y="78" width="22" height="22" fill="#0c101d" />
        <rect x="3" y="78" width="16" height="16" fill="#fff" />
        <rect x="6" y="81" width="10" height="10" fill="#0c101d" />

        <rect x="30" y="5" width="10" height="10" fill="#0c101d" />
        <rect x="45" y="0" width="8" height="15" fill="#0c101d" />
        <rect x="58" y="8" width="12" height="12" fill="#0c101d" />
        <rect x="25" y="22" width="18" height="6" fill="#0c101d" />
        <rect x="38" y="32" width="12" height="14" fill="#0c101d" />
        <rect x="12" y="42" width="12" height="12" fill="#0c101d" />
        <rect x="4" y="58" width="6" height="10" fill="#0c101d" />
        
        <rect x="52" y="28" width="16" height="16" fill="#0c101d" />
        <rect x="72" y="32" width="22" height="8" fill="#0c101d" />
        <rect x="82" y="48" width="10" height="18" fill="#0c101d" />
        
        <rect x="28" y="52" width="12" height="12" fill="#0c101d" />
        <rect x="44" y="62" width="16" height="12" fill="#0c101d" />
        <rect x="28" y="76" width="18" height="18" fill="#0c101d" />
        <rect x="52" y="76" width="22" height="10" fill="#0c101d" />
        <rect x="76" y="76" width="12" height="12" fill="#0c101d" />

        <rect x="38" y="38" width="24" height="24" rx="4" fill="#00e676" />
        <polygon points="50,42 43,51 49,51 48,56 57,47 51,47" fill="#0c101d" />
      </svg>
    </div>
  );

  // Simulated Push tickers bar at top
  const renderTickerBar = () => (
    <div className="ticker-top-bar">
      <div className="ticker-top-left">
        <span className="live-dot"></span>
        <span className="ticker-live-txt">NEXORA INFRASTRUCTURE SECURITIES CLEARING INDEX BDT</span>
      </div>
      <div className="ticker-top-right">
        {isAdmin ? (
          <button className="admin-status-pill" onClick={handleAdminLogout} style={{ background: '#ef4444' }}>
            <LogOut size={12} /> Disconnect Admin Terminal
          </button>
        ) : (
          <button className="admin-status-pill" onClick={() => setShowAdminLogin(true)}>
            <Shield size={12} /> Admin Access Gate
          </button>
        )}
      </div>
    </div>
  );

  // App Bottom navigation items list
  const bottomNavItems = [
    { id: 'dashboard', label: 'Home', icon: Zap },
    { id: 'invest', label: 'Projects', icon: Layers },
    { id: 'mining', label: 'Mining', icon: Cpu },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'me', label: 'Me', icon: Settings }
  ];

  return (
    <div className="app-layout-root">
      
      {/* Ticker strip */}
      {renderTickerBar()}

      {/* Global Toast Alert */}
      {statusMsg.text && (
        <div className={`status-toast ${statusMsg.type === 'error' ? 'toast-error' : statusMsg.type === 'info' ? 'toast-info' : 'toast-success'}`}>
          {statusMsg.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content-wrap">
            <div className="modal-header-row">
              <h3>Secure Admin Gateway</h3>
              <X size={18} className="btn-close-modal" onClick={() => setShowAdminLogin(false)} />
            </div>
            <form onSubmit={handleAdminLogin} className="modal-form-body">
              <div className="form-input-block">
                <label>Admin ID Name</label>
                <input type="text" placeholder="username" value={adminForm.username} onChange={e => setAdminForm({...adminForm, username: e.target.value})} className="glass-input" required />
              </div>
              <div className="form-input-block">
                <label>Access Secret Key</label>
                <input type="password" placeholder="••••••••" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="glass-input" required />
              </div>
              <div className="admin-demo-box">Demo Pass: username <code>admin</code> / key <code>admin123</code></div>
              <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>Decrypt Credentials</button>
            </form>
          </div>
        </div>
      )}

      {/* Split Workspace wrapper */}
      <div className="workspace-wrapper">
        
        {/* Left Side: Desktop dashboard display / Landing info */}
        <div className="desktop-viewport">
          
          <div className="desktop-header-row">
            <div className="desktop-logo-wrap">
              <div className="desktop-logo-box">
                <Cpu size={24} style={{ color: 'var(--accent-green)' }} />
              </div>
              <div>
                <h2>NEXORA GROUP</h2>
                <span className="desktop-sub-logo">Bangladeshi Green Infrastructure Custodial</span>
              </div>
            </div>
            <div className="desktop-nav-actions">
              {landingMode ? (
                <button className="btn-primary" onClick={() => setLandingMode(false)}>
                  Access Workspace Terminal <ArrowUpRight size={16} />
                </button>
              ) : (
                <>
                  <button className="btn-secondary" onClick={() => setLandingMode(true)}>Platform Overview</button>
                  {token && <button className="btn-logout" onClick={handleLogout}>Log Out</button>}
                </>
              )}
            </div>
          </div>

          {/* Desktop Body workspace switcher */}
          {isAdmin ? (
            // Admin Panel
            <div className="admin-panel-container">
              {adminData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="admin-panel-header">
                    <h3>Master Admin Clearing Console</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Manage balances, manually verify payment receipts, freeze account nodes.</p>
                  </div>

                  {/* Summary Metric Stats */}
                  <div className="stats-metric-grid">
                    <div className="stat-metric-card">
                      <span>Total Clients</span>
                      <h2>{adminData.summary.totalUsers} Accounts</h2>
                    </div>
                    <div className="stat-metric-card">
                      <span>Active Turbines Leased</span>
                      <h2>{adminData.summary.activeContractsCount} Units</h2>
                    </div>
                    <div className="stat-metric-card">
                      <span>Active Capital Volume</span>
                      <h2 style={{ color: 'var(--accent-gold)' }}>৳{adminData.summary.activeVolume.toLocaleString()} BDT</h2>
                    </div>
                    <div className="stat-metric-card">
                      <span>Approved Deposits</span>
                      <h2 style={{ color: 'var(--accent-green)' }}>৳{adminData.summary.depositsVolume.toLocaleString()} BDT</h2>
                    </div>
                  </div>

                  {/* Settings Control Block */}
                  <div className="glass-card admin-settings-card">
                    <h4>Global System Parameters</h4>
                    <div className="admin-settings-row">
                      <div className="admin-setting-item">
                        <span>Global Freeze Switch:</span>
                        <button 
                          onClick={() => adminUpdateSettings({ global_freeze: adminData.settings.global_freeze === '1' ? '0' : '1' })}
                          className={`admin-toggle-btn ${adminData.settings.global_freeze === '1' ? 'active-frozen' : 'active-ok'}`}
                        >
                          {adminData.settings.global_freeze === '1' ? 'ACTIVE FREEZE (Withdrawals Locked)' : 'SYSTEM HEALTHY (Normal Operation)'}
                        </button>
                      </div>
                      <div className="admin-setting-item">
                        <span>Withdraw Fee %:</span>
                        <input type="number" defaultValue={adminData.settings.withdrawal_fee_pct} onBlur={(e) => adminUpdateSettings({ withdrawal_fee_pct: e.target.value })} className="admin-val-input" style={{ width: '80px' }} />
                      </div>
                      <div className="admin-setting-item">
                        <span>Min Withdraw (৳):</span>
                        <input type="number" defaultValue={adminData.settings.min_withdrawal_bdt} onBlur={(e) => adminUpdateSettings({ min_withdrawal_bdt: e.target.value })} className="admin-val-input" style={{ width: '100px' }} />
                      </div>
                    </div>
                  </div>

                  {/* Pending Transactions queue */}
                  <div className="glass-card">
                    <h4>Pending Client Deposits & Withdraw Clearing Queue</h4>
                    <div className="table-responsive">
                      <table className="admin-data-table">
                        <thead>
                          <tr>
                            <th>Phone</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Channel</th>
                            <th>TrxID / Info</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminData.pendingTransactions.length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>Clearing queue is empty. No actions required.</td>
                            </tr>
                          ) : (
                            adminData.pendingTransactions.map(tx => (
                              <tr key={tx.id}>
                                <td><strong>{tx.phone}</strong></td>
                                <td><span className={`badge ${tx.type === 'deposit' ? 'badge-green' : 'badge-red'}`}>{tx.type.toUpperCase()}</span></td>
                                <td style={{ fontWeight: 700 }}>৳{tx.amount}</td>
                                <td>{tx.channel}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{tx.trx_id || tx.details}</td>
                                <td>{new Date(tx.created_at).toLocaleString()}</td>
                                <td>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => adminApproveTx(tx.id)} className="admin-act-approve">Approve</button>
                                    <button onClick={() => adminRejectTx(tx.id)} className="admin-act-reject">Reject</button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Accounts management list */}
                  <div className="glass-card">
                    <h4>Client Registry Node Balance Editor</h4>
                    <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table className="admin-data-table">
                        <thead>
                          <tr>
                            <th>Phone</th>
                            <th>IP Address</th>
                            <th>Earnings Bal</th>
                            <th>Deposit Bal</th>
                            <th>Commission Bal</th>
                            <th>Status</th>
                            <th>Adjust Wallet / Freezing</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminData.users.map(u => (
                            <tr key={u.id}>
                              <td>{u.phone}</td>
                              <td>{u.created_ip}</td>
                              <td>৳{u.balance}</td>
                              <td>৳{u.deposit_balance}</td>
                              <td>৳{u.commission_balance}</td>
                              <td><span className={`badge ${u.status === 'frozen' ? 'badge-red' : 'badge-green'}`}>{u.status}</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input 
                                    type="number" 
                                    placeholder="Set Bal"
                                    onBlur={(e) => {
                                      if (e.target.value !== '') adminEditUserBalance(u.id, e.target.value);
                                    }} 
                                    className="admin-val-input"
                                    style={{ width: '80px', padding: '4px' }}
                                  />
                                  <button onClick={() => adminToggleUserFreeze(u.id, u.status)} className={`admin-freeze-btn ${u.status === 'frozen' ? 'frozen-active' : 'frozen-inactive'}`}>
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
              ) : (
                <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>Decrypting Admin Clearing Records...</div>
              )}
            </div>
          ) : landingMode ? (
            // Landing Mode (Introductory layout explaining Nexora)
            <div className="landing-layout-body">
              <div className="landing-hero-section">
                <span className="hero-alert-badge"><Shield size={12} /> BANGLADESH RENEWABLE UTILITY CUSTODY CERTIFIED GRADE-A</span>
                <h1>Secure Physical Clean Power Assets. <span className="hero-gradient-text">Harvest BDT Daily.</span></h1>
                <p>Nexora connects private investment capital directly to physical infrastructure leases. Fund utility solar grids, wind turbines, biomass energy plants, or refinery operations in Bangladesh. Audited flat returns with instant automated clearances.</p>
                <div className="hero-actions-row">
                  <button className="btn-primary" onClick={() => setLandingMode(false)}>Access Workspace Terminal <ArrowUpRight size={16} /></button>
                  <button className="btn-secondary" onClick={() => {
                    const el = document.getElementById('landing-projects');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}>Review Lease Projects</button>
                </div>
              </div>

              {/* Tiers display */}
              <div id="landing-projects" className="landing-projects-section">
                <h3 className="section-title">Verified Green Infrastructure Projects Open for Leases</h3>
                <div className="projects-grid">
                  {LEASE_PROJECTS.map(proj => (
                    <div key={proj.id} className="glass-card project-card-wrap">
                      <div className="card-top-header">
                        <span className="category-badge">{proj.category}</span>
                        <h4>{proj.name}</h4>
                      </div>
                      <p className="project-desc">{proj.description}</p>
                      <div className="project-financial-ledger">
                        <div className="ledger-item">
                          <span>Purchase lease:</span>
                          <strong>৳{proj.price.toLocaleString()} BDT</strong>
                        </div>
                        <div className="ledger-item">
                          <span>Daily harvest ROI:</span>
                          <strong style={{ color: 'var(--accent-green)' }}>+৳{proj.dailyProfit.toLocaleString()} BDT/day</strong>
                        </div>
                        <div className="ledger-item">
                          <span>Lock-in duration:</span>
                          <span>{proj.duration} Days</span>
                        </div>
                        <div className="ledger-item" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                          <span>Total estimated return:</span>
                          <strong style={{ color: 'var(--accent-gold)' }}>৳{proj.totalProfit.toLocaleString()} BDT</strong>
                        </div>
                      </div>
                      <button className="btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={() => setLandingMode(false)}>Sign Lease Agreement</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // User Workspace overview (Shows dashboard synced values)
            <div className="desktop-workspace-body">
              <div className="workspace-welcome-box">
                <div>
                  <h3>Platform Workspace Terminal</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Synchronized real-time simulation screen. Use the mobile APK layout on the right to navigate the 5 menus.</p>
                </div>
                <div className="workspace-user-badge">
                  <span className="live-dot"></span>
                  <span>Node: {user ? user.phone : 'Not Connected'}</span>
                </div>
              </div>

              <div className="desktop-overview-grid">
                
                {/* 3 Wallet Card */}
                <div className="glass-card triple-wallet-display-desktop">
                  <h4>Triple Wallet Architecture Balance Indicators</h4>
                  <div className="wallet-cards-desktop-row">
                    <div className="wallet-card-sub active-total">
                      <span>Total Balance (Combined available)</span>
                      <h2>৳{user ? user.total_balance.toLocaleString() : '0.00'}</h2>
                    </div>
                    <div className="wallet-card-sub active-deposit">
                      <span>Deposit Wallet (Loaded capital)</span>
                      <h2>৳{user ? user.deposit_balance.toLocaleString() : '0.00'}</h2>
                    </div>
                    <div className="wallet-card-sub active-commission">
                      <span>Commission Wallet (Claimed affiliate)</span>
                      <h2>৳{user ? user.commission_balance.toLocaleString() : '0.00'}</h2>
                    </div>
                  </div>
                </div>

                {/* Left col: active contracts */}
                <div className="glass-card">
                  <h4>Your Funded Infrastructure Leases</h4>
                  <div className="table-responsive" style={{ marginTop: '15px' }}>
                    <table className="client-contracts-table" style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <th style={{ padding: '10px 0' }}>Project Node</th>
                          <th>Lease Cost</th>
                          <th>Daily Profit Yield</th>
                          <th>Lease timeline</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contracts.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No active infrastructure leases found. Lease a project tier from the Projects tab.</td>
                          </tr>
                        ) : (
                          contracts.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '12px 0', fontWeight: 600 }}>{c.tier_name}</td>
                              <td>৳{c.price.toLocaleString()} BDT</td>
                              <td style={{ color: 'var(--accent-green)' }}>+৳{(c.price * c.daily_roi).toLocaleString()} BDT/day</td>
                              <td>{c.days_elapsed} / {c.duration_days} Days elapsed</td>
                              <td>
                                <span className={`badge ${c.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                                  {c.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right col: live telecasts */}
                <div className="glass-card">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)' }}>
                    <Send size={14} /> Live Platform Telegram Telecast Feeds
                  </h4>
                  <div className="live-telecast-scroller" style={{ maxHeight: '180px', overflowY: 'auto', marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {telegramFeed.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Awaiting feed telemetry signals...</span>
                    ) : (
                      telegramFeed.map(feed => (
                        <div key={feed.id} className="telecast-item-row" style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-main)' }}>{feed.text}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(feed.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Right Side: Simulated mobile device (Android emulator) */}
        <div className="mobile-emulator-viewport">
          <div className="phone-mockup">
            
            {/* Speaker Notch */}
            <div className="phone-bezel-notch"></div>
            
            {/* Phone Status Bar */}
            <div className="phone-status-bar">
              <span>9:41</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <TrendingUpIcon size={10} style={{ color: 'var(--accent-green)' }} />
                <span>Nexora Net 4G</span>
                <span style={{ fontWeight: 'bold' }}>100%</span>
              </div>
            </div>

            {/* Phone Screen App Container */}
            <div className="phone-screen">
              
              {!token ? (
                // Sign In / Register viewport on mobile phone mockup
                <div className="phone-auth-wrapper">
                  <div className="phone-auth-header">
                    <h2 className="glowing-text">NEXORA</h2>
                    <span>Green Utility Custody</span>
                  </div>

                  <div className="phone-auth-form-card">
                    {isRegistering ? (
                      <form onSubmit={handleSignup} className="phone-auth-form">
                        <h4>Create Client Node Account</h4>
                        <div className="auth-input-group">
                          <input type="text" placeholder="Phone (e.g. +8801700000010)" value={signupForm.phone} onChange={e => setSignupForm({...signupForm, phone: e.target.value})} className="phone-glass-input" required />
                          <span>Must prefix with regional code (+880)</span>
                        </div>
                        <div className="auth-input-group">
                          <input type="password" placeholder="Access Password" value={signupForm.password} onChange={e => setSignupForm({...signupForm, password: e.target.value})} className="phone-glass-input" required />
                        </div>
                        <div className="auth-input-group">
                          <input type="text" placeholder="Referral Code (Optional)" value={signupForm.referredByCode} onChange={e => setSignupForm({...signupForm, referredByCode: e.target.value})} className="phone-glass-input" />
                        </div>
                        <button type="submit" className="phone-btn-primary">Register Account Node</button>
                        <div className="auth-toggle-row">
                          <span>Already a client?</span>
                          <span onClick={() => setIsRegistering(false)} style={{ color: 'var(--accent-green)', fontWeight: 'bold', cursor: 'pointer' }}>Sign In</span>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleLogin} className="phone-auth-form">
                        <h4>Authenticate Client Node</h4>
                        <div className="auth-input-group">
                          <input type="text" placeholder="Registered Phone" value={loginForm.phone} onChange={e => setLoginForm({...loginForm, phone: e.target.value})} className="phone-glass-input" required />
                        </div>
                        <div className="auth-input-group">
                          <input type="password" placeholder="Password Key" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="phone-glass-input" required />
                        </div>
                        <button type="submit" className="phone-btn-primary">Connect Node</button>
                        <div className="auth-toggle-row">
                          <span>New to Nexora?</span>
                          <span onClick={() => setIsRegistering(true)} style={{ color: 'var(--accent-green)', fontWeight: 'bold', cursor: 'pointer' }}>Register</span>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              ) : (
                // Logged In App Interface
                <div className="phone-app-container">
                  
                  {/* Phone Header Logo/Balance strip */}
                  <div className="phone-app-header">
                    <div>
                      <h3 className="app-main-title">NEXORA</h3>
                      <span className="app-sub-title">SECURED COMMODITIES LEASING</span>
                    </div>
                    <div className="header-balance-pill" onClick={() => setMobileTab('me')}>
                      <span>৳</span>
                      <strong>{user ? user.total_balance.toFixed(2) : '0.00'}</strong>
                    </div>
                  </div>

                  {/* Dynamic Mobile content area based on mobileTab */}
                  <div className="phone-app-scrollable-body">
                    
                    {/* TAB 1: HOME (dashboard) */}
                    {mobileTab === 'dashboard' && (
                      <div className="mobile-tab-home" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* High-quality sliding banners */}
                        <div className="banner-container">
                          <div className="banner-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                            {[
                              { img: energyBanner, label: "RENEWABLE ENERGY UTILITIES", title: "Fund Solar Node Arrays", desc: "Lease power grid modules in Bangladesh." },
                              { img: refineryBanner, label: "BATTERY MINERALS REFINING", title: "Lithium Reactor Leases", desc: "Participate in global mineral processors." },
                              { img: metalsBanner, label: "CUSTODIAL PRECIOUS METALS", title: "Rent Gold refining pipelines", desc: "Direct physical bullion backing assurances." }
                            ].map((slide, idx) => (
                              <div key={idx} className="banner-slide" style={{ backgroundImage: `url(${slide.img})` }}>
                                <div className="banner-overlay"></div>
                                <div className="banner-content">
                                  <span className="banner-pretitle">{slide.label}</span>
                                  <h4 className="banner-title">{slide.title}</h4>
                                  <span className="banner-desc">{slide.desc}</span>
                                  <button className="banner-btn" onClick={() => setMobileTab('invest')}>Lease Asset <ArrowUpRight size={10} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="banner-dots">
                            {[0, 1, 2].map(idx => (
                              <div key={idx} className={`banner-dot ${currentSlide === idx ? 'active' : ''}`} onClick={() => setCurrentSlide(idx)}></div>
                            ))}
                          </div>
                        </div>

                        {/* Scrolling marquee ticker */}
                        <div className="marquee-wrapper">
                          <div className="marquee-content">
                            {[
                              "User +88017****2311 withdrew ৳1,400 via bKash!",
                              "User +88019****9908 leased Solar Power Grid for ৳1,000!",
                              "User +88015****3829 withdrew ৳22,500 successfully via Nagad!",
                              "User +88016****0023 leased Biomass Energy Plant for ৳15,000!",
                              "User +88018****4567 withdrew ৳6,200 via Rocket!",
                              "User +88017****8899 leased Lithium Battery Refinery for ৳45,000!",
                              "User +88013****1212 withdrew ৳550 via bKash!",
                              "User +88017****5219 leased Gold Refining Facility for ৳1,00,000!"
                            ].map((item, idx) => {
                              const isWithdraw = item.includes("withdrew");
                              return (
                                <span key={idx} className="marquee-item">
                                  <span className="marquee-speaker">📢</span>
                                  <span className="marquee-text-main">
                                    {item.split(' ')[0]} {item.split(' ')[1]}{' '}
                                    <span style={{ color: isWithdraw ? '#ef4444' : 'var(--accent-green)', fontWeight: 'bold' }}>
                                      {isWithdraw ? "withdrew" : "leased"}
                                    </span>{' '}
                                    <span style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>
                                      {item.split(' ').slice(3).join(' ')}
                                    </span>
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Quick Actions 2x3 Grid */}
                        <div className="quick-actions-2x3-grid">
                          <button onClick={() => { setMobileTab('me'); setDepositModalOpen(true); }} className="quick-action-btn">
                            <div className="btn-icon-wrap" style={{ background: 'var(--accent-green-glow)' }}><ArrowUpRight size={18} style={{ color: 'var(--accent-green)' }} /></div>
                            <span>Deposit</span>
                          </button>
                          <button onClick={() => { setMobileTab('me'); setWithdrawModalOpen(true); }} className="quick-action-btn">
                            <div className="btn-icon-wrap" style={{ background: 'var(--accent-gold-glow)' }}><ArrowDownLeft size={18} style={{ color: 'var(--accent-gold)' }} /></div>
                            <span>Withdraw</span>
                          </button>
                          <button onClick={() => setShowAboutModal(true)} className="quick-action-btn">
                            <div className="btn-icon-wrap" style={{ background: 'rgba(255,255,255,0.05)' }}><Info size={18} style={{ color: '#fff' }} /></div>
                            <span>About Us</span>
                          </button>
                          <button onClick={() => setMobileTab('team')} className="quick-action-btn">
                            <div className="btn-icon-wrap" style={{ background: 'var(--accent-blue-glow)' }}><Share2 size={18} style={{ color: 'var(--accent-blue)' }} /></div>
                            <span>Invite Friends</span>
                          </button>
                          <button onClick={() => setShowPartnershipModal(true)} className="quick-action-btn">
                            <div className="btn-icon-wrap" style={{ background: 'var(--accent-gold-glow)' }}><Handshake size={18} style={{ color: 'var(--accent-gold)' }} /></div>
                            <span>Partnership</span>
                          </button>
                          <button onClick={() => setShowSupportModal(true)} className="quick-action-btn">
                            <div className="btn-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)' }}><Headphones size={18} style={{ color: '#ef4444' }} /></div>
                            <span>Support</span>
                          </button>
                        </div>

                        {/* Team Leader Event motivating promo card */}
                        <div className="team-leader-event-card">
                          <div className="team-leader-header">
                            <div>
                              <span className="leader-pill">OFFICIAL CAREER ROADMAP</span>
                              <h4>Become a Nexora Official Team Leader!</h4>
                            </div>
                            <div className="leader-icon-badge"><Award size={22} style={{ color: 'var(--accent-gold)' }} /></div>
                          </div>
                          <p>Expand your lease network upline and secure fixed monthly salary payouts credited directly to your bank account or mobile wallet.</p>
                          <div className="leader-rewards-row">
                            <div className="reward-item">
                              <span className="rank-name bronce">Bronze Leader</span>
                              <strong>৳10,000 / mo</strong>
                            </div>
                            <div className="reward-item">
                              <span className="rank-name silver">Silver Leader</span>
                              <strong>৳30,000 / mo</strong>
                            </div>
                            <div className="reward-item">
                              <span className="rank-name gold">Gold Leader</span>
                              <strong>৳60,000 / mo</strong>
                            </div>
                            <div className="reward-item">
                              <span className="rank-name diamond">Diamond Leader</span>
                              <strong>৳100,000 / mo</strong>
                            </div>
                          </div>
                          <button className="leader-learn-more-btn" onClick={() => setShowPartnershipModal(true)}>Review Partnership Terms <ArrowUpRight size={12} /></button>
                        </div>

                      </div>
                    )}

                    {/* TAB 2: PROJECTS (asset leasing shop) */}
                    {mobileTab === 'invest' && (
                      <div className="mobile-tab-projects" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        <div className="projects-tab-header">
                          <h3>Clean Energy Lease Shop</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Rent fractional physical nodes. All contracts have a fixed 180-day lock-in period with daily ROI harvest clearance. All returns are flat BDT values.</p>
                        </div>

                        {/* Project cards loop */}
                        <div className="projects-mobile-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {LEASE_PROJECTS.map(proj => (
                            <div key={proj.id} className="mobile-project-card" style={{ borderLeft: `4px solid ${proj.id === 'gold' ? 'var(--accent-gold)' : 'var(--accent-green)'}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <span className="mobile-project-tag">{proj.category}</span>
                                  <h4 style={{ fontSize: '14px', marginTop: '4px' }}>{proj.name}</h4>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Lease Price</span>
                                  <h4 style={{ color: 'var(--text-main)', fontSize: '14px' }}>৳{proj.price.toLocaleString()}</h4>
                                </div>
                              </div>

                              <p className="mobile-proj-desc" style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '8px 0', lineHeight: '1.4' }}>{proj.description}</p>

                              <div className="mobile-proj-stats-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', background: 'rgba(0,0,0,0.15)', padding: '8px', borderRadius: '6px', fontSize: '11px', textAlign: 'center' }}>
                                <div>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block' }}>Daily Earnings</span>
                                  <strong style={{ color: 'var(--accent-green)' }}>৳{proj.dailyProfit}</strong>
                                </div>
                                <div>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block' }}>Duration</span>
                                  <strong style={{ color: 'var(--text-main)' }}>180 Days</strong>
                                </div>
                                <div>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block' }}>Total Profit</span>
                                  <strong style={{ color: 'var(--accent-gold)' }}>৳{proj.totalProfit.toLocaleString()}</strong>
                                </div>
                              </div>

                              <button 
                                onClick={() => setSelectedAgreementProject(proj)} 
                                className="mobile-project-lease-btn"
                              >
                                Sign Agreement & Lease
                              </button>
                            </div>
                          ))}
                        </div>

                      </div>
                    )}

                    {/* TAB 3: MINING (daily harvest & vault) */}
                    {mobileTab === 'mining' && (
                      <div className="mobile-tab-mining" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* Gamified central harvest button */}
                        <div className="glass-card daily-harvest-hub-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', textAlign: 'center', padding: '20px 14px' }}>
                          <div>
                            <h4>Manual Energy Harvest Engine</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>Daily ROI yields are not automated. You must tap this central reactor button every 24 hours to sync power payloads and claim earnings.</p>
                          </div>

                          <div 
                            onClick={!isMining ? harvestAllContracts : null}
                            className={`mining-pulsing-circle ${isMining ? 'active-spinning' : ''}`}
                            style={{ cursor: !isMining ? 'pointer' : 'not-allowed' }}
                          >
                            <div className="inner-pulsing-core">
                              <Zap size={32} style={{ color: isMining ? 'var(--accent-gold)' : 'var(--accent-green)' }} />
                              <span style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '6px' }}>
                                {isMining ? `SYNCING ${miningPercent}%` : 'TAP TO HARVEST'}
                              </span>
                            </div>
                          </div>

                          <div className="turbines-count-row" style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
                            <div>Active Leases: <strong>{contracts.filter(c => c.status === 'active').length} nodes</strong></div>
                            <div>Claimable: <strong>
                              {contracts.filter(c => {
                                if (c.status !== 'active') return false;
                                if (!c.last_claimed_at) return true;
                                const lastC = new Date(c.last_claimed_at);
                                const now = new Date();
                                const isSame = lastC.getUTCDate() === now.getUTCDate() &&
                                              lastC.getUTCMonth() === now.getUTCMonth() &&
                                              lastC.getUTCFullYear() === now.getUTCFullYear();
                                return !isSame;
                              }).length} nodes
                            </strong></div>
                          </div>
                        </div>

                        {/* Compound Lockup Vault */}
                        <div className="glass-card compound-vault-stashing-card">
                          <div className="vault-header-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <Lock size={16} style={{ color: 'var(--accent-blue)' }} />
                            <h4>Compound Lockup Vault</h4>
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.4' }}>Hedge against payouts volatility. Move daily harvest returns or claimed commission into the locked vault to compound extra fixed rewards.</p>
                          
                          <form onSubmit={handleVaultLock} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Stash Amount (Available: ৳{user ? (user.balance + user.commission_balance).toFixed(2) : '0.00'})</label>
                              <input type="number" placeholder="Enter BDT amount" value={vaultAmount} onChange={e => setVaultAmount(e.target.value)} className="glass-input" style={{ padding: '8px 12px', fontSize: '13px' }} required />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Lockup Duration Bonus Options</label>
                              <div className="vault-duration-selector-row" style={{ display: 'flex', gap: '6px' }}>
                                {[
                                  { days: '60', bonus: '+20% bonus' },
                                  { days: '120', bonus: '+50% bonus' },
                                  { days: '180', bonus: '+90% bonus' }
                                ].map(opt => (
                                  <div 
                                    key={opt.days} 
                                    onClick={() => setVaultDuration(opt.days)} 
                                    className={`duration-pill-opt ${vaultDuration === opt.days ? 'selected' : ''}`}
                                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center', cursor: 'pointer', fontSize: '11px' }}
                                  >
                                    <strong>{opt.days} Days</strong>
                                    <span style={{ fontSize: '9px', display: 'block', color: 'var(--accent-green)' }}>{opt.bonus}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <button type="submit" className="phone-btn-primary" style={{ padding: '8px 12px', fontSize: '12px' }}>
                              Lock Funds in Vault
                            </button>
                          </form>

                          {/* Vault locks ledger list */}
                          <div className="vault-locks-ledger-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '15px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Vault Stashes:</span>
                            {vaultLocks.length === 0 ? (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>No active vault stashes found.</span>
                            ) : (
                              vaultLocks.map(lock => {
                                const isReleaseReady = new Date() >= new Date(lock.unlock_date);
                                return (
                                  <div key={lock.id} className="vault-lock-row-item" style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '11px' }}>
                                      <div>Principal: <strong>৳{lock.amount} BDT</strong></div>
                                      <div style={{ color: 'var(--accent-green)' }}>Fixed Reward: +৳{(lock.amount * (lock.bonus_pct / 100)).toFixed(2)} (+{lock.bonus_pct}%)</div>
                                      <div style={{ color: 'var(--text-muted)', fontSize: '9.5px' }}>Unlock Date: {new Date(lock.unlock_date).toLocaleDateString()}</div>
                                    </div>
                                    <div>
                                      {lock.status === 'unlocked' ? (
                                        <span className="badge badge-gray">CLAIMED</span>
                                      ) : isReleaseReady ? (
                                        <button onClick={() => handleVaultUnlock(lock.id)} className="vault-release-btn-claim">Unlock</button>
                                      ) : (
                                        <span className="badge badge-blue">LOCKED</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* TAB 4: TEAM (referral network) */}
                    {mobileTab === 'team' && (
                      <div className="mobile-tab-team" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* Quick share */}
                        <div className="glass-card referrals-sharing-card">
                          <h4>Team Referrals Invite Desk</h4>
                          <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>Build your local power lease tree. Direct Level 1 commissions (10%), sub-member Level 2 (4%), generational Level 3 (1%).</p>

                          <div className="referral-sharing-link-block" style={{ marginTop: '12px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>YOUR DYNAMIC INVITE LINK:</span>
                            <div className="link-copy-input-row" style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                              <input type="text" value={`${window.location.origin}?ref=${user ? user.referral_code : ''}`} readOnly className="glass-input" style={{ flex: 1, padding: '6px 10px', fontSize: '11.5px', fontFamily: 'monospace' }} />
                              <button onClick={() => copyRefLink(`${window.location.origin}?ref=${user ? user.referral_code : ''}`)} className="btn-copy-clip">
                                {isLinkCopied ? <Check size={14} style={{ color: 'var(--accent-green)' }} /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>

                          {/* Social media quick share shortcuts */}
                          <div className="social-quick-shares-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', gap: '6px' }}>
                            {['Facebook', 'TikTok', 'WhatsApp', 'Telegram'].map(sm => (
                              <button 
                                key={sm} 
                                onClick={() => showStatus(`Opening ${sm} link composer...`, 'info')}
                                className="social-share-pill-btn"
                                style={{ flex: 1, padding: '6px 4px', fontSize: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', color: 'var(--text-main)', cursor: 'pointer' }}
                              >
                                {sm}
                              </button>
                            ))}
                          </div>

                          {/* QR Code */}
                          <div className="referral-qr-code-box" style={{ textAlign: 'center', marginTop: '18px' }}>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>CLIENT REGISTRATION BARCODE QR:</span>
                            {renderMockQRCode(`${window.location.origin}?ref=${user ? user.referral_code : ''}`)}
                          </div>
                        </div>

                        {/* 3-Tier counters */}
                        <div className="glass-card team-counters-card">
                          <h4>Structural Network Statistics</h4>
                          <div className="counters-tier-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '12px', textAlign: 'center' }}>
                            <div className="tier-counter-sub" style={{ flex: 1, background: 'var(--accent-green-glow)', border: '1px solid rgba(0,230,118,0.2)', padding: '10px 4px', borderRadius: '8px' }}>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>LEVEL 1 (Direct)</span>
                              <strong style={{ fontSize: '18px', color: 'var(--accent-green)', display: 'block', marginTop: '4px' }}>{user ? user.stats.teamBreakdown.level1 : '0'}</strong>
                              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>10% Comm</span>
                            </div>
                            <div className="tier-counter-sub" style={{ flex: 1, background: 'var(--accent-blue-glow)', border: '1px solid rgba(41,121,255,0.2)', padding: '10px 4px', borderRadius: '8px' }}>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>LEVEL 2 (Indirect)</span>
                              <strong style={{ fontSize: '18px', color: 'var(--accent-blue)', display: 'block', marginTop: '4px' }}>{user ? user.stats.teamBreakdown.level2 : '0'}</strong>
                              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>4% Comm</span>
                            </div>
                            <div className="tier-counter-sub" style={{ flex: 1, background: 'var(--accent-gold-glow)', border: '1px solid rgba(255,215,0,0.2)', padding: '10px 4px', borderRadius: '8px' }}>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>LEVEL 3 (Gen Layer)</span>
                              <strong style={{ fontSize: '18px', color: 'var(--accent-gold)', display: 'block', marginTop: '4px' }}>{user ? user.stats.teamBreakdown.level3 : '0'}</strong>
                              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>1% Comm</span>
                            </div>
                          </div>
                        </div>

                        {/* 1-Click Commission Claiming Button */}
                        <div className="glass-card commission-1click-claiming-box" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
                          <div>
                            <h4>Claim Accumulated Commissions</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>Affiliate referral cuts do not deposit automatically into your active wallet balance. You must clear them via this claim button.</p>
                          </div>
                          
                          <div className="accumulated-balance-row" style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pending Commission:</span>
                            <strong style={{ color: 'var(--accent-green)', fontSize: '15px' }}>৳{user ? user.pending_commission.toFixed(2) : '0.00'}</strong>
                          </div>

                          <button 
                            onClick={claimTeamCommissions} 
                            disabled={!user || user.pending_commission <= 0}
                            className={`glowing-claim-btn ${user && user.pending_commission > 0 ? 'active-pulse' : 'disabled-idle'}`}
                          >
                            1-Click Claim Team Commission
                          </button>
                        </div>

                      </div>
                    )}

                    {/* TAB 5: ME (user profile) */}
                    {mobileTab === 'me' && (
                      <div className="mobile-tab-me" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* Triple-wallet layout header */}
                        <div className="glass-card triple-wallet-apk-card">
                          <div className="profile-details-top" style={{ display: 'flex', gap: '10px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '12px' }}>
                            <div className="profile-initials-avatar">{user ? (user.full_name ? user.full_name.charAt(0) : 'U') : 'U'}</div>
                            <div>
                              <strong style={{ fontSize: '14px', display: 'block' }}>{user ? (user.full_name || 'Nexora User') : 'Loading...'}</strong>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phone: {user ? user.phone : ''}</span>
                            </div>
                          </div>

                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Triple-Wallet Balance Architecture:</span>
                          <div className="triple-wallet-metric-boxes-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '8px' }}>
                            <div className="metric-box-sub sub-total">
                              <span>Total Capital</span>
                              <strong>৳{user ? user.total_balance.toFixed(0) : '0'}</strong>
                            </div>
                            <div className="metric-box-sub sub-deposit">
                              <span>Deposit</span>
                              <strong>৳{user ? user.deposit_balance.toFixed(0) : '0'}</strong>
                            </div>
                            <div className="metric-box-sub sub-comm">
                              <span>Commission</span>
                              <strong>৳{user ? user.commission_balance.toFixed(0) : '0'}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Transaction Controls buttons */}
                        <div className="transaction-controls-apk-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button onClick={() => setDepositModalOpen(true)} className="apk-tile-btn">
                            <ArrowUpRight size={16} style={{ color: 'var(--accent-green)' }} />
                            <div>
                              <strong>Deposit</strong>
                              <span>Submit payments</span>
                            </div>
                          </button>
                          <button onClick={() => setWithdrawModalOpen(true)} className="apk-tile-btn">
                            <ArrowDownLeft size={16} style={{ color: 'var(--accent-gold)' }} />
                            <div>
                              <strong>Withdraw</strong>
                              <span>Cashout requests</span>
                            </div>
                          </button>
                          <button onClick={() => setTxHistoryModalOpen(true)} className="apk-tile-btn" style={{ gridColumn: 'span 2' }}>
                            <FileText size={16} style={{ color: 'var(--accent-blue)' }} />
                            <div>
                              <strong>Transaction Records</strong>
                              <span>Clearance logs & account history</span>
                            </div>
                          </button>
                        </div>

                        {/* Security updating settings */}
                        <div className="glass-card security-adjustments-card">
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <Settings size={15} style={{ color: 'var(--accent-green)' }} />
                            <h4>Security Management</h4>
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.4' }}>Modify your account identity names, configure security email alerts, and change passwords.</p>

                          <form onSubmit={handleSecurityUpdate} className="apk-security-form" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Lessor Full Name (Agreement signing)</label>
                              <input type="text" placeholder="e.g. Shakib Al Hasan" value={securityForm.fullName} onChange={e => setSecurityForm({...securityForm, fullName: e.target.value})} className="glass-input" style={{ padding: '6px 10px', fontSize: '12.5px' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Audit Alert Email Address</label>
                              <input type="email" placeholder="e.g. shakib@mail.com" value={securityForm.email} onChange={e => setSecurityForm({...securityForm, email: e.target.value})} className="glass-input" style={{ padding: '6px 10px', fontSize: '12.5px' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Secure Account Password</label>
                              <input type="password" placeholder="••••••••" value={securityForm.password} onChange={e => setSecurityForm({...securityForm, password: e.target.value})} className="glass-input" style={{ padding: '6px 10px', fontSize: '12.5px' }} />
                            </div>
                            <button type="submit" className="phone-btn-primary" style={{ padding: '8px', fontSize: '12px', marginTop: '4px' }}>
                              Save Security Changes
                            </button>
                          </form>
                        </div>

                        {/* Logout button */}
                        <button className="apk-logout-btn" onClick={handleLogout}>
                          <LogOut size={16} /> Disconnect Account Node
                        </button>

                      </div>
                    )}

                  </div>

                  {/* BOTTOM NAV TABS BAR */}
                  <div className="phone-bottom-nav-bar">
                    {bottomNavItems.map(item => {
                      const IconComponent = item.icon;
                      const isActive = mobileTab === item.id;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setMobileTab(item.id)} 
                          className={`phone-bottom-nav-item ${isActive ? 'active-tab' : ''}`}
                        >
                          <IconComponent size={18} />
                          <span>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* OVERLAY MODAL: DIGITAL INVESTMENT AGREEMENT PAGE */}
      {selectedAgreementProject && (
        <div className="modal-backdrop">
          <div className="glass-card digital-agreement-modal">
            <div className="modal-header-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <h3>Nexora Infrastructure Lease Agreement</h3>
              <X size={18} className="btn-close-modal" onClick={() => { setSelectedAgreementProject(null); setAgreementChecked(false); }} />
            </div>

            <div className="agreement-scroll-view" style={{ maxHeight: '420px', overflowY: 'auto', padding: '15px 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <h4 style={{ color: 'var(--text-main)', textAlign: 'center', marginBottom: '12px', fontSize: '13px' }}>
                CONTRACT LEASING DEED FOR DUAL-REGION GREEN POWER GENERATORS
              </h4>
              
              <div className="agreement-details-table" style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '14px', color: 'var(--text-main)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Lessor Client Name:</span>
                  <strong>{user ? (user.full_name || 'NOT CONFIGURED (Setup in Me tab)') : ''}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Lessor Client Mobile:</span>
                  <strong>{user ? user.phone : ''}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Asset Infrastructure:</span>
                  <strong>{selectedAgreementProject.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Purchase Cost:</span>
                  <strong>৳{selectedAgreementProject.price.toLocaleString()} BDT</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Daily Earnings Yield:</span>
                  <strong style={{ color: 'var(--accent-green)' }}>৳{selectedAgreementProject.dailyProfit.toLocaleString()} BDT/day</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Lock-in Duration:</span>
                  <strong>{selectedAgreementProject.duration} Days</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                  <span>Guaranteed Net Yield:</span>
                  <strong style={{ color: 'var(--accent-gold)' }}>৳{selectedAgreementProject.totalProfit.toLocaleString()} BDT</strong>
                </div>
              </div>

              <div className="legal-paragraphs" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 5px' }}>
                <p>1. <strong>Purpose</strong>: This Deed binds Nexora Global Trust (the 'Custodian') and the Lessor Client (the 'Lessor') to secure physical infrastructure leases for green generator turbines.</p>
                <p>2. <strong>Settlement Terms</strong>: Earnings are calculated based on utility power outputs. The Lessor must manually trigger grid sync telemetry under the Mining Tab daily to claim their daily returns. Unclaimed daily ROI cannot be retroactively recovered.</p>
                <p>3. <strong>Anti-Fraud Security</strong>: The lease is strictly locked for 180 days. Capital liquidation before expiration is prohibited. Accounts attempting false double-clearing deposits or clone referral registrations will be permanently frozen by admin controllers.</p>
                <p>4. <strong>Legal Authority</strong>: This agreement is governed by the laws of Bangladesh and the Digital Assets Leasing Act of 2026.</p>
              </div>

              {/* Stamp Graphic */}
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>OFFICIAL VERIFIED CUSTODIAN CERTIFICATION SEAL:</span>
                {renderCorporateStamp()}
              </div>
            </div>

            <div className="agreement-signing-row" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '12px' }}>
                <input 
                  type="checkbox" 
                  checked={agreementChecked} 
                  onChange={e => setAgreementChecked(e.target.checked)} 
                  style={{ marginTop: '3px' }} 
                />
                <span>I, <strong>{user ? (user.full_name || 'Nexora User') : 'User'}</strong>, certify that I understand the 180-day lockup terms and sign this digital lease agreement.</span>
              </label>

              <button 
                onClick={() => buyContract(selectedAgreementProject.id)}
                disabled={!agreementChecked}
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', background: agreementChecked ? 'linear-gradient(135deg, var(--accent-gold) 0%, #ff8f00 100%)' : 'var(--bg-tertiary)', color: '#000', cursor: agreementChecked ? 'pointer' : 'not-allowed' }}
              >
                Sign & Authorize Lease Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: DEPOSIT DIALOG */}
      {depositModalOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content-wrap">
            <div className="modal-header-row">
              <h3>Checkout Deposit Counter</h3>
              <X size={18} className="btn-close-modal" onClick={() => setDepositModalOpen(false)} />
            </div>
            
            <div className="deposit-instructions-box" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', fontSize: '11px', border: '1px solid var(--border-color)', marginBottom: '14px', lineHeight: '1.5' }}>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>BDT MANUAL DEPOSIT CHANNELS:</span>
              <p>Cashout or Send-Money to the official merchant numbers below:</p>
              <div style={{ margin: '4px 0' }}>bKash Merchant: <strong>+8801700998822</strong></div>
              <div style={{ margin: '4px 0' }}>Nagad Merchant: <strong>+8801988443322</strong></div>
              <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '6px' }}>Submit your payment transaction ID (TrxID) below. Admin confirmation clear time is typically 1-2 hours.</p>
            </div>

            <form onSubmit={handleDepositSubmit} className="modal-form-body">
              <div className="form-input-block">
                <label>Deposit Amount (BDT ৳)</label>
                <input type="number" placeholder="Enter amount" value={depositForm.amount} onChange={e => setDepositForm({...depositForm, amount: e.target.value})} className="glass-input" required />
              </div>
              <div className="form-input-block">
                <label>Mobile Wallet Channel</label>
                <select value={depositForm.channel} onChange={e => setDepositForm({...depositForm, channel: e.target.value})} className="glass-input">
                  <option value="bKash">bKash Merchant Wallet</option>
                  <option value="Nagad">Nagad Merchant Wallet</option>
                  <option value="Rocket">Rocket Personal Wallet</option>
                </select>
              </div>
              <div className="form-input-block">
                <label>Transaction ID (TrxID)</label>
                <input type="text" placeholder="e.g. TXN102948010" value={depositForm.trxId} onChange={e => setDepositForm({...depositForm, trxId: e.target.value})} className="glass-input" required />
              </div>
              <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>Submit Receipt</button>
            </form>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: WITHDRAWAL DIALOG */}
      {withdrawModalOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content-wrap">
            <div className="modal-header-row">
              <h3>Clear Payout Cashout</h3>
              <X size={18} className="btn-close-modal" onClick={() => setWithdrawModalOpen(false)} />
            </div>

            <div className="payout-instructions-box" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', fontSize: '11px', border: '1px solid var(--border-color)', marginBottom: '14px', lineHeight: '1.4' }}>
              <span style={{ color: '#ef4444', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>CASH-OUT CONFIGURATION:</span>
              <div>Minimum Payout: <strong>৳500.00 BDT</strong></div>
              <div>Standard Clearing Fee: <strong>10% service fee</strong></div>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="modal-form-body">
              <div className="form-input-block">
                <label>Withdrawal Source Wallet</label>
                <select value={withdrawForm.source} onChange={e => setWithdrawForm({...withdrawForm, source: e.target.value})} className="glass-input">
                  <option value="earnings">Daily Earnings Wallet (Avail: ৳{user ? user.balance.toFixed(2) : '0.00'})</option>
                  <option value="commission">Commission Wallet (Avail: ৳{user ? user.commission_balance.toFixed(2) : '0.00'})</option>
                </select>
              </div>
              <div className="form-input-block">
                <label>Withdraw Amount (BDT ৳)</label>
                <input type="number" placeholder="Enter amount" value={withdrawForm.amount} onChange={e => setWithdrawForm({...withdrawForm, amount: e.target.value})} className="glass-input" required />
              </div>
              <div className="form-input-block">
                <label>Payout Channel</label>
                <select value={withdrawForm.channel} onChange={e => setWithdrawForm({...withdrawForm, channel: e.target.value})} className="glass-input">
                  <option value="bKash Mobile">bKash Mobile Payout</option>
                  <option value="Nagad Mobile">Nagad Mobile Payout</option>
                </select>
              </div>
              <div className="form-input-block">
                <label>Receiver Wallet Mobile Account</label>
                <input type="text" placeholder="e.g. +88017XXXXXXXX" value={withdrawForm.destination} onChange={e => setWithdrawForm({...withdrawForm, destination: e.target.value})} className="glass-input" required />
              </div>
              <button type="submit" className="btn-primary" style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #ef4444 0%, #ff5252 100%)', color: '#fff' }}>
                Request Clearance Payout
              </button>
            </form>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: TRANSACTION HISTORY DIALOG */}
      {txHistoryModalOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content-wrap" style={{ maxWidth: '640px', width: '90%' }}>
            <div className="modal-header-row">
              <h3>Client Transaction Ledgers</h3>
              <X size={18} className="btn-close-modal" onClick={() => setTxHistoryModalOpen(false)} />
            </div>

            <div className="table-responsive" style={{ marginTop: '15px', maxHeight: '350px', overflowY: 'auto' }}>
              <table className="client-history-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '8px 0' }}>Date</th>
                    <th>Action Type</th>
                    <th>Value</th>
                    <th>Channel - Info</th>
                    <th>Clearance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No transaction entries logged.</td>
                    </tr>
                  ) : (
                    transactions.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 600 }}>{t.type.toUpperCase()}</td>
                        <td style={{ color: t.type === 'deposit' || t.type === 'referral_comm' || t.type === 'claim' || t.type === 'claim_commission' || t.type === 'vault_unlock' ? 'var(--accent-green)' : '#ef4444' }}>
                          {t.type === 'deposit' || t.type === 'referral_comm' || t.type === 'claim' || t.type === 'claim_commission' || t.type === 'vault_unlock' ? '+' : '-'}৳{t.amount}
                        </td>
                        <td>{t.channel || 'System Node'} - {t.trx_id || t.details}</td>
                        <td>
                          <span className={`badge ${t.status === 'approved' ? 'badge-green' : t.status === 'pending' ? 'badge-blue' : 'badge-red'}`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER GENERAL MODALS */}
      {showAboutModal && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content-wrap">
            <div className="modal-header-row">
              <h3>About Nexora Group</h3>
              <X size={18} className="btn-close-modal" onClick={() => setShowAboutModal(false)} />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '10px', lineHeight: '1.6' }}>
              <p><strong>Nexora Utilities</strong> is a registered physical commodities leasing and clean power custodian platform based in Bangladesh.</p>
              <p>We fractionalize capital leases for utility infrastructure. Users rent active generator nodes (solar panels, turbines, mineral refineries) and claim daily yield payouts backed by local utility distributions.</p>
              <p style={{ color: 'var(--accent-green)' }}>✓ Zero-emission grid allocations</p>
              <p style={{ color: 'var(--accent-blue)' }}>✓ Double-wallet security checks</p>
              <p style={{ color: 'var(--accent-gold)' }}>✓ Certified physical contracts</p>
            </div>
            <button className="phone-btn-primary" onClick={() => setShowAboutModal(false)} style={{ marginTop: '15px' }}>Close</button>
          </div>
        </div>
      )}

      {showPartnershipModal && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content-wrap">
            <div className="modal-header-row">
              <h3>Agent Partnership Program</h3>
              <X size={18} className="btn-close-modal" onClick={() => setShowPartnershipModal(false)} />
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '10px', lineHeight: '1.5' }}>
              <p>Grow your direct invite network of active lease nodes to qualify for Nexora Agent status.</p>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>• <strong>Bronze Leader</strong>: Invite 10 active direct downlines. Salary: <strong>৳10,000 / month</strong>.</div>
                <div>• <strong>Silver Leader</strong>: Invite 30 active direct downlines. Salary: <strong>৳30,000 / month</strong>.</div>
                <div>• <strong>Gold Leader</strong>: Invite 80 active direct downlines. Salary: <strong>৳60,000 / month</strong>.</div>
                <div>• <strong>Diamond Leader</strong>: Invite 150 active direct downlines. Salary: <strong>৳100,000 / month</strong>.</div>
              </div>
              <p>All monthly salaries are distributed manually by clearing desks on the 1st of every calendar month. Downline nodes must have at least one active infrastructure lease contract.</p>
            </div>
            <button className="phone-btn-primary" onClick={() => setShowPartnershipModal(false)} style={{ marginTop: '15px' }}>Accept Terms</button>
          </div>
        </div>
      )}

      {showSupportModal && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content-wrap">
            <div className="modal-header-row">
              <h3>Client Helpdesk Support Desk</h3>
              <X size={18} className="btn-close-modal" onClick={() => setShowSupportModal(false)} />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.6' }}>
              <p>Having issues with checkout deposits, withdrawal clearances, or turbine synchronization?</p>
              <p>Our audit clearing desk is active 24 hours a day, 7 days a week to clear client inquiries.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
                <a href="https://t.me/nexora_official_support" target="_blank" rel="noopener noreferrer" className="support-link-btn tele">
                  Join Official Support Telegram
                </a>
                <a href="mailto:support@nexora.vip" className="support-link-btn mail">
                  Open Email Support Ticket
                </a>
              </div>
            </div>
            <button className="phone-btn-primary" onClick={() => setShowSupportModal(false)} style={{ marginTop: '15px' }}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}

// Icon wrapper fix
function TrendingUpIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || "24"}
      height={props.size || "24"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      style={props.style}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
