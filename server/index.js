import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Salesforce session cache
let salesforceSession = null;

/**
 * Authenticate with Salesforce using OAuth 2.0 Password Flow
 * Credentials are kept secure on the server
 */
async function authenticate() {
    // Check if we have a valid cached session
    if (salesforceSession && salesforceSession.expiresAt > Date.now()) {
        return salesforceSession;
    }

    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
    const refreshToken = process.env.SALESFORCE_REFRESH_TOKEN;

    // Method 1: Refresh Token Flow (Recommended)
    if (refreshToken && clientId && clientSecret) {
        try {
            console.log('🔄 Authenticating via Refresh Token...');
            const params = new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken
            });

            const response = await fetch(`${loginUrl}/services/oauth2/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });

            if (response.ok) {
                const data = await response.json();
                salesforceSession = {
                    accessToken: data.access_token,
                    instanceUrl: data.instance_url,
                    expiresAt: Date.now() + 90 * 60 * 1000, // 90 minutes
                };
                console.log('✅ Authenticated with Salesforce (Refresh Token)');
                return salesforceSession;
            } else {
                console.warn('⚠️ Refresh Token authentication failed. Falling back to password flow...');
                const text = await response.text();
                console.error('Refresh Token Error:', text);
            }
        } catch (e) {
            console.error('Refresh Token Network Error:', e);
        }
    }

    // Method 2: Password Flow (Legacy/Fallback)
    console.log('🔄 Authenticating via Password Flow...');
    
    const username = process.env.SALESFORCE_USERNAME;
    const password = process.env.SALESFORCE_PASSWORD;
    const securityToken = process.env.SALESFORCE_SECURITY_TOKEN || '';

    const missingCredentials = [];
    if (!clientId) missingCredentials.push('SALESFORCE_CLIENT_ID');
    if (!clientSecret) missingCredentials.push('SALESFORCE_CLIENT_SECRET');
    if (!username) missingCredentials.push('SALESFORCE_USERNAME');
    if (!password) missingCredentials.push('SALESFORCE_PASSWORD');

    if (missingCredentials.length > 0) {
        throw new Error(`Salesforce credentials not configured. Missing: ${missingCredentials.join(', ')}`);
    }

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
        throw new Error(`Salesforce authentication failed: ${errorText}`);
    }

    const data = await response.json();

    // Cache the session
    salesforceSession = {
        accessToken: data.access_token,
        instanceUrl: data.instance_url,
        expiresAt: Date.now() + 90 * 60 * 1000, // 90 minutes
    };

    console.log('✅ Authenticated with Salesforce (Password Flow)');
    return salesforceSession;
}

/**
 * Make an authenticated request to Salesforce REST API
 */
async function salesforceRequest(endpoint, options = {}) {
    const session = await authenticate();

    const url = `${session.instanceUrl}${endpoint}`;
    const headers = {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
        'Sforce-Duplicate-Rule-Header': 'allowSave=true',
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Salesforce API error: ${response.status} - ${errorText}`);
    }

    // Handle empty responses (like PATCH requests)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return null;
}

/**
 * Query Salesforce using SOQL
 */
async function query(soql) {
    const encodedQuery = encodeURIComponent(soql);
    return salesforceRequest(`/services/data/v59.0/query?q=${encodedQuery}`);
}

/**
 * Create a Salesforce record
 */
async function createRecord(objectType, data) {
    return salesforceRequest(
        `/services/data/v59.0/sobjects/${objectType}`,
        {
            method: 'POST',
            body: JSON.stringify(data),
        }
    );
}

/**
 * Update a Salesforce record
 */
async function updateRecord(objectType, id, data) {
    return salesforceRequest(
        `/services/data/v59.0/sobjects/${objectType}/${id}`,
        {
            method: 'PATCH',
            body: JSON.stringify(data),
        }
    );
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Salesforce proxy server is running' });
});

/**
 * Get OAuth Authorization URL
 * GET /api/auth/url
 */
