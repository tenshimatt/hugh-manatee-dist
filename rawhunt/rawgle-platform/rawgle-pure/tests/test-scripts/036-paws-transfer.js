// Test Script 036: PAWS Transfer Between Users
// Purpose: Test PAWS transfer functionality between registered users
// Expected: Successful transfer should update both sender and recipient balances

export default {
  id: '036',
  name: 'PAWS Transfer Between Users',
  description: 'Tests PAWS transfer functionality between registered users with balance validation',
  category: 'PAWS',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const senderEmail = `sender-${Date.now()}@rawgle.com`;
      const recipientEmail = `recipient-${Date.now()}@rawgle.com`;
      
      // Step 1: Create sender user
      results.push({
        step: 1,
        description: 'Creating sender user with initial PAWS balance',
        status: 'running'
      });
      
      const senderResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: senderEmail,
          password: 'Sender123!'
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
            password: 'Recipient123!'
          })
        });
        
        if (recipientResponse.status === 201) {
          const recipientData = await recipientResponse.json();
          results[1].status = 'passed';
          results[1].details = `Recipient created: ${recipientData.userId} with ${recipientData.pawsBalance} PAWS`;
          
          // Step 3: Perform PAWS transfer
          results.push({
            step: 3,
            description: 'Transferring PAWS between users',
            status: 'running'
          });
          
          const transferAmount = 25;
          const transferResponse = await fetch(`${API_BASE}/api/paws/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromUserId: senderData.userId,
              toUserId: recipientData.userId,
              amount: transferAmount,
              note: 'Test transfer'
            })
          });
          
          if (transferResponse.status === 200) {
            const transferData = await transferResponse.json();
            results[2].status = 'passed';
            results[2].details = `Transfer successful: ${transferAmount} PAWS, transaction ID: ${transferData.transactionId}`;
            
            // Step 4: Verify sender balance updated
            results.push({
              step: 4,
              description: 'Verifying sender balance reduction',
              status: 'running'
            });
            
            const senderBalanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${senderData.userId}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (senderBalanceResponse.status === 200) {
              const senderBalanceData = await senderBalanceResponse.json();
              const expectedBalance = senderData.pawsBalance - transferAmount;
              
              if (senderBalanceData.balance === expectedBalance) {
                results[3].status = 'passed';
                results[3].details = `Sender balance correct: ${senderBalanceData.balance} PAWS (reduced by ${transferAmount})`;
              } else {
                results[3].status = 'failed';
                results[3].details = `Sender balance incorrect: expected ${expectedBalance}, got ${senderBalanceData.balance}`;
              }
            } else {
              results[3].status = 'failed';
              results[3].details = `Failed to retrieve sender balance: ${senderBalanceResponse.status}`;
            }
            
            // Step 5: Verify recipient balance updated
            results.push({
              step: 5,
              description: 'Verifying recipient balance increase',
              status: 'running'
            });
            
            const recipientBalanceResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${recipientData.userId}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (recipientBalanceResponse.status === 200) {
              const recipientBalanceData = await recipientBalanceResponse.json();
              const expectedBalance = recipientData.pawsBalance + transferAmount;
              
              if (recipientBalanceData.balance === expectedBalance) {
                results[4].status = 'passed';
                results[4].details = `Recipient balance correct: ${recipientBalanceData.balance} PAWS (increased by ${transferAmount})`;
              } else {
                results[4].status = 'failed';
                results[4].details = `Recipient balance incorrect: expected ${expectedBalance}, got ${recipientBalanceData.balance}`;
              }
            } else {
              results[4].status = 'failed';
              results[4].details = `Failed to retrieve recipient balance: ${recipientBalanceResponse.status}`;
            }
            
          } else {
            const errorData = await transferResponse.json();
            results[2].status = 'failed';
            results[2].details = `Transfer failed: ${errorData.error}`;
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
      results[0] = results[0] || { step: 1, description: 'PAWS transfer test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};