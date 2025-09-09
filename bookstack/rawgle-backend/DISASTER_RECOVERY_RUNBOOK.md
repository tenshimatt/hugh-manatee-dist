# RAWGLE Database Disaster Recovery Runbook

**🚨 EMERGENCY PROCEDURES - READ BEFORE DISASTER STRIKES**

This runbook provides step-by-step procedures for database disaster recovery scenarios. Keep this document accessible and ensure all team members are familiar with these procedures.

## 📋 Quick Reference

| **RTO (Recovery Time Objective)** | **RPO (Recovery Point Objective)** |
|-----------------------------------|-------------------------------------|
| Critical Systems: 15 minutes     | < 5 minutes data loss              |
| Non-Critical: 1 hour             | < 15 minutes data loss             |

### Emergency Contacts

- **Database Administrator**: [Your Contact]
- **DevOps Engineer**: [Your Contact]  
- **System Administrator**: [Your Contact]
- **Emergency Escalation**: [Your Contact]

### Critical Information

- **Production Database**: `rawgle_production`
- **Backup Location**: `./backups/`
- **Monitoring Dashboard**: [Your Monitoring URL]
- **Status Page**: [Your Status Page URL]

---

## 🔥 Emergency Response Matrix

| Scenario | Severity | RTO Target | Initial Response |
|----------|----------|------------|------------------|
| Database Corruption | P1 | 15 min | Stop writes, assess damage, restore from backup |
| Hardware Failure | P1 | 15 min | Failover to standby, assess primary |
| Network Partition | P2 | 30 min | Check connectivity, manual failover if needed |
| Performance Degradation | P2 | 1 hour | Identify bottleneck, optimize or restart |
| Backup Failure | P3 | 4 hours | Investigate, create manual backup |

---

## 🚨 Immediate Response Procedures

### Step 1: Incident Assessment (2 minutes)

1. **Confirm the incident**:
   ```bash
   # Quick database health check
   npm run db:monitor:health
   
   # Check system connectivity
   ping [database-server]
   
   # Verify application status
   curl -f [application-health-endpoint]
   ```

2. **Classify severity**:
   - **P1 (Critical)**: Complete service outage, data corruption
   - **P2 (Major)**: Degraded performance, partial functionality
   - **P3 (Minor)**: Non-critical features affected

3. **Notify stakeholders**:
   - P1: Immediate notification to all emergency contacts
   - P2: Notification within 15 minutes
   - P3: Notification within 1 hour

### Step 2: Damage Assessment (3 minutes)

```bash
# Check database availability
npm run db:monitor:health

# Check recent error logs
tail -100 /var/log/postgresql/postgresql.log

# Check disk space
df -h

# Check system resources
free -m && top -b -n1 | head -20

# Check connection pool status
npm run db:monitor:connections

# Verify backup integrity
npm run backup:verify [latest-backup-file]
```

### Step 3: Stop the Bleeding (2 minutes)

**For data corruption or critical errors:**
```bash
# Stop application writes immediately
sudo systemctl stop rawgle-backend

# Enable read-only mode if possible
sudo -u postgres psql -d rawgle_production -c "ALTER SYSTEM SET default_transaction_read_only = on;"
sudo -u postgres psql -d rawgle_production -c "SELECT pg_reload_conf();"
```

**For performance issues:**
```bash
# Kill long-running queries
npm run db:monitor | grep "long_running_queries"

# Check for blocking queries
sudo -u postgres psql -d rawgle_production -c "
SELECT pid, query, state, wait_event_type, wait_event
FROM pg_stat_activity 
WHERE wait_event_type IS NOT NULL AND state = 'active';"
```

---

## 🔧 Recovery Procedures

### Scenario 1: Database Corruption

**Detection Signs:**
- Checksum errors in logs
- Unexpected query failures
- Data inconsistencies
- PostgreSQL panic/crash

**Recovery Steps:**

1. **Stop all applications** (1 min):
   ```bash
   sudo systemctl stop rawgle-backend
   sudo systemctl stop nginx
   ```

2. **Assess corruption extent** (3 min):
   ```bash
   # Check database integrity
   sudo -u postgres postgres --single -D /var/lib/postgresql/data -d rawgle_production -c "REINDEX DATABASE rawgle_production;"
   
   # Check for corrupted tables
   sudo -u postgres psql -d rawgle_production -c "
   SELECT schemaname, tablename 
   FROM pg_tables 
   WHERE schemaname = 'public';" | while read schema table; do
     echo "Checking $schema.$table"
     sudo -u postgres psql -d rawgle_production -c "SELECT COUNT(*) FROM $schema.$table;" 2>&1 | grep -i error && echo "ERROR in $schema.$table"
   done
   ```

3. **Create emergency backup** of current state (2 min):
   ```bash
   # Even corrupted data might have recoverable portions
   npm run backup:schema > /tmp/emergency-schema-$(date +%Y%m%d_%H%M%S).sql
   ```

