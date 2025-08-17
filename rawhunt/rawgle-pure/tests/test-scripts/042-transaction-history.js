// Test Script 042: Transaction History Retrieval
// Purpose: Test PAWS transaction history retrieval and filtering
// Expected: Complete transaction history with proper chronological ordering and filtering

export default {
  id: '042',
  name: 'Transaction History Retrieval',
  description: 'Tests PAWS transaction history retrieval with filtering and pagination capabilities',
  category: 'PAWS',
  priority: 'Medium',
  
  async execute() {
    const results = [];
    const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
    
    try {
      const testEmail = `history-test-${Date.now()}@rawgle.com`;
      const recipientEmail = `history-recipient-${Date.now()}@rawgle.com`;
      
      // Step 1: Create test user
      results.push({
        step: 1,
        description: 'Creating test user for transaction history',
        status: 'running'
      });
      
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'HistoryTest123!'
        })
      });
      
      if (registerResponse.status === 201) {
        const userData = await registerResponse.json();
        results[0].status = 'passed';
        results[0].details = `Test user created: ${userData.userId} with ${userData.pawsBalance} PAWS`;
        
        // Step 2: Create recipient for transaction testing
        results.push({
          step: 2,
          description: 'Creating recipient user for transaction testing',
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
          
          // Step 3: Generate test transactions
          results.push({
            step: 3,
            description: 'Generating test transactions for history',
            status: 'running'
          });
          
          const transactions = [
            { type: 'reward', amount: 10, note: 'Daily feeding reward' },
            { type: 'transfer', toUserId: recipientData.userId, amount: 5, note: 'Transfer to friend' },
            { type: 'reward', amount: 15, note: 'Profile completion bonus' }
          ];
          
          let completedTransactions = 0;
          
          for (const transaction of transactions) {
            let response;
            
            if (transaction.type === 'reward') {
              response = await fetch(`${API_BASE}/api/paws/claim-reward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: userData.userId,
                  rewardType: 'manual',
                  amount: transaction.amount,
                  note: transaction.note
                })
              });
            } else if (transaction.type === 'transfer') {
              response = await fetch(`${API_BASE}/api/paws/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fromUserId: userData.userId,
                  toUserId: transaction.toUserId,
                  amount: transaction.amount,
                  note: transaction.note
                })
              });
            }
            
            if (response && (response.status === 200 || response.status === 201)) {
              completedTransactions++;
            }
            
            // Small delay between transactions
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          results[2].status = completedTransactions > 0 ? 'passed' : 'warning';
          results[2].details = `${completedTransactions}/${transactions.length} test transactions completed`;
          
          // Step 4: Retrieve complete transaction history
          results.push({
            step: 4,
            description: 'Retrieving complete transaction history',
            status: 'running'
          });
          
          const historyResponse = await fetch(`${API_BASE}/api/paws/transactions?userId=${userData.userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (historyResponse.status === 200) {
            const historyData = await historyResponse.json();
            
            if (historyData.transactions && Array.isArray(historyData.transactions)) {
              results[3].status = 'passed';
              results[3].details = `Retrieved ${historyData.transactions.length} transactions (including welcome bonus)`;
              
              // Step 5: Verify transaction chronological ordering
              results.push({
                step: 5,
                description: 'Verifying chronological ordering of transactions',
                status: 'running'
              });
              
              let properlyOrdered = true;
              for (let i = 1; i < historyData.transactions.length; i++) {
                const prevDate = new Date(historyData.transactions[i-1].timestamp);
                const currDate = new Date(historyData.transactions[i].timestamp);
                if (prevDate < currDate) {
                  properlyOrdered = false;
                  break;
                }
              }
              
              results[4].status = properlyOrdered ? 'passed' : 'failed';
              results[4].details = properlyOrdered ? 'Transactions properly ordered (newest first)' : 'Transaction ordering is incorrect';
              
              // Step 6: Test transaction type filtering
              results.push({
                step: 6,
                description: 'Testing transaction type filtering',
                status: 'running'
              });
              
              const filterResponse = await fetch(`${API_BASE}/api/paws/transactions?userId=${userData.userId}&type=transfer`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              });
              
              if (filterResponse.status === 200) {
                const filterData = await filterResponse.json();
                const allTransfersOnly = filterData.transactions.every(tx => tx.type === 'transfer' || tx.type === 'sent');
                
                results[5].status = allTransfersOnly ? 'passed' : 'warning';
                results[5].details = `Filter returned ${filterData.transactions.length} transactions, all transfers: ${allTransfersOnly}`;
              } else {
                results[5].status = 'warning';
                results[5].details = `Transaction filtering not available: ${filterResponse.status}`;
              }
              
              // Step 7: Test pagination
              results.push({
                step: 7,
                description: 'Testing transaction history pagination',
                status: 'running'
              });
              
              const paginatedResponse = await fetch(`${API_BASE}/api/paws/transactions?userId=${userData.userId}&limit=2&offset=0`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              });
              
              if (paginatedResponse.status === 200) {
                const paginatedData = await paginatedResponse.json();
                
                if (paginatedData.transactions.length <= 2) {
                  results[6].status = 'passed';
                  results[6].details = `Pagination working: ${paginatedData.transactions.length} transactions returned (limit 2)`;
                } else {
                  results[6].status = 'failed';
                  results[6].details = `Pagination failed: ${paginatedData.transactions.length} transactions returned (expected ≤2)`;
                }
              } else {
                results[6].status = 'warning';
                results[6].details = `Pagination not available: ${paginatedResponse.status}`;
              }
              
            } else {
              results[3].status = 'failed';
              results[3].details = 'Invalid transaction history format received';
            }
            
          } else {
            results[3].status = 'failed';
            results[3].details = `Failed to retrieve transaction history: ${historyResponse.status}`;
          }
          
        } else {
          results[1].status = 'failed';
          results[1].details = `Recipient registration failed: ${recipientResponse.status}`;
        }
        
      } else {
        results[0].status = 'failed';
        results[0].details = `User registration failed: ${registerResponse.status}`;
      }
      
    } catch (error) {
      results[0] = results[0] || { step: 1, description: 'Transaction history test setup', status: 'failed' };
      results[0].details = `Network Error: ${error.message}`;
    }
    
    return results;
  }
};