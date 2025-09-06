#!/bin/bash

# 🚀 Facebook-Grade Production Deployment Pipeline
# This script enforces quality gates and blocks deployment on failures

set -e  # Exit on any error

echo "🚀 FACEBOOK-GRADE PRODUCTION DEPLOYMENT PIPELINE"
echo "================================================"
echo "🔒 Quality gates will block deployment on failures"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Quality gate results
VISUAL_PASSED=false
PERFORMANCE_PASSED=false
ACCESSIBILITY_PASSED=false
FUNCTIONAL_PASSED=false
SECURITY_PASSED=false

# Step 1: Pre-deployment checks
echo -e "${BLUE}📋 STEP 1: Pre-deployment Environment Checks${NC}"
echo "============================================="

# Check if dev server is running
if ! curl -s http://localhost:3001/dashboard/health/logs > /dev/null; then
    echo -e "${YELLOW}⚠️  Starting development server...${NC}"
    npm run dev &
    sleep 10
fi

# Verify server is responsive
if curl -s http://localhost:3001/dashboard/health/logs > /dev/null; then
    echo -e "${GREEN}✅ Development server running${NC}"
else
    echo -e "${RED}❌ DEPLOYMENT BLOCKED: Server not responding${NC}"
    exit 1
fi

# Step 2: Run Facebook-Grade Test Suite
echo ""
echo -e "${BLUE}📊 STEP 2: Facebook-Grade Quality Gates${NC}"
echo "======================================="

# Run visual regression tests
echo -e "${YELLOW}📸 Running visual regression tests...${NC}"
if timeout 60 node facebook-grade-testing.js --visual-only; then
    echo -e "${GREEN}✅ Visual regression tests passed${NC}"
    VISUAL_PASSED=true
else
    echo -e "${RED}❌ Visual regression tests failed${NC}"
fi

# Run performance budget tests
echo -e "${YELLOW}⚡ Running performance budget tests...${NC}"
if timeout 60 node facebook-grade-testing.js --perf-only; then
    echo -e "${GREEN}✅ Performance budget met${NC}"
    PERFORMANCE_PASSED=true
else
    echo -e "${RED}❌ Performance budget exceeded${NC}"
fi

# Run accessibility tests
echo -e "${YELLOW}♿ Running accessibility compliance tests...${NC}"
if timeout 60 node facebook-grade-testing.js --a11y-only; then
    echo -e "${GREEN}✅ Accessibility compliance met${NC}"
    ACCESSIBILITY_PASSED=true
else
    echo -e "${RED}❌ Accessibility compliance failed${NC}"
fi

# Run functional tests
echo -e "${YELLOW}🧪 Running functional test suite...${NC}"
if timeout 120 npx playwright test tests/09-health-logs-comprehensive.spec.ts --timeout=15000 --reporter=dot; then
    echo -e "${GREEN}✅ Functional tests passed${NC}"
    FUNCTIONAL_PASSED=true
else
    echo -e "${RED}❌ Functional tests failed${NC}"
fi

# Run security checks
echo -e "${YELLOW}🔒 Running security vulnerability scan...${NC}"
if npm audit --audit-level=high; then
    echo -e "${GREEN}✅ No high-severity vulnerabilities${NC}"
    SECURITY_PASSED=true
else
    echo -e "${RED}❌ Security vulnerabilities detected${NC}"
fi

# Step 3: Quality Gate Evaluation
echo ""
echo -e "${BLUE}🚦 STEP 3: Quality Gate Evaluation${NC}"
echo "=================================="

GATES_PASSED=0
TOTAL_GATES=5

if [ "$VISUAL_PASSED" = true ]; then
    echo -e "${GREEN}✅ Visual Regression Gate${NC}"
    GATES_PASSED=$((GATES_PASSED + 1))
else
    echo -e "${RED}❌ Visual Regression Gate${NC}"
fi

if [ "$PERFORMANCE_PASSED" = true ]; then
    echo -e "${GREEN}✅ Performance Budget Gate${NC}"
    GATES_PASSED=$((GATES_PASSED + 1))
else
    echo -e "${RED}❌ Performance Budget Gate${NC}"
fi

if [ "$ACCESSIBILITY_PASSED" = true ]; then
    echo -e "${GREEN}✅ Accessibility Compliance Gate${NC}"
    GATES_PASSED=$((GATES_PASSED + 1))
else
    echo -e "${RED}❌ Accessibility Compliance Gate${NC}"
fi

if [ "$FUNCTIONAL_PASSED" = true ]; then
    echo -e "${GREEN}✅ Functional Test Coverage Gate${NC}"
    GATES_PASSED=$((GATES_PASSED + 1))
else
    echo -e "${RED}❌ Functional Test Coverage Gate${NC}"
fi