4. **Restore from last known good backup** (5-10 min):
   ```bash
   # Find latest backup
   ls -la backups/daily/ | head -5
   
   # Verify backup integrity
   npm run backup:verify backups/daily/[latest-backup-file]
   
   # Create new database for restore
   sudo -u postgres createdb rawgle_recovery
   
   # Restore to recovery database first
   npm run backup:restore backups/daily/[latest-backup-file] --target-database rawgle_recovery
   
   # Verify restore success
   sudo -u postgres psql -d rawgle_recovery -c "SELECT COUNT(*) FROM users;"
   
   # Switch databases (rename)
   sudo -u postgres psql -c "ALTER DATABASE rawgle_production RENAME TO rawgle_corrupted_$(date +%Y%m%d_%H%M%S);"
   sudo -u postgres psql -c "ALTER DATABASE rawgle_recovery RENAME TO rawgle_production;"
   ```

5. **Verify and restart services** (2 min):
   ```bash
   # Test database connectivity
   npm run db:monitor:health
   
   # Restart application
   sudo systemctl start rawgle-backend
   sudo systemctl start nginx
   
   # Verify application health
   curl -f localhost:3000/health
   ```

### Scenario 2: Hardware Failure

**Detection Signs:**
- Server unreachable
- Disk I/O errors
- Memory errors
- Network connectivity loss

**Recovery Steps:**

1. **If standby server available** (3 min):
   ```bash
   # Promote standby to primary
   sudo -u postgres pg_ctl promote -D /var/lib/postgresql/data
   
   # Update DNS/load balancer to point to new primary
   # [Manual step - update your DNS/load balancer configuration]
   
   # Verify promotion
   sudo -u postgres psql -c "SELECT pg_is_in_recovery();" # Should return 'f'
   ```

2. **If no standby server** (15-30 min):
   ```bash
   # Provision new server
   # [Manual step - create new server instance]
   
   # Install PostgreSQL and dependencies
   # [Follow your server setup procedures]
   
   # Restore from latest backup
   npm run backup:restore backups/daily/[latest-backup-file]
   
   # Update application configuration
   # [Update DATABASE_URL in environment]
   ```

### Scenario 3: Network Partition

**Detection Signs:**
- Application can't reach database
- Replication lag alerts
- Timeout errors

**Recovery Steps:**

1. **Assess network connectivity** (2 min):
   ```bash
   # Test database server connectivity
   telnet [db-server] 5432
   
   # Check routing
   traceroute [db-server]
   
   # Test from multiple locations
   ```

2. **If network is restored** (1 min):
   ```bash
   # Check replication status
   sudo -u postgres psql -c "SELECT * FROM pg_stat_replication;"
   
   # Monitor for catch-up
   npm run db:monitor
   ```

3. **If network remains down** (10 min):
   ```bash
   # Implement manual failover procedures
   # [Follow your specific network failover steps]
   ```

### Scenario 4: Performance Degradation

**Detection Signs:**
- High response times
- Connection timeouts
- High CPU/memory usage
- Slow query alerts

**Recovery Steps:**

1. **Identify bottleneck** (3 min):
   ```bash
   # Check performance metrics
   npm run db:monitor:performance
   
   # Find slow queries
   sudo -u postgres psql -d rawgle_production -c "
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;"
   
   # Check blocking queries
   sudo -u postgres psql -d rawgle_production -c "
   SELECT blocked_locks.pid AS blocked_pid,
          blocked_activity.usename AS blocked_user,
          blocking_locks.pid AS blocking_pid,
          blocking_activity.usename AS blocking_user,
          blocked_activity.query AS blocked_statement,
          blocking_activity.query AS current_statement_in_blocking_process
   FROM pg_catalog.pg_locks blocked_locks
   JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
   JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
   AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
   AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
   AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
   AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
   AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
   AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
   AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
   AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
   AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
   AND blocking_locks.pid != blocked_locks.pid
   JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
   WHERE NOT blocked_locks.granted;"
   ```

2. **Apply immediate fixes** (2 min):
   ```bash
   # Kill problematic queries
   sudo -u postgres psql -d rawgle_production -c "SELECT pg_terminate_backend([pid]);"
   
   # Increase connection pool if needed
   # [Adjust connection pool settings]
   
   # Clear query plan cache if needed
   sudo -u postgres psql -d rawgle_production -c "SELECT pg_stat_reset();"
   ```

3. **Monitor recovery** (5 min):
   ```bash
   # Watch performance metrics
   watch "npm run db:monitor:performance"
   
   # Check application response times
   curl -w "@curl-format.txt" -s localhost:3000/health
   ```

---

## 🔄 Post-Recovery Procedures

### 1. Verify System Integrity (10 minutes)

```bash
# Run comprehensive monitoring
npm run db:monitor

# Test all critical functions
npm run test:integration

# Check data consistency
sudo -u postgres psql -d rawgle_production -c "
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables 
ORDER BY schemaname, tablename;"

# Verify backup system
npm run backup:verify [latest-backup]
```

### 2. Update Stakeholders (5 minutes)

