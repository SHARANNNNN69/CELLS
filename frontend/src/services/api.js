const BASE_URL = '/api';

// Comprehensive mock database for static hosting environments (e.g. GitHub Pages)
const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

const mockBanks = [
  { id: 1, name: 'Metro Central Blood Bank & Research Institute', license_number: 'BB-KA-2023-011', address: '101 Victoria Road, Richmond Town', city: 'Bangalore', state: 'Karnataka', pincode: '560025', latitude: 12.9654, longitude: 77.6045, contact_phone: '+91-8022114400', contact_email: 'inventory@metroblood.org', operating_hours: '24/7 Service', verification_status: 'verified', total_tested_units: 42 },
  { id: 2, name: 'Apollo Red Cross Regional Bank', license_number: 'BB-KA-2022-005', address: '22 Bannerghatta Main Road', city: 'Bangalore', state: 'Karnataka', pincode: '560076', latitude: 12.9135, longitude: 77.5968, contact_phone: '+91-8026998800', contact_email: 'blooddesk@apollobank.org', operating_hours: '24/7 Service', verification_status: 'verified', total_tested_units: 25 },
  { id: 3, name: 'Lions Civic Community Blood Center', license_number: 'BB-KA-2024-019', address: '5 4th Block, Jayanagar', city: 'Bangalore', state: 'Karnataka', pincode: '560011', latitude: 12.9250, longitude: 77.5838, contact_phone: '+91-8026543210', contact_email: 'lionsblood@sample.org', operating_hours: '8:00 AM - 10:00 PM', verification_status: 'verified', total_tested_units: 23 }
];

const mockDonors = [
  { id: 1, masked_name: 'R*** K***', blood_group: 'O+', city: 'Bangalore', state: 'Karnataka', last_donation_date: '2026-08-10', availability_status: 'available', contact_preference: 'in_app', informational_interval_eligible: true, notes: 'Regular voluntary donor. Universal red cell donor for positive types.' },
  { id: 2, masked_name: 'P*** S***', blood_group: 'B+', city: 'Bangalore', state: 'Karnataka', last_donation_date: '2026-09-15', availability_status: 'available', contact_preference: 'phone', informational_interval_eligible: true, notes: 'Available for emergency weekend donation camps.' },
  { id: 3, masked_name: 'A*** N***', blood_group: 'A+', city: 'Bangalore', state: 'Karnataka', last_donation_date: '2026-07-20', availability_status: 'available', contact_preference: 'in_app', informational_interval_eligible: true, notes: 'Platelet apheresis donor.' }
];

let mockRequests = [
  { id: 1, requester_id: 6, requester_name: 'Amit Sengupta (Demo Requester)', patient_name: 'Ramesh Sengupta (Post-Surgery)', hospital_name_manual: 'CityCare Multispecialty Hospital', blood_group: 'O+', component: 'Packed Red Blood Cells (PRBC)', units_needed: 2, units_fulfilled: 0, urgency: 'urgent', required_by: '2026-11-27T10:00:00', contact_phone: '+91-9876543215', delivery_address: 'Ward 4B, CityCare Hospital, Indiranagar', city: 'Bangalore', state: 'Karnataka', status: 'open', notes: 'Patient scheduled for bypass surgery tomorrow morning.', created_at: '2026-11-25T14:00:00' },
  { id: 2, requester_id: 3, requester_name: 'Dr. Arvind Verma', patient_name: 'Trauma ICU Patient #1042', hospital_name_manual: 'CityCare Multispecialty Hospital', blood_group: 'O-', component: 'Whole Blood', units_needed: 3, units_fulfilled: 0, urgency: 'emergency', required_by: '2026-11-26T04:00:00', contact_phone: '+91-8023456780', delivery_address: 'ICU Resuscitation Bay 2', city: 'Bangalore', state: 'Karnataka', status: 'open', notes: 'Critical road traffic accident trauma case. Immediate availability required.', created_at: '2026-11-25T20:30:00' },
  { id: 3, requester_id: 6, requester_name: 'Amit Sengupta (Demo Requester)', patient_name: 'Sunita M. (Dengue Care)', hospital_name_manual: 'St. Jude Apex Medical Center', blood_group: 'B+', component: 'Platelets', units_needed: 4, units_fulfilled: 4, urgency: 'standard', required_by: '2026-11-24T18:00:00', contact_phone: '+91-9876543215', delivery_address: 'Floor 3, St Jude Center', city: 'Bangalore', state: 'Karnataka', status: 'fulfilled', notes: 'Platelet count dropped below 20k. Fulfilled by Metro Blood Bank.', created_at: '2026-11-24T10:00:00' }
];

