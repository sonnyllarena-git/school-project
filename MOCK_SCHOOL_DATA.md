# Mock School Data: St. Michael's Academy

---

## School Info

```json
{
  "school_id": "STM001",
  "name": "St. Michael's Academy",
  "address": "123 Marañon Street, Santo Tomás, Batangas 4211",
  "deped_id": "123456789",
  "phone": "(043) 740-1234",
  "email": "info@stmichaels.ph",
  "school_year": "2025-2026",
  "principal": "Dr. Maria Santos",
  "created_at": "2025-01-15T00:00:00Z",
  "region": "CALABARZON"
}
```

---

## Admin & Staff

### School Admin (1)
```
Email: admin@stmichaels.ph
Password: (hashed: Admin@2025)
Role: ADMIN
Name: Maria Rodriguez
Created: 2025-01-15
```

### Registrar (1)
```
Email: registrar@stmichaels.ph
Password: (hashed: Registrar@2025)
Role: REGISTRAR
Name: John Dela Cruz
Created: 2025-01-15
```

---

## Teachers (8)

| Email | Name | Grade Level | Subject | Password |
|-------|------|-------------|---------|----------|
| teacher.1@stmichaels.ph | Ms. Ana Gonzales | 1 | Filipino, Math | Teacher@1 |
| teacher.2@stmichaels.ph | Mr. Carlos Ramos | 1 | English, Science | Teacher@2 |
| teacher.3@stmichaels.ph | Ms. Patricia Cruz | 2 | Filipino, Math | Teacher@3 |
| teacher.4@stmichaels.ph | Mr. Ramon Santos | 2 | English, Science | Teacher@4 |
| teacher.5@stmichaels.ph | Ms. Lily Fernandez | 3 | Filipino, Math | Teacher@5 |
| teacher.6@stmichaels.ph | Mr. Victor Lopez | 3 | English, Science | Teacher@6 |
| teacher.7@stmichaels.ph | Ms. Rosa Guinto | 4-6 | PE, Arts, Music | Teacher@7 |
| teacher.8@stmichaels.ph | Mr. Alfonso Reyes | 4-6 | Technology, Values | Teacher@8 |

---

## Students (150 total)

**Distribution by Grade:**
- Grade 1: 25 students (Section 1A, 1B)
- Grade 2: 25 students (Section 2A, 2B)
- Grade 3: 25 students (Section 3A, 3B)
- Grade 4: 25 students (Section 4A, 4B)
- Grade 5: 25 students (Section 5A, 5B)
- Grade 6: 25 students (Section 6A, 6B)

**Sample Students (Grade 1, Section 1A):**

| LRN | Student Name | Date of Birth | Gender | Guardian Email | Status |
|-----|--------------|---------------|--------|-----------------|--------|
| 123001 | Miguel Aquino | 2018-05-12 | M | aguinofamily@gmail.com | Active |
| 123002 | Maria Bautista | 2018-03-08 | F | bautista.family@yahoo.com | Active |
| 123003 | Luis Cantos | 2018-07-22 | M | cantos.luis.parent@gmail.com | Active |
| 123004 | Angela Dato | 2018-04-15 | F | dato.household@gmail.com | Active |
| 123005 | Robert Esguerra | 2018-06-10 | M | esguerra.family.ph@gmail.com | Active |
| ... | (20 more) | ... | ... | ... | Active |

**Seed Pattern:**
- Students 123001–123025 in Grade 1, Section 1A (Teacher: Ms. Ana Gonzales)
- Students 123026–123050 in Grade 1, Section 1B (Teacher: Mr. Carlos Ramos)
- And so on for Grades 2–6

---

## Classes

| Section ID | Grade | Section | Teacher | Room | School Year |
|-----------|-------|---------|---------|------|------------|
| CLS001 | 1 | 1A | Ms. Ana Gonzales | 101 | 2025-2026 |
| CLS002 | 1 | 1B | Mr. Carlos Ramos | 102 | 2025-2026 |
| CLS003 | 2 | 2A | Ms. Patricia Cruz | 201 | 2025-2026 |
| CLS004 | 2 | 2B | Mr. Ramon Santos | 202 | 2025-2026 |
| CLS005 | 3 | 3A | Ms. Lily Fernandez | 301 | 2025-2026 |
| CLS006 | 3 | 3B | Mr. Victor Lopez | 302 | 2025-2026 |

