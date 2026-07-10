import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, Shield, Cpu, Layers, Users, ArrowUpRight, ArrowDownLeft, Lock,
  Unlock, Send, RefreshCw, CheckCircle2, AlertTriangle, Plus, Copy,
  Check, X, Award, Handshake, Info, Headphones, Settings, User,
  FileText, Mail, LogOut, Share2, ShieldAlert, Upload, CheckSquare, List,
  Clock, Trash2, Leaf, House, Sun, Droplet, Wind, WavesHorizontal, Flame,
  Server, Gem, Globe, ListFilter, DollarSign, TrendingUp, Calendar, Wallet
} from 'lucide-react';

import energyBanner from './assets/energy_banner.png';
import refineryBanner from './assets/refinery_banner.png';
import metalsBanner from './assets/metals_banner.png';
import taskSolarImg from './assets/task_solar.png';
import taskWindImg from './assets/task_wind.png';
import taskHydroImg from './assets/task_hydro.png';

const API_BASE = '/api';

// Sticky 5-Tab Navigation Items
const bottomNavItems = [
  { id: 'dashboard', label: 'Home', icon: House },
  { id: 'invest', label: 'Projects', icon: Layers },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'me', label: 'Me', icon: User }
];

// Category icon per project tier, keyed by LEASE_PROJECTS id
const PROJECT_CATEGORY_ICONS = {
  eco_mini: Leaf,
  smart_home: House,
  solar_hub: Sun,
  agro_pump: Droplet,
  wind_farm: Wind,
  hydro_plant: WavesHorizontal,
  biomass_plant: Flame,
  data_center: Server,
  gold_reserve: Gem,
  energy_matrix: Globe
};