app.get('/api/auth/url', (req, res) => {
    let loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
    // Remove trailing slash if present
    if (loginUrl.endsWith('/')) {
        loginUrl = loginUrl.slice(0, -1);
    }
    
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const redirectUri = req.query.redirect_uri || 'https://localhost:3000/oauth/callback';
    
    if (!clientId) {
        return res.status(500).json({ error: 'Missing SALESFORCE_CLIENT_ID env var' });
    }

    const url = `${loginUrl}/services/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    console.log('----------------------------------------------------');
    console.log('🔑 Generated Auth URL:');
    console.log(url);
    console.log('----------------------------------------------------');
    
    res.json({ url });
});

/**
 * Exchange Authorization Code for Tokens
 * POST /api/auth/exchange
 */
app.post('/api/auth/exchange', async (req, res) => {
    const { code, redirect_uri } = req.body;
    
    if (!code) {
        return res.status(400).json({ error: 'Missing code' });
    }

    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
    
    // Check if redirect_uri was passed, otherwise try to guess or use default
    const finalRedirectUri = redirect_uri || 'http://localhost:3000/oauth/callback';
    
    console.log('Using redirect_uri for exchange:', finalRedirectUri);

    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: finalRedirectUri
    });

    try {
        console.log('🔄 Exchanging Authorization Code for Tokens...');
        const response = await fetch(`${loginUrl}/services/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Exchange failed:', data);
            return res.status(response.status).json(data);
        }

        // Cache the session immediately
        salesforceSession = {
            accessToken: data.access_token,
            instanceUrl: data.instance_url,
            expiresAt: Date.now() + 90 * 60 * 1000,
        };
        
        // Log the Refresh Token for the user
        if (data.refresh_token) {
            console.log('\n===============================================================');
            console.log('🔐 NEW REFRESH TOKEN OBTAINED');
            console.log('Copy this to your .env.local as SALESFORCE_REFRESH_TOKEN:');
            console.log(data.refresh_token);
            console.log('===============================================================\n');
            
            process.env.SALESFORCE_REFRESH_TOKEN = data.refresh_token;
        }

        res.json({ 
            success: true, 
            message: 'Authenticated successfully',
            refresh_token: data.refresh_token 
        });
    } catch (error) {
        console.error('Exchange error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create Salesforce records from invoice data
 * POST /api/salesforce/invoice
 */
/**
 * Create a Salesforce Lead
 * POST /api/salesforce/lead
 */
app.post('/api/salesforce/lead', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 Received Lead data:', data.companyName);

        // Map form fields to Salesforce Lead fields
        const leadData = {
            FirstName: data.contactName.split(' ')[0],
            LastName: data.contactName.split(' ').slice(1).join(' ') || 'Unknown',
            Company: data.companyName,
            Email: data.email,
            Phone: data.phone,
            Title: data.jobTitle,
            Website: data.website,
            LeadSource: 'Web',
            Status: 'Open - Not Contacted',
            Description: `Created via Web Form. TPI: ${data.userType === 'tpi' ? 'Yes' : 'No'}`
        };

        if (data.tpiIdentifier) {
            leadData.Description += `\nTPI Identifier: ${data.tpiIdentifier}`;
        }

        const leadResult = await createRecord('Lead', leadData);

        if (!leadResult.success) {
            throw new Error('Failed to create Lead: ' + JSON.stringify(leadResult.errors));
        }

        console.log('✅ Created Lead:', leadResult.id);

        res.json({
            success: true,
            leadId: leadResult.id,
            message: 'Lead created successfully'
        });

    } catch (error) {
        console.error('❌ Create Lead error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Handle Full Form Submission (Invoice + Details)
 * POST /api/salesforce/invoice
 * Also handles Lead Conversion logic if leadId is present
 */
app.post('/api/salesforce/invoice', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 Received Form Submission:', data.companyName);
        console.log('   Lead ID:', data.leadId);

        // 1. Account Logic
        let accountId;
        const existingAccountsQuery = `SELECT Id FROM Account WHERE Name = '${data.companyName.replace(/'/g, "\\'")}' LIMIT 1`;
        const existingAccounts = await query(existingAccountsQuery);

        // Fields to update/set on Account
        const accountFields = {
            Industry: data.industry ? data.industry.charAt(0).toUpperCase() + data.industry.slice(1) : undefined,
            NumberOfEmployees: data.companySize ? parseInt(data.companySize.split('-')[0]) || undefined : undefined,
            Website: data.website,
            Description: `Updated from Web Form on ${new Date().toISOString()}`
        };
        
        // Add budget/timeline to description as they might not have standard fields
        if(data.budget || data.timeline || data.useCase) {
             accountFields.Description += `\n\nRequirements:\nUse Case: ${data.useCase}\nTimeline: ${data.timeline}\nBudget: ${data.budget}`;
        }

        if (existingAccounts.totalSize > 0) {
            accountId = existingAccounts.records[0].Id;
            console.log('Found existing account:', accountId);
            await updateRecord('Account', accountId, accountFields);
        } else {
            console.log('Creating new account...');
            const accountData = {
                Name: data.companyName,
                AccountNumber: data.companyNumber || undefined,
                Type: 'Prospect',
                ...accountFields
            };
            
            const accountResult = await createRecord('Account', accountData);
            if (!accountResult.success) {
                throw new Error('Failed to create Account: ' + JSON.stringify(accountResult.errors));
            }
            accountId = accountResult.id;
        }

        // 2. Lead Conversion (Simulation)
        // If we have a Lead ID, we should "convert" it by updating its status and linking it to the Account if possible
        // Since we can't easily use the /convert endpoint via REST JSON without complexity, we'll mimic the result:
        // - Ensure Contact Exists
        // - Ensure Opportunity Exists
        // - Mark Lead as 'Qualified' (or closed) to show it's moved on
        if (data.leadId) {
             console.log('Simulating Lead Conversion for Lead:', data.leadId);
             try {
                // Update Lead to associate with the (potentially new) Account if possible, 
                // or just mark it as handled. 
                // Note: Updating specific ConvertedAccountId fields on Lead is read-only usually. 
                // We will just update status.
                await updateRecord('Lead', data.leadId, { 
                    Status: 'Working - Contacted', // Or 'Closed - Converted' if allowed without API call
                    Description: `Form Completed. Linked to Account: ${accountId}`
                });
             } catch (e) {
                 console.warn('Failed to update Lead status:', e.message);
             }
        }

        // 3. Contact Logic
        let contactId;
        if (data.contactName || (data.contactFirstName)) { // Support both formats
             const lastName = data.contactName ? data.contactName.split(' ').slice(1).join(' ') || data.contactName : data.contactLastName;
             const firstName = data.contactName ? data.contactName.split(' ')[0] : data.contactFirstName;

            // Check for existing contact to avoid duplicates
            const email = data.email || data.contactEmail;
            let existingContacts = { totalSize: 0 };
            if (email) {
                 existingContacts = await query(`SELECT Id FROM Contact WHERE Email = '${email}' LIMIT 1`);
            }

            if (existingContacts.totalSize > 0) {
                contactId = existingContacts.records[0].Id;
                console.log('Found existing contact:', contactId);
                // Optionally update contact details
            } else {
                const contactData = {
                    AccountId: accountId,
                    FirstName: firstName,
                    LastName: lastName || 'Unknown',
                    Email: email,
                    Phone: data.phone || data.contactPhone,
                    MobilePhone: data.phone || data.contactPhone,
                    Title: data.jobTitle
                };
                
                const contactResult = await createRecord('Contact', contactData);
                if (contactResult.success) {
                    contactId = contactResult.id;
                    console.log('Created contact:', contactId);
                }
            }
        }

        // 4. Opportunity Logic
        // Determine Stage: If CSV uploaded (sites > 0) -> 'Qualification', else 'Prospecting'
        const hasSites = data.sites && data.sites.length > 0;
        const stageName = hasSites ? 'Qualification' : 'Prospecting';

        const opportunityData = {
            Name: `${data.companyName} - ${data.useCase || 'Energy'} Opportunity`,
            AccountId: accountId,
            StageName: stageName,
            Amount: data.totalAmount || undefined, // Estimate
            CloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            Description: `Generated from Web Form.\nUse Case: ${data.useCase}\nTimeline: ${data.timeline}\nBudget: ${data.budget}\n` +
                         `Portfolio Size: ${data.portfolioSize}\n`
        };

        if (contactId) {
            opportunityData.ContactId = contactId; // Primary Contact Role implicit
        }

        const opportunityResult = await createRecord('Opportunity', opportunityData);
        if (!opportunityResult.success) {
            throw new Error('Failed to create Opportunity: ' + JSON.stringify(opportunityResult.errors));
        }
        console.log('Created opportunity:', opportunityResult.id);


        // 5. Sites / Service Points Logic
        const createdPremises = [];
        const createdServicePoints = [];

        if (hasSites) {
            console.log(`Processing ${data.sites.length} sites...`);
            for (const site of data.sites) {
                // Create Premises
                const premisesResult = await createRecord('vlocity_cmt__Premises__c', {
                    Name: site.name || 'Site',
                    vlocity_cmt__StreetAddress__c: site.address || undefined,
                    vlocity_cmt__Status__c: 'Active',
                    vlocity_cmt__PremisesType__c: 'Commercial'
                });

                if (premisesResult.success) {
                    const premisesId = premisesResult.id;
                    createdPremises.push({ id: premisesId, name: site.name });

                    // Create Service Points for this Site
                    if (site.meterPoints && site.meterPoints.length > 0) {
                        for (const meterPoint of site.meterPoints) {
                            const servicePointResult = await createRecord('gtx_sales__Service_Point__c', {
                                gtx_sales__Market_Identifier__c: meterPoint.mpan || undefined,
                                gtx_sales__Service_External_Id__c: meterPoint.meterNumber || undefined,
                                gtx_sales__Service_Type__c: 'Electricity', // Default or derive
                                gtx_sales__Opportunity__c: opportunityResult.id, // Link to Opp
                                vlocity_cmt__PremisesId__c: premisesId,
                                gtx_sales__Annual_Consumption__c: data.totalConsumption || undefined
                            });

                            if (servicePointResult.success) {
                                createdServicePoints.push({
                                    id: servicePointResult.id,
                                    mpan: meterPoint.mpan
                                });
                            }
                        }
                    } else {
                         // Create at least one SP if none explicit? 
                         // For now, only if meter points exist (CSV flow)
                    }
                }
            }
        }
        
        // 6. Handle Invoice File Upload if present
         let fileId;
        if (data.fileContent && data.fileName) {
            const contentVersionResult = await createRecord('ContentVersion', {
                Title: data.fileName,
                PathOnClient: data.fileName,
                VersionData: data.fileContent,
                FirstPublishLocationId: accountId 
            });
            if (contentVersionResult.success) fileId = contentVersionResult.id;
        }


        // Response
        res.json({
            success: true,
            message: 'Application processed successfully',
            records: {
                accountId,
                contactId,
                opportunityId: opportunityResult.id,
                stage: stageName,
                sitesCreated: createdPremises.length,
                servicePointsCreated: createdServicePoints.length
            }
        });

    } catch (error) {
        console.error('❌ Salesforce integration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Generic SOQL query endpoint (for testing/debugging)
 * POST /api/salesforce/query
 */
app.post('/api/salesforce/query', async (req, res) => {
    try {
        const { soql } = req.body;
        
        if (!soql) {
            return res.status(400).json({ error: 'SOQL query is required' });
        }

        const result = await query(soql);
        res.json(result);
    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Salesforce proxy server running on http://localhost:${PORT}`);
    console.log(`📡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
