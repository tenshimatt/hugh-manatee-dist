#!/usr/bin/env python3
"""
SiteReviverAI - Dashboard Backend
Simple Flask server to manage approvals via web UI
"""

from flask import Flask, render_template_string, jsonify, request, send_from_directory
import sqlite3
import json
import os
from datetime import datetime
import threading
import webbrowser
from pathlib import Path

app = Flask(__name__)

class DashboardBackend:
    def __init__(self):
        self.db_path = "approval_database.db"
        self.setup_database()
    
    def setup_database(self):
        """Ensure database exists with proper schema"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS site_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                business_name TEXT NOT NULL,
                website_url TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                city TEXT,
                state TEXT,
                lighthouse_score REAL,
                design_score REAL,
                analysis_data TEXT,
                brand_package TEXT,
                status TEXT DEFAULT 'pending',
                approval_token TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approved_at TIMESTAMP,
                email_sent_at TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def get_all_analyses(self):
        """Get all site analyses from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, business_name, website_url, city, state, lighthouse_score, 
                   design_score, status, brand_package, created_at, analysis_data
            FROM site_analysis 
            ORDER BY created_at DESC
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        analyses = []
        for row in rows:
            try:
                brand_package = json.loads(row[8]) if row[8] else {}
                analysis_data = json.loads(row[10]) if row[10] else {}
                
                analyses.append({
                    'id': row[0],
                    'business_name': row[1],
                    'website_url': row[2],
                    'city': row[3] or 'Unknown',
                    'state': row[4] or 'Unknown',
                    'lighthouse_score': row[5] or 0,
                    'design_score': row[6] or 0,
                    'status': row[7],
                    'primary_color': brand_package.get('primary_color', '#667eea'),
                    'secondary_color': brand_package.get('secondary_color', '#764ba2'),
                    'created_at': row[9],
                    'issues': analysis_data.get('issues', [])
                })
            except:
                # Skip malformed records
                continue
        
        return analyses
    
    def update_status(self, analysis_id, new_status):
        """Update the status of an analysis"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if new_status == 'approved':
            cursor.execute(
                'UPDATE site_analysis SET status = ?, approved_at = ? WHERE id = ?',
                (new_status, datetime.now(), analysis_id)
            )
        else:
            cursor.execute(
                'UPDATE site_analysis SET status = ? WHERE id = ?',
                (new_status, analysis_id)
            )
        
        conn.commit()
        conn.close()
        
        return True
    
    def get_stats(self):
        """Get dashboard statistics"""
        analyses = self.get_all_analyses()
        
        total_analyzed = len(analyses)
        pending_approval = len([a for a in analyses if a['status'] == 'pending'])
        approved = len([a for a in analyses if a['status'] == 'approved'])
        rejected = len([a for a in analyses if a['status'] == 'rejected'])
        emails_sent = approved  # Assuming emails sent for all approved
        
        conversion_rate = round((approved / total_analyzed * 100) if total_analyzed > 0 else 0, 1)
        projected_revenue = approved * 499  # $499 per conversion
        
        return {
            'total_analyzed': total_analyzed,
            'pending_approval': pending_approval,
            'approved': approved,
            'rejected': rejected,
            'emails_sent': emails_sent,
            'conversion_rate': conversion_rate,
            'projected_revenue': projected_revenue
        }

# Initialize backend
backend = DashboardBackend()

@app.route('/')
def dashboard():
    """Serve the main dashboard"""
    with open('dashboard.html', 'r') as f:
        return f.read()

@app.route('/api/analyses')
def get_analyses():
    """Get all analyses data"""
    try:
        analyses = backend.get_all_analyses()
        return jsonify({'success': True, 'data': analyses})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/stats')
def get_stats():
    """Get dashboard statistics"""
    try:
        stats = backend.get_stats()
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/approve/<int:analysis_id>', methods=['POST'])
def approve_analysis(analysis_id):
    """Approve an analysis"""
    try:
        backend.update_status(analysis_id, 'approved')
        
        # Get business name for notification
        analyses = backend.get_all_analyses()
        business_name = next((a['business_name'] for a in analyses if a['id'] == analysis_id), 'Unknown')
        
        return jsonify({
            'success': True, 
            'message': f'{business_name} approved! Customer email will be generated.'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/reject/<int:analysis_id>', methods=['POST'])
def reject_analysis(analysis_id):
    """Reject an analysis"""
    try:
        backend.update_status(analysis_id, 'rejected')
        
        # Get business name for notification
        analyses = backend.get_all_analyses()
        business_name = next((a['business_name'] for a in analyses if a['id'] == analysis_id), 'Unknown')
        
        return jsonify({
            'success': True, 
            'message': f'{business_name} rejected. Marked for manual review.'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/process-batch', methods=['POST'])
def process_new_batch():
    """Process a new batch of suppliers"""
    try:
        # Import and run the simplified production system
        import asyncio
        from simplified_production import SimplifiedSiteReviverAI
        
        async def run_batch():
            system = SimplifiedSiteReviverAI()
            results = await system.process_supplier_batch(limit=2)
            return len(results)
        
        # Run the batch processing
        new_count = asyncio.run(run_batch())
        
        return jsonify({
            'success': True, 
            'message': f'Processed {new_count} new suppliers. Ready for review!',
            'count': new_count
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/view/<filename>')
def view_file(filename):
    """View generated HTML files"""
    try:
        return send_from_directory('.', filename)
    except:
        return "File not found", 404

def open_browser():
    """Open browser after slight delay"""
    import time
    time.sleep(1.5)
    webbrowser.open('http://localhost:5001')

if __name__ == '__main__':
    print("🚀 Starting SiteReviverAI Dashboard...")
    print("📊 Dashboard will open at: http://localhost:5001")
    print("🔄 Use Ctrl+C to stop")
    
    # Open browser in background
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Start Flask server
    app.run(host='0.0.0.0', port=5001, debug=False)
