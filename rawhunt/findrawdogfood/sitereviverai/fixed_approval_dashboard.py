#!/usr/bin/env python3
from flask import Flask, request, jsonify
import sqlite3
import json
from datetime import datetime

app = Flask(__name__)

class ApprovalSystem:
    def __init__(self):
        self.db_path = "batch_analysis_results.db"
    
    def get_pending_approvals(self, limit=20):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, business_name, website_url, phone, city, state,
                   analysis_score, business_potential, outreach_email, processed_at
            FROM analysis_results 
            WHERE status='completed' 
            ORDER BY analysis_score ASC
            LIMIT ?
        """, (limit,))
        
        results = []
        for row in cursor.fetchall():
            analysis_score = row[6] or 0
            if analysis_score <= 30:
                priority = 'URGENT REBUILD'
                estimated_value = '$15k-$25k'
            elif analysis_score <= 50:
                priority = 'HIGH PRIORITY'
                estimated_value = '$10k-$18k'
            elif analysis_score <= 70:
                priority = 'MEDIUM PRIORITY'
                estimated_value = '$8k-$12k'
            else:
                priority = 'LOW PRIORITY'
                estimated_value = '$5k-$8k'
            
            results.append({
                'id': row[0],
                'business_name': row[1],
                'website_url': row[2],
                'phone': row[3],
                'city': row[4],
                'state': row[5],
                'analysis_score': analysis_score,
                'rebuild_priority': priority,
                'estimated_value': estimated_value,
                'business_potential': row[7] or 'unknown',
                'outreach_email': row[8],
                'processed_at': row[9]
            })
        
        conn.close()
        return results

approval_system = ApprovalSystem()

@app.route('/')
def dashboard():
    prospects = approval_system.get_pending_approvals()
    
    html = f'''
<!DOCTYPE html>
<html>
<head>
    <title>FindRawDogFood - Modernization Dashboard</title>
    <style>
        body {{ font-family: Arial; margin: 20px; background: #f5f5f5; }}
        .header {{ background: #8B4513; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }}
        .prospect-card {{ background: white; margin: 10px 0; padding: 20px; border-radius: 8px; border-left: 5px solid #ddd; }}
        .prospect-header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }}
        .business-name {{ font-size: 1.3rem; font-weight: bold; }}
        .score-badge {{ padding: 8px 15px; border-radius: 20px; color: white; font-weight: bold; }}
        .urgent {{ background: #dc3545; }}
        .high {{ background: #fd7e14; }}
        .medium {{ background: #ffc107; color: #333; }}
        .low {{ background: #28a745; }}
        .website-link {{ color: #0066cc; text-decoration: none; }}
        .details {{ margin: 10px 0; }}
        .email-preview {{ background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; max-height: 150px; overflow-y: auto; font-size: 0.9rem; }}
        .btn {{ padding: 10px 20px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; }}
        .btn-approve {{ background: #28a745; color: white; }}
        .btn-reject {{ background: #dc3545; color: white; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🐕 FindRawDogFood - Modernization Dashboard</h1>
        <p>Review website modernization opportunities - {len(prospects)} prospects pending</p>
    </div>
'''
    
    for prospect in prospects:
        priority_class = prospect['rebuild_priority'].lower().replace(' ', '-')
        if 'urgent' in priority_class:
            badge_class = 'urgent'
        elif 'high' in priority_class:
            badge_class = 'high'
        elif 'medium' in priority_class:
            badge_class = 'medium'
        else:
            badge_class = 'low'
            
        html += f'''
        <div class="prospect-card">
            <div class="prospect-header">
                <div>
                    <div class="business-name">{prospect['business_name']}</div>
                    <div style="color: #666;">📍 {prospect.get('city', 'Unknown')}, {prospect.get('state', '')}</div>
                </div>
                <div class="score-badge {badge_class}">
                    Score: {prospect['analysis_score']}/100
                </div>
            </div>
            
            <div class="details">
                <p><strong>Website:</strong> <a href="{prospect['website_url']}" target="_blank" class="website-link">{prospect['website_url']}</a></p>
                <p><strong>Rebuild Priority:</strong> {prospect['rebuild_priority']}</p>
                <p><strong>Estimated Value:</strong> {prospect['estimated_value']}</p>
                <p><strong>Business Potential:</strong> {prospect['business_potential'].title()}</p>
                {f"<p><strong>Phone:</strong> {prospect['phone']}</p>" if prospect.get('phone') else ""}
                
                <details>
                    <summary><strong>📧 Generated Outreach Email</strong></summary>
                    <div class="email-preview">{prospect['outreach_email']}</div>
                </details>
                
                <div style="margin-top: 15px;">
                    <button class="btn btn-approve">✅ APPROVE FOR OUTREACH</button>
                    <button class="btn btn-reject">❌ REJECT</button>
                </div>
            </div>
        </div>
        '''
    
    html += '''
</body>
</html>
    '''
    
    return html

if __name__ == '__main__':
    print("🚀 Starting FindRawDogFood Approval Dashboard...")
    print("📊 Dashboard URL: http://localhost:5001")
    app.run(debug=True, port=5001, host='0.0.0.0')
