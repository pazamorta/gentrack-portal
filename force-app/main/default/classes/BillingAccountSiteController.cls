public with sharing class BillingAccountSiteController {
    
    @AuraEnabled(cacheable=true)
    public static List<Account> getBillingAccounts(Id parentId) {
        return [
            SELECT Id, Name, AccountNumber 
            FROM Account 
            WHERE ParentId = :parentId 
            ORDER BY Name ASC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Site__c> getSites(Id parentId) {
        // Fetch ALL sites related to the parent account, effectively
        // This assumes Site__c has a direct or indirect relationship to the Parent Account.
        // Based on requirements, we need sites linked to Parent (Unassigned) OR linked to Child Billing Accounts (Assigned)
        
        return [
            SELECT Id, Name, Billing_Account__c, Billing_Account__r.Name
            FROM Site__c
            WHERE Account__c = :parentId
            ORDER BY Name ASC
        ];
    }

    @AuraEnabled
    public static void updateSites(List<Id> siteIds, Id billingAccountId) {
        if (siteIds == null || siteIds.isEmpty()) {
            return;
        }

        List<Site__c> sitesToUpdate = new List<Site__c>();
        for (Id siteId : siteIds) {
            sitesToUpdate.add(new Site__c(
                Id = siteId,
                Billing_Account__c = billingAccountId // If null, it unlinks
            ));
        }
        
        update sitesToUpdate;
    }
}
