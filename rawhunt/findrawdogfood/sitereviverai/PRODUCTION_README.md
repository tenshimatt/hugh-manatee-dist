# FindRawDogFood - Production System

## 🎯 Mission
Find website modernization opportunities for pet supply businesses that would benefit from professional website rebuilds.

## 🔧 System Architecture

### Core Components
1. **Modernization Analyzer** (`fixed_scoring_system.py`)
   - Connects to Cloudflare D1 database with 8844+ suppliers
   - Analyzes websites for modernization opportunities using OpenAI GPT-4
   - Scores 0-100 (higher = more urgent modernization needed)
   - Generates personalized outreach emails

2. **Approval Dashboard** (`fixed_approval_dashboard.py`)
   - Web interface at http://localhost:5001
   - Manual review and approval of prospects
   - Export approved prospects to CSV
   - Campaign statistics tracking

3. **Database** (`batch_analysis_results.db`)
   - SQLite database storing all analysis results
   - Approval workflow tracking
   - Campaign management

## 📊 Scoring System

### Modernization Score (0-100)
- **0-30**: Modern website, no rebuild needed
- **31-60**: Some issues, minor updates needed  
- **61-80**: Outdated, would benefit from modernization
- **81-100**: Severely outdated, urgent rebuild needed

### What We Analyze
- Old design patterns (table layouts, no responsive design)
- Mobile optimization issues
- Outdated technology (old CMS, no SSL)
- Limited functionality (no online ordering)
- Poor user experience
- Business viability indicators

## 🚀 Quick Start

### 1. Deploy System
```bash
cd /Users/mattwright/pandora/findrawdogfood/sitereviverai
chmod +x deploy_production_system.sh
./deploy_production_system.sh
```

### 2. Run Analysis
```bash
# Option 1: Use deployment script (recommended)
./deploy_production_system.sh

# Option 2: Manual execution
source venv/bin/activate
python3 fixed_scoring_system.py
```

### 3. Review Results
```bash
# Start dashboard
python3 fixed_approval_dashboard.py

# Access at: http://localhost:5001
```

## 📋 Daily Workflow

### Analysis Phase
1. Run `fixed_scoring_system.py`
2. Reviews 3 real suppliers from D1 database
3. Generates modernization scores and outreach emails
4. Saves results to database

### Approval Phase
1. Open http://localhost:5001
2. Review prospects by modernization score
3. Approve high-value opportunities
4. Reject low-priority or modern sites
5. Export approved prospects for outreach

### Outreach Phase
1. Export approved prospects to CSV
2. Send personalized emails to prospects
3. Track responses and conversions

## 🗂️ Production URLs

| URL | Function |
|-----|----------|
| `http://localhost:5001` | Main approval dashboard |
| `http://localhost:5001/campaign-stats` | Campaign statistics JSON |
| `http://localhost:5001/export-approved` | Download approved prospects CSV |

## 📊 Database Schema

### Analysis Results Table
```sql
CREATE TABLE analysis_results (
    id INTEGER PRIMARY KEY,
    supplier_id TEXT,
    business_name TEXT,
    website_url TEXT,
    phone TEXT,
    city TEXT,
    state TEXT,
    modernization_score REAL,        -- 0-100 modernization urgency
    rebuild_priority TEXT,           -- urgent/high/medium/low/none
    modernization_issues TEXT,       -- JSON array of issues
    business_viability TEXT,         -- excellent/good/fair/poor
    estimated_value TEXT,            -- Project value estimate
    outreach_email TEXT,             -- Generated email
    approval_status TEXT,            -- pending/approved/rejected
    approved_by TEXT,
    approved_at TIMESTAMP,
    approval_notes TEXT,
    processed_at TIMESTAMP
);
```

## 🔄 Scaling to Full Production

### Current: 3 Suppliers per Run
- Test and validate system
- Verify scoring accuracy
- Refine outreach emails

### Scale to 50 Suppliers
```python
# In fixed_scoring_system.py, modify:
suppliers = self.get_d1_suppliers(limit=50)
```

### Scale to All 8844 Suppliers
```python
# Remove limit to process all suppliers
suppliers = self.get_d1_suppliers()  # No limit
```

## 📈 Business Model

### Target Prospects
- Pet supply stores with outdated websites
- Established businesses (not hobby operations)
- Local/regional businesses with physical locations
- Businesses showing signs of success but poor web presence

### Project Values
- **Minor Updates**: $3k-$8k
- **Full Modernization**: $8k-$15k  
- **Complete Rebuild**: $15k-$25k
- **E-commerce Addition**: $20k-$35k

### Success Metrics
- Modernization score >60 = good prospect
- Business viability "good" or "excellent" = qualified lead
- Response rate target: 5-10%
- Conversion rate target: 2-5%

## 🔧 Configuration

### Environment Variables (.env)
```bash
OPENAI_API_KEY=sk-your-openai-api-key
```

### System Requirements
- Python 3.8+
- OpenAI API access
- Cloudflare D1 database access (via wrangler)
- ~$0.10-$0.50 per analysis (OpenAI costs)

## 🚨 Troubleshooting

### Common Issues

1. **D1 Connection Failed**
   ```bash
   # Check wrangler auth
   wrangler auth list
   
   # Test D1 connection
   wrangler d1 execute findrawdogfood-db --command "SELECT COUNT(*) FROM suppliers"
   ```

2. **OpenAI API Errors**
   ```bash
   # Check API key in .env
   grep OPENAI_API_KEY .env
   
   # Test API access
   python3 -c "import openai; print('API key valid')"
   ```

3. **Dashboard Not Loading**
   ```bash
   # Check Flask is running
   ps aux | grep python
   
   # Check port 5001
   lsof -i :5001
   ```

### Database Operations

```bash
# View recent analysis results
sqlite3 batch_analysis_results.db "SELECT business_name, modernization_score, rebuild_priority FROM analysis_results ORDER BY processed_at DESC LIMIT 10;"

# View approval status breakdown
sqlite3 batch_analysis_results.db "SELECT approval_status, COUNT(*) FROM analysis_results GROUP BY approval_status;"

# Clear all results (fresh start)
sqlite3 batch_analysis_results.db "DELETE FROM analysis_results;"
```

## 📞 Support

For issues or questions:
1. Check logs in terminal output
2. Review SQLite database for results
3. Verify D1 connection and OpenAI API access
4. Check file permissions on scripts

---

## Next Steps
1. ✅ System is production-ready for 3-supplier testing
2. 🔄 Scale to 50 suppliers after validation
3. 📈 Full 8844 supplier analysis after approval workflow proven
4. 📧 Integrate with email automation platform
5. 📊 Add response tracking and CRM integration
