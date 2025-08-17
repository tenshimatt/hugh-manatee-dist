// Test Script 037: Insufficient Balance Transfer
// Purpose: Test that transfers with insufficient balance are properly rejected
// Expected: HTTP 400 with clear error message about insufficient funds

export default {
  id: '037',
  name: 'Insufficient Balance Transfer',
  description: 'Tests that PAWS transfers with insufficient sender balance are properly rejected',
  category: 'PAWS',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const senderEmail = `insufficient-sender-${Date.now()}@rawgle.com`;
      const recipientEmail = `insufficient-recipient-${Date.now()}@rawgle.com`;
      
      // Step 1: Create sender user with limited balance
      results.push({
        step: 1,
        description: 'Creating sender user with limited PAWS balance',
        status: 'running'
      });
      
      const senderResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: senderEmail,
          password: 'InsufficientTest123!'
        })
      });
      
      if (senderResponse.status === 201) {
        const senderData = await senderResponse.json();
        results[0].status = 'passed';
        results[0].details = `Sender created: ${senderData.userId} with ${senderData.pawsBalance} PAWS`;
        
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
            email: recipientEmail,
            password: 'RecipientTest123!'
          })
        });
        
        if (recipientResponse.status === 201) {
          const recipientData = await recipientResponse.json();
          results[1].status = 'passed';
          results[1].details = `Recipient created: ${recipientData.userId}`;
          
          // Step 3: Attempt transfer exceeding sender balance
          results.push({
            step: 3,
            description: 'Attempting transfer exceeding sender balance',
            status: 'running'
          });
          
          const transferAmount = senderData.pawsBalance + 100; // More than available
          const transferResponse = await fetch(`${API_BASE}/api/paws/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromUserId: senderData.userId,
              toUserId: recipientData.userId,
              amount: transferAmount,
              note: 'Insufficient balance test'
            })
          });
          
          if (transferResponse.status === 400 || transferResponse.status === 422) {
            const errorData = await transferResponse.json();
            if (errorData.error && errorData.error.toLowerCase().includes('insufficient')) {
              results[2].status = 'passed';
              results[2].details = `Transfer correctly rejected: ${errorData.error}`;
            } else {
              results[2].status = 'failed';
              results[2].details = `Transfer rejected but with unclear error: ${errorData.error}`;
            }
          } else if (transferResponse.status === 200) {
            results[2].status = 'failed';
            results[2].details = 'Transfer succeeded when it should have failed due to insufficient balance';
          } else {
            const errorData = await transferResponse.json();
            results[2].status = 'warning';
            results[2].details = `Unexpected response: ${transferResponse.status} - ${errorData.error}`;
          }
          
          // Step 4: Verify sender balance unchanged
          results.push({
            step: 4,
            description: 'Verifying sender balance remains unchanged',
            status: 'running'
          });
          
          const balanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${senderData.userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (balanceResponse.status === 200) {
            const balanceData = await balanceResponse.json();
            if (balanceData.balance === senderData.pawsBalance) {
              results[3].status = 'passed';
              results[3].details = `Sender balance unchanged: ${balanceData.balance} PAWS`;
            } else {
              results[3].status = 'failed';
              results[3].details = `Sender balance changed unexpectedly: ${balanceData.balance} (expected ${senderData.pawsBalance})`;
            }
          } else {
            results[3].status = 'failed';
            results[3].details = `Failed to retrieve sender balance: ${balanceResponse.status}`;
          }
          
          // Step 5: Test edge case - exact balance transfer
          results.push({
            step: 5,
            description: 'Testing edge case: transfer of entire balance',
            status: 'running'
          });
          
          const exactTransferResponse = await fetch(`${API_BASE}/api/paws/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromUserId: senderData.userId,
              toUserId: recipientData.userId,
              amount: senderData.pawsBalance,
              note: 'Exact balance transfer test'
            })
          });
          
          if (exactTransferResponse.status === 200) {
            results[4].status = 'passed';
            results[4].details = 'Exact balance transfer succeeded as expected';
          } else if (exactTransferResponse.status === 400 || exactTransferResponse.status === 422) {
            const errorData = await exactTransferResponse.json();
            results[4].status = 'warning';
            results[4].details = `Exact balance transfer rejected: ${errorData.error}`;
          } else {
            results[4].status = 'failed';
            results[4].details = `Unexpected response for exact balance transfer: ${exactTransferResponse.status}`;
          }
          
        } else {
          results[1].status = 'failed';
          results[1].details = `Recipient registration failed: ${recipientResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `Sender registration failed: ${senderResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Insufficient balance test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};