let mockBatches = [
  { id: 1, blood_bank_id: 1, blood_bank_name: 'Metro Central Blood Bank', batch_number: 'MCBB-2026-A101', blood_group: 'O+', component: 'Whole Blood', units_available: 14, collection_date: '2026-11-10', expiry_date: '2026-12-15', status: 'tested_safe', days_until_expiry: 19 },
  { id: 2, blood_bank_id: 1, blood_bank_name: 'Metro Central Blood Bank', batch_number: 'MCBB-2026-A102', blood_group: 'O-', component: 'Whole Blood', units_available: 4, collection_date: '2026-11-12', expiry_date: '2026-12-17', status: 'tested_safe', days_until_expiry: 21 },
  { id: 3, blood_bank_id: 1, blood_bank_name: 'Metro Central Blood Bank', batch_number: 'MCBB-2026-A103', blood_group: 'A+', component: 'Packed Red Blood Cells (PRBC)', units_available: 18, collection_date: '2026-11-15', expiry_date: '2026-12-27', status: 'tested_safe', days_until_expiry: 31 },
  { id: 4, blood_bank_id: 1, blood_bank_name: 'Metro Central Blood Bank', batch_number: 'MCBB-2026-A104', blood_group: 'B+', component: 'Platelets', units_available: 8, collection_date: '2026-11-23', expiry_date: '2026-11-28', status: 'tested_safe', days_until_expiry: 2 },
  { id: 5, blood_bank_id: 1, blood_bank_name: 'Metro Central Blood Bank', batch_number: 'MCBB-2026-A105', blood_group: 'AB+', component: 'Fresh Frozen Plasma (FFP)', units_available: 12, collection_date: '2026-11-01', expiry_date: '2027-11-01', status: 'tested_safe', days_until_expiry: 340 },
  { id: 6, blood_bank_id: 1, blood_bank_name: 'Metro Central Blood Bank', batch_number: 'MCBB-2026-A106', blood_group: 'O+', component: 'Packed Red Blood Cells (PRBC)', units_available: 5, collection_date: '2026-11-24', expiry_date: '2026-12-29', status: 'quarantined', days_until_expiry: 33 }
];

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('cells_token');
  
  // Try real backend API first if not forced GitHub Pages
  if (!isGitHubPages) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      };

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn(`Local API unavailable on ${endpoint}, activating demo provider:`, err.message);
    }
  }

  // --- Static GitHub Pages & Demo Fallback Provider ---
  return handleMockRequest(endpoint, options);
};

