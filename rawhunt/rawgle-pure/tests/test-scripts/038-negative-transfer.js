// Test Script 038: Negative Transfer Prevention
// Purpose: Test that negative or zero transfer amounts are properly rejected
// Expected: HTTP 400 with validation error for non-positive amounts

export default {
  id: '038',
  name: 'Negative Transfer Prevention',
  description: 'Tests that negative or zero PAWS transfer amounts are properly rejected with validation errors',
  category: 'PAWS',
  priority: 'High',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const senderEmail = `negative-sender-${Date.now()}@rawgle.com`;
      const recipientEmail = `negative-recipient-${Date.now()}@rawgle.com`;
      
      // Step 1: Create sender user
      results.push({
        step: 1,
        description: 'Creating sender user for negative transfer testing',
        status: 'running'
      });
      
      const senderResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: senderEmail,
          password: 'NegativeTest123!'
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
          
          // Step 3: Test negative transfer amount
          results.push({
            step: 3,
            description: 'Testing negative transfer amount rejection',
            status: 'running'
          });
          
          const negativeTransferResponse = await fetch(`${API_BASE}/api/paws/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromUserId: senderData.userId,
              toUserId: recipientData.userId,
              amount: -25,
              note: 'Negative amount test'
            })
          });
          
          if (negativeTransferResponse.status === 400 || negativeTransferResponse.status === 422) {
            const errorData = await negativeTransferResponse.json();
            results[2].status = 'passed';
            results[2].details = `Negative transfer correctly rejected: ${errorData.error}`;
          } else {
            results[2].status = 'failed';
            results[2].details = `Negative transfer not properly rejected: ${negativeTransferResponse.status}`;
          }
          
          // Step 4: Test zero transfer amount
          results.push({
            step: 4,
            description: 'Testing zero transfer amount rejection',
            status: 'running'
          });
          
          const zeroTransferResponse = await fetch(`${API_BASE}/api/paws/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromUserId: senderData.userId,
              toUserId: recipientData.userId,
              amount: 0,
              note: 'Zero amount test'
            })
          });
          
          if (zeroTransferResponse.status === 400 || zeroTransferResponse.status === 422) {
            const errorData = await zeroTransferResponse.json();
            results[3].status = 'passed';
            results[3].details = `Zero transfer correctly rejected: ${errorData.error}`;
          } else {
            results[3].status = 'failed';
            results[3].details = `Zero transfer not properly rejected: ${zeroTransferResponse.status}`;
          }
          
          // Step 5: Test extremely large negative number
          results.push({
            step: 5,
            description: 'Testing extremely large negative transfer amount',
            status: 'running'
          });
          
          const largeNegativeResponse = await fetch(`${API_BASE}/api/paws/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromUserId: senderData.userId,
              toUserId: recipientData.userId,
              amount: -999999999,
              note: 'Large negative test'
            })
          });
          
          if (largeNegativeResponse.status === 400 || largeNegativeResponse.status === 422) {
            const errorData = await largeNegativeResponse.json();
            results[4].status = 'passed';
            results[4].details = `Large negative transfer correctly rejected: ${errorData.error}`;
          } else {
            results[4].status = 'failed';
            results[4].details = `Large negative transfer not properly rejected: ${largeNegativeResponse.status}`;
          }
          
          // Step 6: Verify balances remain unchanged after all invalid attempts
          results.push({
            step: 6,
            description: 'Verifying balances unchanged after invalid transfers',
            status: 'running'
          });
          
          const finalSenderResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${senderData.userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          const finalRecipientResponse = await fetch(`${API_BASE}/api/paws/balance?userId=${recipientData.userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (finalSenderResponse.status === 200 && finalRecipientResponse.status === 200) {
            const senderBalance = await finalSenderResponse.json();
            const recipientBalance = await finalRecipientResponse.json();
            
            if (senderBalance.balance === senderData.pawsBalance && 
                recipientBalance.balance === recipientData.pawsBalance) {
              results[5].status = 'passed';
              results[5].details = `Balances unchanged: Sender ${senderBalance.balance}, Recipient ${recipientBalance.balance}`;
            } else {
              results[5].status = 'failed';
              results[5].details = `Balances changed unexpectedly after invalid transfers`;
            }
          } else {
            results[5].status = 'failed';
            results[5].details = 'Failed to retrieve final balances for verification';
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
      results[0] = results[0] || { step: 1, description: 'Negative transfer test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};