-- V.S.B ENGINEERING COLLEGE — BUS STUDENTS TRACKER
-- Seed Data for Transport Master Data (Phase 3)

-- 1. Buses
INSERT INTO buses (bus_id, bus_number, capacity, registration_plate, model, manufacturer, purchase_date, status, notes) VALUES
('b1000000-0000-0000-0000-000000000001', 'BUS-14', 54, 'TN-47-AV-1414', 'Viking 222 CRDI', 'Ashok Leyland', '2023-06-15', 'ACTIVE', 'Primary AI & DS corridor shuttle from Karur central'),
('b1000000-0000-0000-0000-000000000002', 'BUS-08', 50, 'TN-47-AV-0808', 'Starbus Ultra', 'Tata Motors', '2022-08-10', 'ACTIVE', 'Dindigul express transit vehicle'),
('b1000000-0000-0000-0000-000000000003', 'BUS-22', 54, 'TN-47-BW-2222', 'Lynx Smart Bus', 'Ashok Leyland', '2024-01-20', 'ACTIVE', 'Trichy route high-capacity bus'),
('b1000000-0000-0000-0000-000000000004', 'BUS-05', 48, 'TN-47-AU-0505', 'Starbus Skool', 'Tata Motors', '2021-11-05', 'ACTIVE', 'Erode connector transit'),
('b1000000-0000-0000-0000-000000000005', 'BUS-31', 54, 'TN-47-BX-3131', 'Viking 222 CRDI', 'Ashok Leyland', '2024-03-01', 'MAINTENANCE', 'Scheduled quarterly brake caliper service')
ON CONFLICT (bus_number) DO NOTHING;

-- 2. Routes
INSERT INTO routes (route_id, route_name, route_code, route_type, distance_km, estimated_duration_minutes, start_time, end_time, status, notes) VALUES
('r1000000-0000-0000-0000-000000000001', 'Karur Central to VSB Campus', 'RT-KRR-01', 'MORNING', 18.50, 40, '07:30:00', '08:15:00', 'ACTIVE', 'High traffic suburban feeder route via Thanthonimalai'),
('r1000000-0000-0000-0000-000000000002', 'VSB Campus to Karur Central', 'RT-KRR-02', 'EVENING', 18.50, 45, '16:45:00', '17:30:00', 'ACTIVE', 'Evening student and faculty return route to Karur'),
('r1000000-0000-0000-0000-000000000003', 'Dindigul Junction to VSB Campus', 'RT-DGL-01', 'MORNING', 45.00, 65, '07:00:00', '08:10:00', 'ACTIVE', 'Inter-district highway commuter route'),
('r1000000-0000-0000-0000-000000000004', 'Tiruchirappalli Chathiram to VSB Campus', 'RT-TRY-01', 'MORNING', 62.00, 75, '06:45:00', '08:05:00', 'ACTIVE', 'National highway express transit via Kulithalai')
ON CONFLICT (route_code) DO NOTHING;

-- 3. Stops
INSERT INTO stops (stop_id, route_id, stop_name, stop_sequence, stop_type, latitude, longitude, address, estimated_arrival_time, estimated_departure_time, geofence_radius_meters, status) VALUES
('s1000000-0000-0000-0000-000000000001', 'r1000000-0000-0000-0000-000000000001', 'Karur Central Bus Stand (Bay 4)', 1, 'BOARDING', 10.95740000, 78.08150000, 'Central Bus Stand, Karur, TN 639001', '07:30:00', '07:35:00', 500, 'ACTIVE'),
('s1000000-0000-0000-0000-000000000002', 'r1000000-0000-0000-0000-000000000001', 'Thanthonimalai Kalyana Mandapam', 2, 'BOARDING', 10.93200000, 78.08640000, 'Thanthonimalai Main Road, Karur', '07:45:00', '07:47:00', 400, 'ACTIVE'),
('s1000000-0000-0000-0000-000000000003', 'r1000000-0000-0000-0000-000000000001', 'Rayanur Junction', 3, 'BOARDING', 10.91500000, 78.08900000, 'Rayanur Arch, NH-83, Karur', '07:53:00', '07:55:00', 400, 'ACTIVE'),
('s1000000-0000-0000-0000-000000000004', 'r1000000-0000-0000-0000-000000000001', 'Gandhigramam Roundana', 4, 'BOARDING', 10.90200000, 78.09300000, 'Gandhigramam Bus Stop, Karur', '08:00:00', '08:02:00', 350, 'ACTIVE'),
('s1000000-0000-0000-0000-000000000005', 'r1000000-0000-0000-0000-000000000001', 'V.S.B. Engineering College Main Gate', 5, 'DROP', 10.87560000, 78.10240000, 'Covai Road, Karudayampalayam, Karur, TN 639111', '08:15:00', '08:20:00', 800, 'ACTIVE')
ON CONFLICT (stop_id) DO NOTHING;