function handleMockRequest(endpoint, options = {}) {
  const url = new URL(`http://dummy${endpoint}`);
  const pathname = url.pathname;
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};

  if (pathname === '/api/health') {
    return { success: true, data: { status: 'HEALTHY (Demo Mode)', service: 'CELLS Network', uptimeSeconds: 3600 } };
  }

  if (pathname === '/api/analytics/dashboard') {
    return {
      success: true,
      data: {
        stockByGroup: [
          { blood_group: 'A+', units: 28 }, { blood_group: 'A-', units: 8 },
          { blood_group: 'B+', units: 26 }, { blood_group: 'B-', units: 6 },
          { blood_group: 'AB+', units: 14 }, { blood_group: 'AB-', units: 4 },
          { blood_group: 'O+', units: 36 }, { blood_group: 'O-', units: 10 }
        ],
        stockByComponent: [
          { component: 'Whole Blood', units: 42 },
          { component: 'Packed Red Blood Cells (PRBC)', units: 38 },
          { component: 'Platelets', units: 22 },
          { component: 'Fresh Frozen Plasma (FFP)', units: 18 },
          { component: 'Cryoprecipitate', units: 12 }
        ],
        requestsByUrgency: [
          { urgency: 'emergency', count: 4 },
          { urgency: 'urgent', count: 7 },
          { urgency: 'standard', count: 12 }
        ],
        expiringBatches: [
          { batch_number: 'MCBB-2026-A104', blood_group: 'B+', component: 'Platelets', units_available: 8, expiry_date: '2026-11-28', blood_bank_name: 'Metro Central Blood Bank' }
        ]
      }
    };
  }

  if (pathname === '/api/bloodbanks') {
    let list = [...mockBanks];
    const city = url.searchParams.get('city');
    if (city) list = list.filter(b => b.city.toLowerCase().includes(city.toLowerCase()));
    return { success: true, data: { banks: list } };
  }

  if (pathname === '/api/donors') {
    let list = [...mockDonors];
    const bg = url.searchParams.get('blood_group');
    if (bg) list = list.filter(d => d.blood_group === bg);
    return { success: true, data: { donors: list } };
  }

  if (pathname === '/api/requests' && method === 'GET') {
    return { success: true, data: mockRequests };
  }

  if (pathname === '/api/requests' && method === 'POST') {
    const newReq = {
      id: mockRequests.length + 1,
      requester_name: 'Demo Requester',
      units_fulfilled: 0,
      status: 'open',
      created_at: new Date().toISOString(),
      ...body
    };
    mockRequests.unshift(newReq);
    return { success: true, data: newReq };
  }

  if (pathname.startsWith('/api/requests/') && pathname.endsWith('/fulfill')) {
    const id = parseInt(pathname.split('/')[3], 10);
    const reqItem = mockRequests.find(r => r.id === id);
    if (reqItem) {
      reqItem.units_fulfilled = Math.min(reqItem.units_needed, reqItem.units_fulfilled + (body.units_to_deduct || 1));
      if (reqItem.units_fulfilled >= reqItem.units_needed) reqItem.status = 'fulfilled';
    }
    return { success: true, message: 'Units issued and deducted.' };
  }

  if (pathname.startsWith('/api/requests/')) {
    const id = parseInt(pathname.split('/')[3], 10);
    const reqItem = mockRequests.find(r => r.id === id) || mockRequests[0];
    return {
      success: true,
      data: {
        ...reqItem,
        responses: [
          { id: 101, responder_name: 'Metro Central Blood Bank', responder_type: 'blood_bank', units_offered: 2, status: 'offered', message: 'Tested units ready. Crossmatch sample required.', created_at: '2026-11-25T16:00:00' }
        ]
      }
    };
  }

  if (pathname === '/api/inventory' && method === 'GET') {
    return { success: true, data: mockBatches };
  }

  if (pathname === '/api/inventory' && method === 'POST') {
    const newBatch = {
      id: mockBatches.length + 1,
      blood_bank_id: 1,
      blood_bank_name: 'Metro Central Blood Bank',
      days_until_expiry: 30,
      ...body
    };
    mockBatches.unshift(newBatch);
    return { success: true, data: newBatch };
  }

  if (pathname.startsWith('/api/inventory/') && method === 'PATCH') {
    const id = parseInt(pathname.split('/')[3], 10);
    const b = mockBatches.find(x => x.id === id);
    if (b && body.status) b.status = body.status;
    return { success: true, message: 'Status updated' };
  }

  if (pathname === '/api/inventory/audit-logs') {
    return {
      success: true,
      data: [
        { id: 1, created_at: new Date().toISOString(), batch_number: 'MCBB-2026-A101', change_units: 14, transaction_type: 'addition', reason: 'Initial camp collection intake', performed_by_name: 'Dr. Sarah Mathews' },
        { id: 2, created_at: new Date().toISOString(), batch_number: 'MCBB-2026-A103', change_units: -2, transaction_type: 'fulfillment', reason: 'Fulfilled Requisition #1', performed_by_name: 'Dr. Sarah Mathews' }
      ]
    };
  }

  if (pathname === '/api/auth/login') {
    const email = body.email || 'demo@cells.org';
    let role = 'public_visitor';
    let name = 'Demo User';
    if (email.includes('admin')) { role = 'admin'; name = 'System Administrator'; }
    else if (email.includes('staff')) { role = 'blood_bank'; name = 'Dr. Sarah Mathews'; }
    else if (email.includes('doctor')) { role = 'hospital'; name = 'Dr. Arvind Verma'; }
    else if (email.includes('donor')) { role = 'donor'; name = 'Rajesh Kumar'; }
    else if (email.includes('requester')) { role = 'requester'; name = 'Amit Sengupta'; }

    const user = { id: 1, full_name: name, email, role, phone: '+91-9876543210' };
    return { success: true, data: { token: 'demo-token-' + role, user } };
  }

  if (pathname === '/api/auth/me') {
    const token = localStorage.getItem('cells_token') || 'demo-token-donor';
    let role = 'donor';
    let name = 'Rajesh Kumar';
    if (token.includes('admin')) { role = 'admin'; name = 'System Administrator'; }
    else if (token.includes('blood_bank')) { role = 'blood_bank'; name = 'Dr. Sarah Mathews'; }
    else if (token.includes('hospital')) { role = 'hospital'; name = 'Dr. Arvind Verma'; }
    else if (token.includes('requester')) { role = 'requester'; name = 'Amit Sengupta'; }

    return {
      success: true,
      data: {
        id: 1,
        full_name: name,
        email: `${role}@cells.org`,
        phone: '+91-9876543210',
        role,
        roleDetails: { blood_group: 'O+', city: 'Bangalore', state: 'Karnataka', availability_status: 'available' }
      }
    };
  }

  if (pathname === '/api/donors/me') {
    return {
      success: true,
      data: { id: 1, blood_group: 'O+', city: 'Bangalore', state: 'Karnataka', pincode: '560001', availability_status: 'available', contact_preference: 'in_app', last_donation_date: '2026-08-10', notes: 'Universal donor.' }
    };
  }

  if (pathname === '/api/donors/history') {
    return {
      success: true,
      data: [
        { id: 1, donation_date: '2026-08-10', blood_bank_name: 'Metro Central Blood Bank', blood_bank_city: 'Bangalore', blood_group: 'O+', units_donated: 1 }
      ]
    };
  }

  if (pathname === '/api/admin/metrics') {
    return { success: true, data: { users: 8, verifiedBanks: 3, verifiedHospitals: 2, totalRequests: mockRequests.length, openRequests: 2, availableTestedUnits: 65 } };
  }

  if (pathname === '/api/admin/users') {
    return {
      success: true,
      data: [
        { id: 1, full_name: 'System Administrator', email: 'admin@cells.org', phone: '+91-9876543210', role: 'admin', is_active: 1 },
        { id: 2, full_name: 'Dr. Sarah Mathews', email: 'staff@metroblood.org', phone: '+91-9876543211', role: 'blood_bank', is_active: 1 },
        { id: 3, full_name: 'Dr. Arvind Verma', email: 'doctor@citycare.org', phone: '+91-9876543212', role: 'hospital', is_active: 1 },
        { id: 4, full_name: 'Rajesh Kumar', email: 'donor.rajesh@cells.sample', phone: '+91-9876543213', role: 'donor', is_active: 1 }
      ]
    };
  }

  if (pathname === '/api/admin/verifications') {
    return {
      success: true,
      data: {
        hospitals: [{ id: 3, name: 'Greenwood Trauma Clinic', license_number: 'HOSP-KA-2025-0105', city: 'Bangalore', contact_phone: '+91-8023456810' }],
        bloodBanks: [{ id: 4, name: 'Sunrise Charitable Blood Bank', license_number: 'BB-KA-2026-033', city: 'Bangalore', contact_phone: '+91-8028451122' }]
      }
    };
  }

  if (pathname === '/api/admin/audit-logs') {
    return {
      success: true,
      data: [
        { id: 1, action: 'SYSTEM_INIT', entity_type: 'SYSTEM', entity_id: 1, user_name: 'System Admin', user_role: 'admin', ip_address: '127.0.0.1', created_at: new Date().toISOString(), details_json: { status: 'Verified' } }
      ]
    };
  }

  if (pathname === '/api/notifications') {
    return {
      success: true,
      data: [
        { id: 1, title: '🚨 Urgent O+ Need Near You', message: 'CityCare Hospital posted a request for 2 units of O+ blood.', type: 'emergency', is_read: 0, link: '/requests/1', created_at: new Date().toISOString() }
      ]
    };
  }

  return { success: true, data: [] };
}

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => apiRequest(endpoint, { method: 'DELETE', ...options })
};

export default api;
