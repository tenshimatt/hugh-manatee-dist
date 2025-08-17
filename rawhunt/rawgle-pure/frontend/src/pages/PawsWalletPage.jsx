import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  GiftIcon,
  TrophyIcon,
  SparklesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { pawsService, subscriptionService } from '../services/api';
import { formatPawsAmount, formatDateTime } from '../utils/helpers';

const PawsWalletPage = () => {
  const [walletData, setWalletData] = useState({
    balance: 0,
    transactions: [],
    isLoading: true,
  });
  
  const [subscription, setSubscription] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    toUserId: '',
    amount: '',
    reason: '',
  });
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWalletData();
    loadSubscription();
  }, []);

  const loadWalletData = async () => {
    try {
      const [balanceData, transactionsData] = await Promise.all([
        pawsService.getBalance(),
        pawsService.getTransactionHistory(),
      ]);

      setWalletData({
        balance: balanceData.balance || 0,
        transactions: transactionsData.transactions || [],
        isLoading: false,
      });
    } catch (err) {
      console.error('Error loading wallet data:', err);
      setWalletData({ balance: 0, transactions: [], isLoading: false });
    }
  };

  const loadSubscription = async () => {
    try {
      const subData = await subscriptionService.getSubscription();
      setSubscription(subData);
    } catch (err) {
      console.error('Error loading subscription:', err);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setIsTransferring(true);
    setError('');

    try {
      await pawsService.transferPaws(
        parseInt(transferForm.toUserId),
        parseFloat(transferForm.amount),
        transferForm.reason
      );

      setTransferForm({ toUserId: '', amount: '', reason: '' });
      setShowTransferModal(false);
      loadWalletData(); // Refresh data
    } catch (err) {
      setError(err.message || 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  const earningSuggestions = [
    {
      icon: CurrencyDollarIcon,
      title: 'Daily Feeding Logs',
      description: 'Earn 10 PAWS for each feeding you log',
      reward: '10 PAWS',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: TrophyIcon,
      title: 'Weekly Consistency',
      description: 'Log feedings for 7 consecutive days',
      reward: '100 PAWS',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: SparklesIcon,
      title: 'AI Consultations',
      description: 'Get health advice from our AI consultant',
      reward: '25 PAWS',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: GiftIcon,
      title: 'Profile Completion',
      description: 'Complete your pet\'s full health profile',
      reward: '150 PAWS',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'earned':
      case 'reward':
        return <ArrowDownIcon className="w-4 h-4 text-green-600" />;
      case 'spent':
      case 'transfer_out':
        return <ArrowUpIcon className="w-4 h-4 text-red-600" />;
      case 'transfer_in':
        return <ArrowDownIcon className="w-4 h-4 text-blue-600" />;
      default:
        return <CurrencyDollarIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'earned':
      case 'reward':
      case 'transfer_in':
        return 'text-green-600';
      case 'spent':
      case 'transfer_out':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (walletData.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PAWS Wallet</h1>
          <p className="text-gray-600 mt-1">
            Earn and manage your PAWS tokens for pet care activities
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="card p-8 text-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 text-white rounded-full mb-4">
          <CurrencyDollarIcon className="w-8 h-8" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-2">
          {formatPawsAmount(walletData.balance)}
        </h2>
        <p className="text-primary-600 font-medium text-lg mb-4">PAWS Balance</p>
        
        {subscription?.plan !== 'free' && (
          <div className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
            <SparklesIcon className="w-4 h-4" />
            <span>{subscription?.plan === 'premium' ? '2x' : '5x'} Earnings Multiplier</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <button
                onClick={() => setShowTransferModal(true)}
                className="btn-primary text-sm"
              >
                Send PAWS
              </button>
            </div>

            {walletData.transactions.length === 0 ? (
              <div className="text-center py-12">
                <CurrencyDollarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h4>
                <p className="text-gray-600">Start earning PAWS by logging pet activities!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {walletData.transactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                        {getTransactionIcon(transaction.transaction_type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.description || transaction.reason || 'PAWS Transaction'}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <ClockIcon className="w-3 h-3" />
                          <span>{formatDateTime(transaction.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(transaction.transaction_type)}`}>
                        {transaction.transaction_type === 'earned' || transaction.transaction_type === 'reward' || transaction.transaction_type === 'transfer_in' ? '+' : '-'}
                        {formatPawsAmount(Math.abs(transaction.amount))}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {transaction.transaction_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Earning Opportunities */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Earn More PAWS</h3>
            <div className="space-y-4">
              {earningSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`p-2 ${suggestion.bgColor} rounded-lg`}>
                    <suggestion.icon className={`w-4 h-4 ${suggestion.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{suggestion.title}</h4>
                    <p className="text-xs text-gray-600 mb-1">{suggestion.description}</p>
                    <p className={`text-xs font-medium ${suggestion.color}`}>{suggestion.reward}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Benefits */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Boost Your Earnings</h3>
            <div className="space-y-3">
              <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <SparklesIcon className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800 text-sm">Premium</span>
                </div>
                <p className="text-yellow-700 text-xs mb-2">2x PAWS earnings on all activities</p>
                <p className="text-yellow-800 font-semibold text-sm">$9.99/month</p>
              </div>
              
              <div className="border border-purple-200 bg-purple-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <TrophyIcon className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-800 text-sm">Enterprise</span>
                </div>
                <p className="text-purple-700 text-xs mb-2">5x PAWS earnings + exclusive perks</p>
                <p className="text-purple-800 font-semibold text-sm">$29.99/month</p>
              </div>
              
              {subscription?.plan === 'free' && (
                <a href="/subscription/upgrade" className="btn-primary w-full text-center text-sm">
                  Upgrade Now
                </a>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Total Earned:</span>
                <span className="font-medium text-green-600">
                  +{formatPawsAmount(
                    walletData.transactions
                      .filter(t => t.transaction_type === 'earned' || t.transaction_type === 'reward')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Total Spent:</span>
                <span className="font-medium text-red-600">
                  -{formatPawsAmount(
                    walletData.transactions
                      .filter(t => t.transaction_type === 'spent')
                      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-medium text-sm">Net Gain:</span>
                <span className="font-medium text-primary-600">
                  +{formatPawsAmount(
                    walletData.transactions
                      .filter(t => t.transaction_type === 'earned' || t.transaction_type === 'reward')
                      .reduce((sum, t) => sum + t.amount, 0) -
                    walletData.transactions
                      .filter(t => t.transaction_type === 'spent')
                      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Send PAWS</h3>
            
            <form onSubmit={handleTransfer} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Recipient User ID</label>
                <input
                  type="number"
                  required
                  className="mt-1 input-field"
                  placeholder="Enter user ID"
                  value={transferForm.toUserId}
                  onChange={(e) => setTransferForm({ ...transferForm, toUserId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (PAWS)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max={walletData.balance}
                  required
                  className="mt-1 input-field"
                  placeholder="Enter amount"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available: {formatPawsAmount(walletData.balance)} PAWS
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reason (optional)</label>
                <input
                  type="text"
                  className="mt-1 input-field"
                  placeholder="Gift, payment, etc."
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 btn-secondary"
                  disabled={isTransferring}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary flex items-center justify-center"
                  disabled={isTransferring}
                >
                  {isTransferring ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span className="ml-2">Sending...</span>
                    </>
                  ) : (
                    'Send PAWS'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PawsWalletPage;