---

## Attendance (Sample: June 2025, First Month)

**June 2025 (20 school days: June 2–27, excluding Sundays, 1 holiday)**

For each student in each class:
- Days Present: 18–20 (random)
- Days Absent: 0–2 (random)
- Days Tardy: 0–1 (random)

**Sample Attendance Record:**
```json
{
  "attendance_id": "ATT00123001001",
  "class_id": "CLS001",
  "student_id": "STU123001",
  "date": "2025-06-02",
  "status": "PRESENT",
  "time_in": "07:45:00",
  "notes": "",
  "recorded_by": "teacher.1@stmichaels.ph",
  "recorded_at": "2025-06-02T08:00:00Z"
}
```

---

## Grades (Sample: First Grading Period)

**Grading Periods (Philippine DepEd):**
1. First Grading (June–August)
2. Second Grading (September–October)
3. Third Grading (November–December)
4. Fourth Grading (January–March)

**Subjects per Grade (Sample: Grade 1):**
- Filipino (Filipo)
- English
- Math
- Science (Agham)
- Values Education (Edukasyong Pagpapahalaga)

**Marking System:**
- 1st to 3rd Periodical Exam (40% each)
- Formative Assessment / Participation (30%)
- Final Exam or Summative (30%)
- Final Grade = Weighted Average

**Sample Grade Record:**
```json
{
  "grade_id": "GRD00123001001001",
  "class_id": "CLS001",
  "student_id": "STU123001",
  "subject": "Filipino",
  "grading_period": "First Grading",
  "first_period_exam": 85,
  "second_period_exam": 87,
  "third_period_exam": 88,
  "formative_score": 86,
  "final_grade": 86.5,
  "recorded_by": "teacher.1@stmichaels.ph",
  "recorded_at": "2025-08-20T10:30:00Z"
}
```

**Student Grade Distribution (Realistic for Grade 1):**
- Excellent (90–100): 20% of students
- Very Good (80–89): 50% of students
- Good (70–79): 25% of students
- Needs Improvement (60–69): 5% of students

---

## Parents (Guardians)

> **Superseded:** the actual implementation does not have a separate Parent role/account — a parent
> uses their child's Student login directly (see CLAUDE.md §0, TASKS.md Phase 3). This section is
> kept as historical planning context only; no `guardians`/`student_guardians` tables or `PARENT`
> users exist in the schema.

**Sample Parent Accounts** (one per ~2–3 students):

| Parent ID | Parent Name | Email | Phone | Student(s) | Password |
|-----------|-----------|-------|-------|-----------|----------|
| PAR001 | Rosa Aquino | aguinofamily@gmail.com | 09175551234 | Miguel Aquino (STU123001) | Parent@1 |
| PAR002 | Elena Bautista | bautista.family@yahoo.com | 09175551235 | Maria Bautista (STU123002) | Parent@2 |
| ... | ... | ... | ... | ... | ... |

**Rules:**
- Parents can only view their own child's grades & attendance
- Parents receive monthly SMS summary: "Attendance: 95%, Grades: 84 avg"
- Parents can message teacher via portal (no direct phone)

---

## Backup & Audit Log (Sample)

**Automated Daily Backup Record:**
```json
{
  "backup_id": "BKP20250602001",
  "school_id": "STM001",
  "backup_date": "2025-06-02",
  "backup_time": "03:00:00",
  "tables_backed_up": ["students", "teachers", "classes", "attendance", "grades"],
  "total_records": 4250,
  "backup_size_mb": 12.4,
  "backup_location": "s3-ph-backup-bucket/stm001/2025-06-02.sql.gz",
  "status": "SUCCESS",
  "retention_days": 30
}
```

**Audit Log Sample:**
```json
{
  "audit_id": "AUD20250602001",
  "school_id": "STM001",
  "user_id": "teacher.1@stmichaels.ph",
  "action": "CREATE_ATTENDANCE",
  "table_affected": "attendance",
  "record_count": 25,
  "timestamp": "2025-06-02T08:15:00Z",
  "ip_address": "192.168.1.100",
  "status": "SUCCESS"
}
```

