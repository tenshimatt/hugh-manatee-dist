#!/usr/bin/env python3
"""
Production Approval Dashboard - Manual Review System
Handles approval workflow for analyzed prospects
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for
import sqlite3
import json
from datetime import datetime
import os

app = Flask(__name__)

class ApprovalSystem:
    def __init__(self):
        self.db_path = "batch_analysis_results.db"
        self.setup_approval_tables()
    
    def setup_approval_tables(self):
        """Setup approval workflow tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Add approval columns if they don't exist
        try:
            cursor.execute("ALTER TABLE analysis_results ADD COLUMN approval_status TEXT DEFAULT 'pending'")
            cursor.execute("ALTER TABLE analysis_results ADD COLUMN approved_by TEXT")
            cursor.execute("ALTER TABLE analysis_results ADD COLUMN approved_at TIMESTAMP")
            cursor.execute("ALTER TABLE analysis_results ADD COLUMN approval_notes TEXT")
            cursor.execute("ALTER TABLE analysis_results ADD COLUMN campaign_id TEXT")
            cursor.execute("ALTER TABLE analysis_results ADD COLUMN email_sent_at TIMESTAMP")
            cursor.execute("ALTER TABLE analysis_results ADD COLUMN response_received BOOLEAN DEFAULT 0")
        except:
            pass  # Columns already exist
        
        conn.commit()
        conn.close()
    
    def get_pending_approvals(self, limit=20):
        """Get prospects awaiting approval"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, business_name, website_url, analysis_score, business_potential, 
                   technical_issues, recommended_actions, outreach_email, processed_at,
                   approval_status, approval_notes
            FROM analysis_results 
            WHERE status='completed' 
            AND (approval_status='pending' OR approval_status IS NULL)
            ORDER BY analysis_score DESC
            LIMIT ?
        """, (limit,))
        
        results = []
        for row in cursor.fetchall():
            results.append({
                'id': row[0],
                'business_name': row[1],
                'website_url': row[2],
                'analysis_score': row[3],
                'business_potential': row[4],
                'technical_issues': json.loads(row[5]) if row[5] else [],
                'recommended_actions': json.loads(row[6]) if row[6] else [],
                'outreach_email': row[7],
                'processed_at': row[8],
                'approval_status': row[9] or 'pending',
                'approval_notes': row[10]
            })
        
        conn.close()
        return results
    
    def approve_prospect(self, prospect_id, approved_by, notes=""):
        """Approve a prospect for outreach"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE analysis_results 
            SET approval_status='approved', 
                approved_by=?, 
                approved_at=?, 
                approval_notes=?
            WHERE id=?
        """, (approved_by, datetime.now(), notes, prospect_id))
        
        conn.commit()
        conn.close()
        return True
    
    def reject_prospect(self, prospect_id, rejected_by, notes=""):
        """Reject a prospect"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE analysis_results 
            SET approval_status='rejected', 
                approved_by=?, 
                approved_at=?, 
                approval_notes=?
            WHERE id=?
        """, (rejected_by, datetime.now(), notes, prospect_id))
        
        conn.commit()
        conn.close()
        return True
    
    def get_campaign_stats(self):
        """Get overall campaign statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Total prospects analyzed
        cursor.execute("SELECT COUNT(*) FROM analysis_results WHERE status='completed'")
        total_analyzed = cursor.fetchone()[0]
        
        # Approval breakdown
        cursor.execute("""
            SELECT approval_status, COUNT(*) 
            FROM analysis_results 
            WHERE status='completed'
            GROUP BY approval_status
        """)
        approval_breakdown = dict(cursor.fetchall())
        
        # Score distribution
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN analysis_score >= 70 THEN 'High (70+)'
                    WHEN analysis_score >= 50 THEN 'Medium (50-69)'
                    ELSE 'Low (<50)'
                END as score_range,
                COUNT(*)
            FROM analysis_results 
            WHERE status='completed'
            GROUP BY score_range
        """)
        score_distribution = dict(cursor.fetchall())
        
        conn.close()
        
        return {
            'total_analyzed': total_analyzed,
            'approval_breakdown': approval_breakdown,
            'score_distribution': score_distribution
        }

