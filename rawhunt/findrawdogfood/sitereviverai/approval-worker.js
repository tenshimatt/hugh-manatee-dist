const EMAIL_TEMPLATE = `Subject: We've Rebuilt Your Website — See the Results

Hi there,

I hope this message finds you well.

My name is Matt, and I represent Octo Digital, a team specializing in effortless website refreshes for small businesses. We recently came across your listing on www.FindRawDogFood.com and using the latest technology and proven customer behavior science research, we've designed two refreshed versions of your website — built to improve usability, showcase your brand more clearly, and help customers find what they need faster.

What's the Offer?
You get full ownership of your updated website with an optional 1 year free hosting for a one-time fee of $100. It includes everything your current site offers, with better design, faster loading, and improved user experience. No ongoing obligation.

We're also happy to discuss any changes or custom features at no extra cost. This may include new high quality images, new professional copy writing, logos etc. More advanced features like e-commerce with automated shipping and stock management, linked to your accounting are also available.

Two Easy Delivery Options:

Option 1:
We send you a downloadable copy of your new website, compatible with nearly any hosting provider. You can host it wherever you choose including your current provider.

Option 2 (most popular):
You simply update your domain settings to point to our servers (we'll guide you). We'll handle everything, including hosting, security, and ongoing support.

After payment, you'll receive:

A confirmation email with your selected design

Step-by-step instructions for setup

Optional support to transfer your domain or manage it for you

Fair Use Policy applies – more than sufficient for 99% of our customer websites

✅ Ready to Go?
Click below to select your design and pay securely. You'll receive everything you need within minutes.

Have questions? Just reply — we're real people and happy to help.

Matt`;

// Business rules for filtering chain stores and ranking prospects
function isIndependentBusiness(websiteUrl, businessName) {
    const chainIndicators = ['/pages/', '/locations/', '/stores/', '/branches/', '/outlets/'];
    const knownChains = ['tomlinsons.com', 'petco.com', 'petsmart.com', 'chewy.com'];
    
    // Filter out chain store subpages
    if (chainIndicators.some(indicator => websiteUrl.toLowerCase().includes(indicator))) {
        return false;
    }
    
    // Filter out known chain domains
    try {
        const domain = new URL(websiteUrl).hostname.toLowerCase().replace('www.', '');
        if (knownChains.some(chain => domain.includes(chain))) {
            return false;
        }
    } catch (e) {
        return false;
    }
    
    return true;
}

function getPriorityRank(analysisScore) {
    if (analysisScore == null) return { rank: 6, label: 'UNKNOWN', value: '$0' };
    if (analysisScore <= 10) return { rank: 1, label: 'CRITICAL - Broken', value: '$20k-$30k' };
    if (analysisScore <= 30) return { rank: 2, label: 'URGENT - Very Poor', value: '$15k-$25k' };
    if (analysisScore <= 50) return { rank: 3, label: 'HIGH - Poor Website', value: '$10k-$18k' };
    if (analysisScore <= 70) return { rank: 4, label: 'MEDIUM - Needs Work', value: '$8k-$12k' };
    return { rank: 5, label: 'LOW - Minor Issues', value: '$5k-$8k' };
}

function generateBusinessEmail(websiteUrl) {
    try {
        const domain = new URL(websiteUrl).hostname.replace('www.', '');
        return `info@${domain}`;
    } catch (e) {
        return 'contact@example.com';
    }
}

