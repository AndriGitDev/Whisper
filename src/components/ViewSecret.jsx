import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useLocation } from 'react-router-dom';
import { Unlock, AlertTriangle, EyeOff, Copy, Check } from 'lucide-react';
import { importKey, decryptData } from '../utils/cryptoUtils';

const ViewSecret = () => {
    const { id } = useParams();
    const location = useLocation();
    const [decryptedSecret, setDecryptedSecret] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [revealed, setRevealed] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchCalled = React.useRef(false);

    useEffect(() => {
        const fetchAndDecrypt = async () => {
            if (fetchCalled.current) return;
            fetchCalled.current = true;

            try {
                // 1. Get Key from Hash
                const hash = location.hash.substring(1); // Remove #
                if (!hash) {
                    throw new Error("Missing decryption key in URL");
                }

                // 2. Fetch Encrypted Data
                const response = await fetch(`/api/secret/${id}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("Secret not found or has expired.");
                    }
                    throw new Error("Failed to fetch secret.");
                }

                const data = await response.json();

                // 3. Decrypt
                const key = await importKey(hash);
                const secret = await decryptData(data.encryptedData, data.iv, key);

                setDecryptedSecret(secret);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if user clicks "Reveal" to prevent accidental burn-on-read?
        // For this MVP, we fetch immediately but hide UI until reveal?
        // Actually, fetching immediately burns the view count on the server.
        // Let's fetch immediately for simplicity, but maybe we should warn user first?
        // Current implementation: Fetch immediately.
        fetchAndDecrypt();
    }, [id, location.hash]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(decryptedSecret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto mt-10 p-6 glass-panel text-center border-red-500/30">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-gray-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-10 md:p-16 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary-color to-transparent opacity-50" />

                {!revealed ? (
                    <div className="text-center space-y-8 py-10">
                        <div className="w-24 h-24 bg-secondary-color/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Unlock className="text-secondary-color w-12 h-12" />
                        </div>
                        <h2 className="text-4xl font-bold text-white">Secret Received</h2>
                        <p className="text-gray-400 max-w-lg mx-auto text-lg">
                            This secret has been decrypted locally. Once you view it, make sure to save it if needed.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setRevealed(true)}
                            className="whisper-button mt-8"
                        >
                            REVEAL SECRET
                        </motion.button>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-secondary-color flex items-center gap-3">
                                <EyeOff size={24} /> DECRYPTED CONTENT
                            </h2>
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center gap-2 text-base text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-md hover:bg-white/5 border border-transparent hover:border-white/10"
                            >
                                {copied ? <span className="text-green-500 font-bold">Copied!</span> : <span>Copy</span>}
                                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                            </button>
                        </div>

                        <div className="bg-black/40 p-8 rounded-xl border border-glass-border font-mono text-base md:text-lg break-all whitespace-pre-wrap max-h-[60vh] overflow-y-auto custom-scrollbar shadow-inner">
                            {decryptedSecret}
                        </div>

                        <div className="text-center pt-4">
                            <p className="text-xs text-gray-500">
                                This message was decrypted in your browser.
                            </p>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default ViewSecret;