export default function App() {
  // Global States
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nex_token') || null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('nex_admin_token') || null);
  const [adminData, setAdminData] = useState(null);
  const [adminTaskSubmissions, setAdminTaskSubmissions] = useState([]);
  
  // Admin-specific States for Modern Dashboard
  const [adminActiveTab, setAdminActiveTab] = useState('task-control');
  const [taskConfigs, setTaskConfigs] = useState([]);
  const [labourLogs, setLabourLogs] = useState([]);
  const [isTaskMenuExpanded, setIsTaskMenuExpanded] = useState(true);
  const [configsState, setConfigsState] = useState([]);
  const [liveUTC, setLiveUTC] = useState("");

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
  const [adminForm, setAdminForm] = useState({ username: 'admin', password: 'admin123' });
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

  // User Tasks tab states
  const [taskSubTab, setTaskSubTab] = useState('in-progress');
  const [runningTasks, setRunningTasks] = useState({});
  const [dailyTasks, setDailyTasks] = useState({ incomplete: [], completed: [] });
  const [countdownTask, setCountdownTask] = useState(null);
  const [countdownSeconds, setCountdownSeconds] = useState(5);

  // Live Lists
  const [contracts, setContracts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [vaultLocks, setVaultLocks] = useState([]);
  const [telegramFeed, setTelegramFeed] = useState([]);
  const [investmentPackages, setInvestmentPackages] = useState([]);
  const [adminPackages, setAdminPackages] = useState([]);
  const [adminInvestments, setAdminInvestments] = useState([]);
  const [packageForm, setPackageForm] = useState({
    id: '',
    name: '',
    price: '',
    daily_return: '',
    total_return: '',
    price_bdt: '',
    daily_return_bdt: '',
    lock_days: '180',
    graphic_type: '',
    description: ''
  });

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
      fetchDailyTasks();
      setLandingMode(false);
    } else {
      setUser(null);
      setContracts([]);
      setTransactions([]);
      setVaultLocks([]);
      setDailyTasks({ incomplete: [], completed: [] });
    }
  }, [token]);

  useEffect(() => {
    if (adminToken) {
      setIsAdmin(true);
      fetchAdminData();
      fetchAdminTaskSubmissions();
      fetchTaskConfigs();
      fetchLabourLogs();
      fetchAdminPackages();
      fetchAdminInvestments();
    } else {
      setIsAdmin(false);
      setAdminData(null);
      setAdminTaskSubmissions([]);
      setTaskConfigs([]);
      setLabourLogs([]);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchInvestmentPackages();
  }, []);

  useEffect(() => {
    setConfigsState(taskConfigs);
  }, [taskConfigs]);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const pad = (n, l=2) => String(n).padStart(l, '0');
      const year = d.getUTCFullYear();
      const month = pad(d.getUTCMonth() + 1);
      const date = pad(d.getUTCDate());
      const hours = pad(d.getUTCHours());
      const minutes = pad(d.getUTCMinutes());
      const seconds = pad(d.getUTCSeconds());
      const ms = pad(d.getUTCMilliseconds(), 3);
      const us = pad(Math.floor(Math.random() * 1000), 3);
      setLiveUTC(`${year}-${month}-${date} ${hours}:${minutes}:${seconds}.${ms}${us}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const showStatus = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 5000);
  };

  const fetchInvestmentPackages = async () => {
    try {
      const res = await fetch(`${API_BASE}/invest/packages`);
      const data = await res.json();
      if (res.ok) {
        setInvestmentPackages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminPackages = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/packages`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAdminPackages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminInvestments = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/investments`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAdminInvestments(data);
      }
    } catch (err) {
      console.error(err);
    }
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

  const fetchDailyTasks = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDailyTasks(data);
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

  const fetchTaskConfigs = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/task-configurations`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTaskConfigs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLabourLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/labour-logs`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLabourLogs(data);
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

  const handleSavePackage = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/packages/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          ...packageForm,
          price: Number(packageForm.price || 0),
          daily_return: Number(packageForm.daily_return || 0),
          total_return: Number(packageForm.total_return || 0),
          price_bdt: Number(packageForm.price_bdt || 0),
          daily_return_bdt: Number(packageForm.daily_return_bdt || 0),
          lock_days: Number(packageForm.lock_days || 180)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showStatus(data.message);
      setPackageForm({ id: '', name: '', price: '', daily_return: '', total_return: '', price_bdt: '', daily_return_bdt: '', lock_days: '180', graphic_type: '', description: '' });
      fetchAdminPackages();
      fetchInvestmentPackages();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleEditPackage = (pkg) => {
    setPackageForm({
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      daily_return: pkg.daily_return,
      total_return: pkg.total_return,
      price_bdt: pkg.price_bdt,
      daily_return_bdt: pkg.daily_return_bdt,
      lock_days: pkg.lock_days,
      graphic_type: pkg.graphic_type,
      description: pkg.description
    });
  };

  const handleDeletePackage = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/packages/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showStatus(data.message);
      fetchAdminPackages();
      fetchInvestmentPackages();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleTerminateContract = async (contractId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/investments/terminate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ contractId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showStatus(data.message);
      fetchAdminInvestments();
    } catch (err) {
      showStatus(err.message, 'error');
    }
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

  // Perform Daily Contract Grid Task Simulation (5-Second countdown + api claims)
  const handleRunTask = (task) => {
    setCountdownTask(task);
    setCountdownSeconds(5);
    
    const interval = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          executeTaskCompletion(task.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const executeTaskCompletion = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ taskId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(data.message, 'success');
      fetchUserProfile();
      fetchDailyTasks();
      fetchUserTxHistory();
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      setCountdownTask(null);
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

  const handleToggleFreeze = async (phone) => {
    try {
      const res = await fetch(`${API_BASE}/admin/labour-logs/toggle-freeze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(data.message);
      fetchLabourLogs();
      fetchAdminData();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleForceReset = async (logId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/labour-logs/reset`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ logId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(data.message);
      fetchLabourLogs();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleResetUserCounters = async (phone) => {
    try {
      const res = await fetch(`${API_BASE}/admin/tasks/reset-user`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(data.message);
      fetchLabourLogs();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleGlobalTasksReset = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/tasks/global-reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(data.message);
      fetchLabourLogs();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleSaveConfig = async (config) => {
    try {
      const res = await fetch(`${API_BASE}/admin/task-configurations/save`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(data.message);
      fetchTaskConfigs();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleDeleteConfig = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/task-configurations/delete/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${adminToken}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showStatus(data.message);
      fetchTaskConfigs();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleAddNewTier = () => {
    const nextTierId = configsState.length > 0 ? Math.max(...configsState.map(c => c.tier_id || 0)) + 1 : 0;
    setConfigsState([
      ...configsState,
      {
        id: null,
        tier_id: nextTierId,
        display_name: `New Tier ${nextTierId}`,
        payout: 10.00,
        animation_delay: 5,
        graphic_asset: "battery_storage.glb"
      }
    ]);
  };

  const handleUpdateConfigLocal = (index, field, value) => {
    const updated = [...configsState];
    updated[index] = { ...updated[index], [field]: value };
    setConfigsState(updated);
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
    { id: 'free_starter', name: 'Free Starter Pack', description: 'Unlocked by default on new registration. Earn through active free tasks.', price: 0, dailyProfit: 0, duration: 180, totalProfit: 36, priceBdt: 0, dailyProfitBdt: 0, bgGradient: 'linear-gradient(135deg, #0f766e 0%, #06b6d4 100%)', category: 'FREE STARTER', graphicType: 'book' },
    { id: 'eco_mini', name: 'Eco-Mini Grid', description: 'Single residential solar cell module generating passive base-grid yields.', price: 10, dailyProfit: 0.25, duration: 180, totalProfit: 135, priceBdt: 1200, dailyProfitBdt: 30, bgGradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', category: 'ECO MINI POWER', graphicType: 'solar' },
    { id: 'smart_home', name: 'Smart Home Grid', description: 'Isometric smart house layout with wireless blue pulse ripple energy grid.', price: 30, dailyProfit: 0.75, duration: 180, totalProfit: 270, priceBdt: 3600, dailyProfitBdt: 90, bgGradient: 'linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)', category: 'SMART SOLAR HOME', graphicType: 'house' },
    { id: 'solar_hub', name: 'Solar Community Hub', description: 'Public interconnected micro-grid arrays powering community energy hubs.', price: 70, dailyProfit: 1.70, duration: 180, totalProfit: 630, priceBdt: 8400, dailyProfitBdt: 204, bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', category: 'COMMUNITY SOLAR', graphicType: 'community' },
    { id: 'agro_pump', name: 'Agro-Solar Pump', description: 'Automated water pump integrated with modular solar wings for agriculture.', price: 100, dailyProfit: 2.50, duration: 180, totalProfit: 900, priceBdt: 12000, dailyProfitBdt: 300, bgGradient: 'linear-gradient(135deg, #22d3ee 0%, #2563eb 100%)', category: 'AGRO WATER NODE', graphicType: 'pump' },
    { id: 'wind_farm', name: 'Wind Farm Asset', description: 'Modern high-poly rotating wind turbines generating clean offshore yields.', price: 300, dailyProfit: 7.50, duration: 180, totalProfit: 2700, priceBdt: 36000, dailyProfitBdt: 900, bgGradient: 'linear-gradient(135deg, #facc15 0%, #f97316 100%)', category: 'WIND UTILITY', graphicType: 'wind' },
    { id: 'hydro_plant', name: 'Industrial Hydro-Plant', description: 'Water dam mechanical terminal pulsating with neon blue energy vectors.', price: 700, dailyProfit: 17.50, duration: 180, totalProfit: 6300, priceBdt: 84000, dailyProfitBdt: 2100, bgGradient: 'linear-gradient(135deg, #2dd4bf 0%, #f59e0b 100%)', category: 'HYDRO BASELINE', graphicType: 'hydro' },
    { id: 'biomass_plant', name: 'Biomass Power Plant', description: 'Bio-refinery silo recycling radiant fluid particles to generate power.', price: 1000, dailyProfit: 25.00, duration: 180, totalProfit: 9900, priceBdt: 120000, dailyProfitBdt: 3000, bgGradient: 'linear-gradient(135deg, #38bdf8 0%, #ef4444 100%)', category: 'BIOMASS NODE', graphicType: 'biomass' },
    { id: 'data_center', name: 'Green Data Center', description: 'High-tech mainframe server chassis layered with bright cooling tubes.', price: 5000, dailyProfit: 125.00, duration: 180, totalProfit: 48600, priceBdt: 600000, dailyProfitBdt: 15000, bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #f59e0b 100%)', category: 'CLOUD DATA CENTER', graphicType: 'server' },
    { id: 'gold_reserve', name: 'Gold Refinery Reserve', description: 'Highly glossed solid bullion gold bars arranged on a circuit refinery pattern.', price: 10000, dailyProfit: 250.00, duration: 180, totalProfit: 102600, priceBdt: 1200000, dailyProfitBdt: 30000, bgGradient: 'linear-gradient(135deg, #fbbf24 0%, #10b981 100%)', category: 'CUSTODIAL GOLD', graphicType: 'gold' }
  ];

  const projectGradientMap = Object.fromEntries(LEASE_PROJECTS.map(project => [project.id, project.bgGradient]));
  const projectCatalog = investmentPackages.length > 0 ? investmentPackages.map(pkg => ({
    id: pkg.id,
    name: pkg.name,
    description: pkg.description || 'Sustainable infrastructure opportunity',
    price: Number(pkg.price || 0),
    dailyProfit: Number(pkg.daily_return || 0),
    duration: Number(pkg.lock_days || 180),
    totalProfit: Number(pkg.total_return || 0),
    priceBdt: Number(pkg.price_bdt || 0),
    dailyProfitBdt: Number(pkg.daily_return_bdt || 0),
    bgGradient: projectGradientMap[pkg.id] || 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
    category: (pkg.name || 'INFRASTRUCTURE').toUpperCase(),
    graphicType: pkg.graphic_type || 'globe'
  })) : LEASE_PROJECTS;

  const getGraphicIcon = (graphicType = '') => {
    const iconMap = {
      book: Leaf,
      solar: Sun,
      house: House,
      community: Sun,
      pump: Droplet,
      wind: Wind,
      hydro: WavesHorizontal,
      biomass: Flame,
      server: Server,
      gold: Gem,
      globe: Globe
    };
    return iconMap[graphicType] || Globe;
  };

  const renderProjectVisual = (project) => {
    const Icon = getGraphicIcon(project.graphicType || project.graphic_type || 'globe');
    return (
      <div className="project-hero-visual" style={{ background: project.bgGradient }}>
        <div className="project-hero-glow"></div>
        <Icon size={44} strokeWidth={1.3} className="project-hero-icon" />
      </div>
    );
  };

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

  const renderTickerBar = () => {
    return (
      <div className="ticker-top-bar">
        <div className="ticker-top-left">
          <div className="live-dot" />
          <span className="ticker-live-txt">
            NEXORA SECURE NETWORK STATUS: ONLINE | SERVER LATENCY: 42ms | SYSTEM YIELD RATE: +12.4% APY
          </span>
        </div>
        {isAdmin ? (
          <div className="admin-status-pill" onClick={handleAdminLogout}>
            <Shield size={12} />
            <span>Admin Active - Sign Out</span>
          </div>
        ) : (
          <div className="admin-status-pill" onClick={() => setShowAdminLogin(true)}>
            <ShieldAlert size={12} />
            <span>Admin Portal Gateway</span>
          </div>
        )}
      </div>
    );
  };

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
          <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
              <div className="admin-sidebar-brand">
                <Cpu size={20} style={{ color: 'var(--accent-blue)' }} />
                <div>
                  <h3>PROJECT ADMIN PANEL</h3>
                  <span style={{ fontSize: '10px', color: '#6b7280' }}>BACKEND CONTROL INTERFACE</span>
                </div>
              </div>
              <div className="admin-sidebar-menu">
                <span style={{ fontSize: '10px', color: '#4b5563', fontWeight: 'bold', padding: '10px 14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Main Navigation</span>
                
                <div className={`admin-menu-item ${adminActiveTab === 'dashboard' ? 'active' : ''}`} onClick={() => setAdminActiveTab('dashboard')}>
                  <Cpu size={16} />
                  <span>Dashboard</span>
                </div>
                
                <div className={`admin-menu-item ${adminActiveTab === 'user-management' ? 'active' : ''}`} onClick={() => setAdminActiveTab('user-management')}>
                  <Users size={16} />
                  <span>User Management</span>
                </div>

                <div className={`admin-menu-item ${adminActiveTab === 'subscription-management' ? 'active' : ''}`} onClick={() => setAdminActiveTab('subscription-management')}>
                  <Layers size={16} />
                  <span>Subscription Management</span>
                </div>

                <div className="admin-menu-group">
                  <div className="admin-menu-item" onClick={() => setIsTaskMenuExpanded(!isTaskMenuExpanded)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Award size={16} />
                      <span>Task Module</span>
                    </div>
                    <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: isTaskMenuExpanded ? 'rotate(90deg)' : 'none' }}>▶</span>
                  </div>
                  {isTaskMenuExpanded && (
                    <div className="admin-submenu">
                      <div className={`admin-submenu-item ${adminActiveTab === 'task-overview' ? 'active' : ''}`} onClick={() => setAdminActiveTab('task-overview')}>
                        <span>1. Task Overview</span>
                      </div>
                      <div className={`admin-submenu-item ${adminActiveTab === 'task-analytics' ? 'active' : ''}`} onClick={() => setAdminActiveTab('task-analytics')}>
                        <span>2. Task Analytics</span>
                      </div>
                      <div className={`admin-submenu-item ${adminActiveTab === 'task-control' ? 'active' : ''}`} onClick={() => setAdminActiveTab('task-control')}>
                        <span>3. Task Control</span>
                      </div>
                      <div className={`admin-submenu-item ${adminActiveTab === 'task-logs' ? 'active' : ''}`} onClick={() => setAdminActiveTab('task-logs')}>
                        <span>4. Task Logs</span>
                      </div>
                      <div className={`admin-submenu-item ${adminActiveTab === 'task-payouts' ? 'active' : ''}`} onClick={() => setAdminActiveTab('task-payouts')}>
                        <span>5. Task Payouts</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`admin-menu-item ${adminActiveTab === 'finance-payouts' ? 'active' : ''}`} onClick={() => setAdminActiveTab('finance-payouts')}>
                  <ArrowDownLeft size={16} />
                  <span>Finance & Payouts</span>
                </div>

                <div className={`admin-menu-item ${adminActiveTab === 'system-settings' ? 'active' : ''}`} onClick={() => setAdminActiveTab('system-settings')}>
                  <Settings size={16} />
                  <span>System Settings</span>
                </div>

                <div className={`admin-menu-item ${adminActiveTab === 'audit-logs' ? 'active' : ''}`} onClick={() => setAdminActiveTab('audit-logs')}>
                  <ShieldAlert size={16} />
                  <span>Audit Logs</span>
                </div>

                <div className={`admin-menu-item ${adminActiveTab === 'support-center' ? 'active' : ''}`} onClick={() => setAdminActiveTab('support-center')}>
                  <Headphones size={16} />
                  <span>Support Center</span>
                </div>
              </div>
              
              <div className="admin-sidebar-footer">
                <Cpu size={16} style={{ color: 'var(--accent-blue)', marginRight: '8px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '10px', color: '#9ca3af' }}>SYSTEM VERSION</strong>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>v2.4.7-build.20250510</div>
                </div>
              </div>
            </aside>

            {/* Main Area */}
            <main className="admin-main">
              {/* Header */}
              <header className="admin-header">
                <div className="admin-header-title">
                  <h2>{adminActiveTab === 'task-control' ? 'Task Control Dashboard (Backend)' : adminActiveTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h2>
                  <span style={{ fontSize: '11.5px', color: '#6b7280' }}>Dashboard / Task Module / {adminActiveTab === 'task-control' ? 'Control Center' : adminActiveTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                </div>
                
                <div className="admin-header-actions">
                  <div className="admin-status-indicator">
                    <span className="admin-status-dot"></span>
                    <span>SERVER STATUS: <strong style={{ color: 'var(--accent-green)' }}>ONLINE</strong></span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#9ca3af', fontFamily: 'monospace' }}>
                    <Clock size={12} />
                    <span>SERVER TIME (UTC): <strong>{liveUTC || 'Loading...'}</strong></span>
                  </div>

                  <div className="admin-profile-badge" onClick={handleAdminLogout}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#2979ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>SA</div>
                    <span>Super Admin</span>
                  </div>
                </div>
              </header>

              {/* Main Content */}
              {adminData ? (
                <div className="admin-content">
                  
                  {/* Stats Row */}
                  {(adminActiveTab === 'task-control' || adminActiveTab === 'dashboard') && (
                    <div className="admin-stats-grid">
                      <div className="admin-stat-card">
                        <div className="admin-stat-info">
                          <span className="admin-stat-label">Total Global Tasks Executed Today</span>
                          <strong className="admin-stat-value">{(128732 + (labourLogs.length || 0)).toLocaleString()}</strong>
                          <span className="admin-stat-trend up">
                            ▲ 12.45% vs yesterday
                          </span>
                        </div>
                        <div className="admin-stat-icon-wrapper" style={{ background: 'rgba(41, 121, 255, 0.1)', color: 'var(--accent-blue)' }}>
                          <CheckSquare size={20} />
                        </div>
                      </div>

                      <div className="admin-stat-card">
                        <div className="admin-stat-info">
                          <span className="admin-stat-label">Total Task Payout Disbursed</span>
                          <strong className="admin-stat-value">${(1283456.78 + (adminData.users.reduce((acc, u) => acc + u.commission_balance, 0) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                          <span className="admin-stat-trend up">
                            ▲ 8.22% vs yesterday
                          </span>
                        </div>
                        <div className="admin-stat-icon-wrapper" style={{ background: 'rgba(255, 215, 0, 0.1)', color: 'var(--accent-gold)' }}>
                          <Layers size={20} />
                        </div>
                      </div>

                      <div className="admin-stat-card">
                        <div className="admin-stat-info">
                          <span className="admin-stat-label">Active Workers Online (24H)</span>
                          <strong className="admin-stat-value">{(2847 + adminData.users.length).toLocaleString()}</strong>
                          <span className="admin-stat-trend up">
                            ▲ 5.31% vs yesterday
                          </span>
                        </div>
                        <div className="admin-stat-icon-wrapper" style={{ background: 'rgba(0, 230, 118, 0.1)', color: 'var(--accent-green)' }}>
                          <Users size={20} />
                        </div>
                      </div>

                      <div className="admin-stat-card">
                        <div className="admin-stat-info">
                          <span className="admin-stat-label">Pending Engine Cron Reset</span>
                          <strong className="admin-stat-value" style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
                            {(() => {
                              const now = new Date();
                              const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
                              const diff = midnight - now;
                              const secsTotal = Math.max(0, Math.floor(diff / 1000));
                              const h = Math.floor(secsTotal / 3600);
                              const m = Math.floor((secsTotal % 3600) / 60);
                              const s = secsTotal % 60;
                              const pad = (n) => String(n).padStart(2, '0');
                              return `${pad(h)} : ${pad(m)} : ${pad(s)}`;
                            })()}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Until Server Reset (00:00 UTC)</span>
                        </div>
                        <div className="admin-stat-icon-wrapper" style={{ background: 'rgba(41, 121, 255, 0.1)', color: 'var(--accent-blue)' }}>
                          <Clock size={20} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Panel Views */}
                  {adminActiveTab === 'task-control' && (
                    <>
                      {/* TASK ENGINE CONFIGURATIONS */}
                      <div className="admin-panel-card">
                        <div className="admin-panel-header">
                          <span className="admin-panel-title">TASK ENGINE MANAGEMENT (TaskConfiguration)</span>
                          <button className="admin-btn admin-btn-primary" onClick={handleAddNewTier}>
                            <Plus size={14} style={{ marginRight: '4px' }} /> Add New Tier
                          </button>
                        </div>
                        <div className="admin-table-container">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Tier ID</th>
                                <th>Task Display Name</th>
                                <th>Micro-Payout (USD)</th>
                                <th>Animation Delay (Sec)</th>
                                <th>UI Graphic Asset</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {configsState.length === 0 ? (
                                <tr>
                                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No task configurations found. Add one above.</td>
                                </tr>
                              ) : (
                                configsState.map((config, index) => (
                                  <tr key={config.id || `new-${index}`}>
                                    <td>
                                      <select 
                                        value={config.tier_id} 
                                        onChange={e => handleUpdateConfigLocal(index, 'tier_id', parseInt(e.target.value))}
                                        className="admin-input-dark"
                                        style={{ width: '80px' }}
                                      >
                                        {[0,1,2,3,4,5,6,7,8,9,10].map(v => (
                                          <option key={v} value={v}>Tier {v}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td>
                                      <input 
                                        type="text" 
                                        value={config.display_name} 
                                        onChange={e => handleUpdateConfigLocal(index, 'display_name', e.target.value)}
                                        className="admin-input-dark"
                                      />
                                    </td>
                                    <td>
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        value={config.payout} 
                                        onChange={e => handleUpdateConfigLocal(index, 'payout', parseFloat(e.target.value))}
                                        className="admin-input-dark"
                                        style={{ width: '100px' }}
                                      />
                                    </td>
                                    <td>
                                      <input 
                                        type="number" 
                                        value={config.animation_delay} 
                                        onChange={e => handleUpdateConfigLocal(index, 'animation_delay', parseInt(e.target.value))}
                                        className="admin-input-dark"
                                        style={{ width: '80px' }}
                                      />
                                    </td>
                                    <td>
                                      <select 
                                        value={config.graphic_asset} 
                                        onChange={e => handleUpdateConfigLocal(index, 'graphic_asset', e.target.value)}
                                        className="admin-input-dark"
                                        style={{ width: '220px' }}
                                      >
                                        <option value="eco_grid_order.glb">eco_grid_order.glb</option>
                                        <option value="wind_turbine.glb">wind_turbine.glb</option>
                                        <option value="hydro_flow.glb">hydro_flow.glb</option>
                                        <option value="solar_panel_array.glb">solar_panel_array.glb</option>
                                        <option value="battery_storage.glb">battery_storage.glb</option>
                                        <option value="biofuel_processor.glb">biofuel_processor.glb</option>
                                      </select>
                                    </td>
                                    <td>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="admin-btn admin-btn-success" onClick={() => handleSaveConfig(config)}>
                                          Save
                                        </button>
                                        <button className="admin-btn admin-btn-danger" onClick={() => {
                                          if (config.id) {
                                            handleDeleteConfig(config.id);
                                          } else {
                                            setConfigsState(configsState.filter((_, i) => i !== index));
                                          }
                                        }}>
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="admin-table-footer">
                          <span>Show 10 entries</span>
                          <span>Showing 1 to {configsState.length} of {configsState.length} entries</span>
                          <div className="admin-pagination">
                            <button className="admin-pagination-btn" disabled>◀</button>
                            <button className="admin-pagination-btn active">1</button>
                            <button className="admin-pagination-btn" disabled>▶</button>
                          </div>
                        </div>
                      </div>

                      {/* LABOUR LOG MATRIX */}
                      <div className="admin-panel-card">
                        <div className="admin-panel-header">
                          <span className="admin-panel-title">REAL-TIME LABOUR LOG MATRIX (Live User Task Execution Logs)</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="admin-btn admin-btn-danger" onClick={handleGlobalTasksReset} style={{ background: 'var(--accent-red)', fontWeight: 'bold' }}>
                              FORCE MANUALLY RESET GLOBAL DAILY TASKS
                            </button>
                            <button className="admin-btn admin-btn-primary" onClick={fetchLabourLogs} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <RefreshCw size={12} style={{ marginRight: '4px' }} /> Refresh
                            </button>
                            <button className="admin-btn admin-btn-primary" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                              Filter ▼
                            </button>
                          </div>
                        </div>
                        <div className="admin-table-container">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Account Handler (Phone)</th>
                                <th>Assigned Subscription Tier</th>
                                <th>Task Instance</th>
                                <th>Execution Status</th>
                                <th>Timestamp (Microsecond)</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {labourLogs.length === 0 ? (
                                <tr>
                                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No live task execution logs found.</td>
                                </tr>
                              ) : (
                                labourLogs.map(log => (
                                  <tr key={log.id}>
                                    <td style={{ fontWeight: 'bold' }}>{log.phone}</td>
                                    <td>{log.tier_name}</td>
                                    <td>{log.task_instance}</td>
                                    <td>
                                      <span className={`admin-badge ${log.status === 'Successfully Processed' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                                        {log.status}
                                      </span>
                                    </td>
                                    <td style={{ fontFamily: 'monospace' }}>{log.timestamp}</td>
                                    <td>
                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button className="admin-btn admin-btn-warning" onClick={() => handleForceReset(log.id)}>
                                          Force Manual Reset
                                        </button>
                                        <button className="admin-btn admin-btn-primary" style={{ background: 'var(--accent-cyan)', color: '#000' }} onClick={() => handleResetUserCounters(log.phone)}>
                                          Force Reset Counters
                                        </button>
                                        <button 
                                          className={`admin-btn ${log.user_status === 'frozen' ? 'admin-btn-success' : 'admin-btn-danger'}`} 
                                          onClick={() => handleToggleFreeze(log.phone)}
                                        >
                                          {log.user_status === 'frozen' ? 'Unfreeze Payouts' : 'Freeze Task Payouts'}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="admin-table-footer">
                          <span>Show 10 entries</span>
                          <span>Showing 1 to {labourLogs.length} of {labourLogs.length} entries</span>
                          <div className="admin-pagination">
                            <button className="admin-pagination-btn" disabled>◀ Previous</button>
                            <button className="admin-pagination-btn active">1</button>
                            <button className="admin-pagination-btn">2</button>
                            <button className="admin-pagination-btn">3</button>
                            <button className="admin-pagination-btn">4</button>
                            <button className="admin-pagination-btn">5</button>
                            <span>...</span>
                            <button className="admin-pagination-btn">1288</button>
                            <button className="admin-pagination-btn">Next ▶</button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {adminActiveTab === 'dashboard' && (
                    <div className="admin-panel-card" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '12px' }}>System Health Telemetry</h3>
                      <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.5' }}>Welcome to the Nexora Admin Operations Deck. Choose a menu sub-section on the left to configure settings, review proofs, clear withdrawals queues, or adjust user balances.</p>
                      
                      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: '24px', gap: '16px' }}>
                        <div style={{ background: '#05070c', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' }}>Approved Deposits</span>
                          <h3 style={{ fontSize: '20px', color: 'var(--accent-green)', marginTop: '6px' }}>${adminData.summary.depositsVolume.toLocaleString()}</h3>
                        </div>
                        <div style={{ background: '#05070c', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' }}>Disbursed Withdrawals</span>
                          <h3 style={{ fontSize: '20px', color: 'var(--accent-blue)', marginTop: '6px' }}>${adminData.summary.withdrawalsVolume.toLocaleString()}</h3>
                        </div>
                      </div>
                    </div>
                  )}

                  {adminActiveTab === 'user-management' && (
                    <div className="admin-panel-card">
                      <div className="admin-panel-header">
                        <span className="admin-panel-title">CLIENT REGISTRY ACCOUNTS MANAGEMENT & FREEZING DESK</span>
                      </div>
                      <div className="admin-table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Phone</th>
                              <th>IP Node</th>
                              <th>Total Bal</th>
                              <th>Deposit Bal</th>
                              <th>Comm Bal</th>
                              <th>Status</th>
                              <th>Adjust Ledger / Freezing Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminData.users.map(u => (
                              <tr key={u.id}>
                                <td><strong>{u.phone}</strong></td>
                                <td style={{ color: '#777' }}>{u.created_ip || '127.0.0.1'}</td>
                                <td style={{ fontWeight: 'bold' }}>${u.total_balance.toFixed(2)}</td>
                                <td style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>${u.deposit_balance.toFixed(2)}</td>
                                <td style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>${u.commission_balance.toFixed(2)}</td>
                                <td>
                                  <span className={`admin-badge ${u.status === 'frozen' ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                                    {u.status}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input 
                                      type="number" 
                                      placeholder="Set Total Bal"
                                      onBlur={(e) => {
                                        if (e.target.value !== '') adminEditUserBalance(u.id, e.target.value);
                                      }} 
                                      className="admin-input-dark"
                                      style={{ width: '120px' }}
                                    />
                                    <button 
                                      onClick={() => adminToggleUserFreeze(u.id, u.status)} 
                                      className={`admin-btn ${u.status === 'frozen' ? 'admin-btn-success' : 'admin-btn-danger'}`}
                                      style={{ fontWeight: 'bold' }}
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
                  )}

                  {adminActiveTab === 'finance-payouts' && (
                    <div className="admin-panel-card">
                      <div className="admin-panel-header">
                        <span className="admin-panel-title">PENDING DEPOSITS & WITHDRAWALS ACTIONS CLEARING QUEUE</span>
                      </div>
                      <div className="admin-table-container">
                        <table className="admin-table">
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
                                <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>Deposit/Withdrawal clearing queue is empty.</td>
                              </tr>
                            ) : (
                              adminData.pendingTransactions.map(tx => (
                                <tr key={tx.id}>
                                  <td><strong>{tx.phone}</strong></td>
                                  <td>
                                    <span className={`admin-badge ${tx.type === 'deposit' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                                      {tx.type}
                                    </span>
                                  </td>
                                  <td style={{ fontWeight: 'bold' }}>${tx.amount.toFixed(2)}</td>
                                  <td>{tx.channel}</td>
                                  <td style={{ fontFamily: 'monospace' }}>{tx.trx_id || tx.details}</td>
                                  <td>{new Date(tx.created_at).toLocaleString()}</td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button onClick={() => adminApproveTx(tx.id)} className="admin-btn admin-btn-success">Approve</button>
                                      <button onClick={() => adminRejectTx(tx.id)} className="admin-btn admin-btn-danger">Reject</button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {adminActiveTab === 'task-logs' && (
                    <div className="admin-panel-card">
                      <div className="admin-panel-header">
                        <span className="admin-panel-title">SELECT TASK PROOF SUBMISSIONS TO APPROVE / REJECT</span>
                      </div>
                      <div className="admin-table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>User ID (Phone)</th>
                              <th>Lessor Tier Level</th>
                              <th>Task Name</th>
                              <th>View Proof Link</th>
                              <th>Date Submitted</th>
                              <th>Clearance Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminTaskSubmissions.length === 0 ? (
                              <tr>
                                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No task proof submissions registered.</td>
                              </tr>
                            ) : (
                              adminTaskSubmissions.map(ts => (
                                <tr key={ts.id}>
                                  <td><strong>{ts.phone}</strong></td>
                                  <td>VIP {ts.vip_level}</td>
                                  <td>{ts.task_name}</td>
                                  <td>
                                    {ts.proof_image ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                        <a href={ts.proof_image} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>
                                          Open Proof Image File
                                        </a>
                                        <img src={ts.proof_image} alt="proof" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                      </div>
                                    ) : (
                                      <span style={{ color: '#6b7280' }}>No proof asset</span>
                                    )}
                                  </td>
                                  <td>{new Date(ts.created_at).toLocaleString()}</td>
                                  <td>
                                    {ts.status === 'pending' ? (
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => adminVerifyTask(ts.id, 'approve')} className="admin-btn admin-btn-success">Approve</button>
                                        <button onClick={() => adminVerifyTask(ts.id, 'reject')} className="admin-btn admin-btn-danger">Reject</button>
                                      </div>
                                    ) : (
                                      <span className={`admin-badge ${ts.status === 'approved' ? 'admin-badge-success' : 'admin-badge-danger'}`}>{ts.status}</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {adminActiveTab === 'system-settings' && (
                    <div className="admin-panel-card">
                      <div className="admin-panel-header">
                        <span className="admin-panel-title">Change System Parameters Settings</span>
                      </div>
                      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                          <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', fontSize: '13px' }}>Global Freeze Switch:</label>
                          <button 
                            onClick={() => adminUpdateSettings({ global_freeze: adminData.settings.global_freeze === '1' ? '0' : '1' })}
                            className={`admin-btn ${adminData.settings.global_freeze === '1' ? 'admin-btn-danger' : 'admin-btn-success'}`}
                            style={{ fontWeight: 'bold' }}
                          >
                            {adminData.settings.global_freeze === '1' ? 'ACTIVE FREEZE (Withdrawals Locked)' : 'SYSTEM HEALTHY (Normal Operation)'}
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '400px' }}>
                          <div>
                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', fontSize: '13px' }}>Withdraw Fee %:</label>
                            <input 
                              type="number" 
                              defaultValue={adminData.settings.withdrawal_fee_pct} 
                              onBlur={(e) => adminUpdateSettings({ withdrawal_fee_pct: e.target.value })} 
                              className="admin-input-dark"
                            />
                          </div>
                          <div>
                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', fontSize: '13px' }}>Min Withdraw ($):</label>
                            <input 
                              type="number" 
                              defaultValue={adminData.settings.min_withdrawal_usd} 
                              onBlur={(e) => adminUpdateSettings({ min_withdrawal_usd: e.target.value })} 
                              className="admin-input-dark"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ADMIN: SUBSCRIPTION MANAGEMENT */}
                  {adminActiveTab === 'subscription-management' && (
                    <div className="admin-panel-card">
                      <div className="admin-panel-header">
                        <span className="admin-panel-title">PRODUCT CONFIGURATOR MANAGER (CRUD) - Investment Tiers</span>
                      </div>
                      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <form onSubmit={handleSavePackage} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <input type="text" placeholder="Package ID" value={packageForm.id} onChange={e => setPackageForm({...packageForm, id: e.target.value})} className="admin-input-dark" disabled={packageForm.id !== ''} required />
                            <input type="text" placeholder="Package Name" value={packageForm.name} onChange={e => setPackageForm({...packageForm, name: e.target.value})} className="admin-input-dark" required />
                            <input type="number" placeholder="Price USD" value={packageForm.price} onChange={e => setPackageForm({...packageForm, price: parseFloat(e.target.value) || 0})} className="admin-input-dark" required />
                            <input type="number" placeholder="Daily Return USD" value={packageForm.daily_return} onChange={e => setPackageForm({...packageForm, daily_return: parseFloat(e.target.value) || 0})} className="admin-input-dark" required />
                            <input type="number" placeholder="Total Return USD" value={packageForm.total_return} onChange={e => setPackageForm({...packageForm, total_return: parseFloat(e.target.value) || 0})} className="admin-input-dark" required />
                            <input type="number" placeholder="Lock Days" value={packageForm.lock_days} onChange={e => setPackageForm({...packageForm, lock_days: parseInt(e.target.value) || 180})} className="admin-input-dark" required />
                            <select value={packageForm.graphic_type} onChange={e => setPackageForm({...packageForm, graphic_type: e.target.value})} className="admin-input-dark" required>
                              <option value="">Select Graphic Type</option>
                              <option value="solar">Solar</option>
                              <option value="wind">Wind</option>
                              <option value="hydro">Hydro</option>
                              <option value="biomass">Biomass</option>
                              <option value="house">House</option>
                              <option value="pump">Pump</option>
                              <option value="server">Server</option>
                              <option value="gold">Gold</option>
                              <option value="book">Book</option>
                              <option value="globe">Globe</option>
                            </select>
                            <input type="text" placeholder="Description" value={packageForm.description} onChange={e => setPackageForm({...packageForm, description: e.target.value})} className="admin-input-dark" />
                          </div>
                          <button type="submit" className="admin-btn admin-btn-success">Save Package</button>
                        </form>
                        <div className="admin-table-container">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Price USD</th>
                                <th>Daily Return</th>
                                <th>Total Return</th>
                                <th>Lock Days</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminPackages.length === 0 ? (
                                <tr>
                                  <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No packages configured.</td>
                                </tr>
                              ) : (
                                adminPackages.map(pkg => (
                                  <tr key={pkg.id}>
                                    <td>{pkg.id}</td>
                                    <td><strong>{pkg.name}</strong></td>
                                    <td>${pkg.price}</td>
                                    <td>${pkg.daily_return}</td>
                                    <td>${pkg.total_return}</td>
                                    <td>{pkg.lock_days} days</td>
                                    <td>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleEditPackage(pkg)} className="admin-btn admin-btn-primary" style={{ fontSize: '11px' }}>Edit</button>
                                        {!['free_starter', 'eco_mini', 'smart_home', 'solar_hub', 'agro_pump', 'wind_farm', 'hydro_plant', 'biomass_plant', 'data_center', 'gold_reserve'].includes(pkg.id) && (
                                          <button onClick={() => handleDeletePackage(pkg.id)} className="admin-btn admin-btn-danger" style={{ fontSize: '11px' }}>Delete</button>
                                        )}
                                      </div>
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

                  {/* ADMIN: TASK OVERVIEW */}
                  {adminActiveTab === 'task-overview' && (
                    <div className="admin-panel-card">
                      <div className="admin-panel-header">
                        <span className="admin-panel-title">ACTIVE INVESTMENT LEDGER - Contract Tracking</span>
                      </div>
                      <div className="admin-table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>User Phone ID</th>
                              <th>Selected Tier</th>
                              <th>Purchase Date</th>
                              <th>Maturity Date</th>
                              <th>Contract Status</th>
                              <th>Price USD</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminInvestments.length === 0 ? (
                              <tr>
                                <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No active investment contracts found.</td>
                              </tr>
                            ) : (
                              adminInvestments.map(inv => (
                                <tr key={inv.id}>
                                  <td><strong>{inv.phone}</strong></td>
                                  <td>{inv.tier_name}</td>
                                  <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                                  <td>{inv.maturity_date}</td>
                                  <td>
                                    <span className={`admin-badge ${inv.status === 'active' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                                      {inv.status}
                                    </span>
                                  </td>
                                  <td>${inv.price}</td>
                                  <td>
                                    <button onClick={() => handleTerminateContract(inv.id)} className="admin-btn admin-btn-danger" style={{ fontSize: '11px' }}>
                                      Terminate Contract
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}


                </div>
              ) : (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: '#9ca3af', fontSize: '13px' }}>
                  <RefreshCw size={20} className="active-spinning" style={{ marginRight: '8px' }} /> Decrypting Admin Control Records...
                </div>
              )}
            </main>
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
              <h3 style={{ fontSize: '18px', color: '#fff', letterSpacing: '1.5px', fontWeight: 800 }}>NEXORA</h3>
              <div
                className="header-wallet-card"
                onClick={() => setActiveTab('me')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: '12px',
                  padding: '6px 12px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4', flexShrink: 0 }}>
                  <Wallet size={16} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>Deposit Wallet</span>
                  <strong style={{ fontSize: '14px', color: '#06e6c8' }}>
                    ${user ? user.deposit_balance.toFixed(2) : '0.00'} <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>USD</span>
                  </strong>
                </div>
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
                <div className="projects-tab-header-flex">
                  <div className="projects-tab-header">
                    <h3>Projects</h3>
                    <p>Invest in sustainable projects. Earn stable daily returns.</p>
                  </div>
                  <button className="filter-icon-btn" type="button" aria-label="Filter projects">
                    <ListFilter size={16} />
                  </button>
                </div>

                {/* Grid list of projects */}
                <div className="projects-grid">
                  {projectCatalog.map((proj, idx) => {
                    const CategoryIcon = PROJECT_CATEGORY_ICONS[proj.id] || Zap;
                    return (
                      <div key={proj.id} className="glass-card project-card-v2">
                        <div className="project-card-top">
                          <span className="tier-badge">TIER {idx + 1}</span>
                          <span className="category-icon-badge" style={{ background: proj.bgGradient }}>
                            <CategoryIcon size={16} strokeWidth={2} />
                          </span>
                        </div>

                        {renderProjectVisual(proj)}

                        <div className="project-card-body">
                          <span className="project-category-label">{proj.category}</span>
                          <h4 className="project-title">{proj.name}</h4>

                          <div className="project-return-block">
                            <span>Total Return</span>
                            <strong>${proj.totalProfit.toLocaleString()} USD</strong>
                          </div>

                          <div className="project-stats-row">
                            <div className="project-stat-box">
                              <DollarSign size={14} />
                              <div>
                                <span>Project Price</span>
                                <strong>${proj.price.toLocaleString()} USD</strong>
                              </div>
                            </div>
                            <div className="project-stat-box">
                              <TrendingUp size={14} />
                              <div>
                                <span>Daily Profit</span>
                                <strong className="stat-green">${proj.dailyProfit.toLocaleString()} USD</strong>
                              </div>
                            </div>
                          </div>

                          <div className="project-card-footer">
                            <span className="project-cycle-info"><Clock size={12} /> Cycle: {proj.duration} Days</span>
                            <button
                              onClick={() => setSelectedAgreementProject(proj)}
                              className="invest-now-btn"
                              type="button"
                            >
                              Invest Now <ArrowUpRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: TASKS (Daily tasks, screenshot upload and attendance) */}
            {activeTab === 'tasks' && (() => {
              const activeUserContracts = contracts.filter(c => c.status === 'active');
              
              const isClaimedToday = (contract) => {
                if (!contract.last_claimed_at) return false;
                const lastClaim = new Date(contract.last_claimed_at);
                const now = new Date();
                return lastClaim.getUTCDate() === now.getUTCDate() &&
                       lastClaim.getUTCMonth() === now.getUTCMonth() &&
                       lastClaim.getUTCFullYear() === now.getUTCFullYear();
              };

              const inProgressContracts = activeUserContracts.filter(c => !isClaimedToday(c));
              const completedContracts = activeUserContracts.filter(c => isClaimedToday(c));

              const canonicalTiers = [
                { id: 'free_starter', name: 'Free Starter Pack', price: 0, daily_return: 0.00, title: 'NEXORA FREE STARTER:', desc: 'Match Starter Telemetry Order', img: taskSolarImg, badge: 'FREE' },
                { id: 'eco_mini', name: 'Eco-Mini Grid', price: 10, daily_return: 0.25, title: 'NEXORA TIER 1:', desc: 'Match Eco-Grid Order', img: taskSolarImg, badge: 'TIER 1' },
                { id: 'smart_home', name: 'Smart Home Grid', price: 30, daily_return: 0.75, title: 'NEXORA TIER 2:', desc: 'Match Wind-Force Order', img: taskWindImg, badge: 'TIER 2' },
                { id: 'solar_hub', name: 'Solar Community Hub', price: 70, daily_return: 1.70, title: 'NEXORA TIER 3:', desc: 'Match Hydro-Flow Order', img: taskHydroImg, badge: 'TIER 3' },
                { id: 'agro_pump', name: 'Agro-Solar Pump', price: 100, daily_return: 2.50, title: 'NEXORA TIER 4:', desc: 'Match Agro-Pump Telemetry', img: taskSolarImg, badge: 'TIER 4' },
                { id: 'wind_farm', name: 'Wind Farm Asset', price: 300, daily_return: 7.50, title: 'NEXORA TIER 5:', desc: 'Match Wind-Farm Sync', img: taskWindImg, badge: 'TIER 5' },
                { id: 'hydro_plant', name: 'Industrial Hydro-Plant', price: 700, daily_return: 17.50, title: 'NEXORA TIER 6:', desc: 'Match Hydro-Plant Telemetry', img: taskHydroImg, badge: 'TIER 6' },
                { id: 'biomass_plant', name: 'Biomass Power Plant', price: 1000, daily_return: 25.00, title: 'NEXORA TIER 7:', desc: 'Match Biomass Calibration', img: taskSolarImg, badge: 'TIER 7' },
                { id: 'data_center', name: 'Green Data Center', price: 5000, daily_return: 125.00, title: 'NEXORA TIER 8:', desc: 'Match Data-Center Coolant Sync', img: taskWindImg, badge: 'TIER 8' },
                { id: 'gold_reserve', name: 'Gold Refinery Reserve', price: 10000, daily_return: 250.00, title: 'NEXORA TIER 9:', desc: 'Match Gold Refinery Verification', img: taskHydroImg, badge: 'TIER 9' }
              ];

              return (
                <div className="tab-pane-layout" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* PREMIUM STATS ROW (Two cards side-by-side) */}
                  <div className="task-stats-row">
                    <div className="glass-card task-stat-card">
                      <div className="task-stat-icon-wrapper clipboard" style={{ color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.3)', background: 'rgba(6, 182, 212, 0.08)' }}>
                        <CheckSquare size={24} />
                      </div>
                      <div className="task-stat-info">
                        <span className="task-stat-title">All tasks for today:</span>
                        <div className="task-stat-value-wrap">
                          <span className="task-stat-value" style={{ fontSize: '24px', fontWeight: 'bold' }}>{user ? user.all_tasks_count : 0}</span>
                          <span className="task-stat-unit" style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>Tasks</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card task-stat-card">
                      <div className="task-stat-icon-wrapper clock">
                        <Clock size={24} />
                      </div>
                      <div className="task-stat-info">
                        <span className="task-stat-title">Today's remaining tasks:</span>
                        <div className="task-stat-value-wrap">
                          <span className="task-stat-value" style={{ fontSize: '24px', fontWeight: 'bold' }}>{user ? user.remaining_tasks_count : 0}</span>
                          <span className="task-stat-unit" style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>Tasks</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TAB SWITCHER */}
                  <div className="task-tab-switcher-v4">
                    <button 
                      type="button"
                      onClick={() => setTaskSubTab('in-progress')}
                      className={`task-tab-btn-v4 ${taskSubTab === 'in-progress' ? 'active' : ''}`}
                    >
                      In progress
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTaskSubTab('completed')}
                      className={`task-tab-btn-v4 ${taskSubTab === 'completed' ? 'active' : ''}`}
                    >
                      Completed
                    </button>
                  </div>

                  {/* TASKS LIST */}
                  <div className="task-cards-list">
                    {taskSubTab === 'in-progress' && (
                      <>
                        {(dailyTasks.incomplete || []).map(task => {
                          const tierDetails = canonicalTiers.find(t => t.name === task.tier_name) || {
                            title: `NEXORA ${task.tier_name.toUpperCase()}:`,
                            desc: 'Match Telemetry Grid Sync',
                            img: taskSolarImg,
                            badge: 'ACTIVE'
                          };

                          return (
                            <div key={`task-item-${task.id}`} className="task-card-v4">
                              <div className="task-card-v4-image-wrap">
                                <img src={tierDetails.img} alt="asset" className="task-card-v4-image" />
                              </div>
                              
                              <div className="task-card-v4-info">
                                <span className="task-card-v4-badge">{tierDetails.badge}</span>
                                <span className="task-card-v4-title" style={{ display: 'block', marginTop: '6px' }}>{tierDetails.title}</span>
                                <h4 className="task-card-v4-desc">{tierDetails.desc}</h4>
                                
                                <div className="task-card-v4-spec-list">
                                  <div className="task-card-v4-spec-item">
                                    <div className="task-card-v4-spec-icon" style={{ color: '#10B981' }}>
                                      <Wallet size={14} />
                                    </div>
                                    <span className="task-card-v4-spec-label">REWARD</span>
                                    <span className="task-card-v4-spec-value reward">+${task.reward.toFixed(2)} USD</span>
                                  </div>
                                  <div className="task-card-v4-spec-item">
                                    <div className="task-card-v4-spec-icon" style={{ color: '#06B6D4' }}>
                                      <Calendar size={14} />
                                    </div>
                                    <span className="task-card-v4-spec-label">DEADLINE</span>
                                    <span className="task-card-v4-spec-value">Today, 11:59 PM</span>
                                  </div>
                                </div>
                              </div>

                              <div className="task-card-v4-action">
                                <button 
                                  type="button"
                                  onClick={() => handleRunTask(task)}
                                  className="task-card-v4-btn"
                                >
                                  START TASK &gt;
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* 2. Locked Tasks */}
                        {canonicalTiers.filter(tier => tier.price > 0 && !contracts.some(c => c.tier_name === tier.name && c.status === 'active')).map(tier => (
                          <div key={`locked-task-${tier.id}`} className="task-card-v4 locked">
                            <div className="task-card-v4-image-wrap" style={{ opacity: 0.5 }}>
                              <img src={tier.img} alt="asset" className="task-card-v4-image" style={{ filter: 'grayscale(0.6) brightness(0.6)' }} />
                            </div>
                            
                            <div className="task-card-v4-info" style={{ opacity: 0.5 }}>
                              <span className="task-card-v4-badge" style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}>LOCKED</span>
                              <span className="task-card-v4-title" style={{ display: 'block', marginTop: '6px', color: 'var(--text-muted)' }}>{tier.title}</span>
                              <h4 className="task-card-v4-desc" style={{ color: 'var(--text-muted)' }}>{tier.desc}</h4>
                              
                              <div className="task-card-v4-spec-list">
                                <div className="task-card-v4-spec-item">
                                  <div className="task-card-v4-spec-icon" style={{ color: 'var(--text-muted)' }}>
                                    <Wallet size={14} />
                                  </div>
                                  <span className="task-card-v4-spec-label">REWARD</span>
                                  <span className="task-card-v4-spec-value" style={{ color: 'var(--text-muted)' }}>+${tier.daily_return.toFixed(2)} USD</span>
                                </div>
                                <div className="task-card-v4-spec-item">
                                  <div className="task-card-v4-spec-icon" style={{ color: 'var(--text-muted)' }}>
                                    <Calendar size={14} />
                                  </div>
                                  <span className="task-card-v4-spec-label">DEADLINE</span>
                                  <span className="task-card-v4-spec-value" style={{ color: 'var(--text-muted)' }}>Today, 11:59 PM</span>
                                </div>
                              </div>
                            </div>

                            <div className="task-card-v4-action">
                              <button 
                                type="button"
                                onClick={() => {
                                  showStatus(`Lease active contract of ${tier.name} to unlock this task! Redirecting...`, 'info');
                                  setTimeout(() => {
                                    setActiveTab('invest');
                                  }, 1500);
                                }}
                                className="task-card-v4-btn locked"
                              >
                                Unlock Tier &gt;
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {taskSubTab === 'completed' && (
                      <>
                        {(dailyTasks.completed || []).map(task => {
                          const tierDetails = canonicalTiers.find(t => t.name === task.tier_name) || {
                            title: `NEXORA ${task.tier_name.toUpperCase()}:`,
                            desc: 'Match Telemetry Grid Sync',
                            img: taskSolarImg,
                            badge: 'COMPLETED'
                          };

                          return (
                            <div key={`completed-task-${task.id}`} className="task-card-v4 completed">
                              <div className="task-card-v4-image-wrap">
                                  <img src={tierDetails.img} alt="asset" className="task-card-v4-image" style={{ filter: 'brightness(0.7)' }} />
                              </div>
                              
                              <div className="task-card-v4-info">
                                <span className="task-card-v4-badge" style={{ color: 'var(--accent-green)', background: 'var(--accent-green-glow)', borderColor: 'rgba(0,230,118,0.2)' }}>COMPLETED</span>
                                <span className="task-card-v4-title" style={{ display: 'block', marginTop: '6px' }}>{tierDetails.title}</span>
                                <h4 className="task-card-v4-desc">{tierDetails.desc}</h4>
                                
                                <div className="task-card-v4-spec-list">
                                  <div className="task-card-v4-spec-item">
                                    <div className="task-card-v4-spec-icon" style={{ color: '#10B981' }}>
                                      <Wallet size={14} />
                                    </div>
                                    <span className="task-card-v4-spec-label">REWARD CLAIMED</span>
                                    <span className="task-card-v4-spec-value reward">+${task.reward.toFixed(2)} USD</span>
                                  </div>
                                  <div className="task-card-v4-spec-item">
                                    <div className="task-card-v4-spec-icon" style={{ color: '#06B6D4' }}>
                                      <Calendar size={14} />
                                    </div>
                                    <span className="task-card-v4-spec-label">CLAIMED AT</span>
                                    <span className="task-card-v4-spec-value">Today</span>
                                  </div>
                                </div>
                              </div>

                              <div className="task-card-v4-action">
                                <button type="button" disabled className="task-card-v4-btn completed">
                                  Completed ✓
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>

                  {/* BOTTOM SECTIONS: ADDITIONAL TELEMETRY & SOCIAL CHANNELS */}
                  <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '30px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>Node Telemetry Allowances & Social Amplification</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '20px' }}>Maximize earnings by completing daily node validations and sharing Nexora promotional updates.</p>
                    
                    <div className="home-dashboard-grid">
                      {/* Left: Daily Attendance checkin */}
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
                          type="button"
                          onClick={claimAttendance}
                          className="btn-primary" 
                          style={{ justifyContent: 'center', marginTop: '5px' }}
                        >
                          Complete Attendance Telemetry
                        </button>
                      </div>

                      {/* Recruitment Milestone Challenge */}
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
                              <strong>{user.stats?.activeDownlinesCount || 0} / 3 Nodes</strong>
                            </div>
                            <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, ((user.stats?.activeDownlinesCount || 0) / 3) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-gold) 0%, #ff8f00 100%)' }}></div>
                            </div>
                          </div>
                        )}

                        <button 
                          type="button"
                          onClick={claimRecruitmentMilestone}
                          disabled={!user || (user.stats?.activeDownlinesCount || 0) < 3 || user.milestone_recruitment_claimed === 1}
                          className="btn-primary" 
                          style={{
                            justifyContent: 'center',
                            background: user && user.milestone_recruitment_claimed === 1 ? 'var(--bg-tertiary)' : (user && (user.stats?.activeDownlinesCount || 0) >= 3) ? 'linear-gradient(135deg, var(--accent-gold) 0%, #ff8f00 100%)' : 'var(--bg-tertiary)',
                            color: user && user.milestone_recruitment_claimed === 1 ? 'var(--text-muted)' : (user && (user.stats?.activeDownlinesCount || 0) >= 3) ? '#000' : 'var(--text-muted)',
                            cursor: (user && (user.stats?.activeDownlinesCount || 0) >= 3 && user.milestone_recruitment_claimed !== 1) ? 'pointer' : 'not-allowed',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          {user && user.milestone_recruitment_claimed === 1 ? "Milestone Claimed" : "Claim Recruitment Reward"}
                        </button>
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

                </div>
              );
            })()}

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

      {/* 5-SECOND COUNTDOWN TASK OVERLAY MODAL */}
      {countdownTask && (() => {
        const canonicalTiers = [
          { name: 'Free Starter Pack', img: taskSolarImg },
          { name: 'Eco-Mini Grid', img: taskSolarImg },
          { name: 'Smart Home Grid', img: taskWindImg },
          { name: 'Solar Community Hub', img: taskHydroImg },
          { name: 'Agro-Solar Pump', img: taskSolarImg },
          { name: 'Wind Farm Asset', img: taskWindImg },
          { name: 'Industrial Hydro-Plant', img: taskHydroImg },
          { name: 'Biomass Power Plant', img: taskSolarImg },
          { name: 'Green Data Center', img: taskWindImg },
          { name: 'Gold Refinery Reserve', img: taskHydroImg }
        ];
        const tierImg = canonicalTiers.find(t => t.name === countdownTask.tier_name)?.img || taskSolarImg;

        return (
          <div className="countdown-overlay-modal-root" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(10px)' }}>
            <div className="countdown-modal-box glass-card" style={{ padding: '40px', width: '90%', maxWidth: '420px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="countdown-modal-image-wrap" style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#000', border: '2px solid rgba(0, 230, 118, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 0 30px rgba(0, 230, 118, 0.2)' }}>
                <img src={tierImg} alt="asset node" className="countdown-modal-image active-pulse" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
              </div>
              <h3 style={{ fontSize: '18px', color: '#fff', fontFamily: 'var(--font-display)', marginBottom: '8px', fontWeight: 'bold' }}>
                Synchronizing Node Telemetry...
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginBottom: '25px', lineHeight: '1.5' }}>
                Connecting to {countdownTask.tier_name} array matrix. Please do not close or reload this window.
              </p>

              {/* Progress Spinner & Numerical Countdown */}
              <div className="countdown-progress-spinner-wrap" style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg className="countdown-svg-circle" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  <circle cx="50" cy="50" r="45" className="countdown-circle-bg" style={{ fill: 'transparent', stroke: 'rgba(255,255,255,0.05)', strokeWidth: 8 }}></circle>
                  <circle cx="50" cy="50" r="45" className="countdown-circle-progress" style={{ fill: 'transparent', stroke: '#06B6D4', strokeWidth: 8, strokeDasharray: 282.6, strokeDashoffset: (282.6 * (5 - countdownSeconds)) / 5, transition: 'stroke-dashoffset 1s linear' }}></circle>
                </svg>
                <div className="countdown-number-inner" style={{ position: 'absolute', fontSize: '24px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>{countdownSeconds}s</div>
              </div>
            </div>
          </div>
        );
      })()}

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
                  <span>Account Holder Name:</span>
                  <strong>{user ? (user.full_name || user.phone || 'Nexora User') : 'Nexora User'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Localized Timestamp:</span>
                  <strong>{new Date().toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Selected Project Tier:</span>
                  <strong>{selectedAgreementProject.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Contract Principal:</span>
                  <strong>${selectedAgreementProject.price.toLocaleString()} USD</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Daily Passive Profit:</span>
                  <strong style={{ color: 'var(--accent-green)' }}>+${selectedAgreementProject.dailyProfit.toLocaleString()} USD/day</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Contract Duration:</span>
                  <strong>{selectedAgreementProject.duration} Days</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                  <span>Total Guaranteed Return:</span>
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
                AGREE & ACTIVATE CONTRACT
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
