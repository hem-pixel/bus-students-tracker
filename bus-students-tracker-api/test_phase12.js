/**
 * Phase 12: Notifications & Alerts System Verification Test
 */
process.env.NODE_ENV = 'test';
const http = require('http');
const app = require('./server');
const notificationService = require('./services/notificationService');
const alertRulesService = require('./services/alertRulesService');

async function runTests() {
  console.log('=== PHASE 12: NOTIFICATIONS & ALERTS SYSTEM VERIFICATION TEST ===\n');

  // Start server on an ephemeral port
  const server = app.server || http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/notifications`;
  const token = 'BST-AUTH-ADMIN-USR-ADM-001';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Service Level: Rule evaluation
    console.log('[TEST 1] Testing Alert Rules Service...');
    const matchedRules = await alertRulesService.evaluateRulesForEvent('GEOFENCE_VIOLATION', {
      bus_number: '1',
      current_location: 'Karur Bypass',
      deviation_km: 3.5
    });
    console.log(`  Matched rules for GEOFENCE_VIOLATION: ${matchedRules.length}`);
    if (!Array.isArray(matchedRules)) throw new Error('Expected array of matched rules');
    console.log('  ✅ Alert rules evaluation passed.\n');

    // 2. Service Level: Notification dispatch service
    console.log('[TEST 2] Testing Notification Service Dispatch...');
    const notifRecord = await notificationService.createNotification(
      'BOARDING',
      'Test Boarding Notification',
      'Student STU-001 boarded at Karur Bus Stand',
      'HIGH',
      [
        {
          id: 'usr-parent-001',
          recipient_id: 'usr-parent-001',
          name: 'R. Balasubramanian',
          email: 'bala.parent@gmail.com',
          phone: '+919443322110',
          role: 'PARENT',
          channels: { email: true, sms: true, in_app: true, push: true }
        }
      ]
    );
    const dispatchRes = await notificationService.sendNotification(notifRecord.id, {
      student_name: 'Balaji B',
      bus_number: '1',
      stop_name: 'Karur Bus Stand',
      time: '08:15 AM',
      eta: '08:45 AM'
    });
    console.log('  Dispatch Result ID:', dispatchRes.notification_id, 'Status:', dispatchRes.status);
    console.log('  Deliveries:', dispatchRes.deliveries ? dispatchRes.deliveries.length : 0);
    console.log('  ✅ Notification dispatch service passed.\n');

    // 3. HTTP: GET /api/notifications/stats
    console.log('[TEST 3] Testing HTTP GET /api/notifications/stats...');
    const statsRes = await fetch(`${baseUrl}/stats`, { headers });
    if (!statsRes.ok) throw new Error(`Stats failed with HTTP ${statsRes.status}`);
    const statsData = await statsRes.json();
    console.log('  Notification stats received:', {
      total: statsData.stats?.total,
      sent: statsData.stats?.sent,
      acknowledged: statsData.stats?.acknowledged,
      critical: statsData.stats?.critical
    });
    console.log('  ✅ Stats endpoint passed.\n');

    // 4. HTTP: GET /api/notifications
    console.log('[TEST 4] Testing HTTP GET /api/notifications...');
    const listRes = await fetch(`${baseUrl}?limit=10`, { headers });
    if (!listRes.ok) throw new Error(`List failed with HTTP ${listRes.status}`);
    const listData = await listRes.json();
    console.log(`  Notifications retrieved: ${listData.notifications?.length || 0}`);
    console.log('  ✅ Listing endpoint passed.\n');

    // 5. HTTP: POST /api/notifications/send
    console.log('[TEST 5] Testing HTTP POST /api/notifications/send...');
    const sendRes = await fetch(`${baseUrl}/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'API Test Alert: Speed Exceeded',
        message: 'Bus #1 speed exceeded safe threshold: 72 km/h on Karur Highway',
        event_type: 'GEOFENCE_VIOLATION',
        priority: 'CRITICAL',
        recipients: [
          {
            recipient_id: 'USR-ADM-001',
            role: 'ADMIN',
            name: 'Transport Manager',
            email: 'transport@vsb.ac.in',
            phone: '+919876543210',
            channels: { in_app: true, email: true, sms: true }
          }
        ],
        bus_number: '1',
        current_location: 'Karur Highway'
      })
    });
    if (!sendRes.ok) throw new Error(`Send failed with HTTP ${sendRes.status}: ${await sendRes.text()}`);
    const sendData = await sendRes.json();
    const createdNotifId = sendData.notification?.id;
    console.log('  Sent notification ID:', createdNotifId);
    console.log('  ✅ Send endpoint passed.\n');

    // 6. HTTP: GET /api/notifications/:id
    console.log('[TEST 6] Testing HTTP GET /api/notifications/:id...');
    const getRes = await fetch(`${baseUrl}/${createdNotifId}`, { headers });
    if (!getRes.ok) throw new Error(`Get notification failed with HTTP ${getRes.status}`);
    const notifDetails = await getRes.json();
    console.log('  Notification Title:', notifDetails.notification?.title);
    console.log('  ✅ Get by ID endpoint passed.\n');

    // 7. HTTP: POST /api/notifications/:id/acknowledge
    console.log('[TEST 7] Testing HTTP POST /api/notifications/:id/acknowledge...');
    const ackRes = await fetch(`${baseUrl}/${createdNotifId}/acknowledge`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ notes: 'Acknowledged by Transport Admin in test' })
    });
    if (!ackRes.ok) throw new Error(`Acknowledge failed with HTTP ${ackRes.status}`);
    const ackData = await ackRes.json();
    console.log('  Acknowledged status:', ackData.notification?.status);
    console.log('  ✅ Acknowledge endpoint passed.\n');

    // 8. HTTP: POST /api/notifications/:id/retry
    console.log('[TEST 8] Testing HTTP POST /api/notifications/:id/retry...');
    const retryRes = await fetch(`${baseUrl}/${createdNotifId}/retry`, {
      method: 'POST',
      headers
    });
    if (!retryRes.ok) throw new Error(`Retry failed with HTTP ${retryRes.status}`);
    const retryData = await retryRes.json();
    console.log('  Retry success:', retryData.success, 'New Status:', retryData.notification?.status);
    console.log('  ✅ Retry endpoint passed.\n');

    // 9. HTTP: POST /api/notifications/bulk
    console.log('[TEST 9] Testing HTTP POST /api/notifications/bulk...');
    const bulkRes = await fetch(`${baseUrl}/bulk`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'College Annual Day Transport Notice',
        message: 'Special transport schedule active tomorrow for all routes.',
        event_type: 'DELAY',
        priority: 'MEDIUM',
        target_group: 'PARENTS',
        recipients: [
          { recipient_id: 'p-01', role: 'PARENT', name: 'Parent 1', email: 'p1@test.com' },
          { recipient_id: 'p-02', role: 'PARENT', name: 'Parent 2', email: 'p2@test.com' }
        ]
      })
    });
    if (!bulkRes.ok) throw new Error(`Bulk send failed with HTTP ${bulkRes.status}`);
    const bulkData = await bulkRes.json();
    console.log('  Bulk dispatch notifications count:', bulkData.count);
    console.log('  ✅ Bulk send endpoint passed.\n');

    // 10. HTTP: Alert Rules CRUD & Test
    console.log('[TEST 10] Testing Alert Rules Endpoints...');
    // List rules
    const rulesRes = await fetch(`${baseUrl}/rules`, { headers });
    if (!rulesRes.ok) throw new Error(`List rules failed with HTTP ${rulesRes.status}`);
    const rulesData = await rulesRes.json();
    console.log(`  Existing alert rules count: ${rulesData.alert_rules?.length || 0}`);

    // Create a new rule
    const createRuleRes = await fetch(`${baseUrl}/rules`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        rule_name: 'Test Emergency SOS Trigger',
        event_type: 'EMERGENCY_SOS',
        priority: 'CRITICAL',
        condition_json: { threshold: 1 },
        recipients_query: 'ADMIN_ONLY',
        actions: { in_app: true, email: true, sms: true },
        enabled: true
      })
    });
    if (!createRuleRes.ok) throw new Error(`Create rule failed with HTTP ${createRuleRes.status}: ${await createRuleRes.text()}`);
    const newRule = await createRuleRes.json();
    const ruleId = newRule.alert_rule?.id;
    console.log('  Created test rule ID:', ruleId);

    // Test rule evaluation endpoint
    const testEvalRes = await fetch(`${baseUrl}/rules/test`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event_type: 'EMERGENCY_SOS',
        event_data: { threshold: 1 }
      })
    });
    if (!testEvalRes.ok) throw new Error(`Test rule evaluation failed with HTTP ${testEvalRes.status}`);
    const evalData = await testEvalRes.json();
    console.log('  Evaluation matched rules count:', evalData.matched_rules_count);

    // Update rule
    const updateRuleRes = await fetch(`${baseUrl}/rules/${ruleId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ rule_name: 'Updated SOS Trigger', priority: 'HIGH' })
    });
    if (!updateRuleRes.ok) throw new Error(`Update rule failed with HTTP ${updateRuleRes.status}`);

    // Delete rule
    const delRuleRes = await fetch(`${baseUrl}/rules/${ruleId}`, {
      method: 'DELETE',
      headers
    });
    if (!delRuleRes.ok) throw new Error(`Delete rule failed with HTTP ${delRuleRes.status}`);
    console.log('  ✅ Alert rules CRUD & test passed.\n');

    // 11. HTTP: Notification Templates CRUD
    console.log('[TEST 11] Testing Notification Templates Endpoints...');
    const tplListRes = await fetch(`${baseUrl}/templates`, { headers });
    if (!tplListRes.ok) throw new Error(`List templates failed with HTTP ${tplListRes.status}`);
    const tplList = await tplListRes.json();
    console.log(`  Templates count: ${tplList.templates?.length || 0}`);

    // Create template
    const createTplRes = await fetch(`${baseUrl}/templates`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        template_name: 'TEST_CUSTOM_TPL',
        event_type: 'CUSTOM_EVENT',
        subject_template: 'Notice: {{topic}}',
        email_template: '<p>Hello {{user_name}}, details: {{details}}</p>',
        sms_template: 'Notice for {{user_name}}: {{details}}',
        push_title: 'Notice: {{topic}}',
        push_body: 'Details: {{details}}'
      })
    });
    if (!createTplRes.ok) throw new Error(`Create template failed with HTTP ${createTplRes.status}`);
    const createdTpl = await createTplRes.json();
    const tplId = createdTpl.template?.id;
    console.log('  Created template ID:', tplId);

    // Update template
    const updateTplRes = await fetch(`${baseUrl}/templates/${tplId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ subject_template: 'Updated Notice: {{topic}}' })
    });
    if (!updateTplRes.ok) throw new Error(`Update template failed with HTTP ${updateTplRes.status}`);

    // Delete template
    const delTplRes = await fetch(`${baseUrl}/templates/${tplId}`, {
      method: 'DELETE',
      headers
    });
    if (!delTplRes.ok) throw new Error(`Delete template failed with HTTP ${delTplRes.status}`);
    console.log('  ✅ Notification templates CRUD passed.\n');

    // 12. HTTP: Notification Preferences
    console.log('[TEST 12] Testing Notification Preferences Endpoints...');
    const prefRes = await fetch(`${baseUrl}/preferences`, { headers });
    if (!prefRes.ok) throw new Error(`Get preferences failed with HTTP ${prefRes.status}`);
    const prefData = await prefRes.json();
    console.log('  Retrieved preferences user_id:', prefData.preferences?.user_id);

    const updatePrefRes = await fetch(`${baseUrl}/preferences`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        in_app_enabled: true,
        quiet_hours_start: '22:30',
        quiet_hours_end: '06:00'
      })
    });
    if (!updatePrefRes.ok) throw new Error(`Update preferences failed with HTTP ${updatePrefRes.status}`);
    const updatedPref = await updatePrefRes.json();
    console.log('  Updated quiet hours start:', updatedPref.preferences?.quiet_hours_start);
    console.log('  ✅ Notification preferences passed.\n');

    // 13. HTTP: Notification Audit History
    console.log('[TEST 13] Testing Notification Audit History...');
    const auditRes = await fetch(`${baseUrl}/audit?limit=5`, { headers });
    if (!auditRes.ok) throw new Error(`Audit history failed with HTTP ${auditRes.status}`);
    const auditData = await auditRes.json();
    console.log(`  Audit logs count: ${auditData.audit_logs?.length || 0}`);
    console.log('  ✅ Notification audit history passed.\n');

    // 14. Delete notification created in test
    console.log('[TEST 14] Testing DELETE /api/notifications/:id...');
    const delNotifRes = await fetch(`${baseUrl}/${createdNotifId}`, {
      method: 'DELETE',
      headers
    });
    if (!delNotifRes.ok) throw new Error(`Delete notification failed with HTTP ${delNotifRes.status}`);
    console.log('  ✅ Delete notification passed.\n');

    console.log('🎉 ALL 14 PHASE 12 VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Phase 12 verification test failed:', err);
  process.exit(1);
});
