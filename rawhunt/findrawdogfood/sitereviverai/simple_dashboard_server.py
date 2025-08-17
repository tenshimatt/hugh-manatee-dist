#!/usr/bin/env python3
"""
SiteReviverAI - Simple Dashboard Server
Uses built-in Python HTTP server - no external dependencies
"""

import http.server
import socketserver
import json
import sqlite3
import os
import webbrowser
import threading
import time
from urllib.parse import urlparse, parse_qs
from datetime import datetime

class SiteReviverHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.db_path = "approval_database.db"
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/':
            # Serve dashboard.html
            self.serve_dashboard()
        elif parsed_path.path == '/api/analyses':
            self.serve_analyses()
        elif parsed_path.path == '/api/stats':
            self.serve_stats()
        else:
            # Serve static files
            super().do_GET()
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path.startswith('/api/approve/'):
            analysis_id = parsed_path.path.split('/')[-1]
            self.handle_approve(analysis_id)
        elif parsed_path.path.startswith('/api/reject/'):
            analysis_id = parsed_path.path.split('/')[-1]
            self.handle_reject(analysis_id)
        elif parsed_path.path == '/api/process-batch':
            self.handle_process_batch()
        else:
            self.send_error(404)
    
    def serve_dashboard(self):
        try:
            with open('dashboard.html', 'r') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(content.encode())
        except FileNotFoundError:
            self.send_error(404, "Dashboard file not found")
    
    def serve_analyses(self):
        try:
            analyses = self.get_all_analyses()
            response = {'success': True, 'data': analyses}
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        except Exception as e:
            self.send_error_response(str(e))
    
    def serve_stats(self):
        try:
            stats = self.get_stats()
            response = {'success': True, 'data': stats}
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        except Exception as e:
            self.send_error_response(str(e))
    
    def handle_approve(self, analysis_id):
        try:
            business_name = self.update_status(analysis_id, 'approved')
            response = {
                'success': True, 
                'message': f'{business_name} approved! Customer email will be generated.'
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        except Exception as e:
            self.send_error_response(str(e))
    
    def handle_reject(self, analysis_id):
        try:
            business_name = self.update_status(analysis_id, 'rejected')
            response = {
                'success': True, 
                'message': f'{business_name} rejected. Marked for manual review.'
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        except Exception as e:
            self.send_error_response(str(e))
    
    def handle_process_batch(self):
        try:
            # Run simplified production system
            import asyncio
            import sys
            import os
            
            # Add current directory to path
            sys.path.append(os.getcwd())
            
            from simplified_production import SimplifiedSiteReviverAI
            
            async def run_batch():
                system = SimplifiedSiteReviverAI()
                results = await system.process_supplier_batch(limit=2)
                return len(results)
            
            new_count = asyncio.run(run_batch())
            
            response = {
                'success': True, 
                'message': f'Processed {new_count} new suppliers. Ready for review!',
                'count': new_count
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        except Exception as e:
            self.send_error_response(str(e))
    
    def send_error_response(self, error_msg):
        response = {'success': False, 'error': error_msg}
        
        self.send_response(500)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def get_all_analyses(self):
        """Get all site analyses from database"""
        if not os.path.exists(self.db_path):
            return []
        
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
                continue
        
        return analyses
    
    def update_status(self, analysis_id, new_status):
        """Update analysis status and return business name"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get business name first
        cursor.execute('SELECT business_name FROM site_analysis WHERE id = ?', (analysis_id,))
        result = cursor.fetchone()
        business_name = result[0] if result else 'Unknown'
        
        # Update status
        if new_status == 'approved':
            cursor.execute(
                'UPDATE site_analysis SET status = ?, approved_at = ? WHERE id = ?',
                (new_status, datetime.now().isoformat(), analysis_id)
            )
        else:
            cursor.execute(
                'UPDATE site_analysis SET status = ? WHERE id = ?',
                (new_status, analysis_id)
            )
        
        conn.commit()
        conn.close()
        
        return business_name
    
    def get_stats(self):
        """Get dashboard statistics"""
        analyses = self.get_all_analyses()
        
        total_analyzed = len(analyses)
        pending_approval = len([a for a in analyses if a['status'] == 'pending'])
        approved = len([a for a in analyses if a['status'] == 'approved'])
        rejected = len([a for a in analyses if a['status'] == 'rejected'])
        emails_sent = approved
        
        conversion_rate = round((approved / total_analyzed * 100) if total_analyzed > 0 else 0, 1)
        projected_revenue = approved * 499
        
        return {
            'total_analyzed': total_analyzed,
            'pending_approval': pending_approval,
            'approved': approved,
            'rejected': rejected,
            'emails_sent': emails_sent,
            'conversion_rate': conversion_rate,
            'projected_revenue': projected_revenue
        }

def open_browser():
    """Open browser after delay"""
    time.sleep(2)
    webbrowser.open('http://localhost:5001')

def start_server():
    """Start the dashboard server"""
    PORT = 5001
    
    print("🚀 Starting SiteReviverAI Dashboard...")
    print(f"📊 Dashboard will open at: http://localhost:{PORT}")
    print("🔄 Use Ctrl+C to stop")
    
    # Change to correct directory
    os.chdir('/Users/mattwright/pandora/findrawdogfood/sitereviverai')
    
    # Open browser in background
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Start server
    with socketserver.TCPServer(("", PORT), SiteReviverHandler) as httpd:
        print(f"✅ Server running on port {PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Shutting down dashboard...")
            httpd.shutdown()

if __name__ == "__main__":
    start_server()
