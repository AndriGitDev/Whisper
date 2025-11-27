import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Lock, Clock, Eye, Copy, Check, ShieldCheck, ChevronDown } from 'lucide-react';
import { generateKey, exportKey, encryptData } from '../utils/cryptoUtils';

const CreateSecret = () => {
    const [secret, setSecret] = useState('');
    const [expiration, setExpiration] = useState(0); // 0 = 24 hours default
    const [views, setViews] = useState(1);
    const [generatedLink, setGeneratedLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCreate = async () => {
        if (!secret) return;
        setLoading(true);

        try {
            // 1. Generate Key
            const key = await generateKey();
            const exportedKey = await exportKey(key);

            // 2. Encrypt Data
            const { encryptedData, iv } = await encryptData(secret, key);

            // 3. Send to Backend
            const response = await fetch('/api/secret', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encryptedData,
                    iv,
                    salt: 'unused-in-this-version', // Kept for schema compatibility if needed later
                    expiration: expiration === 0 ? 86400 : expiration, // Default 24h
                    views
                })
            });

            const data = await response.json();

            if (data.id) {
                // 4. Construct Link
                // Format: https://domain.com/view/ID#KEY
                const link = `${window.location.origin}/view/${data.id}#${exportedKey}`;
                setGeneratedLink(link);
            }
        } catch (error) {
            console.error("Failed to create secret:", error);
            alert(`Failed to create secret: ${error.message}. \n\nIf you just updated the code, try restarting your dev server.`);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-4xl mx-auto">


            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="glass-panel p-10 md:p-16 relative overflow-hidden border-t border-white/10 shadow-2xl"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-color to-transparent opacity-50" />


                {!generatedLink ? (
                    <div className="space-y-16">
                        <div>
                            <label className="block text-sm text-gray-400 mb-3 font-mono tracking-wider uppercase text-center">Your Secret</label>
                            <textarea
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                placeholder="Paste your password, private key, or secret message here..."
                                className="whisper-input h-64 resize-none leading-relaxed"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div>
                                <label className="block text-sm text-gray-400 mb-3 font-mono flex items-center justify-center gap-2 tracking-wider uppercase">
                                    <Clock size={14} /> Expiration
                                </label>
                                <div className="relative">
                                    <select
                                        value={expiration}
                                        onChange={(e) => setExpiration(Number(e.target.value))}
                                        className="whisper-input cursor-pointer"
                                    >
                                        <option value={3600}>1 Hour</option>
                                        <option value={86400}>24 Hours</option>
                                        <option value={604800}>7 Days</option>
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={24} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-3 font-mono flex items-center justify-center gap-2 tracking-wider uppercase">
                                    <Eye size={14} /> Max Views
                                </label>
                                <div className="relative">
                                    <select
                                        value={views}
                                        onChange={(e) => setViews(Number(e.target.value))}
                                        className="whisper-input cursor-pointer"
                                    >
                                        <option value={1}>1 View (Burn on read)</option>
                                        <option value={5}>5 Views</option>
                                        <option value={10}>10 Views</option>
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={24} />
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCreate}
                            disabled={!secret || loading}
                            className="whisper-button"
                        >
                            {loading ? 'ENCRYPTING...' : 'GENERATE SECURE LINK'}
                        </motion.button>

                        <div className="text-xs text-gray-500 text-center font-mono flex items-center justify-center gap-2">
                            <ShieldCheck size={12} />
                            Client-side encryption enabled. Server never sees your secret.
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8 text-center"
                    >
                        <div className="w-20 h-20 bg-primary-color/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="text-primary-color w-10 h-10" />
                        </div>

                        <h3 className="text-3xl font-bold text-white">Link Generated!</h3>
                        <p className="text-gray-400 text-sm">
                            Share this link. It contains the decryption key.
                        </p>

                        <div className="bg-black/50 p-6 rounded-lg border border-glass-border flex items-center gap-4">
                            <input
                                type="text"
                                readOnly
                                value={generatedLink}
                                className="w-full bg-transparent border-none focus:ring-0 text-primary-color font-mono text-lg p-0"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="p-2 hover:bg-white/10 rounded-md transition-colors"
                            >
                                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setGeneratedLink('');
                                setSecret('');
                            }}
                            className="text-sm text-gray-500 hover:text-white underline decoration-dotted"
                        >
                            Create another secret
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default CreateSecret;
