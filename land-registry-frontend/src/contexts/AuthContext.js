import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [availableAccounts, setAvailableAccounts] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get all available accounts from MetaMask
    const getAvailableAccounts = async () => {
        try {
            if (!window.ethereum) {
                throw new Error('Please install MetaMask');
            }

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAvailableAccounts(accounts);
            return accounts;
        } catch (err) {
            console.error('Failed to get accounts:', err);
            setError(err.message);
            throw err;
        }
    };

    // Handle MetaMask account changes
    const handleAccountsChanged = useCallback((accounts) => {
        setAvailableAccounts(accounts);
        
        if (accounts.length === 0) {
            // All accounts disconnected
            disconnect();
        } else {
            const currentAccount = localStorage.getItem('current_account');
            if (currentAccount && !accounts.includes(currentAccount)) {
                // Current account was removed, disconnect
                disconnect();
            }
        }
    }, []);

    // Check if already connected
    useEffect(() => {
        const checkConnection = async () => {
            try {
                if (window.ethereum) {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    setAvailableAccounts(accounts);
                    
                    if (accounts.length > 0) {
                        const token = localStorage.getItem('auth_token');
                        const savedAccount = localStorage.getItem('current_account');
                        
                        if (token && savedAccount && accounts.includes(savedAccount)) {
                            // Validate token and get roles for saved account
                            await validateToken(savedAccount, token);
                        } else if (token) {
                            // Use first account if saved account not available
                            await validateToken(accounts[0], token);
                        }
                    }
                }
                
                // Listen for account changes
                if (window.ethereum) {
                    window.ethereum.on('accountsChanged', handleAccountsChanged);
                }
            } catch (err) {
                console.error('Connection check failed:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        checkConnection();

        // Cleanup event listener
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    }, [handleAccountsChanged]);

    // Connect with specific account
    const connectWithAccount = async (selectedAccount) => {
        try {
            if (!window.ethereum) {
                throw new Error('Please install MetaMask');
            }

            // Request accounts access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            if (accounts.length === 0) {
                throw new Error('No accounts available in MetaMask');
            }

            // Check if the selected account is in the available accounts
            if (!accounts.includes(selectedAccount)) {
                throw new Error(`Please switch to account ${selectedAccount.slice(0, 6)}...${selectedAccount.slice(-4)} in MetaMask and try again`);
            }

            // Use the selected account for signing
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner(selectedAccount);
            const message = `Login to Land Registry System\n\nAddress: ${selectedAccount}\nTimestamp: ${new Date().toISOString()}`;
            const signature = await signer.signMessage(message);

            // Send to backend for verification
            const { token, user } = await authAPI.login({
                address: selectedAccount,
                signature,
                message
            });
            
            // Save auth info
            localStorage.setItem('auth_token', token);
            localStorage.setItem('current_account', selectedAccount);
            setAccount(selectedAccount);
            setRoles(user.roles);
            setError(null);

            return user.roles;
        } catch (err) {
            console.error('Connection failed:', err);
            setError(err.message);
            throw err;
        }
    };

    // Connect with first available account (for backward compatibility)
    const connect = async () => {
        try {
            if (!window.ethereum) {
                throw new Error('Please install MetaMask');
            }

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length === 0) {
                throw new Error('No accounts available');
            }
            
            setAvailableAccounts(accounts);
            return await connectWithAccount(accounts[0]);
        } catch (err) {
            console.error('Connection failed:', err);
            setError(err.message);
            throw err;
        }
    };

    // Switch to different account
    const switchAccount = async (newAccount) => {
        try {
            // Check if the new account is available
            const currentAccounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (!currentAccounts.includes(newAccount)) {
                throw new Error(`Please switch to account ${newAccount.slice(0, 6)}...${newAccount.slice(-4)} in MetaMask first, then try again`);
            }

            // Disconnect current session
            localStorage.removeItem('auth_token');
            localStorage.removeItem('current_account');
            setAccount(null);
            setRoles([]);
            
            // Connect with new account
            return await connectWithAccount(newAccount);
        } catch (err) {
            console.error('Account switch failed:', err);
            setError(err.message);
            throw err;
        }
    };

    // Validate existing token
    const validateToken = async (address, token) => {
        try {
            const { roles } = await authAPI.validateToken();
            setAccount(address);
            setRoles(roles);
            localStorage.setItem('current_account', address);
            return roles;
        } catch (err) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('current_account');
            setAccount(null);
            setRoles([]);
            throw err;
        }
    };

    // Disconnect
    const disconnect = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_account');
        setAccount(null);
        setRoles([]);
    };

    // Check role
    const hasRole = (role) => {
        return roles.includes(role);
    };

    const value = {
        account,
        availableAccounts,
        roles,
        loading,
        error,
        connect,
        connectWithAccount,
        switchAccount,
        getAvailableAccounts,
        disconnect,
        hasRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 