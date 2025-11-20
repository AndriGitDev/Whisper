// Utility functions for client-side encryption using Web Crypto API

export async function generateKey() {
    return window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function exportKey(key) {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return arrayBufferToBase64(exported);
}

export async function importKey(base64Key) {
    const rawKey = base64ToArrayBuffer(base64Key);
    return window.crypto.subtle.importKey(
        "raw",
        rawKey,
        "AES-GCM",
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptData(data, key) {
    const encodedData = new TextEncoder().encode(data);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        encodedData
    );

    return {
        encryptedData: arrayBufferToBase64(encryptedContent),
        iv: arrayBufferToBase64(iv)
    };
}

export async function decryptData(encryptedData, iv, key) {
    const encryptedBuffer = base64ToArrayBuffer(encryptedData);
    const ivBuffer = base64ToArrayBuffer(iv);

    try {
        const decryptedContent = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: ivBuffer
            },
            key,
            encryptedBuffer
        );

        return new TextDecoder().decode(decryptedContent);
    } catch (e) {
        console.error("Decryption failed:", e);
        throw new Error("Failed to decrypt data. The key might be incorrect or the data corrupted.");
    }
}

// Helper functions for Base64 conversion
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
