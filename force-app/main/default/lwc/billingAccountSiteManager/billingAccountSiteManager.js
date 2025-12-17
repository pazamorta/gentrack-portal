import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getBillingAccounts from '@salesforce/apex/BillingAccountSiteController.getBillingAccounts';
import getSites from '@salesforce/apex/BillingAccountSiteController.getSites';
import updateSites from '@salesforce/apex/BillingAccountSiteController.updateSites';

export default class BillingAccountSiteManager extends LightningElement {
    @api recordId; // Parent Account Id
    
    @track selectedAccountId = null;
    @track currentTab = 'unassigned';
    @track isSaving = false;

    // Staging changes: SiteId -> TargetBillingAccountId (null for unlink, ID for link)
    @track stagedChanges = {}; 

    wiredBillingAccountsResult;
    wiredSitesResult;

    @track allSites = [];

    // --- Wire Services ---

    @wire(getBillingAccounts, { parentId: '$recordId' })
    wiredBillingAccounts(result) {
        this.wiredBillingAccountsResult = result;
    }

    @wire(getSites, { parentId: '$recordId' })
    wiredSites(result) {
        this.wiredSitesResult = result;
        if (result.data) {
            this.allSites = JSON.parse(JSON.stringify(result.data));
        } else if (result.error) {
            this.showToast('Error', 'Failed to load sites', 'error');
        }
    }

    // --- Getters ---

    get billingAccounts() {
        if (!this.wiredBillingAccountsResult || !this.wiredBillingAccountsResult.data) {
            return { data: [], error: this.wiredBillingAccountsResult ? this.wiredBillingAccountsResult.error : null };
        }
        
        return {
            data: this.wiredBillingAccountsResult.data.map(acc => ({
                ...acc,
                itemClass: `slds-p-around_small account-item ${acc.Id === this.selectedAccountId ? 'selected' : ''}`
            })),
            error: null
        };
    }

    get selectedAccount() {
        if (!this.billingAccounts.data || !this.selectedAccountId) return null;
        return this.billingAccounts.data.find(acc => acc.Id === this.selectedAccountId);
    }

    get unassignedSites() {
        if (!this.allSites) return [];
        // Show sites that are (Not Linked in DB AND Not Staged to Link) OR (Linked in DB AND Staged to Unlink)
        // Effectively: Final Destination is NULL (or diff account?) 
        // Requirement 4: "See all Sites that are not linked to a Billing Account"
        // Adjusting logic to specifically filter for the Current View context.
        
        return this.allSites.filter(site => {
            // Determine effective link status considering staged changes
            let effectiveBillingAccount = site.Billing_Account__c;
            if (this.stagedChanges.hasOwnProperty(site.Id)) {
                effectiveBillingAccount = this.stagedChanges[site.Id];
            }

            // In Unassigned view, we want sites where effectiveBillingAccount is NULL
            // AND we want to allow selecting them to link to CURRENT selectedAccountId
            return effectiveBillingAccount == null || effectiveBillingAccount === undefined;
        }).map(site => ({
            ...site,
            pillClass: `site-pill ${this.stagedChanges[site.Id] === this.selectedAccountId ? 'selected' : ''}`
        }));
    }

    get linkedSites() {
        if (!this.allSites || !this.selectedAccountId) return [];
        
        return this.allSites.filter(site => {
            // Determine effective link
            let effectiveBillingAccount = site.Billing_Account__c;
            if (this.stagedChanges.hasOwnProperty(site.Id)) {
                effectiveBillingAccount = this.stagedChanges[site.Id];
            }

            // In Linked view, we want sites where effectiveBillingAccount is CURRENT selectedAccountId
            return effectiveBillingAccount === this.selectedAccountId;
        }).map(site => ({
            ...site,
            // If staged to UNLINK (null), it shouldn't show here? 
            // Wait, if I click it to remove, it stays here but looks selected (to remove)?
            // UX Pattern: 
            // Unassigned Tab -> Click to Select -> Save -> Moves to Linked.
            // Linked Tab -> Click to Select -> Save -> Moves to Unassigned.
            
            // If I click a lined site, I am staging it to become NULL.
            // So if stagedChanges[site.Id] === null, it is "selected for removal".
            pillClass: `site-pill linked ${this.stagedChanges[site.Id] === null ? 'selected-remove' : ''}`
        }));
    }

    get hasChanges() {
        return Object.keys(this.stagedChanges).length > 0;
    }

    // --- Handlers ---

    handleAccountSelect(event) {
        const accountId = event.currentTarget.dataset.id;
        if (this.hasChanges) {
            // Optional: confirm discard? For now just discard.
             if(!confirm('You have unsaved changes. Discard them?')) return;
             this.handleCancel();
        }
        this.selectedAccountId = accountId;
        this.currentTab = 'unassigned'; // Default to unassigned view
    }

    handleTabActive(event) {
        this.currentTab = event.target.value;
    }

    handleSiteToggle(event) {
        const siteId = event.currentTarget.dataset.id;
        const site = this.allSites.find(s => s.Id === siteId);
        
        // Check if already staged
        if (this.stagedChanges.hasOwnProperty(siteId)) {
            // Toggle off (remove from staging)
            delete this.stagedChanges[siteId];
            this.stagedChanges = { ...this.stagedChanges }; // Trigger reactivity
        } else {
            // Toggle on (add to staging)
            // If we are in 'unassigned', we are staging to Link (to selectedAccountId)
            // If we are in 'linked', we are staging to Unlink (to null)
            
            // However, relying on the Tab might be brittle if items move.
            // Let's rely on calculation.
            
            let current effectiveBillingAccount = site.Billing_Account__c; 
            // (Only DB value matters for toggle-on, if it was staged we would have hit the first if block)
            
            if (effectiveBillingAccount === this.selectedAccountId) {
                // It is currently linked, so we stage to UNLINK
                this.stagedChanges = { ...this.stagedChanges, [siteId]: null };
            } else {
                // It is currently unlinked (or linked to other), so we stage to LINK
                this.stagedChanges = { ...this.stagedChanges, [siteId]: this.selectedAccountId };
            }
        }
    }

    handleCancel() {
        this.stagedChanges = {};
    }

    async handleSave() {
        this.isSaving = true;

        // Separate into lists for processing (though Apex handles list of IDs + target)
        // We have two operations: Link and Unlink.
        // Or we can just iterate.
        // Apex `updateSites` takes (List<Id>, Id target).
        // So we need to batch:
        // 1. Sites to Link to selectedAccountId
        // 2. Sites to Unlink (target null)

        const toLink = [];
        const toUnlink = [];

        Object.keys(this.stagedChanges).forEach(siteId => {
            const target = this.stagedChanges[siteId];
            if (target === this.selectedAccountId) {
                toLink.push(siteId);
            } else if (target === null) {
                toUnlink.push(siteId);
            }
        });

        try {
            const promises = [];
            if (toLink.length > 0) {
                promises.push(updateSites({ siteIds: toLink, billingAccountId: this.selectedAccountId }));
            }
            if (toUnlink.length > 0) {
                promises.push(updateSites({ siteIds: toUnlink, billingAccountId: null }));
            }

            await Promise.all(promises);

            this.showToast('Success', 'Changes saved successfully', 'success');
            this.stagedChanges = {};
            await refreshApex(this.wiredSitesResult); // Refresh data
            
        } catch (error) {
            this.showToast('Error', error.body ? error.body.message : 'Unknown Error', 'error');
            console.error(error);
        } finally {
            this.isSaving = false;
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
