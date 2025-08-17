#!/usr/bin/env python3
from flask import Flask, request, jsonify
import sqlite3
from datetime import datetime

app = Flask(__name__)

EMAIL_TEMPLATE = """Subject: We've Rebuilt Your Website — See the Results

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

Matt"""

def get_qualified_prospects():
    conn = sqlite3.connect("batch_analysis_results.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, business_name, website_url, email, phone, city, state,
               analysis_score, business_potential, outreach_email, processed_at,
               priority_rank, priority_label, approval_status
        FROM analysis_results 
        WHERE status='completed' 
        AND should_process=1
        AND (approval_status='pending' OR approval_status IS NULL)
        ORDER BY analysis_score ASC
        LIMIT 20
    """)
    
    results = []
    for row in cursor.fetchall():
        analysis_score = row[7] or 0
        
        # Generate estimated value and badge class
        if analysis_score <= 30:
            estimated_value = '$15k-$25k'
            badge_class = 'urgent'
        elif analysis_score <= 50:
            estimated_value = '$10k-$18k'
            badge_class = 'high'
        elif analysis_score <= 70:
            estimated_value = '$8k-$12k'
            badge_class = 'medium'
        else:
            estimated_value = '$5k-$8k'
            badge_class = 'low'
        
        # Generate recipient email
        try:
            domain = row[2].replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
            recipient_email = f"info@{domain}"
        except:
            recipient_email = "contact@example.com"
        
        results.append({
            'id': row[0],
            'business_name': row[1],
            'website_url': row[2],
            'email': row[3],
            'phone': row[4],
            'city': row[5],
            'state': row[6],
            'analysis_score': analysis_score,
            'priority_label': row[12] or 'NEEDS REVIEW',
            'estimated_value': estimated_value,
            'badge_class': badge_class,
            'business_potential': row[8] or 'unknown',
            'outreach_email': row[9],
            'processed_at': row[10],
            'recipient_email': recipient_email
        })
    
    conn.close()
    return results

@app.route('/')
def dashboard():
    prospects = get_qualified_prospects()
    
    html = f'''
<!DOCTYPE html>
<html>
<head>
    <title>FindRawDogFood - Qualified Prospects Dashboard</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .header {{ background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 30px; text-align: center; }}
        .prospect-card {{ background: white; margin: 20px 0; padding: 25px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }}
        .prospect-header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }}
        .business-name {{ font-size: 1.4rem; font-weight: bold; color: #333; }}
        .score-badge {{ font-size: 1.5rem; font-weight: bold; padding: 10px 20px; border-radius: 25px; color: white; }}
        .urgent {{ background: #dc3545; }}
        .high {{ background: #fd7e14; }}
        .medium {{ background: #ffc107; color: #333; }}
        .low {{ background: #28a745; }}
        .recipient-email {{ background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; }}
        .email-address {{ font-family: monospace; background: white; padding: 5px 10px; border-radius: 4px; }}
        .value-highlight {{ background: #e8f5e8; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0; }}
        .btn {{ padding: 15px 30px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin: 5px; }}
        .btn-approve {{ background: #28a745; color: white; }}
        .btn-reject {{ background: #dc3545; color: white; }}
        .website-link {{ color: #0066cc; text-decoration: none; }}
        .email-preview {{ background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e0e0e0; max-height: 200px; overflow-y: auto; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 FindRawDogFood - Qualified Prospects</h1>
        <p><strong>Independent Businesses • Worst Websites First</strong></p>
        <p>{len(prospects)} qualified prospects awaiting approval</p>
    </div>
'''
    
    for i, prospect in enumerate(prospects, 1):
        html += f'''
        <div class="prospect-card" id="prospect-{prospect['id']}">
            <div class="prospect-header">
                <div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 2rem; font-weight: bold; color: #666;">#{i}</span>
                        <div>
                            <div class="business-name">{prospect['business_name']}</div>
                            <div style="color: #666;">📍 {prospect.get('city', 'Unknown')}, {prospect.get('state', '')}</div>
                        </div>
                    </div>
                </div>
                <div class="score-badge {prospect['badge_class']}">
                    {prospect['analysis_score']}/100
                </div>
            </div>
            
            <div class="recipient-email">
                <strong>📧 Email will be sent to:</strong>
                <div class="email-address">{prospect['recipient_email']}</div>
            </div>
            
            <p><strong>Website:</strong> <a href="{prospect['website_url']}" target="_blank" class="website-link">{prospect['website_url']}</a></p>
            <p><strong>Priority:</strong> {prospect['priority_label']}</p>
            {f"<p><strong>Phone:</strong> {prospect['phone']}</p>" if prospect.get('phone') else ""}
            
            <div class="value-highlight">
                <strong>💰 Estimated Project Value: {prospect['estimated_value']}</strong>
            </div>
            
            <details>
                <summary><strong>📧 Email Preview</strong></summary>
                <div class="email-preview">{EMAIL_TEMPLATE}</div>
            </details>
            
            <div style="margin-top: 20px;">
                <button class="btn btn-approve" onclick="approveProspect({prospect['id']}, '{prospect['recipient_email']}')">
                    ✅ APPROVE & SEND EMAIL
                </button>
                <button class="btn btn-reject" onclick="rejectProspect({prospect['id']})">
                    ❌ REJECT PROSPECT
                </button>
            </div>
        </div>
        '''
    
    html += '''
    
    <script>
        async function approveProspect(prospectId, recipientEmail) {
            const confirmed = confirm(`SEND EMAIL TO: ${recipientEmail}\\n\\nApprove this prospect for outreach?`);
            if (!confirmed) return;
            
            try {
                const response = await fetch(`/api/approve/${prospectId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recipient_email: recipientEmail })
                });
                
                if (response.ok) {
                    const card = document.getElementById(`prospect-${prospectId}`);
                    card.style.background = '#d4edda';
                    alert(`✅ APPROVED! Email queued for: ${recipientEmail}`);
                    setTimeout(() => card.style.display = 'none', 2000);
                }
            } catch (error) {
                alert('Error approving prospect');
            }
        }
        
        async function rejectProspect(prospectId) {
            const notes = prompt('Rejection reason:');
            if (!notes) return;
            
            try {
                const response = await fetch(`/api/reject/${prospectId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notes: notes })
                });
                
                if (response.ok) {
                    const card = document.getElementById(`prospect-${prospectId}`);
                    card.style.background = '#f8d7da';
                    alert('❌ Prospect rejected');
                    setTimeout(() => card.style.display = 'none', 2000);
                }
            } catch (error) {
                alert('Error rejecting prospect');
            }
        }
    </script>
</body>
</html>
    '''
    
    return html

@app.route('/api/approve/<int:prospect_id>', methods=['POST'])
def approve_prospect(prospect_id):
    data = request.get_json()
    recipient_email = data.get('recipient_email', '')
    
    conn = sqlite3.connect("batch_analysis_results.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE analysis_results 
        SET approval_status='approved', 
            approved_by='Matt Wright', 
            approved_at=?, 
            recipient_email=?
        WHERE id=?
    """, (datetime.now(), recipient_email, prospect_id))
    
    conn.commit()
    conn.close()
    
    print(f"✅ APPROVED: Prospect {prospect_id} → {recipient_email}")
    return jsonify({'success': True})

@app.route('/api/reject/<int:prospect_id>', methods=['POST'])
def reject_prospect(prospect_id):
    data = request.get_json()
    notes = data.get('notes', '')
    
    conn = sqlite3.connect("batch_analysis_results.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE analysis_results 
        SET approval_status='rejected', 
            approved_by='Matt Wright', 
            approved_at=?, 
            approval_notes=?
        WHERE id=?
    """, (datetime.now(), notes, prospect_id))
    
    conn.commit()
    conn.close()
    
    print(f"❌ REJECTED: Prospect {prospect_id} - {notes}")
    return jsonify({'success': True})

if __name__ == '__main__':
    print("🚀 Starting Working Approval Dashboard...")
    print("📊 Dashboard URL: http://localhost:5001")
    print("")
    print("✅ Features:")
    print("   • Chain stores filtered out (like Tomlinsons subpages)")
    print("   • Worst websites ranked first")
    print("   • Shows recipient email addresses")
    print("   • Email template preview")
    print("   • Project value estimates")
    app.run(debug=True, port=5001, host='0.0.0.0')