-- 4. Drivers
INSERT INTO drivers (driver_id, employee_id, first_name, last_name, email, phone, emergency_contact, emergency_phone, license_number, license_expiry, aadhar_number, date_of_birth, status, assigned_bus_id, assignment_date, notes) VALUES
('d1000000-0000-0000-0000-000000000001', 'DRV-VSB-04', 'Murugesan', 'Palanisamy', 'driver@vsb.ac.in', '+91 94432 10104', 'Saraswathi M (Spouse)', '+91 94432 10105', 'TN47-20120004589', '2028-09-30', '784512963012', '1982-05-14', 'ACTIVE', 'b1000000-0000-0000-0000-000000000001', '2023-06-15', 'Certified Heavy Vehicle Operator - 14 years service'),
('d1000000-0000-0000-0000-000000000002', 'DRV-VSB-08', 'Sivakumar', 'Kaliappan', 'sivakumar.drv@vsb.ac.in', '+91 98421 20208', 'Lakshmi S (Spouse)', '+91 98421 20209', 'TN47-20150007812', '2029-03-15', '654123987456', '1985-11-22', 'ACTIVE', 'b1000000-0000-0000-0000-000000000002', '2022-08-10', 'Dindigul highway route specialist'),
('d1000000-0000-0000-0000-000000000003', 'DRV-VSB-22', 'Ramanathan', 'Chettiar', 'ramanathan.drv@vsb.ac.in', '+91 97500 30322', 'Meenakshi R (Spouse)', '+91 97500 30323', 'TN47-20100003456', '2027-12-31', '321654987123', '1979-08-04', 'ACTIVE', 'b1000000-0000-0000-0000-000000000003', '2024-01-20', 'Trichy express route lead driver')
ON CONFLICT (employee_id) DO NOTHING;

-- 5. Bus In-Charges
INSERT INTO bus_in_charges (in_charge_id, employee_id, first_name, last_name, email, phone, emergency_contact, emergency_phone, department, designation, date_of_birth, status, assigned_bus_id, assignment_date, notes) VALUES
('f1000000-0000-0000-0000-000000000001', 'FAC-AIDS-12', 'Revathi', 'Ramasamy', 'incharge@vsb.ac.in', '+91 94861 80012', 'Dr. Sundaram (Spouse)', '+91 94861 80013', 'Department of AI & DS', 'Assistant Professor', '1988-03-18', 'ACTIVE', 'b1000000-0000-0000-0000-000000000001', '2023-06-15', 'Faculty in-charge for BUS-14. Responsible for student conduct and headcounts.'),
('f1000000-0000-0000-0000-000000000002', 'FAC-CSE-09', 'Karthi', 'Shanmugam', 'karthi.cse@vsb.ac.in', '+91 94861 80009', 'Deepa K (Spouse)', '+91 94861 80010', 'Department of CSE', 'Associate Professor', '1984-07-25', 'ACTIVE', 'b1000000-0000-0000-0000-000000000002', '2022-08-10', 'Faculty in-charge for BUS-08 (Dindigul route)'),
('f1000000-0000-0000-0000-000000000003', 'FAC-ECE-15', 'Jayakumar', 'Perumal', 'jayakumar.ece@vsb.ac.in', '+91 94861 80015', 'Priya J (Spouse)', '+91 94861 80016', 'Department of ECE', 'Assistant Professor', '1990-12-10', 'ACTIVE', 'b1000000-0000-0000-0000-000000000003', '2024-01-20', 'Faculty in-charge for BUS-22 (Trichy route)')
ON CONFLICT (employee_id) DO NOTHING;

