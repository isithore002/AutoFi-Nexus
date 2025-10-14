import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu,
  X,
  Sun,
  Moon,
  BarChart3,
  Wallet,
  Settings,
  PieChart,
  User,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useWeb3Context } from '../contexts/Web3Context';
import { NAV_ITEMS } from '../utils/constants';
import { formatAddress } from '../utils';
import WalletConnectButton from './WalletConnectButton';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { walletInfo, isConnected } = useWeb3Context();
  const location = useLocation();

  // Icon mapping for navigation items
  const iconMap: Record<string, React.ComponentType<any>> = {
    'ChartBarIcon': BarChart3,
    'BanknotesIcon': Wallet,
    'CogIcon': Settings,
    'ChartPieIcon': PieChart,
    'UserIcon': User,
  };

  const navigation = NAV_ITEMS.map(item => ({
    ...item,
    current: location.pathname === item.href,
    Icon: iconMap[item.icon] || BarChart3,
  }));

  // Check if we're on the dashboard route to apply different background
  const isDashboard = location.pathname === '/';
  
  return (
    <div className={`min-h-screen relative ${isDashboard ? 'bg-transparent' : 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'}`}>
      {/* Subtle Background Pattern - only show if not on dashboard */}
      {!isDashboard && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20"></div>
        </div>
      )}
      
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setSidebarOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div 
              className="fixed inset-y-0 left-0 flex w-80 flex-col bg-gradient-to-b from-purple-900/80 via-purple-800/70 to-purple-900/80 backdrop-blur-xl border-r border-purple-500/30"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="flex h-20 items-center justify-between px-6 border-b border-purple-500/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl">
                      <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-gradient">AutoFi Nexus</h1>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-purple-200 hover:text-white hover:bg-purple-700/30 rounded-xl transition-all duration-200"
                >
                      <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 px-6 py-8">
                <ul className="space-y-3">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`nav-item flex items-center gap-4 text-sm font-medium transition-all duration-300 ${
                          item.current
                            ? 'text-white'
                            : 'text-purple-200 hover:text-white'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

          {/* Enhanced Desktop sidebar */}
          <motion.div 
            className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col relative z-20"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
        <div className="flex flex-col flex-grow bg-gradient-to-b from-purple-900/80 via-purple-800/70 to-purple-900/80 backdrop-blur-xl border-r border-purple-500/30 shadow-2xl">
          {/* Enhanced Logo Section */}
          <div className="flex h-28 items-center px-8 border-b border-purple-500/30">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl shadow-glow animate-glow">
                    <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient-glow">AutoFi Nexus</h1>
                <p className="text-sm text-gray-400 font-medium">Cross-Chain DeFi Manager</p>
              </div>
            </div>
          </div>
          
          {/* Enhanced Navigation */}
          <nav className="flex-1 px-6 py-8">
            <ul className="space-y-4">
              {navigation.map((item, index) => {
                const Icon = item.Icon;
                return (
                  <motion.li 
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link
                      to={item.href}
                      className={`group flex items-center gap-4 px-6 py-4 rounded-2xl text-base font-semibold transition-all duration-300 ${
                        item.current
                          ? 'bg-gradient-to-r from-purple-600/30 to-violet-600/30 text-white border border-purple-500/40 shadow-glow scale-105'
                          : 'text-purple-200 hover:text-white hover:bg-purple-700/30 hover:scale-105'
                      }`}
                    >
                      <Icon className={`h-5 w-5 transition-all duration-300 ${
                        item.current 
                          ? 'text-purple-300' 
                          : 'text-purple-300 group-hover:text-purple-100 group-hover:scale-110'
                      }`} />
                      <span>{item.name}</span>
                      {item.current && (
                        <div className="ml-auto w-2 h-2 bg-purple-400 rounded-full animate-pulse shadow-glow"></div>
                      )}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </nav>
          
          {/* Wallet Status */}
          <div className="p-6 border-t border-purple-500/30">
            {isConnected && walletInfo ? (
              <div className="glass-effect rounded-2xl p-4 border border-accent-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-accent-400 rounded-full animate-pulse shadow-glow"></div>
                  <span className="text-sm font-semibold text-accent-400">
                    Wallet Connected
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-mono bg-black/20 rounded-lg px-3 py-2">
                  {formatAddress(walletInfo.address, 8)}
                </p>
              </div>
            ) : (
              <div className="glass-effect rounded-2xl p-4">
                <p className="text-sm text-gray-400 text-center">
                  Connect your wallet to start
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

          {/* Main content */}
          <div className="lg:pl-80 relative z-10">
        {/* Enhanced Top bar */}
        <motion.div 
          className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-6 glass-effect border-b border-white/10 px-6 shadow-glass sm:gap-x-8 sm:px-8"
          initial={{ y: -80 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button
            type="button"
            className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
                <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-6 self-stretch lg:gap-x-8">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-6 lg:gap-x-8">
              {/* Theme toggle */}
              <motion.button
                onClick={toggleTheme}
                className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {theme === 'light' ? (
                      <Moon className="h-5 w-5" />
                    ) : (
                      <Sun className="h-5 w-5" />
                )}
              </motion.button>

              {/* Wallet connection */}
              <div className="flex items-center gap-x-3">
                {isConnected && walletInfo ? (
                  <div className="flex items-center gap-x-3 px-4 py-2 glass-effect rounded-xl border border-accent-500/30">
                    <div className="text-sm text-gray-300 font-medium">
                      {formatAddress(walletInfo.address, 6)}
                    </div>
                    <div className="h-2 w-2 rounded-full bg-accent-400 animate-pulse shadow-glow"></div>
                  </div>
                ) : (
                  <WalletConnectButton />
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}