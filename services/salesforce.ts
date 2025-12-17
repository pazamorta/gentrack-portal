// Secure browser-compatible Salesforce service using backend proxy
export interface MeterPoint {
    mpan: string;
    meterNumber: string;
    address?: string;
}

export interface Site {
    name: string;
    address?: string;
    meterPoints: MeterPoint[];
}

export interface BillingAccount {
    accountNumber: string;
    invoices: string[]; // Invoice IDs
}

export interface Contact {
    firstName?: string;
    lastName: string;
    email?: string;
    phone?: string;
    salesforceId?: string;
}

export interface SalesforceAccount {
    name: string;
    companyNumber: string;
    billingAccounts: BillingAccount[];
    sites: Site[];
    salesforceId?: string;
}

export interface Opportunity {
    name: string;
    stage: string;
    amount?: number;
    closeDate: string;
    salesforceId?: string;
}

export interface ParsedInvoiceData {
    companyName: string;
    companyNumber?: string;
    accountNumber?: string;
    invoiceNumber?: string;
    totalAmount?: number;
    totalConsumption?: number; // in MWh
    invoiceDate?: string;
    contactFirstName?: string;
    contactLastName?: string;
    contactEmail?: string;
    contactPhone?: string;
    sites: Site[];
    fileContent?: string; // Base64 encoded content
    fileName?: string;
    
    // Additional fields for full conversion
    leadId?: string;
    industry?: string;
    companySize?: string;
    useCase?: string;
    timeline?: string;
    budget?: string;
    portfolioSize?: string;
}

export interface SuccessResponse {
    success: boolean;
    message: string;
    records?: {
        instanceUrl: string;
        accountId: string;
        contactId: string;
        opportunityId: string;
        stage?: string;
        sitesCreated?: number;
        servicePointsCreated?: number;
        contentDocumentId?: string;
    };
    createdRecords?: {
        account: SalesforceAccount;
        contact?: Contact;
        opportunity: Opportunity;
    };
}

// Backend API URL - configurable via environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const salesforceService = {
    /**
     * Create a Lead in Salesforce
     */
    createLead: async (data: any): Promise<{ success: boolean; leadId?: string; message?: string }> => {
        try {
            const response = await fetch(`${API_URL}/api/salesforce/lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Create Lead error:', error);
            throw error;
        }
    },

    /**
     * Create Salesforce records from invoice data via backend proxy
     * This keeps credentials secure on the server
     */
    createRecordsFromInvoice: async (data: ParsedInvoiceData): Promise<SuccessResponse> => {
        console.log('Creating Salesforce records via backend proxy:', data.companyName);

        try {
            const response = await fetch(`${API_URL}/api/salesforce/invoice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to create Salesforce records');
            }

            console.log('✅ Successfully created Salesforce records via backend');
            return result;

        } catch (error) {
            console.error('❌ Salesforce integration error:', error);
            
            // Provide helpful error messages
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Cannot connect to backend server. Please ensure the server is running on ' + API_URL);
            }
            
            throw new Error(`Salesforce error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Execute a SOQL query via backend proxy (for debugging/testing)
     */
    query: async (soql: string): Promise<any> => {
        try {
            const response = await fetch(`${API_URL}/api/salesforce/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ soql }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            return response.json();

        } catch (error) {
            console.error('Query error:', error);
            throw error;
        }
    },

    /**
     * Health check to verify backend is running
     */
    healthCheck: async (): Promise<boolean> => {
        try {
            const response = await fetch(`${API_URL}/api/health`);
            return response.ok;
        } catch (error) {
            console.error('Backend health check failed:', error);
            return false;
        }
    }
};