-- 6. Bus Route Assignments
INSERT INTO bus_route_assignments (assignment_id, bus_id, route_id, assigned_date, status) VALUES
('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'r1000000-0000-0000-0000-000000000001', '2024-01-01', 'ACTIVE'),
('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'r1000000-0000-0000-0000-000000000003', '2024-01-01', 'ACTIVE'),
('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'r1000000-0000-0000-0000-000000000004', '2024-01-01', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- 7. Cameras
INSERT INTO cameras (camera_id, camera_name, bus_id, location, camera_type, ip_address, status, last_seen, resolution, notes) VALUES
('c1000000-0000-0000-0000-000000000001', 'CAM-B14-ENTRY', 'b1000000-0000-0000-0000-000000000001', 'Front Boarding Door Footstep', 'ENTRY', '192.168.14.101', 'ONLINE', CURRENT_TIMESTAMP, '1080p @ 30fps', 'Primary face and badge detection optical pipeline'),
('c1000000-0000-0000-0000-000000000002', 'CAM-B14-EXIT', 'b1000000-0000-0000-0000-000000000001', 'Rear Departure Door', 'EXIT', '192.168.14.102', 'ONLINE', CURRENT_TIMESTAMP, '1080p @ 30fps', 'Egress validation sensor'),
('c1000000-0000-0000-0000-000000000003', 'CAM-B14-CABIN', 'b1000000-0000-0000-0000-000000000001', 'Ceiling Center Forward Facing', 'INTERIOR', '192.168.14.103', 'ONLINE', CURRENT_TIMESTAMP, '4K Wide Angle', 'Passenger seat occupancy vision telemetry'),
('c1000000-0000-0000-0000-000000000004', 'CAM-B08-ENTRY', 'b1000000-0000-0000-0000-000000000002', 'Front Boarding Door', 'ENTRY', '192.168.8.101', 'ONLINE', CURRENT_TIMESTAMP, '1080p @ 30fps', 'Bus 08 entry gate sensor'),
('c1000000-0000-0000-0000-000000000005', 'CAM-B31-ENTRY', 'b1000000-0000-0000-0000-000000000005', 'Front Boarding Door', 'ENTRY', '192.168.31.101', 'OFFLINE', CURRENT_TIMESTAMP - INTERVAL '2 hours', '1080p @ 30fps', 'Power supply disconnected for bus maintenance')

-- 8. Students (Phase 4)
INSERT INTO students (student_id, roll_number, first_name, last_name, email, phone, emergency_contact_name, emergency_contact_phone, date_of_birth, department, semester, section, transport_status, bio_enrolled, face_recognition_id, parent_name, parent_phone, address, city, postal_code, notes) VALUES
('st100000-0000-0000-0000-000000000001', '922521104001', 'Hemanth', 'Kumar', 'hemanth.aids@vsb.ac.in', '+91 98765 43210', 'Arumugam K (Father)', '+91 98765 43211', '2004-05-12', 'Artificial Intelligence & Data Science', 6, 'A', 'ACTIVE', true, 'FACE-VSB-AIDS-001', 'Arumugam K', '+91 98765 43211', '12, Kamaraj Nagar, Thanthonimalai', 'Karur', '639005', 'AI/DS Dept Student Representative'),
('st100000-0000-0000-0000-000000000002', '922521104042', 'Priya', 'Sharma', 'priya.aids@vsb.ac.in', '+91 98765 43212', 'Radhakrishnan S (Father)', '+91 98765 43213', '2004-08-22', 'Artificial Intelligence & Data Science', 6, 'A', 'ACTIVE', true, 'FACE-VSB-AIDS-042', 'Radhakrishnan S', '+91 98765 43213', '45/2, Kovai Road, Rayanur', 'Karur', '639003', 'Enrolled in edge camera vision trials'),
('st100000-0000-0000-0000-000000000003', '922521104055', 'Rajesh', 'Patel', 'rajesh.cse@vsb.ac.in', '+91 98765 43214', 'Mahesh Patel (Father)', '+91 98765 43215', '2003-11-15', 'Computer Science & Engineering', 6, 'B', 'ACTIVE', false, NULL, 'Mahesh Patel', '+91 98765 43215', '88, Central Bus Stand West, Bay Area', 'Karur', '639001', 'Regular morning commuter'),
('st100000-0000-0000-0000-000000000004', '922522104018', 'Aisha', 'Khan', 'aisha.ece@vsb.ac.in', '+91 98765 43216', 'Farooq Khan (Father)', '+91 98765 43217', '2005-02-18', 'Electronics & Communication Engineering', 4, 'A', 'REQUESTED', false, NULL, 'Farooq Khan', '+91 98765 43217', '104, Gandhigramam South', 'Karur', '639004', 'Requested route change to RT-KRR-01'),
('st100000-0000-0000-0000-000000000005', '922522104090', 'Vikram', 'Singh', 'vikram.mech@vsb.ac.in', '+91 98765 43218', 'Balwant Singh (Father)', '+91 98765 43219', '2005-06-30', 'Mechanical Engineering', 4, 'B', 'INACTIVE', false, NULL, 'Balwant Singh', '+91 98765 43219', '22, Dindigul Highway bypass', 'Dindigul', '624001', 'Hostel resident - transport currently suspended')
ON CONFLICT (roll_number) DO NOTHING;

-- 9. Student Bus Assignments (Phase 4)
INSERT INTO student_bus_assignments (assignment_id, student_id, bus_id, route_id, boarding_stop_id, drop_stop_id, assignment_date, status, is_primary, notes) VALUES
('sa100000-0000-0000-0000-000000000001', 'st100000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'r1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000002', 's1000000-0000-0000-0000-000000000005', '2024-01-02', 'ACTIVE', true, 'Thanthonimalai boarding point assignment'),
('sa100000-0000-0000-0000-000000000002', 'st100000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'r1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000003', 's1000000-0000-0000-0000-000000000005', '2024-01-02', 'ACTIVE', true, 'Rayanur Junction boarding point assignment'),
('sa100000-0000-0000-0000-000000000003', 'st100000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'r1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000005', '2024-01-02', 'ACTIVE', true, 'Karur Central Bus Stand boarding point assignment')
ON CONFLICT DO NOTHING;

-- 10. Student Transport Requests (Phase 4)
INSERT INTO student_transport_requests (request_id, student_id, requested_bus_id, requested_route_id, requested_boarding_stop_id, requested_drop_stop_id, request_type, request_status, requested_by_role, notes) VALUES
('tr100000-0000-0000-0000-000000000001', 'st100000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'r1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000004', 's1000000-0000-0000-0000-000000000005', 'NEW_ASSIGNMENT', 'PENDING', 'STUDENT', 'Relocated to Gandhigramam, requesting seat in BUS-14'),
('tr100000-0000-0000-0000-000000000002', 'st100000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'r1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000004', 's1000000-0000-0000-0000-000000000005', 'STOP_CHANGE', 'APPROVED', 'STUDENT', 'Temporary stop change approved for lab practical weeks')
ON CONFLICT DO NOTHING;

-- 11. Student Attendance Log (Phase 4)
INSERT INTO student_attendance_log (log_id, student_id, bus_id, boarding_time, drop_time, boarding_stop_id, drop_stop_id, recognition_status, verification_result, camera_id, confidence_score, notes) VALUES
('al100000-0000-0000-0000-000000000001', 'st100000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', CURRENT_TIMESTAMP - INTERVAL '1 hour 25 minutes', CURRENT_TIMESTAMP - INTERVAL '35 minutes', 's1000000-0000-0000-0000-000000000002', 's1000000-0000-0000-0000-000000000005', 'FACE_MATCH', 'VERIFIED', 'c1000000-0000-0000-0000-000000000001', 0.98, 'Edge camera matched facial embeddings at Thanthonimalai stop'),
('al100000-0000-0000-0000-000000000002', 'st100000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', CURRENT_TIMESTAMP - INTERVAL '1 hour 15 minutes', CURRENT_TIMESTAMP - INTERVAL '35 minutes', 's1000000-0000-0000-0000-000000000003', 's1000000-0000-0000-0000-000000000005', 'FACE_MATCH', 'VERIFIED', 'c1000000-0000-0000-0000-000000000001', 0.96, 'Edge camera matched facial embeddings at Rayanur stop'),
('al100000-0000-0000-0000-000000000003', 'st100000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', CURRENT_TIMESTAMP - INTERVAL '1 hour 30 minutes', CURRENT_TIMESTAMP - INTERVAL '35 minutes', 's1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000005', 'MANUAL', 'VERIFIED', NULL, 1.00, 'Faculty in-charge verified physical ID card at Central Bus Stand')
ON CONFLICT DO NOTHING;

-- 12. Staff Roles (Phase 5)
INSERT INTO staff_roles (role_id, role_name, role_description, permissions, is_system_role) VALUES
('sr100000-0000-0000-0000-000000000001', 'DRIVER', 'Bus Driver Role with route & vehicle view access', '{"permissions": ["view_assigned_bus", "view_route", "view_students", "log_boarding", "log_dropoff"], "dashboard_access": ["driver_dashboard"], "report_access": ["daily_attendance", "route_summary"]}', true),
('sr100000-0000-0000-0000-000000000002', 'BUS_IN_CHARGE', 'Faculty Bus In-Charge role with student conduct tracking', '{"permissions": ["manage_students", "review_requests", "track_attendance", "generate_reports"], "dashboard_access": ["staff_dashboard", "student_management"], "report_access": ["daily_report", "weekly_report", "student_analytics"]}', true),
('sr100000-0000-0000-0000-000000000003', 'TRANSPORT_STAFF', 'Transport Department Operations Staff', '{"permissions": ["manage_buses", "manage_routes", "manage_drivers", "manage_staff"], "dashboard_access": ["admin_dashboard", "fleet_management"], "report_access": ["fleet_report", "driver_report", "compliance_report"]}', true),
('sr100000-0000-0000-0000-000000000004', 'ADMIN', 'Transport System Administrator Full Access', '{"permissions": ["*"], "dashboard_access": ["admin_dashboard", "all"], "report_access": ["all"]}', true)
ON CONFLICT (role_name) DO NOTHING;

-- 13. Staff Members (Phase 5)
INSERT INTO staff_members (staff_id, staff_type, employee_id, first_name, last_name, email, phone, emergency_contact_name, emergency_contact_phone, date_of_birth, gender, address, city, postal_code, role_id, department, designation, employment_status, hire_date, username, license_number, license_expiry, license_category, license_holder_name, safety_rating, punctuality_rating, student_satisfaction, total_incidents, total_complaints, assigned_bus_id, assignment_date, notes) VALUES
('sm100000-0000-0000-0000-000000000001', 'DRIVER', 'STF-001', 'Murugesan', 'Palanisamy', 'murugesan.drv@vsb.ac.in', '+91 94432 10104', 'Saraswathi M (Spouse)', '+91 94432 10105', '1982-05-14', 'M', '45, Anna Nagar, Thanthonimalai', 'Karur', '639005', 'sr100000-0000-0000-0000-000000000001', 'Transport Operations', 'Senior Heavy Vehicle Pilot', 'ACTIVE', '2023-01-15', 'murugesan_drv', 'TN47-20120004589', '2028-09-30', 'HMV', 'Murugesan Palanisamy', 4.90, 4.95, 4.85, 0, 0, 'b1000000-0000-0000-0000-000000000001', '2023-06-15', 'Certified Heavy Vehicle Operator - 14 years accident-free service'),
('sm100000-0000-0000-0000-000000000002', 'DRIVER', 'STF-002', 'Sivakumar', 'Kaliappan', 'sivakumar.drv@vsb.ac.in', '+91 98421 20208', 'Lakshmi S (Spouse)', '+91 98421 20209', '1985-11-22', 'M', '12, Bypass Road', 'Dindigul', '624001', 'sr100000-0000-0000-0000-000000000001', 'Transport Operations', 'Heavy Vehicle Pilot', 'ACTIVE', '2023-02-20', 'sivakumar_drv', 'TN47-20150007812', '2029-03-15', 'HMV', 'Sivakumar Kaliappan', 4.80, 4.70, 4.90, 0, 1, 'b1000000-0000-0000-0000-000000000002', '2022-08-10', 'Dindigul highway route transit specialist'),
('sm100000-0000-0000-0000-000000000003', 'DRIVER', 'STF-003', 'Ramanathan', 'Chettiar', 'ramanathan.drv@vsb.ac.in', '+91 97500 30322', 'Meenakshi R (Spouse)', '+91 97500 30323', '1979-08-04', 'M', '78, Chathiram Main Road', 'Tiruchirappalli', '620002', 'sr100000-0000-0000-0000-000000000001', 'Transport Operations', 'Senior Transit Pilot', 'ON_LEAVE', '2024-01-20', 'ramanathan_drv', 'TN47-20100003456', '2027-12-31', 'HMV', 'Ramanathan Chettiar', 4.85, 4.90, 4.80, 1, 0, 'b1000000-0000-0000-0000-000000000003', '2024-01-20', 'Trichy express route lead pilot - on medical leave this week'),
('sm100000-0000-0000-0000-000000000004', 'BUS_IN_CHARGE', 'STF-004', 'Revathi', 'Ramasamy', 'revathi.faculty@vsb.ac.in', '+91 94861 80012', 'Dr. Sundaram (Spouse)', '+91 94861 80013', '1988-03-18', 'F', '14, Staff Quarters, VSB Campus', 'Karur', '639111', 'sr100000-0000-0000-0000-000000000002', 'Artificial Intelligence & Data Science', 'Assistant Professor & Bus In-Charge', 'ACTIVE', '2023-03-10', 'revathi_faculty', NULL, NULL, NULL, NULL, 5.00, 5.00, 4.95, 0, 0, 'b1000000-0000-0000-0000-000000000001', '2023-06-15', 'Faculty in-charge for BUS-14 AI/DS transit corridor'),
('sm100000-0000-0000-0000-000000000005', 'TRANSPORT_STAFF', 'STF-005', 'Karthi', 'Shanmugam', 'karthi.staff@vsb.ac.in', '+91 94861 80009', 'Deepa K (Spouse)', '+91 94861 80010', '1984-07-25', 'M', '22, Teachers Colony', 'Karur', '639002', 'sr100000-0000-0000-0000-000000000003', 'Transport & Fleet Office', 'Transport Supervisor', 'ACTIVE', '2022-05-01', 'karthi_transport', NULL, NULL, NULL, NULL, 4.95, 4.85, 4.90, 0, 0, NULL, NULL, 'Fleet dispatch supervisor and driver coordinator')
ON CONFLICT (employee_id) DO NOTHING;

-- 14. Staff Shifts (Phase 5)
INSERT INTO staff_shifts (shift_id, staff_id, bus_id, route_id, shift_date, shift_type, scheduled_start_time, scheduled_end_time, actual_start_time, actual_end_time, status, shift_notes) VALUES
('ss100000-0000-0000-0000-000000000001', 'sm100000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'r1000000-0000-0000-0000-000000000001', CURRENT_DATE, 'MORNING', '06:45:00', '08:30:00', CURRENT_TIMESTAMP - INTERVAL '1 hour 45 minutes', CURRENT_TIMESTAMP - INTERVAL '15 minutes', 'COMPLETED', 'Morning run completed on schedule. 52 students boarded.'),
('ss100000-0000-0000-0000-000000000002', 'sm100000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'r1000000-0000-0000-0000-000000000002', CURRENT_DATE, 'EVENING', '16:30:00', '18:15:00', NULL, NULL, 'SCHEDULED', 'Evening return trip scheduled for Bay 4 Karur route'),
('ss100000-0000-0000-0000-000000000003', 'sm100000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'r1000000-0000-0000-0000-000000000003', CURRENT_DATE, 'MORNING', '06:30:00', '08:20:00', CURRENT_TIMESTAMP - INTERVAL '1 hour 50 minutes', CURRENT_TIMESTAMP - INTERVAL '20 minutes', 'COMPLETED', 'Dindigul morning commute completed'),
('ss100000-0000-0000-0000-000000000004', 'sm100000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'r1000000-0000-0000-0000-000000000004', CURRENT_DATE, 'EVENING', '16:30:00', '18:30:00', NULL, NULL, 'SCHEDULED', 'Assigned as substitute driver for BUS-22 Trichy route')
ON CONFLICT DO NOTHING;

-- 15. Staff Leave Requests (Phase 5)
INSERT INTO staff_leave_requests (leave_id, staff_id, leave_type, leave_start_date, leave_end_date, total_days, reason, request_status, approved_by_user_id, approved_at, approval_notes, replacement_staff_id) VALUES
('lr100000-0000-0000-0000-000000000001', 'sm100000-0000-0000-0000-000000000003', 'SICK', CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 3, 'Viral fever and prescribed medical rest by physician', 'APPROVED', 'admin@vsb.ac.in', CURRENT_TIMESTAMP - INTERVAL '1 day', 'Approved. Driver Sivakumar assigned for Trichy route coverage.', 'sm100000-0000-0000-0000-000000000002'),
('lr100000-0000-0000-0000-000000000002', 'sm100000-0000-0000-0000-000000000001', 'CASUAL', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '6 days', 2, 'Family function in hometown Madurai', 'PENDING', NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- 16. Staff Performance Log (Phase 5)
INSERT INTO staff_performance_log (log_id, staff_id, log_date, log_type, incident_type, incident_description, severity, complaint_from_student_id, complaint_description, commendation_reason, safety_score, punctuality_score, student_interaction_score, professionalism_score, action_taken, follow_up_required, follow_up_date, resolved, created_by_user_id) VALUES
('pl100000-0000-0000-0000-000000000001', 'sm100000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '10 days', 'COMMENDATION', NULL, NULL, 'LOW', NULL, NULL, 'Exceptional vehicle handling in dense monsoon rain near Thanthonimalai with full passenger safety', 5.00, 5.00, 5.00, 5.00, 'Appreciation certificate issued by Transport Office', false, NULL, true, 'admin@vsb.ac.in'),
('pl100000-0000-0000-0000-000000000002', 'sm100000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '5 days', 'FEEDBACK', NULL, NULL, 'LOW', NULL, NULL, NULL, 4.80, 4.70, 4.90, 4.80, 'Monthly student feedback aggregate', false, NULL, true, 'incharge@vsb.ac.in'),
('pl100000-0000-0000-0000-000000000003', 'sm100000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '20 days', 'INCIDENT', 'MINOR_DELAY', 'Vehicle tire puncture on Trichy highway, safe evacuation to shoulder and swift tire replacement within 18 minutes', 'LOW', NULL, NULL, NULL, 4.50, 4.00, 4.80, 4.90, 'Spares inspected and tire pressure sensors calibrated', false, NULL, true, 'admin@vsb.ac.in')
ON CONFLICT DO NOTHING;

-- 17. Staff Salary Structure (Phase 5)
INSERT INTO staff_salary_structure (salary_id, staff_id, effective_date, base_salary, dearness_allowance, house_rent_allowance, conveyance_allowance, medical_allowance, performance_bonus, total_monthly_salary, provident_fund, income_tax, salary_status) VALUES
('sl100000-0000-0000-0000-000000000001', 'sm100000-0000-0000-0000-000000000001', '2024-01-01', 22000.00, 4400.00, 3300.00, 1800.00, 1200.00, 2000.00, 34700.00, 2640.00, 500.00, 'ACTIVE'),
('sl100000-0000-0000-0000-000000000002', 'sm100000-0000-0000-0000-000000000002', '2024-01-01', 20000.00, 4000.00, 3000.00, 1800.00, 1200.00, 1500.00, 31500.00, 2400.00, 400.00, 'ACTIVE'),
('sl100000-0000-0000-0000-000000000003', 'sm100000-0000-0000-0000-000000000003', '2024-01-01', 23000.00, 4600.00, 3450.00, 1800.00, 1200.00, 1800.00, 35850.00, 2760.00, 600.00, 'ACTIVE'),
('sl100000-0000-0000-0000-000000000004', 'sm100000-0000-0000-0000-000000000004', '2024-01-01', 45000.00, 9000.00, 6750.00, 2500.00, 2000.00, 3000.00, 68250.00, 5400.00, 2500.00, 'ACTIVE'),
('sl100000-0000-0000-0000-000000000005', 'sm100000-0000-0000-0000-000000000005', '2024-01-01', 28000.00, 5600.00, 4200.00, 2000.00, 1500.00, 2000.00, 43300.00, 3360.00, 1000.00, 'ACTIVE')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PHASE 6 SEEDS — CAMERA MANAGEMENT & INTEGRATION
-- ============================================================

-- 18. Camera Network Metrics
INSERT INTO camera_network_metrics (camera_id, bus_id, recorded_at, ping_latency_ms, packet_loss_percentage, jitter_ms, bandwidth_kbps, connection_quality, battery_percentage, cpu_usage_percentage, memory_usage_percentage, temperature_celsius, fps_current, bitrate_current_kbps, network_type) VALUES
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', CURRENT_TIMESTAMP - INTERVAL '5 minutes', 24.50, 0.00, 2.10, 2048, 'EXCELLENT', 94, 28.50, 42.00, 38.5, 30.0, 2048, '4G'),
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', CURRENT_TIMESTAMP, 26.20, 0.00, 3.40, 2048, 'EXCELLENT', 93, 31.00, 44.50, 39.0, 30.0, 2048, '4G'),
('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', CURRENT_TIMESTAMP, 32.10, 0.20, 4.20, 2048, 'GOOD', 95, 24.00, 38.00, 37.2, 30.0, 2048, '4G'),
('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', CURRENT_TIMESTAMP, 45.00, 1.10, 6.80, 4096, 'GOOD', 91, 46.50, 58.00, 42.1, 30.0, 4096, '4G'),
('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', CURRENT_TIMESTAMP, 58.40, 2.40, 8.50, 1536, 'FAIR', 88, 35.00, 48.00, 41.5, 28.5, 1536, '4G')
ON CONFLICT DO NOTHING;

-- 19. Camera Events & Alerts
INSERT INTO camera_events (camera_id, bus_id, event_type, severity, event_description, event_data, is_resolved, resolved_at, resolved_by, resolution_notes) VALUES
('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005', 'DISCONNECTION', 'CRITICAL', 'Device heartbeat lost on BUS-31 front entry camera', '{"last_ping": "2 hours ago", "gateway_reachable": false}'::jsonb, false, NULL, NULL, NULL),
('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', 'PACKET_LOSS_HIGH', 'WARNING', 'Packet loss exceeded threshold (2.4% > 2.0%) during transit near Thanthonimalai', '{"loss_pct": 2.4, "network": "4G"}'::jsonb, true, CURRENT_TIMESTAMP - INTERVAL '30 minutes', 1, 'Signal recovered automatically after leaving cellular shadow area'),
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'CAMERA_CALIBRATED', 'INFO', 'Routine weekly optical alignment verified for face recognition accuracy', '{"pan": 0, "tilt": -15, "confidence": 0.98}'::jsonb, true, CURRENT_TIMESTAMP - INTERVAL '1 day', 1, 'Verified by Transport Supervisor Karthi Shanmugam')
ON CONFLICT DO NOTHING;

-- 20. Camera Calibration
INSERT INTO camera_calibration (camera_id, calibrated_by, calibration_date, pan_angle_deg, tilt_angle_deg, zoom_factor, focus_distance_m, face_detection_threshold, min_face_size_pixels, calibration_status, reference_image_url, notes, verified_by, verified_at) VALUES
('c1000000-0000-0000-0000-000000000001', 1, CURRENT_TIMESTAMP - INTERVAL '1 day', 0.00, -15.00, 1.0, 2.50, 0.85, 80, 'VERIFIED', '/uploads/calibrations/cam_b14_entry_ref.jpg', 'Optimal angle capturing boarding passenger face and college RFID badge simultaneously', 1, CURRENT_TIMESTAMP - INTERVAL '1 day'),
('c1000000-0000-0000-0000-000000000002', 1, CURRENT_TIMESTAMP - INTERVAL '2 days', 5.00, -10.00, 1.0, 2.20, 0.80, 80, 'VERIFIED', '/uploads/calibrations/cam_b14_exit_ref.jpg', 'Departure verification focus configured', 1, CURRENT_TIMESTAMP - INTERVAL '2 days'),
('c1000000-0000-0000-0000-000000000003', 1, CURRENT_TIMESTAMP - INTERVAL '3 days', 0.00, -25.00, 1.2, 4.50, 0.75, 60, 'VERIFIED', '/uploads/calibrations/cam_b14_cabin_ref.jpg', 'Cabin wide angle coverage for student seating and driver mirror monitoring', 1, CURRENT_TIMESTAMP - INTERVAL '3 days'),
('c1000000-0000-0000-0000-000000000004', 1, CURRENT_TIMESTAMP - INTERVAL '5 days', -2.00, -12.00, 1.0, 2.40, 0.85, 80, 'VERIFIED', '/uploads/calibrations/cam_b08_entry_ref.jpg', 'Entry camera aligned for Bus 08', 1, CURRENT_TIMESTAMP - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- 21. Camera Stream Segments
INSERT INTO camera_stream_segments (camera_id, bus_id, shift_id, segment_start_time, segment_end_time, duration_seconds, file_path, file_size_bytes, stream_quality, retention_policy, is_archived, archive_reason) VALUES
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 1, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour', 3600, '/streams/segments/2026-09-20/b14_cam1_seg01.mp4', 1073741824, '1080p', '30_DAYS', false, NULL),
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 1, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP, 3600, '/streams/segments/2026-09-20/b14_cam1_seg02.mp4', 1048576000, '1080p', '30_DAYS', false, NULL),
('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 1, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour', 3600, '/streams/segments/2026-09-20/b14_cam2_seg01.mp4', 858993459, '720p', '7_DAYS', false, NULL)
ON CONFLICT DO NOTHING;

