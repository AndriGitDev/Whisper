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
    const [loading, setLoading] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [readyToReveal, setReadyToReveal] = useState(false);

    const fetchCalled = React.useRef(false);

    useEffect(() => {
        // Validate that we have the required components
        const hash = location.hash.substring(1);
        if (!hash || !id) {
            setError("Invalid secret link - missing decryption key or ID");
            return;
        }
        setReadyToReveal(true);
    }, [id, location.hash]);

    const handleRevealClick = async () => {
        if (fetchCalled.current || loading) return;
        fetchCalled.current = true;
        setLoading(true);

        try {
            // 1. Get Key from Hash
            const hash = location.hash.substring(1); // Remove #
            if (!hash) {
                throw new Error("Missing decryption key in URL");
            }

            // 2. Fetch Encrypted Data (this burns a view)
            const response = await fetch(`/api/secret/${id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Secret not found or has expired.");
                }
                if (response.status === 429) {
                    throw new Error("Rate limit exceeded. Please try again in a moment.");
                }
                throw new Error("Failed to fetch secret.");
            }

            const data = await response.json();

            // 3. Decrypt
            const key = await importKey(hash);
            const secret = await decryptData(data.encryptedData, data.iv, key);

            setDecryptedSecret(secret);
            setRevealed(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(decryptedSecret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (error) {
        return (
            <div className="max-w-md mx-auto mt-10 p-6 glass-panel text-center border-red-500/30">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
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
                    <div className="space-y-8 text-center py-10">
                        <div className="flex justify-center mb-6">
                            <div className="w-24 h-24 bg-secondary-color/10 rounded-full flex items-center justify-center">
                                <Unlock className="text-secondary-color w-12 h-12" />
                            </div>
                        </div>

                        <h2 className="text-4xl font-bold text-white">Secret Ready</h2>

                        <div className="flex justify-center">
                            <p className="text-gray-400 max-w-lg text-lg">
                                Click below to retrieve and decrypt the secret. This will consume one view.
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <p className="text-yellow-500/80 text-sm max-w-md">
                                ⚠️ Warning: Once revealed, this action cannot be undone and will count against the view limit.
                            </p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleRevealClick}
                            disabled={!readyToReveal || loading}
                            className="whisper-button mt-8"
                        >
                            {loading ? 'RETRIEVING...' : 'REVEAL SECRET'}
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