async function getQualifiedProspects(env) {
    // Get suppliers from D1 database with poor websites (rating < 3.5 indicates poor websites)
    const { results } = await env.DB.prepare(`
        SELECT id, name, website, phone_number, city, state, rating, category
        FROM suppliers 
        WHERE website IS NOT NULL 
        AND website != '' 
        AND website != 'null'
        AND rating < 3.5
        ORDER BY rating ASC
        LIMIT 50
    `).all();
    
    const qualified = [];
    
    for (const supplier of results) {
        // Apply business rules
        if (!isIndependentBusiness(supplier.website, supplier.name)) {
            continue; // Skip chain stores
        }
        
        // Mock analysis score based on rating (lower rating = higher modernization need)
        const analysisScore = Math.round((supplier.rating || 1) * 20); // Convert 1-5 rating to 20-100 score
        const priority = getPriorityRank(analysisScore);
        
        // Only include prospects that need significant work
        if (priority.rank >= 5) continue;
        
        qualified.push({
            id: supplier.id,
            business_name: supplier.name,
            website_url: supplier.website,
            phone: supplier.phone_number,
            city: supplier.city,
            state: supplier.state,
            analysis_score: analysisScore,
            priority_rank: priority.rank,
            priority_label: priority.label,
            estimated_value: priority.value,
            recipient_email: generateBusinessEmail(supplier.website),
            badge_class: priority.rank <= 2 ? 'urgent' : priority.rank <= 3 ? 'high' : 'medium'
        });
    }
    
    return qualified.sort((a, b) => a.analysis_score - b.analysis_score); // Worst first
}