# Initialize approval system
approval_system = ApprovalSystem()

@app.route('/')
def dashboard():
    """Main approval dashboard"""
    pending_approvals = approval_system.get_pending_approvals()
    stats = approval_system.get_campaign_stats()
    
    return render_template('approval_dashboard.html', 
                         prospects=pending_approvals, 
                         stats=stats)

@app.route('/api/approve/<int:prospect_id>', methods=['POST'])
def approve_prospect(prospect_id):
    """API endpoint to approve a prospect"""
    data = request.get_json()
    notes = data.get('notes', '')
    approved_by = data.get('approved_by', 'system')
    
    success = approval_system.approve_prospect(prospect_id, approved_by, notes)
    
    return jsonify({'success': success})

@app.route('/api/reject/<int:prospect_id>', methods=['POST'])
def reject_prospect(prospect_id):
    """API endpoint to reject a prospect"""
    data = request.get_json()
    notes = data.get('notes', '')
    rejected_by = data.get('rejected_by', 'system')
    
    success = approval_system.reject_prospect(prospect_id, rejected_by, notes)
    
    return jsonify({'success': success})

@app.route('/campaign-stats')
def campaign_stats():
    """Campaign statistics page"""
    stats = approval_system.get_campaign_stats()
    return jsonify(stats)

