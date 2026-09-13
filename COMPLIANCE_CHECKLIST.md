# Compliance Checklist: DepEd & NPC Requirements

---

## 1. Data Privacy Act of 2012 (DPA) Compliance

### 1.1 Personal Data Processing
- [ ] **Consent Form:** Before collecting any student data, school must have signed consent from parent/guardian
- [ ] **Purpose Limitation:** Document why each data field is collected (e.g., "Attendance for DepEd reporting")
- [ ] **Data Minimization:** Only collect fields needed (LRN, name, age, contact, grades, attendance)
- [ ] **Accuracy:** Regular audit to ensure data is correct (students can request corrections)
- [ ] **Storage Limitation:** Data retention policy: 3 years after school year ends, then delete

### 1.2 Special Categories
- [ ] **Health Data:** If collecting health info (allergies, medical conditions), must have explicit consent
- [ ] **Biometric Data:** If using fingerprint/face ID for attendance, must have signed consent + NPC registration
- [ ] **Children's Data:** Extra protection (age <18). Cannot use for marketing/profiling.

### 1.3 Data Security
- [ ] **Encryption at Rest:** All student data in database encrypted (AES-256)
- [ ] **Encryption in Transit:** HTTPS only, no plain HTTP
- [ ] **Access Control:** Only authorized users (teachers, admins) can view student data
- [ ] **Audit Trails:** Every access logged (user, timestamp, action, what was accessed)
- [ ] **Password Security:** Hashed with bcrypt, minimum 8 chars, no plain text storage

---

## 2. National Privacy Commission (NPC) Requirements

### 2.1 Privacy Policy
- [ ] **Embedded in App:** Accessible via footer link, no login required
- [ ] **In Plain Language:** Explain in Tagalog/English what data we collect, why, how long we keep it
- [ ] **Covers:** Our use, school's use, third parties (if any), data residency, user rights
- [ ] **User Rights Explained:** Right to access, right to correction, right to deletion, right to restrict processing
- [ ] **Contact:** NPC contact info + our Data Protection Officer (DPO)

### 2.2 Terms of Service (School-Specific)
- [ ] **Data Ownership:** "All student data belongs to the school. We are a service provider."
- [ ] **No Data Selling:** "We will never sell, share, or use student data for marketing."
- [ ] **SLA Statement:** "We commit to 99.5% uptime (excluding scheduled maintenance)."
- [ ] **Data Retention:** "We keep backups for 30 days. Schools can request deletion anytime."
- [ ] **Exit Clause:** "If our service shuts down, all data will be provided to the school in portable format."
- [ ] **No Arbitrary Suspension:** "We will not suspend service without written notice (30 days)."

### 2.3 Data Processing Agreement (DPA)
- [ ] **If we process on behalf of schools:** Sign written DPA with each school
- [ ] **DPA includes:** Scope of processing, data security measures, sub-processors, liability
- [ ] **School Right to Audit:** School can request proof of compliance anytime

### 2.4 Data Breach Protocol
- [ ] **Breach Detection:** Within 24 hours, we must know if data was compromised
- [ ] **School Notification:** Notify school within 72 hours of discovery
- [ ] **NPC Notification:** If breach affects >1000 people, notify NPC (may depend on risk assessment)
- [ ] **Student Notification:** School must notify parents if their child's data was exposed

---

## 3. DepEd-Specific Compliance

### 3.1 DepEd Accreditation & Integration
- [ ] **DepEd ID Support:** System can handle DepEd school IDs and student LRNs
- [ ] **DepEd Reporting:** Grades, attendance can be exported in DepEd-compatible format (if required)
- [ ] **Regional Compliance:** Hosted data in Philippines (CALABARZON region for this school)

### 3.2 Academic Standards
- [ ] **Grading Scale:** Supports Philippine DepEd marking system (0–100, with 60 as passing)
- [ ] **Grading Periods:** Four grading periods (June–August, Sept–Oct, Nov–Dec, Jan–Mar)
- [ ] **Subject Names:** Curriculum follows DepEd K–12 subject list

### 3.3 Attendance Tracking
- [ ] **Daily Log:** Records presence/absence/tardy for each student per day
- [ ] **DepEd Reporting:** Can generate attendance report (% of school days present)
- [ ] **Audit Trail:** Who marked attendance, when, and can it be edited (and by whom)

---

## 4. No Vendor Lock-In (Data Portability)

