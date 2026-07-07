import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Shield, Cpu, Layers, Users, ArrowUpRight, ArrowDownLeft, Lock, 
  Unlock, Send, RefreshCw, CheckCircle2, AlertTriangle, Plus, Copy, 
  Check, X, Award, Handshake, Info, Headphones, Settings, 
  FileText, Mail, LogOut, Share2, ShieldAlert, Upload, CheckSquare, List
} from 'lucide-react';

import energyBanner from './assets/energy_banner.png';
import refineryBanner from './assets/refinery_banner.png';
import metalsBanner from './assets/metals_banner.png';

const API_BASE = '/api';

// Sticky 5-Tab Navigation Items
const bottomNavItems = [
  { id: 'dashboard', label: 'Home', icon: Cpu },
  { id: 'invest', label: 'Projects', icon: Layers },
  { id: 'tasks', label: 'Tasks', icon: Award },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'me', label: 'Me', icon: Settings }
];

export default function App() {
  // Global States
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nex_token') || null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('nex_admin_token') || null);
  const [adminData, setAdminData] = useState(null);
  const [adminTaskSubmissions, setAdminTaskSubmissions] = useState([]);

  // Responsive Layout View States
  const [landingMode, setLandingMode] = useState(true); // true = landing page, false = app portal
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' (Home), 'invest' (Projects), 'tasks' (Tasks), 'team', 'me'
  
  // Modals & Sheets
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPartnershipModal, setShowPartnershipModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [miningModalOpen, setMiningModalOpen] = useState(false); // Daily Claim & Vault is now a quick action modal
  const [selectedAgreementProject, setSelectedAgreementProject] = useState(null);
  const [showFrozenWalletModal, setShowFrozenWalletModal] = useState(false);
  
  // Copy Actions
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  // Carousel
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auth Forms
  const [signupForm, setSignupForm] = useState({ phone: '', password: '', referredByCode: '' });
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Transaction Forms (USD)
  const [depositForm, setDepositForm] = useState({ amount: '', channel: 'bKash Mobile Deposit', trxId: '' });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', channel: 'bKash Mobile Payout', destination: '', source: 'earnings' });
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [txHistoryModalOpen, setTxHistoryModalOpen] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  
  // Vault Form
  const [vaultAmount, setVaultAmount] = useState('');
  const [vaultDuration, setVaultDuration] = useState('60');

  // Profile Settings Forms (Tab 5)
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', email: '', avatar: '', oldPassword: '', newPassword: '' });

  // Social Task proof states
  const [selectedProofFile, setSelectedProofFile] = useState(null);
  const [proofBase64, setProofBase64] = useState('');

  // Harvesting Progress & Feedback
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [isMining, setIsMining] = useState(false);
  const [miningPercent, setMiningPercent] = useState(0);

  // Live Lists
  const [contracts, setContracts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [vaultLocks, setVaultLocks] = useState([]);
  const [telegramFeed, setTelegramFeed] = useState([]);

  // Timer Tick state for rolling tickers
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Auto-slide banner
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Rolling counter timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
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
      fetchAdminTaskSubmissions();
    } else {
      setIsAdmin(false);
      setAdminData(null);
      setAdminTaskSubmissions([]);
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
      setProfileForm({
        fullName: data.full_name || '',
        phone: data.phone || '',
        email: data.email || '',
        avatar: data.avatar || '',
        oldPassword: '',
        newPassword: ''
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

  const fetchAdminTaskSubmissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/task-submissions`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminTaskSubmissions(data);
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
    setActiveTab('dashboard');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('nex_admin_token');
    setAdminToken(null);
    setIsAdmin(false);
    setAdminData(null);
    setAdminTaskSubmissions([]);
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
          // Ignore
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

      showStatus(`Locked $${vaultAmount} in the vault for ${vaultDuration} days.`);
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

  // Claim Level pending commissions (Manual Claim)
  const claimLevelCommission = async (level) => {
    try {
      const res = await fetch(`${API_BASE}/team/claim-level-commission`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ level })
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

  // Attendance task reward ($0.20 instant claim)
  const claimAttendance = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks/attendance`, {
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

  // Submit Social Amplification file proof ($1.00 uploader)
  const submitSocialTask = async (e) => {
    e.preventDefault();
    if (!proofBase64) {
      showStatus("Please upload a screenshot proof file first.", "error");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/tasks/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskName: "Social Amplification Facebook/TikTok",
          proofImage: proofBase64
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(data.message);
      setSelectedProofFile(null);
      setProofBase64('');
      fetchUserProfile();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Claim Recruitment Milestone
  const claimRecruitmentMilestone = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/claim-recruitment-milestone`, {
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

  // Claim Leader Milestones
  const claimLeaderMilestone = async (milestoneId) => {
    try {
      const res = await fetch(`${API_BASE}/user/claim-leader-milestone`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ milestoneId })
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

      showStatus("Deposit checkout submitted. Approval pending.");
      setDepositForm({ amount: '', channel: 'bKash Mobile Deposit', trxId: '' });
      setDepositModalOpen(false);
      fetchUserTxHistory();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  // Payout withdrawal submission (Intercepts and opens exception modal on block)
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
      if (!res.ok) {
        // Intercept VIP 0 hard lock error
        if (data.error && data.error.includes("Task Wallet balance is currently frozen")) {
          setShowFrozenWalletModal(true);
          setWithdrawModalOpen(false);
          return;
        }
        throw new Error(data.error);
      }

      showStatus("Cashout withdrawal requested successfully.");
      setWithdrawForm({ amount: '', channel: 'bKash Mobile Payout', destination: '', source: 'earnings' });
      setWithdrawModalOpen(false);
      fetchUserProfile();
      fetchUserTxHistory();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  // Profile updating (including Avatar upload)
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/user/update-profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          phone: profileForm.phone,
          email: profileForm.email,
          avatar: profileForm.avatar,
          oldPassword: profileForm.oldPassword,
          newPassword: profileForm.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus("Profile details updated successfully.");
      fetchUserProfile();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm({ ...profileForm, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Admin Actions
  const adminVerifyTask = async (submissionId, action) => {
    try {
      const res = await fetch(`${API_BASE}/admin/task-submissions/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ submissionId, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(`Task submission successfully ${action === 'approve' ? 'approved' : 'rejected'}.`);
      fetchAdminTaskSubmissions();
      fetchAdminData();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

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

      showStatus("Transaction approved and level commissions calculated.");
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

      showStatus("Transaction rejected and refunded where applicable.");
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
  // 10-Tier USD Nexora Investment Shop definitions
  const LEASE_PROJECTS = [
    {
      id: 'eco_mini',
      name: "Nexora Eco-Mini Grid",
      description: "Fractional clean power nodes generating base grid energy outputs.",
      price: 10,
      dailyProfit: 0.35,
      duration: 180,
      totalProfit: 63,
      bgGradient: "linear-gradient(135deg, #00e676 0%, #00b0ff 100%)",
      category: "ECO MINI POWER"
    },
    {
      id: 'smart_home',
      name: "Nexora Smart Home Grid",
      description: "Localized solar setups for eco-smart home residential integrations.",
      price: 30,
      dailyProfit: 1.10,
      duration: 180,
      totalProfit: 198,
      bgGradient: "linear-gradient(135deg, #2979ff 0%, #a012f3 100%)",
      category: "SMART SOLAR HOME"
    },
    {
      id: 'solar_hub',
      name: "Nexora Solar Community Hub",
      description: "Community grid nodes yielding utility-scale solar outputs.",
      price: 70,
      dailyProfit: 2.70,
      duration: 180,
      totalProfit: 486,
      bgGradient: "linear-gradient(135deg, #ff9100 0%, #ff3d00 100%)",
      category: "COMMUNITY SOLAR"
    },
    {
      id: 'agro_pump',
      name: "Nexora Agro-Solar Pump",
      description: "Agro-power pumping array providing agricultural water allocations.",
      price: 100,
      dailyProfit: 4.00,
      duration: 180,
      totalProfit: 720,
      bgGradient: "linear-gradient(135deg, #00e5ff 0%, #2979ff 100%)",
      category: "AGRO WATER NODE"
    },
    {
      id: 'wind_farm',
      name: "Nexora Wind Farm Asset",
      description: "Coastal wind turbines feeding high efficiency offshore allocations.",
      price: 300,
      dailyProfit: 13.00,
      duration: 180,
      totalProfit: 2340,
      bgGradient: "linear-gradient(135deg, #ffd700 0%, #ff6d00 100%)",
      category: "WIND UTILITY"
    },
    {
      id: 'hydro_plant',
      name: "Nexora Industrial Hydro-Plant",
      description: "Utility hydro-electric generator plants driving baseline grid syncs.",
      price: 700,
      dailyProfit: 32.00,
      duration: 180,
      totalProfit: 5760,
      bgGradient: "linear-gradient(135deg, #00e676 0%, #ff9100 100%)",
      category: "HYDRO BASELINE"
    },
    {
      id: 'biomass_plant',
      name: "Nexora Biomass Power Plant",
      description: "Agricultural waste combustion nodes providing 24/7 utility feeds.",
      price: 1000,
      dailyProfit: 48.00,
      duration: 180,
      totalProfit: 8640,
      bgGradient: "linear-gradient(135deg, #2979ff 0%, #ff3d00 100%)",
      category: "BIOMASS NODE"
    },
    {
      id: 'data_center',
      name: "Nexora Green Data Center",
      description: "Solar-powered cluster grids routing cloud computing operations.",
      price: 5000,
      dailyProfit: 260.00,
      duration: 180,
      totalProfit: 46800,
      bgGradient: "linear-gradient(135deg, #a012f3 0%, #ff9100 100%)",
      category: "CLOUD DATA CENTER"
    },
    {
      id: 'gold_reserve',
      name: "Nexora Gold Refinery Reserve",
      description: "Rent physical commodities refining pipelines processing bullion.",
      price: 10000,
      dailyProfit: 550.00,
      duration: 180,
      totalProfit: 99000,
      bgGradient: "linear-gradient(135deg, #ffd700 0%, #00e676 100%)",
      category: "CUSTODIAL GOLD"
    },
    {
      id: 'energy_matrix',
      name: "Nexora Sovereign Energy Matrix",
      description: "State-level utility clean energy allocations synched globally.",
      price: 50000,
      dailyProfit: 3000.00,
      duration: 180,
      totalProfit: 540000,
      bgGradient: "linear-gradient(135deg, #ffd700 0%, #a012f3 100%)",
      category: "SOVEREIGN MATRIX"
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

  return (
    <div className="app-layout-root">
      
      {/* Top Index Ticker */}
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

      {/* Navigation Headers (Desktop & Tablet) */}
      {!landingMode && token && !isAdmin && (
        <header className="desktop-app-header">
          <div className="desktop-header-logo-block">
            <div className="desktop-header-logo-box">
              <Cpu size={20} style={{ color: 'var(--accent-green)' }} />
            </div>
            <div>
              <h3>NEXORA</h3>
              <span>Bangladeshi Infrastructure Leasing</span>
            </div>
          </div>

          <nav className="desktop-header-nav">
            {bottomNavItems.map(item => {
              const Icon = item.icon;
              return (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`desktop-nav-link-btn ${activeTab === item.id ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="desktop-header-user-status">
            <div className="desktop-balance-indicators">
              <div className="desktop-bal-pill dep">Deposit: ৳{user ? user.deposit_balance.toLocaleString() : '0'}</div>
              <div className="desktop-bal-pill comm">Comm: ৳{user ? user.commission_balance.toLocaleString() : '0'}</div>
              <div className="desktop-bal-pill active">Total: ৳{user ? user.total_balance.toLocaleString() : '0'}</div>
            </div>
            <button className="desktop-logout-icon-btn" onClick={handleLogout} title="Log Out">
              <LogOut size={16} />
            </button>
          </div>
        </header>
      )}

      {/* Main Body (Corporate Landing or Portal Dashboard) */}
      <main className="main-content-scroller">
        
        {isAdmin ? (
          // MASTER ADMIN DJANGO CONTROL PANEL
          <div className="django-admin-wrapper" style={{ minHeight: 'calc(100vh - 38px)', background: '#f8f9fa', color: '#333', fontFamily: 'Roboto, Arial, sans-serif' }}>
            {/* Django top header banner */}
            <div style={{ background: '#124c3e', color: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#f5dd5d', letterSpacing: '0.5px', fontFamily: 'monospace' }}>
                  Nexora Control Center - Django-Control Console
                </h2>
              </div>
              <div style={{ fontSize: '12px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <span>Welcome, <strong>administrator</strong>.</span>
                <button onClick={handleAdminLogout} style={{ background: '#417690', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Log Out Control Panel
                </button>
              </div>
            </div>

            {/* Django Breadcrumb Bar */}
            <div style={{ background: '#79aec8', color: '#fff', padding: '8px 24px', fontSize: '11px', fontWeight: '500' }}>
              Home › Admin Operations › Verification desk
            </div>

            {adminData ? (
              <div style={{ display: 'flex', gap: '20px', padding: '24px' }}>
                
                {/* Sidebar list models */}
                <div style={{ width: '240px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ background: '#79aec8', color: '#fff', padding: '10px 15px', fontSize: '12px', fontWeight: 'bold' }}>
                    MODELS DIRECTORY
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '12px 15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                      <span style={{ color: '#447e9b', fontWeight: '500' }}>Users Database</span>
                      <span style={{ background: '#eee', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{adminData.users.length}</span>
                    </div>
                    <div style={{ padding: '12px 15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                      <span style={{ color: '#447e9b', fontWeight: '500' }}>Transactions Log</span>
                      <span style={{ background: '#eee', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{adminData.pendingTransactions.length} Pending</span>
                    </div>
                    <div style={{ padding: '12px 15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                      <span style={{ color: '#447e9b', fontWeight: '500' }}>Task Proof Submissions</span>
                      <span style={{ background: '#eee', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{adminTaskSubmissions.filter(t=>t.status==='pending').length} Pending</span>
                    </div>
                  </div>
                </div>

                {/* Main django content block */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* System stats */}
                  <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '15px' }}>
                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '8px', color: '#666', fontWeight: 'bold' }}>SYSTEM HEALTH SUMMARY</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginTop: '12px', textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase' }}>Total Clients</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>{adminData.summary.totalUsers}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase' }}>Active Leases</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>{adminData.summary.activeContractsCount} Units</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase' }}>Active Volume</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#124c3e' }}>${adminData.summary.activeVolume.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase' }}>Approved Deposits</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#26b99a' }}>${adminData.summary.depositsVolume.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* System Parameters Settings */}
                  <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: '#417690', color: '#fff', padding: '8px 15px', fontSize: '12px', fontWeight: 'bold' }}>
                      Change System Parameters Settings
                    </div>
                    <div style={{ padding: '15px', fontSize: '12px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Global Freeze Switch:</label>
                        <button 
                          onClick={() => adminUpdateSettings({ global_freeze: adminData.settings.global_freeze === '1' ? '0' : '1' })}
                          style={{
                            background: adminData.settings.global_freeze === '1' ? '#ba2121' : '#26b99a',
                            color: '#fff',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          {adminData.settings.global_freeze === '1' ? 'ACTIVE FREEZE (Withdrawals Locked)' : 'SYSTEM HEALTHY (Normal Operation)'}
                        </button>
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Withdraw Fee %:</label>
                        <input type="number" defaultValue={adminData.settings.withdrawal_fee_pct} onBlur={(e) => adminUpdateSettings({ withdrawal_fee_pct: e.target.value })} style={{ width: '60px', padding: '3px' }} />
                      </div>
                      <div>
                        <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Min Withdraw ($):</label>
                        <input type="number" defaultValue={adminData.settings.min_withdrawal_bdt} onBlur={(e) => adminUpdateSettings({ min_withdrawal_bdt: e.target.value })} style={{ width: '80px', padding: '3px' }} />
                      </div>
                    </div>
                  </div>

                  {/* Task Submissions Module */}
                  <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: '#124c3e', color: '#fff', padding: '8px 15px', fontSize: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>SELECT TASK PROOF SUBMISSIONS TO APPROVE / REJECT</span>
                    </div>
                    <div style={{ padding: '10px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#eee', borderBottom: '1px solid #ddd', color: '#666' }}>
                            <th style={{ padding: '8px' }}>User ID (Phone)</th>
                            <th style={{ padding: '8px' }}>Lessor Tier Level</th>
                            <th style={{ padding: '8px' }}>Task Name</th>
                            <th style={{ padding: '8px' }}>View Proof Link</th>
                            <th style={{ padding: '8px' }}>Date Submitted</th>
                            <th style={{ padding: '8px' }}>Clearance Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminTaskSubmissions.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No task proof submissions registered.</td>
                            </tr>
                          ) : (
                            adminTaskSubmissions.map(ts => (
                              <tr key={ts.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px' }}><strong>{ts.phone}</strong></td>
                                <td style={{ padding: '8px' }}>VIP {ts.vip_level}</td>
                                <td style={{ padding: '8px' }}>{ts.task_name}</td>
                                <td style={{ padding: '8px' }}>
                                  {ts.proof_image ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <a href={ts.proof_image} target="_blank" rel="noopener noreferrer" style={{ color: '#447e9b', fontWeight: 'bold' }}>
                                        Open Proof Image File
                                      </a>
                                      <img src={ts.proof_image} alt="proof" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }} />
                                    </div>
                                  ) : (
                                    <span style={{ color: '#999' }}>No proof asset</span>
                                  )}
                                </td>
                                <td style={{ padding: '8px' }}>{new Date(ts.created_at).toLocaleString()}</td>
                                <td style={{ padding: '8px' }}>
                                  {ts.status === 'pending' ? (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button onClick={() => adminVerifyTask(ts.id, 'approve')} style={{ background: '#26b99a', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}>Approve</button>
                                      <button onClick={() => adminVerifyTask(ts.id, 'reject')} style={{ background: '#ba2121', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
                                    </div>
                                  ) : (
                                    <span style={{ fontWeight: 'bold', color: ts.status === 'approved' ? '#26b99a' : '#ba2121', textTransform: 'capitalize' }}>{ts.status}</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pending Transactions queue */}
                  <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: '#124c3e', color: '#fff', padding: '8px 15px', fontSize: '12px', fontWeight: 'bold' }}>
                      PENDING DEPOSITS & WITHDRAWALS ACTIONS CLEARING QUEUE
                    </div>
                    <div style={{ padding: '10px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#eee', borderBottom: '1px solid #ddd', color: '#666' }}>
                            <th style={{ padding: '8px' }}>Phone</th>
                            <th style={{ padding: '8px' }}>Type</th>
                            <th style={{ padding: '8px' }}>Amount</th>
                            <th style={{ padding: '8px' }}>Channel</th>
                            <th style={{ padding: '8px' }}>TrxID / Info</th>
                            <th style={{ padding: '8px' }}>Date</th>
                            <th style={{ padding: '8px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminData.pendingTransactions.length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Deposit/Withdrawal clearing queue is empty.</td>
                            </tr>
                          ) : (
                            adminData.pendingTransactions.map(tx => (
                              <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px' }}><strong>{tx.phone}</strong></td>
                                <td style={{ padding: '8px' }}><span style={{ background: tx.type === 'deposit' ? '#26b99a' : '#ba2121', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold', fontSize: '9px' }}>{tx.type.toUpperCase()}</span></td>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>${tx.amount.toFixed(2)}</td>
                                <td style={{ padding: '8px' }}>{tx.channel}</td>
                                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{tx.trx_id || tx.details}</td>
                                <td style={{ padding: '8px' }}>{new Date(tx.created_at).toLocaleString()}</td>
                                <td style={{ padding: '8px' }}>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => adminApproveTx(tx.id)} style={{ background: '#26b99a', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}>Approve</button>
                                    <button onClick={() => adminRejectTx(tx.id)} style={{ background: '#ba2121', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Users database management */}
                  <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: '#124c3e', color: '#fff', padding: '8px 15px', fontSize: '12px', fontWeight: 'bold' }}>
                      CLIENT REGISTRY ACCOUNTS MANAGEMENT & FREEZING DESK
                    </div>
                    <div style={{ padding: '10px', overflowX: 'auto', maxHeight: '350px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#eee', borderBottom: '1px solid #ddd', color: '#666' }}>
                            <th style={{ padding: '8px' }}>Phone</th>
                            <th style={{ padding: '8px' }}>IP Node</th>
                            <th style={{ padding: '8px' }}>Total Bal</th>
                            <th style={{ padding: '8px' }}>Deposit Bal</th>
                            <th style={{ padding: '8px' }}>Comm Bal</th>
                            <th style={{ padding: '8px' }}>Status</th>
                            <th style={{ padding: '8px' }}>Adjust Ledger / Freezing Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminData.users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '8px' }}><strong>{u.phone}</strong></td>
                              <td style={{ padding: '8px', color: '#777' }}>{u.created_ip || '127.0.0.1'}</td>
                              <td style={{ padding: '8px' }}>${u.total_balance.toFixed(2)}</td>
                              <td style={{ padding: '8px', color: '#26b99a', fontWeight: 'bold' }}>${u.deposit_balance.toFixed(2)}</td>
                              <td style={{ padding: '8px', color: '#ff9100', fontWeight: 'bold' }}>${u.commission_balance.toFixed(2)}</td>
                              <td style={{ padding: '8px' }}><span style={{ color: u.status === 'frozen' ? '#ba2121' : '#26b99a', fontWeight: 'bold' }}>{u.status.toUpperCase()}</span></td>
                              <td style={{ padding: '8px' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input 
                                    type="number" 
                                    placeholder="Set Total Bal"
                                    onBlur={(e) => {
                                      if (e.target.value !== '') adminEditUserBalance(u.id, e.target.value);
                                    }} 
                                    style={{ width: '100px', padding: '3px', border: '1px solid #ccc', borderRadius: '3px' }}
                                  />
                                  <button 
                                    onClick={() => adminToggleUserFreeze(u.id, u.status)} 
                                    style={{
                                      background: u.status === 'frozen' ? '#26b99a' : '#ba2121',
                                      color: '#fff',
                                      border: 'none',
                                      padding: '4px 8px',
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {u.status === 'frozen' ? 'Unfreeze Account' : 'Freeze Account'}
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
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 0', color: '#999', fontSize: '13px' }}>Decrypting Admin Control Records...</div>
            )}
          </div>
        ) : landingMode ? (
          // CORPORATE LANDING PAGE (Unauthenticated Homepage)
          <div className="landing-layout-body">
            <div className="desktop-header-row max-width-container">
              <div className="desktop-logo-wrap">
                <div className="desktop-logo-box">
                  <Cpu size={24} style={{ color: 'var(--accent-green)' }} />
                </div>
                <div>
                  <h2>NEXORA</h2>
                  <span className="desktop-sub-logo">Clean Energy & Commodities Custodial</span>
                </div>
              </div>
              <div className="desktop-nav-actions">
                <button className="btn-primary" onClick={() => setLandingMode(false)}>
                  Access Workspace Terminal <ArrowUpRight size={16} />
                </button>
              </div>
            </div>

            <div className="landing-hero-section max-width-container">
              <span className="hero-alert-badge"><Shield size={12} /> SECURED & CERTIFIED ASSET LEASES • GRADE AAA</span>
              <h1>Lease Infrastructure. <br /><span className="hero-gradient-text">Harvest Daily Cash yields.</span></h1>
              <p>Nexora connects private investment capital directly to physical power nodes and chemical refineries in Bangladesh. Lease utility-scale clean solar grid modules, vertical wind turbines, agricultural biomass reactors, or bullion processors. 180-day fixed lockups with instant daily ROI payout clearance.</p>
              
              <div className="hero-actions-row">
                <button className="btn-primary" onClick={() => setLandingMode(false)}>
                  Access Workspace Terminal <ArrowUpRight size={16} />
                </button>
                <button className="btn-secondary" onClick={() => {
                  const el = document.getElementById('landing-projects');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}>
                  Explore Leases Tiers
                </button>
              </div>
            </div>

            {/* Core Stats Overview */}
            <div className="stats-metric-grid max-width-container" style={{ margin: '40px auto' }}>
              <div className="stat-metric-card">
                <span>Total Assets Active</span>
                <h2>2,450 Units</h2>
              </div>
              <div className="stat-metric-card">
                <span>Bangladesh Grid Synced</span>
                <h2>99.98% Healthy</h2>
              </div>
              <div className="stat-metric-card">
                <span>Leased Volume</span>
                <h2 style={{ color: 'var(--accent-gold)' }}>৳24,500,000</h2>
              </div>
            </div>

            {/* Projects Overview */}
            <div id="landing-projects" className="landing-projects-section max-width-container">
              <h3 className="section-title">Verified Green Infrastructures Open for Leases</h3>
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
                        <span>Lease cost:</span>
                        <strong>৳{proj.price.toLocaleString()} BDT</strong>
                      </div>
                      <div className="ledger-item">
                        <span>Daily harvest yield:</span>
                        <strong style={{ color: 'var(--accent-green)' }}>+৳{proj.dailyProfit.toLocaleString()} BDT/day</strong>
                      </div>
                      <div className="ledger-item">
                        <span>Lock-in duration:</span>
                        <span>{proj.duration} Days</span>
                      </div>
                      <div className="ledger-item" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                        <span>Total contract return:</span>
                        <strong style={{ color: 'var(--accent-gold)' }}>৳{proj.totalProfit.toLocaleString()} BDT</strong>
                      </div>
                    </div>
                    <button className="btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={() => setLandingMode(false)}>Sign Lease Agreement</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !token ? (
          // USER LOGIN/SIGNUP CARD (Full-screen viewport layout)
          <div className="auth-fullscreen-container">
            <div className="auth-box-wrap glass-card">
              <div className="phone-auth-header">
                <h2 className="glowing-text">NEXORA</h2>
                <span>Clean Energy Infrastructure Custodial</span>
              </div>

              {isRegistering ? (
                <form onSubmit={handleSignup} className="phone-auth-form">
                  <h4>Create Client Account Node</h4>
                  <div className="auth-input-group">
                    <label>Registered Mobile Number</label>
                    <input type="text" placeholder="e.g. +8801700000010" value={signupForm.phone} onChange={e => setSignupForm({...signupForm, phone: e.target.value})} className="glass-input" required />
                    <span>Bangladesh phone prefix code (+880) required</span>
                  </div>
                  <div className="auth-input-group">
                    <label>Secure Password Key</label>
                    <input type="password" placeholder="••••••••" value={signupForm.password} onChange={e => setSignupForm({...signupForm, password: e.target.value})} className="glass-input" required />
                  </div>
                  <div className="auth-input-group">
                    <label>Upline Referral Code (Optional)</label>
                    <input type="text" placeholder="e.g. NEX-XXXX-XXX" value={signupForm.referredByCode} onChange={e => setSignupForm({...signupForm, referredByCode: e.target.value})} className="glass-input" />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Register Account Node</button>
                  <div className="auth-toggle-row">
                    <span>Already registered?</span>
                    <span onClick={() => setIsRegistering(false)} style={{ color: 'var(--accent-green)', fontWeight: 'bold', cursor: 'pointer' }}>Sign In</span>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="phone-auth-form">
                  <h4>Authenticate Account Node</h4>
                  <div className="auth-input-group">
                    <label>Registered Phone</label>
                    <input type="text" placeholder="e.g. +8801700000010" value={loginForm.phone} onChange={e => setLoginForm({...loginForm, phone: e.target.value})} className="glass-input" required />
                  </div>
                  <div className="auth-input-group">
                    <label>Account Password</label>
                    <input type="password" placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="glass-input" required />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Connect Node</button>
                  <div className="auth-toggle-row">
                    <span>New client investor?</span>
                    <span onClick={() => setIsRegistering(true)} style={{ color: 'var(--accent-green)', fontWeight: 'bold', cursor: 'pointer' }}>Register Node</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          // USER PORTAL DASHBOARD (Authenticated)
          <div className="portal-container max-width-container">
            
            {/* Mobile-Only Header status */}
            <div className="mobile-only-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', height: '56px' }}>
              <div>
                <h3 style={{ fontSize: '15px', color: '#fff', letterSpacing: '0.5px' }}>NEXORA</h3>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Green Grid Custody</span>
              </div>
              <div className="header-balance-pill" onClick={() => setActiveTab('me')} style={{ background: 'var(--accent-green-glow)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>$</span>
                <strong style={{ color: '#fff', fontSize: '13px' }}>{user ? user.total_balance.toFixed(2) : '0.00'}</strong>
              </div>
            </div>

            {/* TAB 1: HOME (dashboard) */}
            {activeTab === 'dashboard' && (
              <div className="tab-pane-layout" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* High-quality sliding banners */}
                <div className="banner-container">
                  <div className="banner-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    {[
                      { img: energyBanner, label: "RENEWABLE SOLAR GRID UNITS", title: "Fund Solar Power Arrays", desc: "Lease solar power cells generating USD yields daily." },
                      { img: refineryBanner, label: "BATTERY MINERALS REFINERS", title: "Lithium Reactor Unit Leases", desc: "Lease high-efficiency minerals refining reactors." },
                      { img: metalsBanner, label: "PRECIOUS METALS CUSTODY", title: "Rent Gold refining pipelines", desc: "Rental structures backed by certified bullion custody deeds." }
                    ].map((slide, idx) => (
                      <div key={idx} className="banner-slide" style={{ backgroundImage: `url(${slide.img})` }}>
                        <div className="banner-overlay"></div>
                        <div className="banner-content">
                          <span className="banner-pretitle">{slide.label}</span>
                          <h4 className="banner-title">{slide.title}</h4>
                          <span className="banner-desc">{slide.desc}</span>
                          <button className="banner-btn" onClick={() => setActiveTab('invest')}>Lease Asset Unit <ArrowUpRight size={10} /></button>
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

                {/* Scrolling marquee ticker (USD based payouts) */}
                <div className="marquee-wrapper">
                  <div className="marquee-content">
                    {[
                      "User +88017****2311 withdrew $14.00 via bKash Mobile!",
                      "User +88019****9908 leased Nexora Eco-Mini Grid for $10.00!",
                      "User +88015****3829 withdrew $225.00 successfully via Nagad Mobile!",
                      "User +88016****0023 leased Nexora Biomass Power Plant for $1,000.00!",
                      "User +88018****4567 withdrew $62.00 via Rocket Payout!",
                      "User +88017****8899 leased Nexora Wind Farm Asset for $300.00!",
                      "User +88013****1212 withdrew $5.50 via bKash!",
                      "User +88017****5219 leased Nexora Gold Refinery Reserve for $10,000.00!"
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

                {/* Desktop and Mobile Dual Grid layout for Home metrics */}
                <div className="home-dashboard-grid">
                  
                  {/* Left Column: Quick Actions & Team Leader event info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Quick actions 2x3 Grid */}
                    <div className="quick-actions-2x3-grid">
                      <button onClick={() => { setActiveTab('me'); setDepositModalOpen(true); }} className="quick-action-btn">
                        <div className="btn-icon-wrap" style={{ background: 'var(--accent-green-glow)' }}><ArrowUpRight size={20} style={{ color: 'var(--accent-green)' }} /></div>
                        <span>Deposit</span>
                      </button>
                      <button onClick={() => { setActiveTab('me'); setWithdrawModalOpen(true); }} className="quick-action-btn">
                        <div className="btn-icon-wrap" style={{ background: 'var(--accent-gold-glow)' }}><ArrowDownLeft size={20} style={{ color: 'var(--accent-gold)' }} /></div>
                        <span>Withdraw</span>
                      </button>
                      <button onClick={() => setMiningModalOpen(true)} className="quick-action-btn">
                        <div className="btn-icon-wrap" style={{ background: 'var(--accent-green-glow)' }}><Zap size={20} style={{ color: 'var(--accent-green)' }} /></div>
                        <span>Mining Engine</span>
                      </button>
                      <button onClick={() => setActiveTab('team')} className="quick-action-btn">
                        <div className="btn-icon-wrap" style={{ background: 'var(--accent-blue-glow)' }}><Share2 size={20} style={{ color: 'var(--accent-blue)' }} /></div>
                        <span>Invite Friends</span>
                      </button>
                      <button onClick={() => setShowPartnershipModal(true)} className="quick-action-btn">
                        <div className="btn-icon-wrap" style={{ background: 'var(--accent-gold-glow)' }}><Handshake size={20} style={{ color: 'var(--accent-gold)' }} /></div>
                        <span>Partnership</span>
                      </button>
                      <button onClick={() => setShowSupportModal(true)} className="quick-action-btn">
                        <div className="btn-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)' }}><Headphones size={20} style={{ color: '#ef4444' }} /></div>
                        <span>Support Desk</span>
                      </button>
                    </div>

                    {/* Team Leader Event Promo card */}
                    <div className="team-leader-event-card">
                      <div className="team-leader-header">
                        <div>
                          <span className="leader-pill">CAREER COMMISSIONS ROADMAP</span>
                          <h4>Become a Nexora Official Team Leader!</h4>
                        </div>
                        <div className="leader-icon-badge"><Award size={24} style={{ color: 'var(--accent-gold)' }} /></div>
                      </div>
                      <p>Build a local community leasing group. Expand active downlines to unlock official agent contracts providing fixed monthly salary payments.</p>
                      
                      <div className="leader-rewards-row">
                        <div className="reward-item">
                          <span className="rank-name bronce">Bronze Leader</span>
                          <strong>$100.00 / mo</strong>
                        </div>
                        <div className="reward-item">
                          <span className="rank-name silver">Silver Leader</span>
                          <strong>$300.00 / mo</strong>
                        </div>
                        <div className="reward-item">
                          <span className="rank-name gold">Gold Leader</span>
                          <strong>$600.00 / mo</strong>
                        </div>
                        <div className="reward-item">
                          <span className="rank-name diamond">Diamond Leader</span>
                          <strong>$1,000.00 / mo</strong>
                        </div>
                      </div>
                      <button className="leader-learn-more-btn" onClick={() => setShowPartnershipModal(true)}>
                        Review Official Terms & Rules <ArrowUpRight size={12} />
                      </button>
                    </div>

                    {/* Team Leader Event Milestones */}
                    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ color: 'var(--accent-gold)' }}>Daily Referral Leader Event Milestones</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Recruit active downlines who make a deposit today to claim bonus spendable rewards.</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          { id: 'leader_milestone_1', target: 2, reward: 2.00, title: "Bronze Recruiter Milestone" },
                          { id: 'leader_milestone_2', target: 5, reward: 7.00, title: "Silver Recruiter Milestone" },
                          { id: 'leader_milestone_3', target: 10, reward: 20.00, title: "Gold Recruiter Milestone" }
                        ].map(m => {
                          const progress = user ? user.stats.todayReferralsWithDeposit : 0;
                          const pct = Math.min(100, (progress / m.target) * 100);
                          const claimed = user && user.claimed_milestones ? user.claimed_milestones.split(',') : [];
                          const isClaimed = claimed.includes(m.id);
                          const canClaim = progress >= m.target && !isClaimed;
                          return (
                            <div key={m.id} style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-color)', padding: '10px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                <strong>{m.title} (Invite {m.target})</strong>
                                <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Reward: +${m.reward.toFixed(2)}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ flex: 1, height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-green) 0%, var(--accent-blue) 100%)' }}></div>
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{progress}/{m.target}</span>
                              </div>
                              <button 
                                onClick={() => claimLeaderMilestone(m.id)}
                                disabled={!canClaim}
                                style={{
                                  background: isClaimed ? 'var(--bg-tertiary)' : canClaim ? 'linear-gradient(135deg, var(--accent-green) 0%, var(--accent-blue) 100%)' : 'rgba(255,255,255,0.02)',
                                  color: isClaimed ? 'var(--text-muted)' : canClaim ? '#000' : 'var(--text-muted)',
                                  border: '1px solid var(--border-color)',
                                  padding: '6px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  borderRadius: '4px',
                                  cursor: canClaim ? 'pointer' : 'default',
                                  textAlign: 'center',
                                  marginTop: '3px'
                                }}
                              >
                                {isClaimed ? "Claimed" : canClaim ? "Claim Reward" : "Incomplete"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Active contracts summary list with Accrued Rolling Ticker */}
                  <div className="glass-card home-active-leases-block">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4>Your Funded Infrastructure Leases</h4>
                      <span className="badge badge-green">GRID SYNCED ACTIVE</span>
                    </div>

                    <div className="table-responsive">
                      <table className="client-contracts-table" style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <th style={{ padding: '8px 0' }}>Project Node</th>
                            <th>Lease Cost</th>
                            <th>Accrued Yield (Live)</th>
                            <th>Timeline</th>
                            <th>Collect</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contracts.length === 0 ? (
                            <tr>
                              <td colSpan="5" style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No active leases. Fund an infrastructure grid from the Projects tab.
                              </td>
                            </tr>
                          ) : (
                            contracts.map(c => {
                              const isClaimedToday = c.last_claimed_at && 
                                new Date(c.last_claimed_at).toDateString() === new Date().toDateString();
                              
                              // Calculate rolling accrued profit
                              const getAccruedProfit = (contract) => {
                                const startDate = contract.last_claimed_at ? new Date(contract.last_claimed_at) : new Date(contract.created_at);
                                const now = new Date();
                                const elapsedSeconds = Math.max(0, Math.floor((now - startDate) / 1000));
                                const dailyEarning = contract.price * contract.daily_roi;
                                const perSecondRate = dailyEarning / 86400;
                                const accrued = elapsedSeconds * perSecondRate;
                                return accrued.toFixed(6);
                              };

                              return (
                                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '10px 0', fontWeight: 600 }}>{c.tier_name}</td>
                                  <td>${c.price.toLocaleString()}</td>
                                  <td style={{ color: 'var(--accent-green)', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                    {isClaimedToday ? (
                                      <span>+$0.000000 (Claimed)</span>
                                    ) : (
                                      <span className="accrued-live-glowing-number">${getAccruedProfit(c)}</span>
                                    )}
                                  </td>
                                  <td>{c.days_elapsed} / {c.duration_days} Days</td>
                                  <td>
                                    {c.status === 'completed' ? (
                                      <span className="badge badge-gray">COMPLETED</span>
                                    ) : isClaimedToday ? (
                                      <span className="badge badge-green">SYNCED</span>
                                    ) : (
                                      <button 
                                        onClick={() => setMiningModalOpen(true)} 
                                        className="admin-act-approve" 
                                        style={{ fontSize: '10px', padding: '3px 6px' }}
                                      >
                                        Sync
                                      </button>
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

                {/* Bottom live telegram alerts list */}
                <div className="glass-card">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', fontSize: '13px' }}>
                    <Send size={14} /> Live Official Telegram Verification Telecasts
                  </h4>
                  <div className="live-telecast-scroller" style={{ maxHeight: '120px', overflowY: 'auto', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {telegramFeed.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Awaiting feed telemetry signals...</span>
                    ) : (
                      telegramFeed.map(feed => (
                        <div key={feed.id} className="telecast-item-row" style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.015)', padding: '6px 10px', borderRadius: '4px', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-main)' }}>{feed.text}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(feed.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: PROJECTS (Leasing Shop) */}
            {activeTab === 'invest' && (
              <div className="tab-pane-layout" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="projects-tab-header">
                  <h3>Infrastructure Lease Shop</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Rent fractional clean power nodes or metal refinery reactors. All contracts have a fixed 180-day lock-in period with daily ROI harvest clearance. All returns are flat USD values.</p>
                </div>

                {/* Grid list of projects */}
                <div className="projects-grid">
                  {LEASE_PROJECTS.map(proj => (
                    <div key={proj.id} className="glass-card project-card-wrap" style={{ borderTop: `4px solid ${proj.id === 'gold_reserve' || proj.id === 'energy_matrix' ? 'var(--accent-gold)' : 'var(--accent-green)'}` }}>
                      <div className="card-top-header">
                        <span className="category-badge">{proj.category}</span>
                        <h4>{proj.name}</h4>
                      </div>
                      <p className="project-desc">{proj.description}</p>
                      
                      <div className="project-financial-ledger">
                        <div className="ledger-item">
                          <span>Purchase Lease Cost:</span>
                          <strong>${proj.price.toLocaleString()}</strong>
                        </div>
                        <div className="ledger-item">
                          <span>Daily Profit return:</span>
                          <strong style={{ color: 'var(--accent-green)' }}>+${proj.dailyProfit.toLocaleString()}/day</strong>
                        </div>
                        <div className="ledger-item">
                          <span>Lock-in Duration:</span>
                          <span>180 Days</span>
                        </div>
                        <div className="ledger-item" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                          <span>Total estimated return:</span>
                          <strong style={{ color: 'var(--accent-gold)' }}>${proj.totalProfit.toLocaleString()}</strong>
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedAgreementProject(proj)} 
                        className="btn-primary" 
                        style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                      >
                        Sign Agreement & Lease
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: TASKS (Daily tasks, screenshot upload and attendance) */}
            {activeTab === 'tasks' && (
              <div className="tab-pane-layout" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div className="projects-tab-header">
                  <h3>Lessor Task Rewards Terminal</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Perform grid synchronization and social promotion actions to earn additional spendable credits directly into your wallet.</p>
                </div>

                <div className="home-dashboard-grid">
                  
                  {/* Left Column: Daily Attendance & Recruitment Milestone */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Attendance checkin */}
                    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ fontSize: '15px' }}>Daily Attendance Telemetry</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>Synchronize your node telemetry once daily to claim attendance allowance.</p>
                        </div>
                        <div style={{ background: 'var(--accent-green-glow)', padding: '8px', borderRadius: '50%' }}>
                          <CheckSquare size={20} style={{ color: 'var(--accent-green)' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.18)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
                        <span>Daily Allowance:</span>
                        <strong style={{ color: 'var(--accent-green)' }}>+$0.20 USD</strong>
                      </div>

                      <button 
                        onClick={claimAttendance}
                        className="btn-primary" 
                        style={{ justifyContent: 'center', marginTop: '5px' }}
                      >
                        Complete Attendance Telemetry
                      </button>
                    </div>

                    {/* Recruitment Milestone Tier */}
                    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ fontSize: '15px' }}>Recruitment Milestone Challenge</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>Expand your network: get 3 direct Level 1 downlines to active Tier 1 ($10+) lease project.</p>
                        </div>
                        <div style={{ background: 'var(--accent-gold-glow)', padding: '8px', borderRadius: '50%' }}>
                          <Users size={20} style={{ color: 'var(--accent-gold)' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.18)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
                        <span>Milestone Reward:</span>
                        <strong style={{ color: 'var(--accent-gold)' }}>+$10.00 USD</strong>
                      </div>

                      {/* Recruitment progress */}
                      {user && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                            <span>Active Downline Leases:</span>
                            <strong>{user.stats.activeDownlinesCount} / 3 Nodes</strong>
                          </div>
                          <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, (user.stats.activeDownlinesCount / 3) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-gold) 0%, #ff8f00 100%)' }}></div>
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={claimRecruitmentMilestone}
                        disabled={!user || user.stats.activeDownlinesCount < 3 || user.milestone_recruitment_claimed === 1}
                        className="btn-primary" 
                        style={{
                          justifyContent: 'center',
                          background: user && user.milestone_recruitment_claimed === 1 ? 'var(--bg-tertiary)' : (user && user.stats.activeDownlinesCount >= 3) ? 'linear-gradient(135deg, var(--accent-gold) 0%, #ff8f00 100%)' : 'var(--bg-tertiary)',
                          color: user && user.milestone_recruitment_claimed === 1 ? 'var(--text-muted)' : (user && user.stats.activeDownlinesCount >= 3) ? '#000' : 'var(--text-muted)',
                          cursor: (user && user.stats.activeDownlinesCount >= 3 && user.milestone_recruitment_claimed !== 1) ? 'pointer' : 'not-allowed',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {user && user.milestone_recruitment_claimed === 1 ? "Milestone Claimed" : "Claim Recruitment Reward"}
                      </button>
                    </div>

                  </div>

                  {/* Right Column: Social sharing Screenshot Uploader */}
                  <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '15px' }}>Social Amplification sharing</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>Share Nexora official banners on Facebook/TikTok. Upload proof screenshot here.</p>
                      </div>
                      <div style={{ background: 'var(--accent-blue-glow)', padding: '8px', borderRadius: '50%' }}>
                        <Upload size={20} style={{ color: 'var(--accent-blue)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.18)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
                      <span>Promotion Reward:</span>
                      <strong style={{ color: 'var(--accent-green)' }}>+$1.00 USD</strong>
                    </div>

                    <form onSubmit={submitSocialTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Choose Screenshot Proof Image</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="glass-input" style={{ fontSize: '12px' }} />
                      </div>

                      {/* Image preview */}
                      {proofBase64 && (
                        <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', maxHeight: '160px' }}>
                          <img src={proofBase64} alt="proof preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}

                      <button type="submit" className="btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
                        Submit Screenshot Proof
                      </button>
                    </form>

                    <div style={{ marginTop: '10px', fontSize: '11.5px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', color: 'var(--text-muted)' }}>
                      <span>Status: Submit post screenshot to claim reward after review.</span>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 4: TEAM (referral affiliate tree) */}
            {activeTab === 'team' && (
              <div className="tab-pane-layout" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div className="home-dashboard-grid">
                  
                  {/* Left Column: sharing link & QR */}
                  <div className="glass-card referrals-sharing-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3>Team Referrals Invite Desk</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>Build your local power lease tree. Direct Level 1 commissions (10%), sub-member Level 2 (4%), generational Level 3 (1%).</p>

                    <div className="referral-sharing-link-block" style={{ marginTop: '5px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>YOUR UNIQUE DYNAMIC INVITE LINK:</span>
                      <div className="link-copy-input-row" style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <input type="text" value={`${window.location.origin}?ref=${user ? user.referral_code : ''}`} readOnly className="glass-input" style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px' }} />
                        <button onClick={() => copyRefLink(`${window.location.origin}?ref=${user ? user.referral_code : ''}`)} className="btn-copy-clip" style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', color: '#fff', cursor: 'pointer' }}>
                          {isLinkCopied ? <Check size={16} style={{ color: 'var(--accent-green)' }} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="social-quick-shares-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      {['Facebook Share', 'TikTok Share', 'WhatsApp Quick Send', 'Telegram Channels'].map(sm => (
                        <button 
                          key={sm} 
                          onClick={() => showStatus(`Opening ${sm} link composer...`, 'info')}
                          className="social-share-pill-btn"
                          style={{ flex: 1, padding: '8px 4px', fontSize: '10.5px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.015)', color: 'var(--text-main)', cursor: 'pointer' }}
                        >
                          {sm}
                        </button>
                      ))}
                    </div>

                    <div className="referral-qr-code-box" style={{ textAlign: 'center', marginTop: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>CLIENT REGISTRATION BARCODE QR:</span>
                      {renderMockQRCode(`${window.location.origin}?ref=${user ? user.referral_code : ''}`)}
                    </div>
                  </div>

                  {/* Right Column: 3-tier metrics & Glowing claim buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Level 1 Grid Card */}
                    <div className="glass-card team-counters-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent-green-glow)', border: '1px solid rgba(0,230,118,0.25)' }}>
                      <div>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 'bold' }}>LEVEL 1 NETWORK (Direct)</span>
                        <strong style={{ fontSize: '24px', color: 'var(--accent-green)', display: 'block', margin: '4px 0' }}>{user ? user.stats.teamBreakdown.level1 : '0'} Members</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>10% Direct commission reward</span>
                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                          Pending claims: <strong style={{ color: 'var(--accent-green)' }}>${user ? user.level1_pending_comm.toFixed(2) : '0.00'}</strong>
                        </div>
                      </div>
                      <button 
                        onClick={() => claimLevelCommission(1)}
                        disabled={!user || user.level1_pending_comm <= 0}
                        className={`glowing-claim-btn ${user && user.level1_pending_comm > 0 ? 'active-pulse' : 'disabled-idle'}`}
                        style={{ padding: '8px 16px', fontSize: '11.5px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: user && user.level1_pending_comm > 0 ? 'pointer' : 'not-allowed' }}
                      >
                        Claim L1
                      </button>
                    </div>

                    {/* Level 2 Grid Card */}
                    <div className="glass-card team-counters-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent-blue-glow)', border: '1px solid rgba(41,121,255,0.25)' }}>
                      <div>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 'bold' }}>LEVEL 2 NETWORK (Sub-members)</span>
                        <strong style={{ fontSize: '24px', color: 'var(--accent-blue)', display: 'block', margin: '4px 0' }}>{user ? user.stats.teamBreakdown.level2 : '0'} Members</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>4% Sub-member commission reward</span>
                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                          Pending claims: <strong style={{ color: 'var(--accent-blue)' }}>${user ? user.level2_pending_comm.toFixed(2) : '0.00'}</strong>
                        </div>
                      </div>
                      <button 
                        onClick={() => claimLevelCommission(2)}
                        disabled={!user || user.level2_pending_comm <= 0}
                        className={`glowing-claim-btn ${user && user.level2_pending_comm > 0 ? 'active-pulse' : 'disabled-idle'}`}
                        style={{ padding: '8px 16px', fontSize: '11.5px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: user && user.level2_pending_comm > 0 ? 'pointer' : 'not-allowed' }}
                      >
                        Claim L2
                      </button>
                    </div>

                    {/* Level 3 Grid Card */}
                    <div className="glass-card team-counters-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent-gold-glow)', border: '1px solid rgba(255,215,0,0.25)' }}>
                      <div>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 'bold' }}>LEVEL 3 NETWORK (Generational)</span>
                        <strong style={{ fontSize: '24px', color: 'var(--accent-gold)', display: 'block', margin: '4px 0' }}>{user ? user.stats.teamBreakdown.level3 : '0'} Members</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1% Generational commission reward</span>
                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                          Pending claims: <strong style={{ color: 'var(--accent-gold)' }}>${user ? user.level3_pending_comm.toFixed(2) : '0.00'}</strong>
                        </div>
                      </div>
                      <button 
                        onClick={() => claimLevelCommission(3)}
                        disabled={!user || user.level3_pending_comm <= 0}
                        className={`glowing-claim-btn ${user && user.level3_pending_comm > 0 ? 'active-pulse' : 'disabled-idle'}`}
                        style={{ padding: '8px 16px', fontSize: '11.5px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: user && user.level3_pending_comm > 0 ? 'pointer' : 'not-allowed' }}
                      >
                        Claim L3
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* TAB 5: ME (User profile settings & balances) */}
            {activeTab === 'me' && (
              <div className="tab-pane-layout" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Profile Header and Triple-Wallet balances */}
                <div className="glass-card triple-wallet-apk-card" style={{ padding: '30px' }}>
                  <div className="profile-details-top" style={{ display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '20px', marginBottom: '20px' }}>
                    {user && user.avatar ? (
                      <img src={user.avatar} alt="avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-green)' }} />
                    ) : (
                      <div className="profile-initials-avatar" style={{ width: '48px', height: '48px', fontSize: '18px' }}>{user ? (user.full_name ? user.full_name.charAt(0) : 'U') : 'U'}</div>
                    )}
                    <div>
                      <strong style={{ fontSize: '18px', display: 'block' }}>{user ? (user.full_name || 'Nexora User') : 'Loading...'}</strong>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Registered Phone Node: {user ? user.phone : ''}</span>
                    </div>
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '10px' }}>Triple-Wallet Balance Architecture:</span>
                  
                  <div className="triple-wallet-metric-boxes-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="metric-box-sub sub-total" style={{ padding: '15px' }}>
                      <span style={{ fontSize: '10px' }}>Total Capital Balance</span>
                      <strong style={{ fontSize: '18px', marginTop: '6px' }}>${user ? user.total_balance.toLocaleString() : '0.00'}</strong>
                    </div>
                    <div className="metric-box-sub sub-deposit" style={{ padding: '15px' }}>
                      <span style={{ fontSize: '10px' }}>Deposit Wallet Balance</span>
                      <strong style={{ fontSize: '18px', marginTop: '6px', color: 'var(--accent-green)' }}>${user ? user.deposit_balance.toLocaleString() : '0.00'}</strong>
                    </div>
                    <div className="metric-box-sub sub-comm" style={{ padding: '15px' }}>
                      <span style={{ fontSize: '10px' }}>Commission Wallet Balance</span>
                      <strong style={{ fontSize: '18px', marginTop: '6px', color: 'var(--accent-gold)' }}>${user ? user.commission_balance.toLocaleString() : '0.00'}</strong>
                    </div>
                  </div>
                </div>

                {/* Double column grid for settings & transactions history */}
                <div className="home-dashboard-grid">
                  
                  {/* Left Column: Transaction Quick Tiles & Security adjustment forms */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div className="transaction-controls-apk-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button onClick={() => setDepositModalOpen(true)} className="apk-tile-btn" style={{ padding: '15px' }}>
                        <ArrowUpRight size={20} style={{ color: 'var(--accent-green)' }} />
                        <div>
                          <strong>Deposit Checkout</strong>
                          <span>Add leasing funds</span>
                        </div>
                      </button>
                      <button onClick={() => setWithdrawModalOpen(true)} className="apk-tile-btn" style={{ padding: '15px' }}>
                        <ArrowDownLeft size={20} style={{ color: 'var(--accent-gold)' }} />
                        <div>
                          <strong>Withdraw Cashout</strong>
                          <span>Request wallet payouts</span>
                        </div>
                      </button>
                      <button onClick={() => setTxHistoryModalOpen(true)} className="apk-tile-btn" style={{ gridColumn: 'span 2', padding: '15px' }}>
                        <FileText size={20} style={{ color: 'var(--accent-blue)' }} />
                        <div>
                          <strong>Platform Transaction Records Ledger</strong>
                          <span>Browse manual clearing deposits, payouts history, and referral audits</span>
                        </div>
                      </button>
                    </div>

                    {/* Settings Form */}
                    <div className="glass-card security-adjustments-card" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                        <Settings size={18} style={{ color: 'var(--accent-green)' }} />
                        <h4>Lessor Node Security Configuration</h4>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.4' }}>Modify your legal name, contact email address, node display avatar, and validate password credentials.</p>

                      <form onSubmit={handleProfileUpdate} className="apk-security-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                        
                        {/* Avatar Image Selector */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lessor Display Avatar Image</label>
                          <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="glass-input" style={{ fontSize: '12px' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lessor Full Name (Agreement Deed Signature Name)</label>
                          <input type="text" placeholder="e.g. Shakib Al Hasan" value={profileForm.fullName} onChange={e => setProfileForm({...profileForm, fullName: e.target.value})} className="glass-input" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered Phone Node</label>
                          <input type="text" placeholder="e.g. +8801700000000" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="glass-input" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Linked Gmail Account Node</label>
                          <input type="email" placeholder="e.g. shakib@gmail.com" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="glass-input" />
                        </div>
                        
                        {/* Password OLD to NEW validator */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '5px' }}>
                          <span style={{ fontSize: '10.5px', color: 'var(--accent-gold)', display: 'block', marginBottom: '8px' }}>Security Password Change Vault:</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Current Password Key</label>
                              <input type="password" placeholder="••••••••" value={profileForm.oldPassword} onChange={e => setProfileForm({...profileForm, oldPassword: e.target.value})} className="glass-input" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>New Password Key</label>
                              <input type="password" placeholder="••••••••" value={profileForm.newPassword} onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})} className="glass-input" />
                            </div>
                          </div>
                        </div>

                        <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '5px' }}>
                          Save Security Changes
                        </button>
                      </form>
                    </div>

                  </div>

                  {/* Right Column: Platform overview details and stats */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h4>Lessor Accounts Legal Deed Verification</h4>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p>All active lease contracts are legally backed by physical renewable grid nodes and commodities stockpiles managed directly by Nexora custodial groups.</p>
                      <p><strong>Lessor Rights</strong>:</p>
                      <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <li>Instant daily ROI settlements are credited directly to your daily earnings wallet balance.</li>
                        <li>180-day lockups are protected by hardware lease contracts. Early liquidation is prohibited.</li>
                        <li>Referral cuts and vault compound interest are subject to double-currency audits.</li>
                      </ul>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '10px' }}>
                        <span>Lessor Legal Stamp ID:</span>
                        <strong style={{ display: 'block', color: 'var(--accent-gold)', fontFamily: 'monospace', fontSize: '11px', marginTop: '2px' }}>
                          NEX-DEED-{user ? user.referral_code : 'XXXX'}
                        </strong>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Disconnect button */}
                <button className="apk-logout-btn" onClick={handleLogout} style={{ maxWidth: '200px', alignSelf: 'flex-start' }}>
                  <LogOut size={16} /> Disconnect Account Node
                </button>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Mobile-Only Navigation bottom tabs bar */}
      {!landingMode && token && !isAdmin && (
        <div className="phone-bottom-nav-bar mobile-only-nav">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div 
                key={item.id} 
                onClick={() => setActiveTab(item.id)} 
                className={`phone-bottom-nav-item ${isActive ? 'active-tab' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* OVERLAY MODAL: DIGITAL INVESTMENT AGREEMENT PAGE */}
      {selectedAgreementProject && (
        <div className="modal-backdrop">
          <div className="glass-card digital-agreement-modal" style={{ maxWidth: '600px', width: '90%' }}>
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
                  <strong>${selectedAgreementProject.price.toLocaleString()} USD</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Daily Earnings Yield:</span>
                  <strong style={{ color: 'var(--accent-green)' }}>+${selectedAgreementProject.dailyProfit.toLocaleString()} USD/day</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Lock-in Duration:</span>
                  <strong>{selectedAgreementProject.duration} Days</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                  <span>Guaranteed Net Yield:</span>
                  <strong style={{ color: 'var(--accent-gold)' }}>${selectedAgreementProject.totalProfit.toLocaleString()} USD</strong>
                </div>
              </div>

              <div className="legal-paragraphs" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 5px' }}>
                <p>1. <strong>Purpose</strong>: This Deed binds Nexora Global Trust (the 'Custodian') and the Lessor Client (the 'Lessor') to secure physical infrastructure leases for green generator turbines.</p>
                <p>2. <strong>Settlement Terms</strong>: Earnings are calculated based on utility power outputs. The Lessor must manually trigger grid sync telemetry under the Mining Engine daily to claim their daily returns. Unclaimed daily ROI cannot be retroactively recovered.</p>
                <p>3. <strong>Anti-Fraud Security</strong>: The lease is strictly locked for 180 days. Capital liquidation before expiration is prohibited. Accounts attempting false double-clearing deposits or clone referral registrations will be permanently frozen by admin controllers.</p>
                <p>4. <strong>Legal Authority</strong>: This agreement is governed by the laws of Bangladesh and the Digital Assets Leasing Act of 2026.</p>
              </div>

              {/* Stamp Graphic with Red/Gold Wax Seal */}
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

      {/* OVERLAY MODAL: AUTOMATED DEPOSIT PAYWALL */}
      {depositModalOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content-wrap" style={{ maxWidth: '480px', width: '90%' }}>
            <div className="modal-header-row">
              <h3>Secure Checkout Deposit Paywall</h3>
              <X size={18} className="btn-close-modal" onClick={() => setDepositModalOpen(false)} />
            </div>
            
            <form onSubmit={handleDepositSubmit} className="modal-form-body">
              <div className="form-input-block">
                <label>Deposit Amount (USD $)</label>
                <input type="number" placeholder="Enter amount in USD" value={depositForm.amount} onChange={e => setDepositForm({...depositForm, amount: e.target.value})} className="glass-input" required />
              </div>
              
              <div className="form-input-block">
                <label>Payment Channel</label>
                <select value={depositForm.channel} onChange={e => setDepositForm({...depositForm, channel: e.target.value})} className="glass-input">
                  <option value="bKash Mobile Deposit">bKash Mobile Payment (+880)</option>
                  <option value="USDT TRC20 Checkout">USDT Crypto Checkout (TRC20)</option>
                  <option value="Credit Card Gate">Credit / Debit Card Checkout</option>
                </select>
              </div>

              {/* Dynamic instruction overlays based on channel */}
              {depositForm.channel === 'bKash Mobile Deposit' && (
                <div className="deposit-instructions-box" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', fontSize: '11px', border: '1px solid var(--border-color)', marginBottom: '14px', lineHeight: '1.5' }}>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>bKash Mobile instructions:</span>
                  <p>Send Cashout or Send-Money (Equivalent USD rate ৳120/$1) to the official merchant numbers below:</p>
                  <div style={{ margin: '4px 0' }}>bKash Merchant: <strong>+8801700998822</strong></div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '6px' }}>Input your TrxID below to clear transaction.</p>
                  <div className="form-input-block" style={{ marginTop: '10px' }}>
                    <label>Transaction ID (TrxID)</label>
                    <input type="text" placeholder="e.g. TXN102948010" value={depositForm.trxId} onChange={e => setDepositForm({...depositForm, trxId: e.target.value})} className="glass-input" required />
                  </div>
                </div>
              )}

              {depositForm.channel === 'USDT TRC20 Checkout' && (
                <div className="deposit-instructions-box" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', fontSize: '11px', border: '1px solid var(--border-color)', marginBottom: '14px', lineHeight: '1.5' }}>
                  <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>USDT TRC20 Crypto instructions:</span>
                  <p>Transfer exactly the amount to our secure custodian deposit hash address below:</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px', margin: '6px 0', fontFamily: 'monospace' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>TYH872hD83jDksa92kDhS89dKals72HkdS</span>
                    <button type="button" onClick={() => { copyToClipboard("TYH872hD83jDksa92kDhS89dKals72HkdS"); showStatus("Address copied!", "info"); }} style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', cursor: 'pointer', fontSize: '10px' }}>Copy</button>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Submit your Blockchain Tx Hash below for verifying clearance.</p>
                  <div className="form-input-block" style={{ marginTop: '10px' }}>
                    <label>USDT Tx Hash ID</label>
                    <input type="text" placeholder="e.g. 0x8a92d83ab9e984..." value={depositForm.trxId} onChange={e => setDepositForm({...depositForm, trxId: e.target.value})} className="glass-input" required />
                  </div>
                </div>
              )}

              {depositForm.channel === 'Credit Card Gate' && (
                <div className="deposit-instructions-box" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', fontSize: '11px', border: '1px solid var(--border-color)', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', display: 'block' }}>Instant Credit Card processor:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Cardholder Name</label>
                    <input type="text" placeholder="e.g. Shakib Al Hasan" className="glass-input" style={{ padding: '6px', fontSize: '11px' }} required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Card Number</label>
                    <input type="text" placeholder="4000 1234 5678 9010" className="glass-input" style={{ padding: '6px', fontSize: '11px' }} required />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Expiration Date</label>
                      <input type="text" placeholder="MM/YY" className="glass-input" style={{ padding: '6px', fontSize: '11px' }} required />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>CVV Code</label>
                      <input type="password" placeholder="•••" className="glass-input" style={{ padding: '6px', fontSize: '11px' }} required />
                    </div>
                  </div>
                  <input type="hidden" value="CREDIT_CARD_INSTANT" />
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ justifyContent: 'center', width: '100%', marginTop: '5px' }}>
                Complete Paywall checkout
              </button>
            </form>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: WITHDRAWAL DIALOG */}
      {withdrawModalOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content-wrap" style={{ maxWidth: '440px', width: '90%' }}>
            <div className="modal-header-row">
              <h3>Clear Payout Cashout</h3>
              <X size={18} className="btn-close-modal" onClick={() => setWithdrawModalOpen(false)} />
            </div>

            <div className="payout-instructions-box" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', fontSize: '11px', border: '1px solid var(--border-color)', marginBottom: '14px', lineHeight: '1.4' }}>
              <span style={{ color: '#ef4444', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>CASH-OUT CONFIGURATION:</span>
              <div>Minimum Payout: <strong>$5.00 USD</strong></div>
              <div>Standard Clearing Fee: <strong>10% service fee</strong></div>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="modal-form-body">
              <div className="form-input-block">
                <label>Withdrawal Source Wallet</label>
                <select value={withdrawForm.source} onChange={e => setWithdrawForm({...withdrawForm, source: e.target.value})} className="glass-input">
                  <option value="earnings">Daily Earnings Wallet (Avail: ${user ? user.balance.toFixed(2) : '0.00'})</option>
                  <option value="commission">Commission Wallet (Avail: ${user ? user.commission_balance.toFixed(2) : '0.00'})</option>
                </select>
              </div>
              <div className="form-input-block">
                <label>Withdraw Amount (USD $)</label>
                <input type="number" placeholder="Enter amount" value={withdrawForm.amount} onChange={e => setWithdrawForm({...withdrawForm, amount: e.target.value})} className="glass-input" required />
              </div>
              <div className="form-input-block">
                <label>Payout Channel</label>
                <select value={withdrawForm.channel} onChange={e => setWithdrawForm({...withdrawForm, channel: e.target.value})} className="glass-input">
                  <option value="bKash Mobile Payout">bKash Mobile Payout (+880)</option>
                  <option value="Nagad Mobile Payout">Nagad Mobile Payout (+880)</option>
                  <option value="USDT TRC20 Wallet">USDT TRC20 Crypto Wallet</option>
                </select>
              </div>
              <div className="form-input-block">
                <label>Receiver Wallet Account Mobile/Address</label>
                <input type="text" placeholder="e.g. +88017... or TYH..." value={withdrawForm.destination} onChange={e => setWithdrawForm({...withdrawForm, destination: e.target.value})} className="glass-input" required />
              </div>
              <button type="submit" className="btn-primary" style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #ef4444 0%, #ff5252 100%)', color: '#fff' }}>
                Request Clearance Payout
              </button>
            </form>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: MINING ENGINE QUICK ACTION SHEET */}
      {miningModalOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content-wrap" style={{ maxWidth: '800px', width: '95%' }}>
            <div className="modal-header-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '15px' }}>
              <h3>Nexora Manual Daily ROI Sync & Vault</h3>
              <X size={18} className="btn-close-modal" onClick={() => setMiningModalOpen(false)} />
            </div>

            <div className="home-dashboard-grid">
              
              {/* Left Column: Pulsing Harvest central button */}
              <div className="glass-card daily-harvest-hub-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '15px' }}>Manual Energy Harvest Engine</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>Daily ROI yields are not automated. You must tap this central reactor button every 24 hours to sync power payloads and claim earnings.</p>
                </div>

                <div 
                  onClick={!isMining ? harvestAllContracts : null}
                  className={`mining-pulsing-circle ${isMining ? 'active-spinning' : ''}`}
                  style={{ width: '130px', height: '130px', cursor: !isMining ? 'pointer' : 'not-allowed', margin: '15px 0' }}
                >
                  <div className="inner-pulsing-core">
                    <Zap size={40} style={{ color: isMining ? 'var(--accent-gold)' : 'var(--accent-green)' }} />
                    <span style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '6px' }}>
                      {isMining ? `SYNCING ${miningPercent}%` : 'TAP TO HARVEST'}
                    </span>
                  </div>
                </div>

                <div className="turbines-count-row" style={{ display: 'flex', gap: '20px', fontSize: '12.5px' }}>
                  <div>Active Nodes: <strong>{contracts.filter(c => c.status === 'active').length}</strong></div>
                  <div>Claimable today: <strong>
                    {contracts.filter(c => {
                      if (c.status !== 'active') return false;
                      if (!c.last_claimed_at) return true;
                      const lastC = new Date(c.last_claimed_at);
                      const now = new Date();
                      const isSame = lastC.getUTCDate() === now.getUTCDate() &&
                                    lastC.getUTCMonth() === now.getUTCMonth() &&
                                    lastC.getUTCFullYear() === now.getUTCFullYear();
                      return !isSame;
                    }).length}
                  </strong></div>
                </div>
              </div>

              {/* Right Column: Compound lockup Vault */}
              <div className="glass-card compound-vault-stashing-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                <div className="vault-header-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Lock size={18} style={{ color: 'var(--accent-blue)' }} />
                  <h3 style={{ fontSize: '15px' }}>Compound Lockup Vault</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.4' }}>Move daily harvest returns or claimed commission into the locked vault to compound extra fixed rewards.</p>
                
                <form onSubmit={handleVaultLock} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Stash Amount (Available: ${user ? (user.balance + user.commission_balance).toFixed(2) : '0.00'})</label>
                    <input type="number" placeholder="Enter USD amount" value={vaultAmount} onChange={e => setVaultAmount(e.target.value)} className="glass-input" style={{ padding: '10px' }} required />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Lockup Duration Options</label>
                    <div className="vault-duration-selector-row" style={{ display: 'flex', gap: '8px' }}>
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

                  <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '10px' }}>
                    Lock Funds in Vault
                  </button>
                </form>

                {/* Vault locks ledger list */}
                <div className="vault-locks-ledger-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Vault Stashes:</span>
                  {vaultLocks.length === 0 ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>No active vault stashes found.</span>
                  ) : (
                    vaultLocks.map(lock => {
                      const isReleaseReady = new Date() >= new Date(lock.unlock_date);
                      return (
                        <div key={lock.id} className="vault-lock-row-item" style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '11px' }}>
                            <div>Principal: <strong>${lock.amount.toFixed(2)}</strong></div>
                            <div style={{ color: 'var(--accent-green)' }}>Fixed Reward: +${(lock.amount * (lock.bonus_pct / 100)).toFixed(2)} (+{lock.bonus_pct}%)</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '9.5px' }}>Unlock Date: {new Date(lock.unlock_date).toLocaleDateString()}</div>
                          </div>
                          <div>
                            {lock.status === 'unlocked' ? (
                              <span className="badge badge-gray" style={{ fontSize: '9px' }}>CLAIMED</span>
                            ) : isReleaseReady ? (
                              <button onClick={() => handleVaultUnlock(lock.id)} className="vault-release-btn-claim" style={{ fontSize: '9px', padding: '3px 6px' }}>Unlock & Claim</button>
                            ) : (
                              <span className="badge badge-blue" style={{ fontSize: '9px' }}>LOCKED</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
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
                          {t.type === 'deposit' || t.type === 'referral_comm' || t.type === 'claim' || t.type === 'claim_commission' || t.type === 'vault_unlock' ? '+' : '-'}${t.amount.toFixed(2)}
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
            <button className="btn-primary" onClick={() => setShowAboutModal(false)} style={{ marginTop: '15px', width: '100%', justifyContent: 'center' }}>Close Info</button>
          </div>
        </div>
      )}

      {/* PARTNERSHIP MODAL (USD) */}
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
                <div>• <strong>Bronze Leader</strong>: Invite 10 active direct downlines. Salary: <strong>$100.00 / month</strong>.</div>
                <div>• <strong>Silver Leader</strong>: Invite 30 active direct downlines. Salary: <strong>$300.00 / month</strong>.</div>
                <div>• <strong>Gold Leader</strong>: Invite 80 active direct downlines. Salary: <strong>$600.00 / month</strong>.</div>
                <div>• <strong>Diamond Leader</strong>: Invite 150 active direct downlines. Salary: <strong>$1,000.00 / month</strong>.</div>
              </div>
              <p>All monthly salaries are distributed manually by clearing desks on the 1st of every calendar month. Downline nodes must have at least one active infrastructure lease contract.</p>
            </div>
            <button className="btn-primary" onClick={() => setShowPartnershipModal(false)} style={{ marginTop: '15px', width: '100%', justifyContent: 'center' }}>Accept Terms</button>
          </div>
        </div>
      )}

      {/* SUPPORT DESK MODAL */}
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
            <button className="btn-primary" onClick={() => setShowSupportModal(false)} style={{ marginTop: '15px', width: '100%', justifyContent: 'center' }}>Close Support</button>
          </div>
        </div>
      )}

      {/* HARD LOCK EXCEPTION MODAL (Frozen Wallet Warning) */}
      {showFrozenWalletModal && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content-wrap" style={{ border: '2px solid #ef4444', background: 'radial-gradient(circle at 10% 10%, rgba(239, 68, 68, 0.08) 0%, rgba(12, 15, 29, 0.98) 90%)' }}>
            <div className="modal-header-row">
              <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={20} /> Withdrawal Operation Aborted</h3>
              <X size={18} className="btn-close-modal" onClick={() => setShowFrozenWalletModal(false)} />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '10px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontWeight: 'bold' }}>
                Task Wallet balance is currently frozen.
              </p>
              <p style={{ color: 'var(--text-muted)' }}>
                To permanently activate withdrawals, your account must possess at least one running Tier 1 ($10) or higher active investment project.
              </p>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Required Action:</span>
                <p style={{ fontSize: '12px', color: 'var(--accent-gold)', marginTop: '4px', fontWeight: '500' }}>Activate Nexora Eco-Mini Grid ($10.00 USD) or higher package to instantly unfreeze your task balances.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={() => {
                  setShowFrozenWalletModal(false);
                  setActiveTab('invest');
                }} 
                className="btn-primary" 
                style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-gold) 0%, #ff8f00 100%)', color: '#000' }}
              >
                Go to Project Shop
              </button>
              <button 
                onClick={() => setShowFrozenWalletModal(false)} 
                className="btn-secondary" 
                style={{ flex: 1 }}
              >
                Close Warning
              </button>
            </div>
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
