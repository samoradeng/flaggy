/**
 * Generate Apple Sign In JWT Secret for Supabase
 *
 * Usage:
 * 1. Place your .p8 file in this directory (or provide full path)
 * 2. Run: node generate-apple-secret.js
 */

const crypto = require('crypto');

// Your Apple Developer credentials
const TEAM_ID = '5P54VDRKV9';
const KEY_ID = 'TAMP9VNZF6';
const CLIENT_ID = 'com.flagtriv.signin';

// Read the .p8 file - update this path to your actual file
const fs = require('fs');
const path = require('path');

// Try to find .p8 file in current directory
const files = fs.readdirSync('.').filter(f => f.endsWith('.p8'));
if (files.length === 0) {
    console.error('❌ No .p8 file found in current directory.');
    console.error('   Place your AuthKey_TAMP9VNZF6.p8 file here and run again.');
    process.exit(1);
}

const p8File = files[0];
console.log(`📄 Using key file: ${p8File}`);

const privateKey = fs.readFileSync(p8File, 'utf8');

// Generate JWT manually (no external dependencies needed)
function base64url(data) {
    return Buffer.from(data)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function generateAppleClientSecret() {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + (180 * 24 * 60 * 60); // 180 days

    const header = {
        alg: 'ES256',
        kid: KEY_ID
    };

    const payload = {
        iss: TEAM_ID,
        iat: now,
        exp: expiry,
        aud: 'https://appleid.apple.com',
        sub: CLIENT_ID
    };

    const headerBase64 = base64url(JSON.stringify(header));
    const payloadBase64 = base64url(JSON.stringify(payload));
    const signatureInput = `${headerBase64}.${payloadBase64}`;

    // Sign with ES256
    const sign = crypto.createSign('SHA256');
    sign.update(signatureInput);
    const signature = sign.sign(privateKey);

    // Convert DER signature to raw r,s format for ES256
    // DER format: 0x30 [total-length] 0x02 [r-length] [r] 0x02 [s-length] [s]
    let offset = 2;
    const rLength = signature[offset + 1];
    offset += 2;
    let r = signature.slice(offset, offset + rLength);
    offset += rLength + 1;
    const sLength = signature[offset];
    offset += 1;
    let s = signature.slice(offset, offset + sLength);

    // Ensure r and s are 32 bytes each
    if (r.length > 32) r = r.slice(r.length - 32);
    if (s.length > 32) s = s.slice(s.length - 32);
    if (r.length < 32) r = Buffer.concat([Buffer.alloc(32 - r.length), r]);
    if (s.length < 32) s = Buffer.concat([Buffer.alloc(32 - s.length), s]);

    const rawSignature = Buffer.concat([r, s]);
    const signatureBase64 = base64url(rawSignature);

    return `${signatureInput}.${signatureBase64}`;
}

try {
    const jwt = generateAppleClientSecret();
    console.log('\n✅ Apple Client Secret JWT generated!\n');
    console.log('Copy this entire string and paste it into Supabase:\n');
    console.log('─'.repeat(60));
    console.log(jwt);
    console.log('─'.repeat(60));
    console.log('\n⏰ This JWT expires in 180 days. Set a reminder to regenerate it.\n');
} catch (error) {
    console.error('❌ Error generating JWT:', error.message);
    process.exit(1);
}