### 4.1 Data Export
- [ ] **One-Click Export:** Admin can export all school data as CSV/JSON
- [ ] **Scope Options:** By date range, by class, by student, or full dataset
- [ ] **Frequency:** No limits on export frequency
- [ ] **Format:** Documented column headers, standard CSV (not proprietary)

### 4.2 Data Migration Guide
- [ ] **Documentation:** "How to migrate from our system to another platform"
- [ ] **Runbook:** Step-by-step guide for importing exported CSV into competitors' systems
- [ ] **Support:** Email support for data export issues (no "contact sales" walls)

### 4.3 No Encryption Trap
- [ ] **No Proprietary Encryption:** Exported data is NOT encrypted with our keys
- [ ] **Schools Can Decrypt:** All encryption keys are school's responsibility if they choose to encrypt further

---

## 5. Offline-First & Reliability

### 5.1 Offline Capability
- [ ] **Core Features Offline:** Attendance, grades, roster can be used without internet
- [ ] **Service Worker:** PWA/offline storage caches school data locally
- [ ] **Sync Protocol:** When online returns, offline changes sync to server
- [ ] **Conflict Resolution:** Documented behavior if both offline user and online user edit same record

### 5.2 Disaster Recovery
- [ ] **RTO (Recovery Time Objective):** 1 hour max to restore service
- [ ] **RPO (Recovery Point Objective):** 15 minutes max data loss
- [ ] **Daily Backups:** Automated, retained for 30 days, testable restore process
- [ ] **Geo-Redundancy:** Backup copies stored separately from primary database

### 5.3 Status & Uptime
- [ ] **Public Status Page:** Uptime dashboard accessible (no login needed)
- [ ] **Incident Communication:** During outages, status page updated every 30 minutes

---

## 6. Third-Party & Sub-Processors

### 6.1 Hosting Provider
- [ ] **Provider Name:** (e.g., DigitalOcean, AWS, Azure)
- [ ] **Data Location:** Philippines (confirm in contract)
- [ ] **Sub-processor Agreement:** Signed DPA with provider

### 6.2 Email/SMS Provider (if used)
- [ ] **SMS Gateway:** For parent notifications (if applicable)
- [ ] **Provider:** (e.g., Smart, Globe, or third-party)
- [ ] **Data Handling:** Documented how student names are NOT included in SMS
- [ ] **Opt-Out:** Schools can disable SMS anytime

### 6.3 Analytics (Prohibited on Student Data)
- [ ] **Google Analytics:** NOT used on student-facing pages
- [ ] **No Tracking Pixels:** No ad networks or third-party trackers on portal
- [ ] **Admin Dashboard:** Can have analytics (e.g., "attendance trending"), but not tied to individual students

---

## 7. Terms of Service & Legal

### 7.1 ToS Review by Lawyer
- [ ] **Lawyer Review:** Get DPA, Privacy Policy, ToS reviewed by Philippine lawyer ($5k–$10k)
- [ ] **Lawyer Confirmation:** "Complies with Data Privacy Act and NPC guidelines"
- [ ] **Iterative Feedback:** Include lawyer's edits in ToS before going live

### 7.2 Liability & Indemnification
- [ ] **Liability Cap:** Defined in ToS (e.g., "Limited to 1 month's subscription fee")
- [ ] **Data Breach Clause:** "Company liable for breaches caused by our negligence, but not if school uses weak passwords"

---

## 8. Pre-Launch Checklist

- [ ] **Privacy Policy:** Written, in Tagalog + English, embedded in app
- [ ] **Terms of Service:** Written, DepEd-specific, lawyer-reviewed
- [ ] **Data Processing Agreement:** Template ready to sign with each school
- [ ] **Encryption Keys:** Management plan documented (who has them, rotation schedule)
- [ ] **Audit Logs:** Retention policy (e.g., 1 year), tested query
- [ ] **Backup Strategy:** Daily backup, 30-day retention, tested restore
- [ ] **Incident Response Plan:** Written (breach detection, notification timeline)
- [ ] **Access Control:** Admin / Teacher / Student / Parent role permissions mapped
- [ ] **Export Function:** Tested with real mock data, can import to Excel/Google Sheets
- [ ] **Status Page:** Public uptime dashboard live

---

## Tracked Changes

| Date | Action | Status |
|------|--------|--------|
| 2025-01-15 | Created checklist | INCOMPLETE |
| TBD | Lawyer review | PENDING |
| TBD | NPC clarification | PENDING |

