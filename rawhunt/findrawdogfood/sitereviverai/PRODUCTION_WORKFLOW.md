# FindRawDogFood - Production Workflow System
## Complete Business Process Documentation

### 🎯 PRODUCTION WORKFLOW OVERVIEW

This system analyzes pet supply businesses and generates approval-based outreach campaigns.

---

## 📊 SYSTEM ARCHITECTURE

### **1. Analysis Pipeline**
```
D1 Database (8844 suppliers) → Analysis Engine → Approval Queue → Outreach Campaign
```

### **2. Key Components**
- **Batch Analyzer**: Processes suppliers in batches
- **Approval Dashboard**: Manual review system  
- **Email Generator**: Creates personalized outreach
- **Campaign Tracker**: Monitors responses

---

## 🔄 PRODUCTION WORKFLOW STEPS

### **STEP 1: Batch Analysis**
```bash
cd /Users/mattwright/pandora/findrawdogfood/sitereviverai
source venv/bin/activate
python3 production_batch_analyzer.py --batch-size 50
```

**Output**: 
- Analysis results in `batch_analysis_results.db`
- Approval queue populated with scored prospects

### **STEP 2: Approval Dashboard**
**URL**: `http://localhost:5001/approval-dashboard`

**Actions Available**:
- ✅ **APPROVE** - Generate outreach email and add to campaign
- ❌ **REJECT** - Mark as not suitable for outreach  
- 📝 **REVIEW** - Flag for manual follow-up
- 📊 **VIEW ANALYSIS** - See detailed scoring breakdown

### **STEP 3: Campaign Generation**
**URL**: `http://localhost:5001/campaign-manager`

**Functions**:
- Export approved prospects to CSV
- Generate email templates
- Track outreach status
- Monitor response rates

### **STEP 4: Outreach Execution**
**URL**: `http://localhost:5001/outreach-tracker`

**Workflow**:
- Send emails to approved prospects
- Track opens/clicks/responses
- Schedule follow-ups
- Update prospect status

---

## 🌐 SYSTEM URLS & FUNCTIONS

| URL | Function | Purpose |
|-----|----------|---------|
| `/` | Main Dashboard | Overview of entire system |
| `/analysis` | Batch Analysis Control | Start/stop analysis runs |
| `/approval-dashboard` | Manual Approval Queue | Review prospects for outreach |
| `/campaign-manager` | Campaign Creation | Build outreach campaigns |
| `/outreach-tracker` | Email Campaign Monitor | Track campaign performance |
| `/results-export` | Data Export | Export prospects to CSV/Excel |
| `/api/analyze-batch` | API Endpoint | Trigger batch analysis |
| `/api/approve-prospect` | API Endpoint | Approve/reject prospects |
| `/api/campaign-stats` | API Endpoint | Get campaign metrics |

---

## 📝 APPROVAL WORKFLOW

### **Approval States**
- 🟡 **PENDING** - Awaiting manual review
- ✅ **APPROVED** - Ready for outreach 
- ❌ **REJECTED** - Not suitable for contact
- 📝 **NEEDS_REVIEW** - Requires additional analysis
- 📧 **EMAIL_SENT** - Outreach completed
- 📈 **RESPONDED** - Prospect responded

### **Approval Criteria**
- **Score 70+**: Auto-approve for outreach
- **Score 50-69**: Manual review required  
- **Score <50**: Auto-reject unless special circumstances

---

## 🚀 DAILY OPERATIONS

### **Morning Routine** (9 AM)
1. Check overnight analysis results
2. Review approval queue (15-20 prospects)
3. Approve high-scoring prospects
4. Generate daily outreach batch

### **Afternoon Routine** (2 PM)  
1. Send approved outreach emails
2. Update campaign tracking
3. Process any responses
4. Plan next day's analysis batch

### **Weekly Review** (Fridays)
1. Export campaign performance report
2. Analyze response rates by score range
3. Adjust approval criteria if needed
4. Scale successful campaign types

---

## 📊 SUCCESS METRICS

### **Key Performance Indicators**
- **Analysis Rate**: Suppliers processed per day
- **Approval Rate**: % of analyzed prospects approved
- **Response Rate**: % of outreach emails getting responses  
- **Conversion Rate**: % leading to actual projects

### **Target Numbers**
- Analyze 100+ suppliers per day
- Maintain 15-20% approval rate
- Achieve 5-8% email response rate
- Convert 2-3% to actual prospects

---

## 🔧 MAINTENANCE TASKS

### **Daily**
- Monitor analysis queue
- Check system logs for errors
- Backup results database

### **Weekly**  
- Update approval criteria based on results
- Refresh supplier database from D1
- Archive completed campaigns

### **Monthly**
- Analyze campaign performance trends
- Optimize email templates
- Scale successful processes

---

## 🚨 TROUBLESHOOTING

### **Common Issues**
- **D1 Connection Failed**: Use fallback supplier list
- **OpenAI Rate Limit**: Reduce batch size to 20
- **Email Generation Failed**: Check API keys
- **Approval Dashboard Down**: Restart with `python3 dashboard.py`

### **Emergency Contacts**
- **System Issues**: Check logs in `/logs/`
- **Database Problems**: Restart D1 connection
- **API Failures**: Verify environment variables

---

## 📈 SCALING PLAN

### **Phase 1** (Current)
- Manual approval workflow
- 100 suppliers/day analysis
- Email-based outreach

### **Phase 2** (Next Month)
- Automated approval for high scores
- 500 suppliers/day analysis  
- CRM integration

### **Phase 3** (3 Months)
- AI-powered approval decisions
- 1000+ suppliers/day analysis
- Multi-channel outreach (email, LinkedIn, phone)

---

*Last Updated: July 20, 2025*
*System Version: 1.0.0*