@app.route('/export-approved')
def export_approved():
    """Export approved prospects to CSV"""
    conn = sqlite3.connect(approval_system.db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT business_name, website_url, analysis_score, business_potential,
               outreach_email, approved_at, approval_notes
        FROM analysis_results 
        WHERE approval_status='approved'
        ORDER BY analysis_score DESC
    """)
    
    results = cursor.fetchall()
    conn.close()
    
    # Create CSV content
    csv_content = "Business Name,Website,Score,Potential,Email,Approved Date,Notes\n"
    for row in results:
        csv_content += f'"{row[0]}","{row[1]}",{row[2]},"{row[3]}","{row[4]}","{row[5]}","{row[6] or ""}"\n'
    
    from flask import Response
    return Response(
        csv_content,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=approved_prospects.csv"}
    )

# Create the HTML template
template_html = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FindRawDogFood - Approval Dashboard</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        
        .header {
            background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #8B4513;
        }
        
        .prospects-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .prospect-card {
            border-bottom: 1px solid #eee;
            padding: 20px;
        }
        
        .prospect-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .business-name {
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
        }
        
        .score {
            font-size: 1.5rem;
            font-weight: bold;
            padding: 5px 15px;
            border-radius: 20px;
            color: white;
        }
        
        .score.high { background: #28a745; }
        .score.medium { background: #ffc107; color: #333; }
        .score.low { background: #dc3545; }
        
        .prospect-details {
            margin-bottom: 15px;
        }
        
        .website-link {
            color: #0066cc;
            text-decoration: none;
            font-weight: 500;
        }
        
        .issues-list {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        
        .actions {
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
        }
        
        .btn-approve {
            background: #28a745;
            color: white;
        }
        
        .btn-reject {
            background: #dc3545;
            color: white;
        }
        
        .btn-review {
            background: #ffc107;
            color: #333;
        }
        
        .email-preview {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            max-height: 150px;
            overflow-y: auto;
            font-size: 0.9rem;
            line-height: 1.4;
        }
        
        .export-btn {
            background: #8B4513;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐕 FindRawDogFood Approval Dashboard</h1>
        <p>Review analyzed prospects for outreach campaigns</p>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-number">{{ stats.total_analyzed }}</div>
            <div>Total Analyzed</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">{{ stats.approval_breakdown.get('pending', 0) }}</div>
            <div>Pending Approval</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">{{ stats.approval_breakdown.get('approved', 0) }}</div>
            <div>Approved</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">{{ stats.approval_breakdown.get('rejected', 0) }}</div>
            <div>Rejected</div>
        </div>
    </div>
    
    <button class="export-btn" onclick="window.location.href='/export-approved'">
        📊 Export Approved Prospects
    </button>
    
    <div class="prospects-container">
        {% for prospect in prospects %}
        <div class="prospect-card" id="prospect-{{ prospect.id }}">
            <div class="prospect-header">
                <div class="business-name">{{ prospect.business_name }}</div>
                <div class="score {% if prospect.analysis_score >= 70 %}high{% elif prospect.analysis_score >= 50 %}medium{% else %}low{% endif %}">
                    {{ prospect.analysis_score }}/100
                </div>
            </div>
            
            <div class="prospect-details">
                <p><strong>Website:</strong> <a href="{{ prospect.website_url }}" target="_blank" class="website-link">{{ prospect.website_url }}</a></p>
                <p><strong>Business Potential:</strong> {{ prospect.business_potential.upper() }}</p>
                <p><strong>Analyzed:</strong> {{ prospect.processed_at }}</p>
                
                {% if prospect.technical_issues %}
                <div class="issues-list">
                    <strong>🔍 Issues Found:</strong>
                    <ul>
                        {% for issue in prospect.technical_issues %}
                        <li>{{ issue }}</li>
                        {% endfor %}
                    </ul>
                </div>
                {% endif %}
                
                <details>
                    <summary><strong>📧 Generated Outreach Email</strong></summary>
                    <div class="email-preview">{{ prospect.outreach_email | replace('\n', '<br>') | safe }}</div>
                </details>
            </div>
            
            <div class="actions">
                <button class="btn btn-approve" onclick="approveProspect({{ prospect.id }})">
                    ✅ APPROVE
                </button>
                <button class="btn btn-reject" onclick="rejectProspect({{ prospect.id }})">
                    ❌ REJECT
                </button>
                <button class="btn btn-review" onclick="flagForReview({{ prospect.id }})">
                    📝 REVIEW
                </button>
            </div>
        </div>
        {% endfor %}
    </div>
    
    <script>
        async function approveProspect(prospectId) {
            const notes = prompt('Approval notes (optional):');
            
            const response = await fetch(`/api/approve/${prospectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    approved_by: 'Matt Wright',
                    notes: notes || ''
                })
            });
            
            if (response.ok) {
                document.getElementById(`prospect-${prospectId}`).style.background = '#d4edda';
                alert('Prospect approved for outreach!');
                setTimeout(() => {
                    document.getElementById(`prospect-${prospectId}`).style.display = 'none';
                }, 2000);
            }
        }
        
        async function rejectProspect(prospectId) {
            const notes = prompt('Rejection reason:');
            if (!notes) return;
            
            const response = await fetch(`/api/reject/${prospectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rejected_by: 'Matt Wright',
                    notes: notes
                })
            });
            
            if (response.ok) {
                document.getElementById(`prospect-${prospectId}`).style.background = '#f8d7da';
                alert('Prospect rejected.');
                setTimeout(() => {
                    document.getElementById(`prospect-${prospectId}`).style.display = 'none';
                }, 2000);
            }
        }
        
        function flagForReview(prospectId) {
            alert('Flagged for additional review - will remain in queue.');
        }
    </script>
</body>
</html>
'''

# Create templates directory and save template
os.makedirs('templates', exist_ok=True)
with open('templates/approval_dashboard.html', 'w') as f:
    f.write(template_html)

if __name__ == '__main__':
    print("🚀 Starting Approval Dashboard...")
    print("📊 Dashboard URL: http://localhost:5001")
    print("📈 Campaign Stats: http://localhost:5001/campaign-stats")
    print("📄 Export Approved: http://localhost:5001/export-approved")
    app.run(debug=True, port=5001)
