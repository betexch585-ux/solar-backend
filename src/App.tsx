import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { WhatsAppButton } from './components/WhatsAppButton';
import { LandingPage } from './components/LandingPage';
import { User, SolarPackage, OwnerSettings, Deposit, Withdrawal, ReferralRecord, UserInvestment } from './types';
import { Sun, ShieldCheck, Zap, Heart, CheckCircle2 } from 'lucide-react';

// Admin Login Gate for Restricted Access
function AdminLoginGate({ onLoginSuccess }: { onLoginSuccess: (user: User) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('solar-backend-production-f93f.up.railway.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');
      if (data.user.role !== 'admin') {
        throw new Error('Access Denied: This account does not have Administrator privileges.');
      }
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 flex justify-center items-center">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-6 h-6 text-amber-700" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Operations Sign In</h2>
          <p className="text-xs text-slate-500">
            Owner Master Portal • Please enter your Admin Username and Password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Username</label>
            <input
              type="text"
              required
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Admin Username"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-600 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Password</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Admin Password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> Sign In to Admin Panel
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [clientUser, setClientUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<'client' | 'admin'>('client');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // App Data State
  const [solarPackages, setSolarPackages] = useState<SolarPackage[]>([]);
  const [ownerSettings, setOwnerSettings] = useState<OwnerSettings>({
    bank_name: 'Meezan Bank Limited',
    account_title: 'GreenWorld Solar Energy Pvt Ltd',
    iban_account: 'PK36MEZN00010982347101',
    easypaisa_number: '0300-8829102',
    easypaisa_name: 'GreenWorld EasyPaisa Business',
    jazzcash_number: '0301-9982310',
    jazzcash_name: 'GreenWorld JazzCash Official',
    deposit_instructions: 'Please transfer exact amount in RS and upload screenshot proof.',
    whatsapp_number: '+923008829102',
  });

  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [referralEarningsRs, setReferralEarningsRs] = useState(0);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);

  // Admin Data State
  const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
  const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTriggeringProfit, setIsTriggeringProfit] = useState(false);

  // Auto-login default demo user on mount for smooth immediate preview
  useEffect(() => {
    fetchInitialData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchInitialData = async () => {
    try {
      // 1. Public packages & owner settings
      const pubRes = await fetch('/api/public/packages');
      if (pubRes.ok) {
        const pubData = await pubRes.json();
        setSolarPackages(pubData.packages || []);
        if (pubData.settings) setOwnerSettings(pubData.settings);
      }

      // 2. Fetch admin users & pending items
      fetchAdminData();

      // 3. Restore client session if available
      const savedClientId = localStorage.getItem('gw_active_client_id');
      if (savedClientId) {
        const profileRes = await fetch(`/api/client/profile/${savedClientId}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setClientUser(profileData.user);
          setReferrals(profileData.referrals || []);
          setReferralEarningsRs(profileData.referral_earnings_rs || 0);
          setUserInvestments(profileData.investments || []);
          return;
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/client/profile/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setClientUser(data.user);
        setReferrals(data.referrals || []);
        setReferralEarningsRs(data.referral_earnings_rs || 0);
        setUserInvestments(data.investments || []);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const fetchAdminData = async () => {
    try {
      const depRes = await fetch('/api/admin/deposits');
      if (depRes.ok) {
        const depData = await depRes.json();
        setPendingDeposits(depData.pendingDeposits || []);
        setAllDeposits(depData.allDeposits || []);
      }

      const wdRes = await fetch('/api/admin/withdrawals');
      if (wdRes.ok) {
        const wdData = await wdRes.json();
        setPendingWithdrawals(wdData.pendingWithdrawals || []);
        setAllWithdrawals(wdData.allWithdrawals || []);
      }

      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsersList(uData.users || []);
      }

      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.settings) setOwnerSettings(sData.settings);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  const handleUserLoginSuccess = (user: User) => {
    if (user.role === 'admin') {
      setAdminUser(user);
      fetchAdminData();
      showToast(`Admin signed in: ${user.full_name}`);
      // Ensure client user is also active if not logged in
      if (!clientUser) {
        fetchInitialData();
      }
    } else {
      setClientUser(user);
      localStorage.setItem('gw_active_client_id', user.id);
      fetchUserProfile(user.id);
      fetchAdminData();
      showToast(`Welcome back, ${user.full_name}!`);
    }
  };

  const handleLogout = () => {
    if (activeView === 'admin') {
      setAdminUser(null);
      showToast('Admin signed out.');
    } else {
      setClientUser(null);
      localStorage.removeItem('gw_active_client_id');
      showToast('Client signed out.');
    }
  };

  // Admin Actions
  const handleApproveDeposit = async (depositId: string) => {
    try {
      const res = await fetch('/api/admin/approve-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deposit_id: depositId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message);
      fetchAdminData();
      if (clientUser) fetchUserProfile(clientUser.id);
    } catch (err: any) {
      showToast('Error approving deposit: ' + err.message);
    }
  };

  const handleRejectDeposit = async (depositId: string) => {
    try {
      const res = await fetch('/api/admin/reject-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deposit_id: depositId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Deposit request rejected.');
      fetchAdminData();
    } catch (err: any) {
      showToast('Error rejecting deposit: ' + err.message);
    }
  };

  const handleMarkPaidWithdrawal = async (withdrawalId: string) => {
    try {
      const res = await fetch('/api/admin/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawal_id: withdrawalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message);
      fetchAdminData();
      if (clientUser) fetchUserProfile(clientUser.id);
    } catch (err: any) {
      showToast('Error marking payout: ' + err.message);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    try {
      const res = await fetch('/api/admin/reject-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawal_id: withdrawalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Withdrawal request rejected.');
      fetchAdminData();
    } catch (err: any) {
      showToast('Error rejecting withdrawal: ' + err.message);
    }
  };

  const handleSaveOwnerSettings = async (newSettings: OwnerSettings) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setOwnerSettings(data.settings);
      showToast('Owner payment destination details updated live!');
    } catch (err: any) {
      showToast('Error saving settings: ' + err.message);
    }
  };

  // Trigger 5% Daily Interest
  const handleTriggerDailyProfit = async () => {
    setIsTriggeringProfit(true);
    try {
      const res = await fetch('/api/admin/trigger-daily-profit', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('✨ 5% Daily Yield credited across all client wallets!');
        fetchAdminData();
        if (clientUser) fetchUserProfile(clientUser.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriggeringProfit(false);
    }
  };

  // Buy Package handler
  const handleBuyPackage = async (pkg: SolarPackage) => {
    if (!clientUser) {
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }

    if (clientUser.wallet_balance < pkg.price_rs) {
      setDepositModalOpen(true);
      showToast(`Insufficient funds (RS ${clientUser.wallet_balance.toLocaleString()}). Please submit deposit proof first.`);
      return;
    }

    try {
      const res = await fetch('/api/client/invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: clientUser.id, package_id: pkg.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message);
      fetchUserProfile(clientUser.id);
      fetchAdminData();
    } catch (err: any) {
      showToast('Purchase error: ' + err.message);
    }
  };

  const activeUser = activeView === 'admin' ? adminUser : clientUser;

  return (
    <div className="min-h-screen bg-[#F9FAF9] text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-white border border-emerald-300 text-emerald-950 px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        user={activeUser}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeView === 'client' ? (
          clientUser ? (
            <ClientDashboard
              user={clientUser}
              solarPackages={solarPackages}
              ownerSettings={ownerSettings}
              referrals={referrals}
              referralEarningsRs={referralEarningsRs}
              userInvestments={userInvestments}
              deposits={allDeposits.filter((d) => d.user_id === clientUser.id)}
              withdrawals={allWithdrawals.filter((w) => w.user_id === clientUser.id)}
              onOpenDeposit={() => setDepositModalOpen(true)}
              onOpenWithdrawal={() => setWithdrawModalOpen(true)}
              onRefreshData={() => {
                fetchUserProfile(clientUser.id);
                fetchAdminData();
              }}
              onBuyPackage={handleBuyPackage}
            />
          ) : (
            <LandingPage
              solarPackages={solarPackages}
              ownerSettings={ownerSettings}
              onOpenAuth={(mode) => {
                setAuthMode(mode);
                setAuthModalOpen(true);
              }}
            />
          )
        ) : adminUser?.role === 'admin' ? (
          <AdminPanel
            pendingDeposits={pendingDeposits}
            allDeposits={allDeposits}
            pendingWithdrawals={pendingWithdrawals}
            allWithdrawals={allWithdrawals}
            ownerSettings={ownerSettings}
            usersList={usersList}
            onApproveDeposit={handleApproveDeposit}
            onRejectDeposit={handleRejectDeposit}
            onMarkPaidWithdrawal={handleMarkPaidWithdrawal}
            onRejectWithdrawal={handleRejectWithdrawal}
            onSaveOwnerSettings={handleSaveOwnerSettings}
            onTriggerDailyProfit={handleTriggerDailyProfit}
            onRefreshData={fetchAdminData}
            isTriggeringProfit={isTriggeringProfit}
          />
        ) : (
          <AdminLoginGate onLoginSuccess={handleUserLoginSuccess} />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        allowRegister={activeView === 'client'}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleUserLoginSuccess}
      />

      {clientUser && (
        <>
          <DepositModal
            isOpen={depositModalOpen}
            userId={clientUser.id}
            userName={clientUser.full_name}
            ownerSettings={ownerSettings}
            onClose={() => setDepositModalOpen(false)}
            onDepositSubmitted={() => {
              fetchUserProfile(clientUser.id);
              fetchAdminData();
              showToast('Deposit proof submitted to owner admin!');
            }}
          />

          <WithdrawModal
            isOpen={withdrawModalOpen}
            userId={clientUser.id}
            walletBalance={clientUser.wallet_balance}
            onClose={() => setWithdrawModalOpen(false)}
            onWithdrawalSubmitted={() => {
              fetchUserProfile(clientUser.id);
              fetchAdminData();
              showToast('Withdrawal request submitted!');
            }}
          />
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-slate-500 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Sun className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-emerald-900 text-sm">GreenWorld Solar Energy Platform</span>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Express Backend Port 3000 • Multer Deposit Proof Uploads • 5% Daily Yield Calculation • Pakistan (+92) Format
          </p>

          <div className="flex items-center gap-4 text-[11px] font-medium">
            <button onClick={() => setActiveView('client')} className="hover:text-emerald-700 text-emerald-800">
              Client Portal
            </button>
            <span>•</span>
            <button onClick={() => setActiveView('admin')} className="hover:text-amber-700 text-amber-800">
              Owner Admin Panel
            </button>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Customer Support Button */}
      <WhatsAppButton whatsappNumber={ownerSettings.whatsapp_number} />
    </div>
  );
}