- Send recovery status update
- Update status page
- Document lessons learned
- Schedule post-incident review

### 3. Monitor for Issues (30 minutes)

```bash
# Continuous monitoring
watch "npm run db:monitor:health && npm run db:monitor:performance"

# Check error logs
tail -f /var/log/postgresql/postgresql.log
tail -f /var/log/rawgle/app.log

# Monitor application metrics
# [Check your application monitoring dashboard]
```

---

## 📊 Backup and Recovery Testing

### Monthly Backup Tests

```bash
# Test backup creation
npm run backup:full

# Test backup verification
npm run backup:verify [backup-file]

# Test restore to test environment
npm run backup:restore [backup-file] --target-database rawgle_test --dry-run

# Verify restored data integrity
npm run test:data-integrity --database rawgle_test
```

### Quarterly Disaster Recovery Drills

1. **Simulate database failure**
2. **Execute recovery procedures**
3. **Measure RTO/RPO**
4. **Document improvements**
5. **Update runbook**

---

## 🛠 Maintenance and Prevention

### Daily Preventive Tasks

```bash
# Check backup completion
ls -la backups/daily/ | head -3

# Monitor disk space
df -h | grep -E "(95%|96%|97%|98%|99%|100%)"

# Check log files for errors
grep -i error /var/log/postgresql/postgresql.log | tail -10

# Quick health check
npm run db:monitor:health
```

### Weekly Preventive Tasks

```bash
# Run full monitoring suite
npm run db:monitor

# Check backup retention
npm run backup:cleanup

# Review slow query log
npm run db:monitor:performance

# Test disaster recovery procedures (abbreviated)
npm run backup:verify [recent-backup]
```

### Monthly Preventive Tasks

```bash
# Full disaster recovery drill
# [Follow quarterly drill procedures]

# Review and update runbook
# [Check for procedure improvements]

# Capacity planning review
# [Analyze growth trends and resource needs]

# Security audit
npm run db:monitor | grep security
```

---

## 📚 Additional Resources

### Useful Commands Reference

```bash
# Emergency database stop
sudo systemctl stop postgresql

# Emergency database start
sudo systemctl start postgresql

# Check database processes
ps aux | grep postgres

# Check port availability
netstat -tlnp | grep :5432

# Database size and usage
sudo -u postgres psql -d rawgle_production -c "
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as db_size,
  pg_size_pretty(pg_total_relation_size('users')) as users_table_size;"

# Connection count by state
sudo -u postgres psql -d rawgle_production -c "
SELECT state, count(*) 
FROM pg_stat_activity 
GROUP BY state;"
```

### Log Locations

- **PostgreSQL Logs**: `/var/log/postgresql/postgresql.log`
- **Application Logs**: `/var/log/rawgle/app.log`
- **System Logs**: `/var/log/syslog`
- **Backup Logs**: `./backups/backup.log`

### Configuration Files

- **PostgreSQL Config**: `/etc/postgresql/[version]/main/postgresql.conf`
- **HBA Config**: `/etc/postgresql/[version]/main/pg_hba.conf`
- **Application Config**: `.env`

---

## 🔍 Troubleshooting Guide

### Common Issues and Solutions

#### "Connection refused" errors
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check port binding
sudo netstat -tlnp | grep :5432

# Check configuration
sudo -u postgres psql -c "SHOW listen_addresses;"
```

#### "Too many connections" errors
```bash
# Check current connections
sudo -u postgres psql -c "
SELECT count(*), state 
FROM pg_stat_activity 
GROUP BY state;"

# Increase max_connections (restart required)
sudo -u postgres psql -c "ALTER SYSTEM SET max_connections = 200;"
sudo systemctl restart postgresql
```

#### "Disk full" errors
```bash
# Check disk space
df -h

# Clean up old logs
sudo logrotate -f /etc/logrotate.d/postgresql

# Clean up old backups
npm run backup:cleanup
```

#### High memory usage
```bash
# Check shared_buffers setting
sudo -u postgres psql -c "SHOW shared_buffers;"

# Check for memory leaks in connections
sudo -u postgres psql -c "
SELECT pid, usename, application_name, state, 
       query_start, state_change, query 
FROM pg_stat_activity 
WHERE state = 'idle in transaction'
AND state_change < now() - interval '1 hour';"
```

---

## ⚠️ Important Notes

1. **Always test procedures in non-production first**
2. **Keep this runbook updated with any infrastructure changes**
3. **Ensure all team members have access to this document**
4. **Practice procedures regularly - muscle memory is critical**
5. **Document all recovery actions for post-incident analysis**
6. **Never make changes during an incident without documenting**

---

## 📞 When to Escalate

**Immediate Escalation:**
- Data corruption affecting critical business functions
- Complete service outage > 15 minutes
- Suspected security breach
- Recovery procedures failing

**Standard Escalation:**
- Performance degradation > 1 hour
- Backup failures
- Recovery taking longer than RTO targets

---

*Last Updated: 2025-09-07*  
*Next Review Date: 2025-12-07*  
*Document Owner: Database Administration Team*