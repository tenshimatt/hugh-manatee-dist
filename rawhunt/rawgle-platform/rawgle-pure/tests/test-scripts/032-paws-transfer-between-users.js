// Test Script 032: PAWS Transfer Between Users
// Purpose: Test PAWS transfer functionality between user accounts
// Expected: HTTP 200 with successful transfer and updated balances

export default {
  id: '032',
  name: 'PAWS Transfer Between Users',
  description: 'Tests PAWS transfer functionality between different user accounts',
  category: 'PAWS',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const timestamp = Date.now();
      
      // Step 1: Create sender user
      results.push({
        step: 1,
        description: 'Creating sender user with PAWS balance',
        status: 'running'
      });
      
      const senderResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `sender-${timestamp}@rawgle.com`,
          password: 'SenderTest123!'
        })
      });
      
      if (senderResponse.status === 201) {
        const senderData = await senderResponse.json();
        results[0].status = 'passed';
        results[0].details = `Sender created with ${senderData.pawsBalance} PAWS`;
        
        // Step 2: Create recipient user
        results.push({
          step: 2,
          description: 'Creating recipient user',
          status: 'running'
        });
        
        const recipientResponse = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `recipient-${timestamp}@rawgle.com`,
            password: 'RecipientTest123!'
          })
        });
        
        if (recipientResponse.status === 201) {
          const recipientData = await recipientResponse.json();
          results[1].status = 'passed';
          results[1].details = `Recipient created with ${recipientData.pawsBalance} PAWS`;
          
          // Step 3: Transfer PAWS from sender to recipient
          results.push({
            step: 3,
            description: 'Transferring PAWS between users',
            status: 'running'
          });
          
          const transferResponse = await fetch(`${API_BASE}/api/paws/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromUserId: senderData.userId,
              toUserId: recipientData.userId,
              amount: 25,
              reason: 'Test transfer'
            })
          });
          
          if (transferResponse.status === 200) {
            const transferData = await transferResponse.json();
            results[2].status = 'passed';
            results[2].details = `Transfer successful: ${transferData.transferred} PAWS, ID: ${transferData.transactionId}`;
            
            // Step 4: Verify balance updates
            results.push({
              step: 4,
              description: 'Verifying balance updates after transfer',
              status: 'running'
            });
            
            const expectedSenderBalance = senderData.pawsBalance - 25;
            const expectedRecipientBalance = recipientData.pawsBalance + 25;
            
            if (transferData.fromBalance === expectedSenderBalance && 
                transferData.toBalance === expectedRecipientBalance) {
              results[3].status = 'passed';
              results[3].details = `Balances updated correctly: Sender ${transferData.fromBalance}, Recipient ${transferData.toBalance}`;
            } else {
              results[3].status = 'failed';
              results[3].details = `Balance mismatch: Expected sender ${expectedSenderBalance}, got ${transferData.fromBalance}`;\n            }\n            \n          } else {\n            const errorData = await transferResponse.json();\n            results[2].status = 'failed';\n            results[2].details = `Transfer failed: ${errorData.error}`;\n          }\n          \n        } else {\n          results[1].status = 'failed';\n          results[1].details = `Recipient creation failed: ${recipientResponse.status}`;\n        }\n        \n      } else {\n        results[0].status = 'failed';\n        results[0].details = `Sender creation failed: ${senderResponse.status}`;\n      }\n      \n    } catch (error) {\n      results[0] = results[0] || { step: 1, description: 'PAWS transfer test', status: 'failed' };\n      results[0].details = `Network Error: ${error.message}`;\n    }\n    \n    return results;\n  }\n};