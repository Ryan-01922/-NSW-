import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if already connected
    useEffect(() => {
        const checkConnection = async () => {
            try {
                if (window.ethereum) {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        const token = localStorage.getItem('auth_token');
                        if (token) {
                            // Validate token and get roles
                            await validateToken(accounts[0], token);
                        }
                    }
                }
            } catch (err) {
                console.error('Connection check failed:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        checkConnection();
    }, []);

    // Connect wallet
    const connect = async () => {
        try {
            if (!window.ethereum) {
                throw new Error('Please install MetaMask');
            }

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            // Generate signature
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const message = `Login to Land Registry System\n\nAddress: ${account}\nTimestamp: ${new Date().toISOString()}`;
            const signature = await signer.signMessage(message);

            // Send to backend for verification
            const { token, user } = await authAPI.login({
                address: account,
                signature,
                message
            });
            
            // Save auth info
            localStorage.setItem('auth_token', token);
            setAccount(account);
            setRoles(user.roles);
            setError(null);

            return user.roles;
        } catch (err) {
            console.error('Connection failed:', err);
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
            return roles;
        } catch (err) {
            localStorage.removeItem('auth_token');
            setAccount(null);
            setRoles([]);
            throw err;
        }
    };

    // Disconnect
    const disconnect = () => {
        localStorage.removeItem('auth_token');
        setAccount(null);
        setRoles([]);
    };

    // Check role
    const hasRole = (role) => {
        return roles.includes(role);
    };

    const value = {
        account,
        roles,
        loading,
        error,
        connect,
        disconnect,
        hasRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 