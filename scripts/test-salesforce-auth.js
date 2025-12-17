import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function testAuth() {
    console.log('🔍 Diagnostic: Testing Salesforce Authentication...');
    
    // 1. Check Env Vars
    const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const username = process.env.SALESFORCE_USERNAME;
    const password = process.env.SALESFORCE_PASSWORD;
    const securityToken = process.env.SALESFORCE_SECURITY_TOKEN || '';

    console.log('\nConfiguration Detected:');
    console.log(`- Login URL:     ${loginUrl}`);
    console.log(`- Username:      ${username ? username : 'MISSING ❌'}`);
    console.log(`- Client ID:     ${clientId ? (clientId.substring(0, 5) + '...') : 'MISSING ❌'}`);
    console.log(`- Client Secret: ${clientSecret ? 'Present ✅' : 'MISSING ❌'}`);
    console.log(`- Password:      ${password ? 'Present ✅' : 'MISSING ❌'}`);
    console.log(`- Security Token:${securityToken ? 'Present (Length: ' + securityToken.length + ') ✅' : 'MISSING (May be required) ⚠️'}`);

    if (!clientId || !clientSecret || !username || !password) {
        console.error('\n❌ CRITICAL: Missing required credentials.');
        return;
    }

    // 2. Prepare Request (Ensure no whitespace)
    const cleanDetails = {
        loginUrl: loginUrl.trim(),
        username: username.trim(),
        password: password.trim(),
        token: securityToken.trim()
    };

    console.log('\n🔍 Deep Inspection:');
    console.log(`- Username: '${cleanDetails.username}' (Length: ${cleanDetails.username.length})`);
    console.log(`- Client ID: '${clientId.substring(0, 5)}...' (Length: ${clientId.length})`);
    console.log(`- Password: '${cleanDetails.password.substring(0, 2)}...${cleanDetails.password.slice(-2)}' (Length: ${cleanDetails.password.length})`);
    console.log(`- Token: '${cleanDetails.token.substring(0, 2)}...${cleanDetails.token.slice(-2)}' (Length: ${cleanDetails.token.length})`);

    console.log('\n🔄 Attempting to authenticate (Method A: Password + Token)...');
    
    // First attempt: Password + Token
    const params = new URLSearchParams({
        grant_type: 'password',
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        username: cleanDetails.username,
        password: cleanDetails.password + cleanDetails.token,
    });

    const start = Date.now();
    try {
        let response = await fetch(`${cleanDetails.loginUrl}/services/oauth2/token`, {

            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        if (!response.ok && cleanDetails.token) {
             console.log('⚠️  Method A failed. Trying Method B: Password ONLY (in case IP is trusted)...');
             const paramsNoToken = new URLSearchParams({
                grant_type: 'password',
                client_id: clientId.trim(),
                client_secret: clientSecret.trim(),
                username: cleanDetails.username,
                password: cleanDetails.password,
            });
            response = await fetch(`${cleanDetails.loginUrl}/services/oauth2/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: paramsNoToken.toString(),
            });
        }
        
        // ... (rest of processing)
        const duration = Date.now() - start;

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`\n❌ Authentication Failed (${response.status}) after ${duration}ms:`);
            console.error('Response Body:', errorText);
            console.log('\n💡 Troubleshooting Tips:');
            console.log('1. "invalid_grant": Check Username, Password, or Security Token.');
            console.log('2. Check Login URL: Use "https://test.salesforce.com" for Sandboxes.');
            console.log('3. Security Token: Create one in Salesforce Settings if you are working remotely.');
            console.log('4. Connected App: Ensure "Relax IP restrictions" is enabled in OAuth policies.');
        } else {
            const data = await response.json();
            console.log(`\n✅ SUCCESS! Authenticated in ${duration}ms.`);
            console.log(`- Instance URL: ${data.instance_url}`);
            console.log(`- Token Type:   ${data.token_type}`);
            console.log('\nYour credentials are working correctly for the Integration.');
        }
    } catch (error) {
        console.error('\n❌ Network/System Error:');
        console.error(error);
    }
}

testAuth();
