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

export interface SalesforceAccount {
    name: string;
    companyNumber: string;
    billingAccounts: BillingAccount[];
    sites: Site[];
}

export interface Opportunity {
    name: string;
    stage: string;
    amount?: number;
    closeDate: string;
}

export interface ParsedInvoiceData {
    companyName: string;
    companyNumber?: string;
    accountNumber?: string;
    invoiceNumber?: string;
    totalAmount?: number;
    invoiceDate?: string;
    sites: Site[];
}

export interface SuccessResponse {
    success: boolean;
    message: string;
    createdRecords: {
        account: SalesforceAccount;
        opportunity: Opportunity;
    };
}

export const salesforceService = {
    createRecordsFromInvoice: async (data: ParsedInvoiceData): Promise<SuccessResponse> => {
        console.log('Creating Salesforce records from invoice data:', data);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // content
        const account: SalesforceAccount = {
            name: data.companyName,
            companyNumber: data.companyNumber || 'UNKNOWN',
            billingAccounts: [
                {
                    accountNumber: data.accountNumber || 'NEW-ACC-' + Math.floor(Math.random() * 10000),
                    invoices: data.invoiceNumber ? [data.invoiceNumber] : [],
                },
            ],
            sites: data.sites,
        };

        const opportunity: Opportunity = {
            name: `${data.companyName} - New Energy Contract`,
            stage: 'Prospecting',
            amount: data.totalAmount,
            closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        };

        console.log('CREATED RECORD: Account', account);
        console.log('CREATED RECORD: Opportunity', opportunity);

        return {
            success: true,
            message: 'Successfully created Account, Billing Account, Site, and Opportunity records in Salesforce.',
            createdRecords: {
                account,
                opportunity,
            },
        };
    },
};
