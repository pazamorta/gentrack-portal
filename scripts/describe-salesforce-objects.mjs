// Script to describe Salesforce objects and their fields using REST API
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const loginUrl = process.env.VITE_SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
const clientId = process.env.VITE_SALESFORCE_CLIENT_ID;
const clientSecret = process.env.VITE_SALESFORCE_CLIENT_SECRET;
const username = process.env.VITE_SALESFORCE_USERNAME;
const password = process.env.VITE_SALESFORCE_PASSWORD;
const securityToken = process.env.VITE_SALESFORCE_SECURITY_TOKEN || '';

let accessToken = null;
let instanceUrl = null;

async function authenticate() {
    const params = new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username: username,
        password: password + securityToken,
    });

    const response = await fetch(`${loginUrl}/services/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed: ${errorText}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    instanceUrl = data.instance_url;
}

async function salesforceRequest(endpoint) {
    const response = await fetch(`${instanceUrl}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    return response.json();
}

async function describeObject(objectName) {
    return salesforceRequest(`/services/data/v59.0/sobjects/${objectName}/describe`);
}

async function describeObjects() {
    try {
        console.log('🔐 Authenticating with Salesforce...');
        await authenticate();
        console.log('✅ Connected to Salesforce\n');

        // Objects to describe
        const objects = [
            'Account',
            'vlocity_cmt__Premises__c',
            'gtx_sales__Service_Point__c',
            'Opportunity'
        ];

        for (const objectName of objects) {
            console.log(`\n${'='.repeat(80)}`);
            console.log(`📋 Object: ${objectName}`);
            console.log('='.repeat(80));

            try {
                const metadata = await describeObject(objectName);
                
                console.log(`\nLabel: ${metadata.label}`);
                console.log(`API Name: ${metadata.name}`);
                console.log(`Createable: ${metadata.createable}`);
                console.log(`\nCreatable Fields:`);
                console.log('-'.repeat(80));

                const creatableFields = metadata.fields
                    .filter(f => f.createable)
                    .sort((a, b) => a.name.localeCompare(b.name));

                creatableFields.forEach(field => {
                    const required = field.nillable ? '' : ' [REQUIRED]';
                    console.log(`  ${field.name.padEnd(40)} (${field.type.padEnd(15)}) - ${field.label}${required}`);
                });

                console.log(`\nTotal creatable fields: ${creatableFields.length}`);

            } catch (error) {
                console.error(`❌ Error describing ${objectName}:`, error.message);
            }
        }

    } catch (error) {
        console.error('❌ Connection error:', error.message);
        console.error('\nPlease ensure your .env.local file contains:');
        console.error('  - VITE_SALESFORCE_CLIENT_ID');
        console.error('  - VITE_SALESFORCE_CLIENT_SECRET');
        console.error('  - VITE_SALESFORCE_USERNAME');
        console.error('  - VITE_SALESFORCE_PASSWORD');
        console.error('  - VITE_SALESFORCE_SECURITY_TOKEN (optional)');
        console.error('  - VITE_SALESFORCE_LOGIN_URL (optional, defaults to https://login.salesforce.com)');
    }
}

describeObjects();