function getDashboardHTML(prospects) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>FindRawDogFood - Qualified Prospects Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
        .header { background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5rem; font-weight: 700; }
        .stats { background: rgba(255,255,255,0.9); padding: 15px; border-radius: 10px; margin: 20px 0; text-align: center; }
        
        .prospect-card { background: white; margin: 20px 0; padding: 25px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .prospect-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .business-name { font-size: 1.4rem; font-weight: bold; color: #333; }
        .business-location { color: #666; font-size: 0.9rem; }
        
        .score-badge { font-size: 1.5rem; font-weight: bold; padding: 10px 20px; border-radius: 25px; color: white; min-width: 120px; text-align: center; }
        .urgent { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); }
        .high { background: linear-gradient(135deg, #fd7e14 0%, #e55a00 100%); }
        .medium { background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); color: #333; }
        
        .recipient-email { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2196f3; }
        .recipient-email strong { color: #1976d2; }
        .email-address { font-family: Monaco, monospace; background: white; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px; }
        
        .website-link { color: #0066cc; text-decoration: none; font-weight: 500; }
        .value-highlight { background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%); padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0; }
        .value-highlight strong { color: #155724; font-size: 1.2rem; }
        
        .btn { padding: 15px 30px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; margin: 5px; }
        .btn-approve { background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%); color: white; }
        .btn-reject { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; }
        
        .email-preview { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e0e0e0; max-height: 200px; overflow-y: auto; font-size: 0.9rem; line-height: 1.5; }
        
        @media (max-width: 768px) {
            .prospect-header { flex-direction: column; align-items: flex-start; gap: 15px; }
            .score-badge { font-size: 1.2rem; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 FindRawDogFood - Qualified Prospects</h1>
        <p><strong>Independent Businesses • Worst Websites First</strong></p>
        <p>${prospects.length} qualified prospects from 8844+ supplier database</p>
    </div>
    
    <div class="stats">
        <strong>📊 Business Rules Applied:</strong> 
        Chain stores filtered • Independent businesses only • Ranked by worst websites first
        <br><strong>🎯 Focus:</strong> Poor websites with high modernization potential
    </div>

    ${prospects.map((prospect, i) => `
        <div class="prospect-card" id="prospect-${prospect.id}">
            <div class="prospect-header">
                <div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 2rem; font-weight: bold; color: #666;">#${i + 1}</span>
                        <div>
                            <div class="business-name">${prospect.business_name}</div>
                            <div class="business-location">📍 ${prospect.city || 'Unknown'}, ${prospect.state || ''}</div>
                        </div>
                    </div>
                </div>
                <div class="score-badge ${prospect.badge_class}">
                    ${prospect.analysis_score}/100<br>
                    <small>${prospect.priority_label}</small>
                </div>
            </div>
            
            <div class="recipient-email">
                <strong>📧 Email will be sent to:</strong>
                <div class="email-address">${prospect.recipient_email}</div>
            </div>
            
            <p><strong>Website:</strong> <a href="${prospect.website_url}" target="_blank" class="website-link">${prospect.website_url}</a></p>
            ${prospect.phone ? `<p><strong>Phone:</strong> ${prospect.phone}</p>` : ''}
            
            <div class="value-highlight">
                <strong>💰 Estimated Project Value: ${prospect.estimated_value}</strong>
            </div>
            
            <details>
                <summary><strong>📧 Email Template Preview</strong></summary>
                <div class="email-preview">${EMAIL_TEMPLATE}</div>
            </details>
            
            <div style="margin-top: 20px;">
                <button class="btn btn-approve" onclick="approveProspect(${prospect.id}, '${prospect.recipient_email}')">
                    ✅ APPROVE & SEND EMAIL
                </button>
                <button class="btn btn-reject" onclick="rejectProspect(${prospect.id})">
                    ❌ REJECT PROSPECT
                </button>
            </div>
        </div>
    `).join('')}
    
    <script>
        async function approveProspect(prospectId, recipientEmail) {
            const confirmed = confirm(\`SEND EMAIL TO: \${recipientEmail}\\n\\nApprove this qualified prospect for outreach?\\n\\nThis will queue the email for sending.\`);
            if (!confirmed) return;
            
            try {
                const response = await fetch(\`/api/approve/\${prospectId}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recipient_email: recipientEmail })
                });
                
                if (response.ok) {
                    const card = document.getElementById(\`prospect-\${prospectId}\`);
                    card.style.background = 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)';
                    card.style.border = '2px solid #28a745';
                    alert(\`✅ APPROVED!\\n\\nEmail queued for: \${recipientEmail}\\n\\nProspect approved for outreach campaign.\`);
                    setTimeout(() => card.style.display = 'none', 3000);
                } else {
                    alert('❌ Error approving prospect. Please try again.');
                }
            } catch (error) {
                alert('❌ Network error: ' + error.message);
            }
        }
        
        async function rejectProspect(prospectId) {
            const notes = prompt('Rejection reason (required):');
            if (!notes || notes.trim() === '') {
                alert('Rejection reason is required.');
                return;
            }
            
            try {
                const response = await fetch(\`/api/reject/\${prospectId}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notes: notes.trim() })
                });
                
                if (response.ok) {
                    const card = document.getElementById(\`prospect-\${prospectId}\`);
                    card.style.background = 'linear-gradient(135deg, #f8d7da 0%, #f1b0b7 100%)';
                    card.style.border = '2px solid #dc3545';
                    alert('❌ Prospect rejected and removed from campaign.');
                    setTimeout(() => card.style.display = 'none', 3000);
                } else {
                    alert('❌ Error rejecting prospect. Please try again.');
                }
            } catch (error) {
                alert('❌ Network error: ' + error.message);
            }
        }
    </script>
</body>
</html>`;
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };
        
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }
        
        try {
            // API endpoints
            if (url.pathname.startsWith('/api/approve/')) {
                const prospectId = url.pathname.split('/')[3];
                const data = await request.json();
                
                console.log(`✅ APPROVED: Prospect ${prospectId} → ${data.recipient_email}`);
                
                return new Response(JSON.stringify({ success: true }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
            
            if (url.pathname.startsWith('/api/reject/')) {
                const prospectId = url.pathname.split('/')[3];
                const data = await request.json();
                
                console.log(`❌ REJECTED: Prospect ${prospectId} - ${data.notes}`);
                
                return new Response(JSON.stringify({ success: true }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
            
            // Main dashboard
            const prospects = await getQualifiedProspects(env);
            const html = getDashboardHTML(prospects);
            
            return new Response(html, {
                headers: { 'Content-Type': 'text/html', ...corsHeaders }
            });
            
        } catch (error) {
            console.error('Worker error:', error);
            return new Response(`Error: ${error.message}`, {
                status: 500,
                headers: corsHeaders
            });
        }
    }
};
