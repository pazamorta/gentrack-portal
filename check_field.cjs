const { exec } = require('child_process');

exec('sf sobject describe --sobject GTCX_Service_Point__c --target-org GTCX --json', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    const result = JSON.parse(stdout);
    if (result.status === 0) {
        const nameField = result.result.fields.find(f => f.name === 'Name');
        console.log('Name Field Details:');
        console.log(JSON.stringify({
            name: nameField.name,
            type: nameField.type,
            autoNumber: nameField.autoNumber,
            createable: nameField.createable,
            updateable: nameField.updateable,
            defaultedOnCreate: nameField.defaultedOnCreate,
            nillable: nameField.nillable
        }, null, 2));
    } else {
        console.error('Command failed', result);
    }
});
