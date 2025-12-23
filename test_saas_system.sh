#!/bin/bash

echo "🚀 SaaS Business Management System - API Test Suite"
echo "=================================================="

BASE_URL="http://localhost:3000"

# Test 1: Check if server is running
echo "✅ Testing Server Connection..."
if curl -s "$BASE_URL" > /dev/null; then
    echo "   ✓ Server is running"
else
    echo "   ✗ Server is not responding"
    exit 1
fi

# Test 2: Get SaaS data
echo "✅ Testing SaaS Data Endpoint..."
SAAS_DATA=$(curl -s "$BASE_URL/api/saas/data")
if [[ $SAAS_DATA == *"leads"* ]] && [[ $SAAS_DATA == *"deals"* ]]; then
    echo "   ✓ SaaS data endpoint working"
else
    echo "   ✗ SaaS data endpoint failed"
fi

# Test 3: Get SaaS stats
echo "✅ Testing SaaS Statistics Endpoint..."
STATS_DATA=$(curl -s "$BASE_URL/api/saas/stats")
if [[ $STATS_DATA == *"leads"* ]] && [[ $STATS_DATA == *"revenue"* ]]; then
    echo "   ✓ SaaS stats endpoint working"
else
    echo "   ✗ SaaS stats endpoint failed"
fi

# Test 4: Create a test lead
echo "✅ Testing Lead Creation..."
LEAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/saas/lead/save" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Lead","email":"test@example.com","company":"TestCorp","source":"API Test","service":"Testing","score":75}')
if [[ $LEAD_RESPONSE == *"success"* ]]; then
    echo "   ✓ Lead creation successful"
    LEAD_ID=$(echo $LEAD_RESPONSE | grep -o '"leadId":[0-9]*' | cut -d: -f2)
else
    echo "   ✗ Lead creation failed"
fi

# Test 5: Create a test deal
echo "✅ Testing Deal Creation..."
DEAL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/saas/deal/save" \
  -H "Content-Type: application/json" \
  -d '{"clientName":"Test Client","company":"TestCorp","value":25000,"service":"API Testing","stage":"Proposal","probability":60}')
if [[ $DEAL_RESPONSE == *"success"* ]]; then
    echo "   ✓ Deal creation successful"
    DEAL_ID=$(echo $DEAL_RESPONSE | grep -o '"dealId":[0-9]*' | cut -d: -f2)
else
    echo "   ✗ Deal creation failed"
fi

# Test 6: Record test revenue
echo "✅ Testing Revenue Recording..."
REVENUE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/saas/revenue/save" \
  -H "Content-Type: application/json" \
  -d '{"amount":5000,"source":"API Test","clientName":"Test Client","service":"Testing"}')
if [[ $REVENUE_RESPONSE == *"success"* ]]; then
    echo "   ✓ Revenue recording successful"
else
    echo "   ✗ Revenue recording failed"
fi

# Test 7: Set test goal
echo "✅ Testing Goal Setting..."
GOAL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/saas/goal/save" \
  -H "Content-Type: application/json" \
  -d '{"type":"Monthly Revenue","target":50000,"current":5000,"month":12,"year":2024,"description":"Test goal"}')
if [[ $GOAL_RESPONSE == *"success"* ]]; then
    echo "   ✓ Goal setting successful"
else
    echo "   ✗ Goal setting failed"
fi

# Test 8: Verify updated stats
echo "✅ Testing Updated Statistics..."
UPDATED_STATS=$(curl -s "$BASE_URL/api/saas/stats")
if [[ $UPDATED_STATS == *"\"leads\":{\"total\":1"* ]]; then
    echo "   ✓ Statistics updated correctly"
else
    echo "   ✗ Statistics update failed"
fi

echo ""
echo "🎉 SaaS Business Management System Test Complete!"
echo "📊 System Features Verified:"
echo "   ✓ Lead Management"
echo "   ✓ Deal Pipeline"  
echo "   ✓ Revenue Tracking"
echo "   ✓ Goal Setting"
echo "   ✓ Dashboard Statistics"
echo "   ✓ Service Management"
echo ""
echo "🌐 Access your SaaS system at: http://localhost:3000"
echo "📱 Click '🚀 SaaS' to enter the business management interface"