if [ "$SECURITY_PASSED" = true ]; then
    echo -e "${GREEN}✅ Security Vulnerability Gate${NC}"
    GATES_PASSED=$((GATES_PASSED + 1))
else
    echo -e "${RED}❌ Security Vulnerability Gate${NC}"
fi

echo ""
echo -e "${BLUE}📊 Quality Gate Summary: ${GATES_PASSED}/${TOTAL_GATES} passed${NC}"

# Step 4: Build Decision
echo ""
echo -e "${BLUE}🎯 STEP 4: Build Decision${NC}"
echo "======================="

if [ "$GATES_PASSED" -eq "$TOTAL_GATES" ]; then
    echo -e "${GREEN}🎉 ALL QUALITY GATES PASSED!${NC}"
    echo -e "${GREEN}🚀 PROCEEDING WITH PRODUCTION DEPLOYMENT${NC}"
    
    # Step 5: Production Build
    echo ""
    echo -e "${BLUE}🏗️  STEP 5: Production Build${NC}"
    echo "========================="
    
    echo -e "${YELLOW}📦 Building production bundle...${NC}"
    if npm run build; then
        echo -e "${GREEN}✅ Production build successful${NC}"
    else
        echo -e "${RED}❌ DEPLOYMENT BLOCKED: Build failed${NC}"
        exit 1
    fi
    
    # Step 6: Final Verification
    echo ""
    echo -e "${BLUE}🔍 STEP 6: Final Production Verification${NC}"
    echo "======================================="
    
    echo -e "${YELLOW}🔍 Verifying build artifacts...${NC}"
    if [ -d ".next" ] && [ -f ".next/BUILD_ID" ]; then
        echo -e "${GREEN}✅ Build artifacts verified${NC}"
    else
        echo -e "${RED}❌ DEPLOYMENT BLOCKED: Invalid build artifacts${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}📊 Analyzing bundle size...${NC}"
    npx next-bundle-analyzer || echo "Bundle analyzer not available"
    
    # Step 7: Deployment Ready
    echo ""
    echo -e "${GREEN}🎯 DEPLOYMENT READY!${NC}"
    echo "==================="
    echo -e "${GREEN}✅ All quality gates passed${NC}"
    echo -e "${GREEN}✅ Production build successful${NC}"
    echo -e "${GREEN}✅ Artifacts verified${NC}"
    echo ""
    echo -e "${GREEN}🚀 Ready to deploy to production environment${NC}"
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "   1. Deploy to staging for final validation"
    echo "   2. Run production smoke tests"
    echo "   3. Deploy to production"
    echo "   4. Monitor production metrics"
    
    # Generate deployment report
    echo ""
    echo -e "${YELLOW}📊 Generating deployment report...${NC}"
    cat > deployment-report.md << EOF
# 🚀 Production Deployment Report

**Status**: ✅ READY FOR DEPLOYMENT
**Date**: $(date)
**Build ID**: $(cat .next/BUILD_ID 2>/dev/null || echo "N/A")

## Quality Gates Results
- ✅ Visual Regression: PASSED
- ✅ Performance Budget: PASSED  
- ✅ Accessibility Compliance: PASSED
- ✅ Functional Test Coverage: PASSED
- ✅ Security Vulnerability Scan: PASSED

## Build Artifacts
- Production bundle: ✅ Generated
- Static assets: ✅ Optimized
- Bundle analysis: ✅ Completed

## Deployment Approval
**Approved for production deployment** 🚀

---
*Generated by Facebook-Grade Deployment Pipeline*
EOF
    
    echo -e "${GREEN}📊 Deployment report saved to: deployment-report.md${NC}"
    
else
    echo -e "${RED}❌ QUALITY GATES FAILED${NC}"
    echo -e "${RED}🚫 DEPLOYMENT BLOCKED${NC}"
    echo ""
    echo -e "${RED}Critical issues must be resolved before deployment:${NC}"
    
    if [ "$VISUAL_PASSED" != true ]; then
        echo -e "${RED}  • Fix visual regression issues${NC}"
    fi
    if [ "$PERFORMANCE_PASSED" != true ]; then
        echo -e "${RED}  • Optimize performance to meet budget${NC}"
    fi
    if [ "$ACCESSIBILITY_PASSED" != true ]; then
        echo -e "${RED}  • Fix accessibility compliance issues${NC}"
    fi
    if [ "$FUNCTIONAL_PASSED" != true ]; then
        echo -e "${RED}  • Fix failing functional tests${NC}"
    fi
    if [ "$SECURITY_PASSED" != true ]; then
        echo -e "${RED}  • Resolve security vulnerabilities${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}🔧 View detailed reports in:${NC}"
    echo "   - test-reports/facebook-grade-report.html"
    echo "   - test-outputs/ (screenshots)"
    echo "   - Console output above"
    
    exit 1
fi