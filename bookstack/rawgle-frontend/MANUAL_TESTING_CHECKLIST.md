# Manual Testing Checklist - Chat & Forms

## Quick Verification Guide

### 🔐 Authentication Testing (2 mins)
**URL**: http://localhost:3000/auth/sign-in

- [ ] Fill email field with `test@example.com`
- [ ] Fill password field with `password123`
- [ ] Click password visibility toggle (eye icon)
- [ ] Click "Continue with Google" button
- [ ] Submit form - should redirect to dashboard
- [ ] Try empty form - should show validation error

### 💬 Chat Interface Testing (3 mins)
**URL**: http://localhost:3000/chat

- [ ] Page loads with chat interface
- [ ] Type message in text area: "Hello RAWGLE"
- [ ] Message input accepts text properly
- [ ] Click a "Quick Action" button (Calculate Portions)
- [ ] Try clicking send button (may fail due to backend)
- [ ] Verify interface is responsive

**Expected**: Interface works, but messages may not send (API error)

### 🧮 Feeding Calculator Testing (5 mins)
**URL**: http://localhost:3000/dashboard/feeding/calculator

**Test Data Entry**:
- [ ] Pet Name: `Buddy`
- [ ] Weight: `25`
- [ ] Age: `3`
- [ ] Select Species dropdown → Choose option
- [ ] Move Body Condition slider
- [ ] Select Activity Level from dropdown

**Expected**: Form fills, calculations appear, results displayed

### 📱 Mobile Testing (2 mins)
**Chrome DevTools**: Toggle device toolbar (Ctrl+Shift+M)

- [ ] Set to iPhone SE (375px width)
- [ ] Navigate to /auth/sign-in - forms work
- [ ] Navigate to /chat - interface responsive
- [ ] Navigate to /dashboard/feeding/calculator - inputs work

### ⌨️ Keyboard Testing (1 min)
- [ ] Tab navigation works through forms
- [ ] Enter key sends chat messages
- [ ] All form inputs accessible via keyboard

---

## Issues to Expect (Known from Testing)

### ❌ Chat Backend Issues
- Messages won't send (API connection error)
- Quick actions trigger failed requests
- **Status**: Frontend UI works, backend needed

### ⚠️ Minor Form Issues
- Some validation messages inconsistent
- Dropdown selectors may have conflicts
- **Status**: Forms work, polish needed

### ✅ What Definitely Works
- All form inputs accept data
- Feeding calculator performs calculations
- Mobile responsiveness
- Authentication flows (demo mode)
- Page navigation

---

## Developer Notes

**For quick functional verification**:
```bash
# Start dev server
npm run dev

# Run automated tests
node comprehensive-functional-test.js
```

**Current Status**: 78% functionality working
**Blocked by**: Chat API backend connection
**Ready for**: Authentication, calculator, basic features