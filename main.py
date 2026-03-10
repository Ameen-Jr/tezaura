from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from pydantic import BaseModel
import sqlite3
import shutil
import os
from typing import List
from datetime import datetime

# --- DB CONNECTION HELPER ---
def get_db():
    conn = sqlite3.connect(
        "classflow.db",
        check_same_thread=False,
        timeout=10
    )
    conn.row_factory = sqlite3.Row
    return conn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.path.exists("uploaded_photos"):
    os.makedirs("uploaded_photos")

app.mount("/photos", StaticFiles(directory="uploaded_photos"), name="photos")

# --- DATA MODELS ---
class FeeSchema(BaseModel):
    admission_number: str
    month_year: str
    amount: float
    date_paid: str

class UpdateStudentSchema(BaseModel):
    name: str
    class_standard: str
    division: str | None = None
    gender: str | None = None
    dob: str | None = None
    school_name: str | None = None
    address: str | None = None
    father_name: str | None = None
    father_occupation: str | None = None
    father_phone: str | None = None
    mother_name: str | None = None
    mother_occupation: str | None = None
    mother_phone: str | None = None
    whatsapp_number: str | None = None
    bus_stop: str | None = None
    panchayat: str | None = None
    remarks: str | None = None
    sslc_number: str | None = None

class AttendanceRecord(BaseModel):
    student_id: int
    status: str

# --- UPDATE THIS CLASS ---
class DailyAttendanceSchema(BaseModel):
    date: str
    session: str = "Day"  # <--- NEW: Defaults to "Day" if not sent
    records: List[AttendanceRecord]

# --- NEW: EXAM MODELS ---
class ExamSchema(BaseModel):
    name: str          # e.g. "Unit Test 1"
    date: str
    class_standard: str
    subject: str       # e.g. "Maths"
    max_marks: float

class StudentMarkSchema(BaseModel):
    student_id: int
    marks_obtained: float

class MarksSubmissionSchema(BaseModel):
    exam_id: int
    records: List[StudentMarkSchema]

# --- TERM EXAM MODELS ---
class TermExamSubjectSchema(BaseModel):
    subject_name: str
    max_marks: float
    sort_order: int = 0

class TermExamCreateSchema(BaseModel):
    name: str
    date: str
    class_standard: str
    division: str = ""
    subjects: List[TermExamSubjectSchema]

class BulkStudentMarkSchema(BaseModel):
    student_id: int
    exam_id: int
    marks_obtained: float

class BulkMarksSubmissionSchema(BaseModel):
    records: List[BulkStudentMarkSchema]

# --- LIBRARY MODELS ---
class LibraryIssueSchema(BaseModel):
    admission_number: str
    book_name: str
    book_id: str
    issue_date: str

class LibraryReturnSchema(BaseModel):
    record_id: int
    return_date: str    

class DiscontinueSchema(BaseModel):
    reason: str
    date_left: str

class PromotionSchema(BaseModel):
    graduation_year: str # e.g. "2025"
    reset_fees: bool     # true/false    

class BatchDiscontinueSchema(BaseModel):
    admission_numbers: List[str]
    reason: str
    date_left: str

# --- NEW: SSLC RESULT SCHEMA ---
class SSLCResultSchema(BaseModel):
    admission_number: str
    lang_i: str
    lang_ii: str
    english: str
    hindi: str
    maths: str
    physics: str
    chemistry: str
    biology: str
    social: str
    it: str

# --- CONSTANTS ---
ACADEMIC_ORDER = [
    "April", "May", "June", "July", "August", "September", 
    "October", "November", "December", "January", "February", "March"
]
MONTH_MAP = {
    "January": "01", "February": "02", "March": "03", "April": "04", "May": "05", "June": "06",
    "July": "07", "August": "08", "September": "09", "October": "10", "November": "11", "December": "12"
}

# --- API ENDPOINTS ---

@app.get("/students/search")
def search_students(query: str, power_search: bool = False):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            
            # --- FIX: Search by Name OR Admission Number ---
            # LOGIC: If power_search is True, show ALL. If False, show only Active.
            status_filter = "" if power_search else "AND is_active = 1"

            sql_query = f"""
            SELECT 
                admission_number, name, class_standard, division, gender, address, school_name, dob,
                father_name, father_occupation, father_phone, 
                mother_name, mother_occupation, mother_phone, 
                whatsapp_number, bus_stop, panchayat, remarks, photo_path, sslc_number
            FROM students 
            WHERE (name LIKE ? OR admission_number LIKE ?) {status_filter}
            """
            
            # Pass the query string twice (once for name, once for adm no)
            search_param = f"%{query}%"
            cursor.execute(sql_query, (search_param, search_param))
            
            results = cursor.fetchall()
            
            students_found = []
            for row in results:
                students_found.append({
                    "admission_number": row[0],
                    "name": row[1],
                    "class_standard": row[2],
                    "division": row[3],
                    "gender": row[4],
                    "address": row[5],
                    "school_name": row[6],
                    "dob": row[7],
                    "father_name": row[8],
                    "father_occupation": row[9],
                    "father_phone": row[10],
                    "mother_name": row[11],
                    "mother_occupation": row[12],
                    "mother_phone": row[13],
                    "whatsapp_number": row[14],
                    "bus_stop": row[15],
                    "panchayat": row[16],
                    "remarks": row[17],
                    "photo_path": row[18],
                    "sslc_number": row[19]
                })
            return {"count": len(students_found), "results": students_found}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- ADMISSION HISTORY ---
@app.get("/students/recent-admissions")
def get_recent_admissions():
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            # Fetch last 50 students, ordered by newest ID first
            query = """
                SELECT admission_number, name, class_standard, division, school_name, admission_date 
                FROM students 
                WHERE is_active = 1 
                ORDER BY id DESC LIMIT 50
            """
            cursor.execute(query)
            history = []
            for row in cursor.fetchall():
                history.append({
                    "adm": row[0], "name": row[1], "class": row[2], 
                    "div": row[3], "school": row[4], "date": row[5]
                })
            return history
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# --- GET NEXT ADMISSION NUMBER ---
@app.get("/students/next-admission-number")
def get_next_admission_number():
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            # We look for the highest numeric admission number
            cursor.execute("SELECT MAX(CAST(admission_number AS INTEGER)) FROM students")
            result = cursor.fetchone()
            max_val = result[0]
            
            # If database is empty, start at 1. Otherwise, increment by 1.
            next_val = 1 if max_val is None else max_val + 1
            return {"next_admission_number": str(next_val)}
    except Exception as e:
        # If something goes wrong (e.g. alphanumeric numbers), return empty to let user type
        return {"next_admission_number": ""}

@app.post("/students")
def add_student(
    admission_number: str = Form(...),
    name: str = Form(...),
    class_standard: str = Form(...),
    division: str = Form(""),
    gender: str = Form("Male"),
    dob: str = Form(None),
    school_name: str = Form(None),
    address: str = Form(None),
    father_name: str = Form(None),
    father_occupation: str = Form(None),
    father_phone: str = Form(None),
    mother_name: str = Form(None),
    mother_occupation: str = Form(None),
    mother_phone: str = Form(None),
    whatsapp_number: str = Form(None),
    bus_stop: str = Form(None),
    panchayat: str = Form(None),
    remarks: str = Form(None),
    sslc_number: str = Form(None),
    admission_date: str = Form(None),  # <--- NEW FIELD
    photo: UploadFile = File(None)
):
    try:
        photo_path = None
        if photo:
            file_extension = photo.filename.split(".")[-1]
            filename = f"{admission_number}_{name.replace(' ', '_')}.{file_extension}"
            file_location = f"uploaded_photos/{filename}"
            with open(file_location, "wb+") as file_object:
                shutil.copyfileobj(photo.file, file_object)
            photo_path = filename

        # Default to today if not provided
        if not admission_date:
            from datetime import date
            admission_date = date.today().isoformat()

        with get_db() as connection:
            cursor = connection.cursor()
            sql = """
            INSERT INTO students (
                admission_number, name, class_standard, division, gender, address, school_name, dob,
                father_name, father_occupation, father_phone, 
                mother_name, mother_occupation, mother_phone, 
                whatsapp_number, bus_stop, panchayat, remarks, sslc_number, photo_path, is_active, admission_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            """
            values = (
                admission_number, name, class_standard, division, gender, address, school_name, dob,
                father_name, father_occupation, father_phone,
                mother_name, mother_occupation, mother_phone,
                whatsapp_number, bus_stop, panchayat, remarks, sslc_number, photo_path, admission_date
            )
            cursor.execute(sql, values)
            connection.commit()
            return {"status": "success", "message": f"Student {name} added!"}

    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Error: Admission Number already exists.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/students/{admission_number}")
def update_student(admission_number: str, student: UpdateStudentSchema):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            sql = """
            UPDATE students SET
                name=?, class_standard=?, division=?, gender=?, dob=?, school_name=?, address=?,
                father_name=?, father_occupation=?, father_phone=?,
                mother_name=?, mother_occupation=?, mother_phone=?,
                whatsapp_number=?, bus_stop=?, panchayat=?, remarks=?, sslc_number=?
            WHERE admission_number=?
            """
            values = (
                student.name, student.class_standard, student.division, student.gender, student.dob, student.school_name, student.address,
                student.father_name, student.father_occupation, student.father_phone,
                student.mother_name, student.mother_occupation, student.mother_phone,
                student.whatsapp_number, student.bus_stop, student.panchayat, student.remarks, student.sslc_number,
                admission_number
            )
            cursor.execute(sql, values)
            connection.commit()
            return {"status": "success", "message": "Updated successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/students/{admission_number}/photo")
def update_student_photo(admission_number: str, photo: UploadFile = File(...)):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT name FROM students WHERE admission_number = ?", (admission_number,))
            result = cursor.fetchone()
            if not result: raise HTTPException(status_code=404, detail="Student not found")
            student_name = result[0]
            file_extension = photo.filename.split(".")[-1]
            new_filename = f"{admission_number}_{student_name.replace(' ', '_')}_v2.{file_extension}"
            file_location = f"uploaded_photos/{new_filename}"
            with open(file_location, "wb+") as file_object:
                shutil.copyfileobj(photo.file, file_object)
            cursor.execute("UPDATE students SET photo_path = ? WHERE admission_number = ?", (new_filename, admission_number))
            connection.commit()
        return {"status": "success", "message": "Photo updated successfully!", "new_path": new_filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fees")
def add_fee(fee: FeeSchema):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT id, name FROM students WHERE admission_number = ?", (fee.admission_number,))
            student = cursor.fetchone()
            if not student: raise HTTPException(status_code=404, detail="Student not found")
            cursor.execute("INSERT INTO fees (student_id, month_year, amount, date_paid) VALUES (?, ?, ?, ?)", 
                           (student[0], fee.month_year, fee.amount, fee.date_paid))
            connection.commit()
            return {"status": "success", "message": f"Fee recorded for {student[1]}"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/fees/{admission_number}")
def get_fee_history(admission_number: str):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT id FROM students WHERE admission_number = ?", (admission_number,))
            student = cursor.fetchone()
            if not student: raise HTTPException(status_code=404, detail="Student not found")
            cursor.execute("SELECT month_year, amount, date_paid FROM fees WHERE student_id = ? ORDER BY date_paid DESC", (student[0],))
            history = [{"month_year": r[0], "amount": r[1], "date_paid": r[2]} for r in cursor.fetchall()]
            return history
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/reports/index")
def get_class_index(class_std: str, division: str = ""):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            query = "SELECT id, name, gender, admission_number, school_name FROM students WHERE class_standard = ? AND is_active = 1"
            params = [class_std]
            if division:
                query += " AND division = ?"
                params.append(division)
            query += " ORDER BY name ASC"
            cursor.execute(query, tuple(params))
            results = cursor.fetchall()
            boys = []
            girls = []
            for row in results:
                student = {"id": row[0], "name": row[1], "gender": row[2], "adm": row[3], "school": row[4] if row[4] else "Unknown School"}
                if row[2] == "Male": boys.append(student)
                else: girls.append(student)
            return {"class": class_std, "division": division, "total_students": len(boys) + len(girls), "boys": boys, "girls": girls}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/reports/pending-fees")
def get_pending_fees(class_std: str, month: str, division: str = ""):
    try:
        if month not in ACADEMIC_ORDER: raise HTTPException(status_code=400, detail="Invalid Month")
        with get_db() as connection:
            cursor = connection.cursor()
            query = "SELECT id, name, admission_number, father_phone FROM students WHERE class_standard = ? AND is_active = 1"
            params = [class_std]
            if division:
                query += " AND division = ?"
                params.append(division)
            cursor.execute(query, tuple(params))
            students = cursor.fetchall()
            target_index = ACADEMIC_ORDER.index(month)
            required_months = ACADEMIC_ORDER[:target_index+1]
            defaulters = []
            for student in students:
                student_id, name, adm, phone = student
                cursor.execute("SELECT month_year FROM fees WHERE student_id = ?", (student_id,))
                paid_records = cursor.fetchall()
                paid_month_names = []
                for record in paid_records:
                    paid_str = record[0]
                    for m in ACADEMIC_ORDER:
                        if m in paid_str: paid_month_names.append(m)
                pending_months = []
                target_fee = 600 if class_std == "10" else 550
                total_due = 0
                for req_month in required_months:
                    if req_month not in paid_month_names:
                        pending_months.append(req_month)
                        total_due += target_fee
                if pending_months:
                    defaulters.append({"name": name, "adm": adm, "phone": phone, "pending_months": pending_months, "total_due": total_due})
            return {"class": class_std, "month_upto": month, "defaulters": defaulters}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/reports/attendance-monthly")
def get_monthly_attendance_report(class_std: str, month: str, year: str, session: str = "Day", division: str = ""):
    try:
        # 1. Setup Month
        month_num = MONTH_MAP.get(month)
        if not month_num: raise HTTPException(status_code=400, detail="Invalid Month")
        
        # 2. Convert Month Name to YYYY-MM format
        try:
            from datetime import datetime
            m_int = datetime.strptime(month, "%B").month
            month_str = f"{year}-{m_int:02d}"
        except ValueError:
            month_str = f"{year}-01"

        print(f"📊 Generating Report: Class {class_std} | {month_str} | Session: {session}")

        with get_db() as connection:
            cursor = connection.cursor()
            
            # 3. Get Students (Active Only)
            query = "SELECT id, name, admission_number FROM students WHERE class_standard = ? AND is_active = 1"
            params = [class_std]
            if division:
                query += " AND division = ?"
                params.append(division)
            query += " ORDER BY name ASC"
            cursor.execute(query, tuple(params))
            students_rows = cursor.fetchall()
            
            # 4. Get Attendance (Strictly Filtered by SESSION)
            cursor.execute("""
                SELECT a.student_id, a.date, a.status 
                FROM attendance a
                JOIN students s ON a.student_id = s.id
                WHERE s.class_standard = ? 
                  AND a.date LIKE ? 
                  AND a.session = ?
            """, (class_std, f"{month_str}%", session))
            
            records = cursor.fetchall()
            
            # 5. Calculate Total Working Days (Unique dates found for this session)
            unique_dates = sorted(list(set(r[1] for r in records)))
            total_class_days = len(unique_dates)
            
            print(f"   -> Found {len(records)} records across {total_class_days} working days.")

            # 6. Map Data
            attendance_map = {}
            present_counts = {}

            for r in records:
                sid, date_str, status = r
                day_part = int(date_str.split("-")[2]) # Extract day (1, 2, 3...)
                
                if sid not in attendance_map: 
                    attendance_map[sid] = {}
                    present_counts[sid] = 0
                
                # Store Status: P or A
                code = "P" if status == "Present" else "A"
                attendance_map[sid][day_part] = code
                
                if status == "Present":
                    present_counts[sid] += 1

            # 7. Build Final List
            report = []
            total_presents_all_students = 0
            
            for s_row in students_rows:
                s_id, name, adm = s_row
                
                # Get stats for this student
                s_att = attendance_map.get(s_id, {})
                p_count = present_counts.get(s_id, 0)
                
                # Percentage Calculation
                pct = 0
                if total_class_days > 0:
                    pct = round((p_count / total_class_days) * 100, 1)
                
                total_presents_all_students += p_count
                
                report.append({
                    "name": name, 
                    "adm": adm, 
                    "attendance": s_att, 
                    "present_days": p_count, 
                    "percentage": pct
                })

            # 8. Class Average Percentage
            class_pct = 0
            if total_class_days > 0 and len(students_rows) > 0:
                possible_attendance = total_class_days * len(students_rows)
                class_pct = round((total_presents_all_students / possible_attendance) * 100, 1)

            return {
                "class": class_std,
                "students": report,
                "total_class_days": total_class_days,
                "class_percentage": class_pct
            }
    except Exception as e: 
        print(f"❌ Error generating report: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/attendance")
def mark_attendance(data: DailyAttendanceSchema):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            
            # Delete existing records for THIS Date AND Session
            cursor.execute("DELETE FROM attendance WHERE date = ? AND session = ?", (data.date, data.session))
            
            for record in data.records:
                cursor.execute("""
                    INSERT INTO attendance (student_id, date, status, session) 
                    VALUES (?, ?, ?, ?)
                """, (record.student_id, data.date, record.status, data.session))
            
            connection.commit()
            return {"status": "success", "message": f"{data.session} Attendance Saved!"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# --- EXAM ENDPOINTS ---

@app.post("/exams")
def create_exam(exam: ExamSchema):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                INSERT INTO exams (name, date, class_standard, subject, max_marks) 
                VALUES (?, ?, ?, ?, ?)
            """, (exam.name, exam.date, exam.class_standard, exam.subject, exam.max_marks))
            connection.commit()
            return {"status": "success", "message": f"Exam '{exam.name}' created!"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/exams")
def get_exams(class_std: str):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT id, name, date, subject, max_marks FROM exams WHERE class_standard = ? ORDER BY date DESC", (class_std,))
            exams = [{"id": r[0], "name": r[1], "date": r[2], "subject": r[3], "max_marks": r[4]} for r in cursor.fetchall()]
            return exams
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/exams/term")
def create_term_exam(data: TermExamCreateSchema):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            created_exams = []

            for subject in data.subjects:
                # Create one exam row per subject
                cursor.execute("""
                    INSERT INTO exams (name, date, class_standard, division, subject, max_marks)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (data.name, data.date, data.class_standard, data.division, subject.subject_name, subject.max_marks))
                
                exam_id = cursor.lastrowid

                # Record subject metadata in exam_subjects table
                cursor.execute("""
                    INSERT INTO exam_subjects (exam_id, subject_name, max_marks, sort_order)
                    VALUES (?, ?, ?, ?)
                """, (exam_id, subject.subject_name, subject.max_marks, subject.sort_order))

                created_exams.append({"exam_id": exam_id, "subject": subject.subject_name})

            connection.commit()
            return {"status": "success", "message": f"Term exam '{data.name}' created with {len(created_exams)} subjects.", "exams": created_exams}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/exams/grouped")
def get_exams_grouped(class_std: str, division: str = ""):
    try:
        with get_db() as connection:
            cursor = connection.cursor()

            query = """
                SELECT e.id, e.name, e.date, e.subject, e.max_marks, es.sort_order
                FROM exams e
                LEFT JOIN exam_subjects es ON e.id = es.exam_id
                WHERE e.class_standard = ?
            """
            params = [class_std]
            if division:
                query += " AND e.division = ?"
                params.append(division)
            query += " ORDER BY e.date DESC, es.sort_order ASC"
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()

            # Group by exam name + date (prevents collision if same name used across years)
            grouped = {}
            for row in rows:
                exam_id, name, date, subject, max_marks, sort_order = row
                group_key = f"{name}||{date}"
                if group_key not in grouped:
                    grouped[group_key] = {"name": name, "date": date, "subjects": []}
                grouped[group_key]["subjects"].append({
                    "exam_id": exam_id,
                    "subject": subject,
                    "max_marks": max_marks,
                    "sort_order": sort_order or 0
                })

                return list(grouped.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/marks/bulk")
def submit_bulk_marks(data: BulkMarksSubmissionSchema):
    try:
        with get_db() as connection:
            cursor = connection.cursor()

            for record in data.records:
                # Upsert: update if exists, insert if not
                cursor.execute("""
                    SELECT id FROM marks 
                    WHERE exam_id = ? AND student_id = ?
                """, (record.exam_id, record.student_id))
                existing = cursor.fetchone()

                if existing:
                    cursor.execute("""
                        UPDATE marks SET marks_obtained = ? WHERE id = ?
                    """, (record.marks_obtained, existing[0]))
                else:
                    cursor.execute("""
                        INSERT INTO marks (exam_id, student_id, marks_obtained) 
                        VALUES (?, ?, ?)
                    """, (record.exam_id, record.student_id, record.marks_obtained))

            connection.commit()
            return {"status": "success", "message": f"{len(data.records)} mark records saved."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))            

@app.post("/marks")
def submit_marks(data: MarksSubmissionSchema):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            for record in data.records:
                # Check if mark exists
                cursor.execute("SELECT id FROM marks WHERE exam_id = ? AND student_id = ?", (data.exam_id, record.student_id))
                existing = cursor.fetchone()
                if existing:
                    cursor.execute("UPDATE marks SET marks_obtained = ? WHERE id = ?", (record.marks_obtained, existing[0]))
                else:
                    cursor.execute("INSERT INTO marks (exam_id, student_id, marks_obtained) VALUES (?, ?, ?)", 
                                   (data.exam_id, record.student_id, record.marks_obtained))
            connection.commit()
            return {"status": "success", "message": "Marks saved successfully!"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/exams/{exam_id}/results")
def get_exam_results(exam_id: int):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            
            # Get Exam Info
            cursor.execute("SELECT name, subject, max_marks, class_standard FROM exams WHERE id = ?", (exam_id,))
            exam_info = cursor.fetchone()
            if not exam_info: raise HTTPException(status_code=404, detail="Exam not found")
            
            # Get Students of that class
            cursor.execute("SELECT id, name, admission_number FROM students WHERE class_standard = ? AND is_active = 1 ORDER BY name ASC", (exam_info[3],))
            students = cursor.fetchall()
            
            results = []
            for s in students:
                s_id, s_name, s_adm = s
                cursor.execute("SELECT marks_obtained FROM marks WHERE exam_id = ? AND student_id = ?", (exam_id, s_id))
                mark_row = cursor.fetchone()
                score = mark_row[0] if mark_row else 0
                results.append({"id": s_id, "name": s_name, "adm": s_adm, "marks": score})
            
            return {
                "exam": {"name": exam_info[0], "subject": exam_info[1], "max_marks": exam_info[2]},
                "results": results
            }
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# --- NEW: STUDENT EXAM HISTORY ---
@app.get("/students/{admission_number}/exams")
def get_student_exam_history(admission_number: str):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            
            cursor.execute("SELECT id FROM students WHERE admission_number = ?", (admission_number,))
            student = cursor.fetchone()
            if not student: raise HTTPException(status_code=404, detail="Student not found")
            
            # Join Marks and Exams to get full details
            query = """
                SELECT e.name, e.subject, e.date, m.marks_obtained, e.max_marks 
                FROM marks m 
                JOIN exams e ON m.exam_id = e.id 
                WHERE m.student_id = ? 
                ORDER BY e.date DESC
            """
            cursor.execute(query, (student[0],))
            history = [
                {"exam": r[0], "subject": r[1], "date": r[2], "marks": r[3], "max": r[4]} 
                for r in cursor.fetchall()
            ]
            return history
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# --- NEW: OVERALL RANK LIST GENERATOR ---
class OverallRankRequest(BaseModel):
    class_standard: str
    exam_ids: List[int] # List of selected exams (e.g., [1, 3])

@app.post("/reports/overall-rank")
def get_overall_rank(data: OverallRankRequest):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            
            if not data.exam_ids:
                return []

            # 1. Calculate Total Max Marks for selected exams
            placeholders = ','.join('?' for _ in data.exam_ids)
            cursor.execute(f"SELECT sum(max_marks) FROM exams WHERE id IN ({placeholders})", tuple(data.exam_ids))
            total_max_score = cursor.fetchone()[0] or 0
            
            if total_max_score == 0: return []

            # 2. Get Sum of Marks for each student for these exams
            query = f"""
                SELECT m.student_id, s.name, s.admission_number, sum(m.marks_obtained) as total_obtained
                FROM marks m
                JOIN students s ON m.student_id = s.id
                WHERE m.exam_id IN ({placeholders})
                GROUP BY m.student_id
            """
            cursor.execute(query, tuple(data.exam_ids))
            results = cursor.fetchall()
            
            # 3. Calculate Percentage and Rank
            rank_list = []
            for row in results:
                s_id, name, adm, obtained = row
                percentage = (obtained / total_max_score) * 100
                rank_list.append({
                    "name": name,
                    "adm": adm,
                    "total_obtained": obtained,
                    "total_max": total_max_score,
                    "percentage": round(percentage, 2)
                })
            
            # Sort by Percentage DESC
            rank_list.sort(key=lambda x: x["percentage"], reverse=True)
            
            return rank_list

    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# --- LIBRARY ENDPOINTS ---

@app.post("/library/issue")
def issue_book(data: LibraryIssueSchema):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            
            # 1. Find Student
            cursor.execute("SELECT id, name FROM students WHERE admission_number = ?", (data.admission_number,))
            student = cursor.fetchone()
            if not student: raise HTTPException(status_code=404, detail="Student not found")
            
            # 2. Issue Book
            cursor.execute("""
                INSERT INTO library_records (student_id, book_name, book_id, issue_date)
                VALUES (?, ?, ?, ?)
            """, (student[0], data.book_name, data.book_id, data.issue_date))
            
            connection.commit()
            return {"status": "success", "message": f"Book issued to {student[1]}"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.put("/library/return")
def return_book(data: LibraryReturnSchema):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            cursor.execute("UPDATE library_records SET return_date = ? WHERE id = ?", (data.return_date, data.record_id))
            connection.commit()
            return {"status": "success", "message": "Book returned successfully!"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/library/active")
def get_active_library_records():
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            # Fetch records where return_date is NULL (Active Issues)
            query = """
                SELECT l.id, s.name, s.class_standard, s.division, s.admission_number, l.book_name, l.book_id, l.issue_date
                FROM library_records l
                JOIN students s ON l.student_id = s.id
                WHERE l.return_date IS NULL
                ORDER BY l.issue_date DESC
            """
            cursor.execute(query)
            records = []
            for row in cursor.fetchall():
                records.append({
                    "id": row[0], "student_name": row[1], "class": row[2], "div": row[3], "adm": row[4],
                    "book_name": row[5], "book_id": row[6], "issue_date": row[7]
                })
            return records
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/library/history")
def get_library_history():
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            # Fetch records where return_date is NOT NULL (Returned Books)
            query = """
                SELECT l.id, s.name, s.class_standard, s.division, l.book_name, l.book_id, l.issue_date, l.return_date
                FROM library_records l
                JOIN students s ON l.student_id = s.id
                WHERE l.return_date IS NOT NULL
                ORDER BY l.return_date DESC
                LIMIT 50
            """
            cursor.execute(query)
            records = []
            for row in cursor.fetchall():
                records.append({
                    "id": row[0], "student_name": row[1], "class": row[2], "div": row[3],
                    "book_name": row[4], "book_id": row[5], "issue_date": row[6], "return_date": row[7]
                })
            return records
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# --- DISCONTINUE STUDENT ---
@app.post("/students/{admission_number}/discontinue")
def discontinue_student(admission_number: str, data: DiscontinueSchema):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            
            # 1. Get Student Info
            cursor.execute("SELECT id, name, class_standard, division FROM students WHERE admission_number = ?", (admission_number,))
            student = cursor.fetchone()
            if not student: raise HTTPException(status_code=404, detail="Student not found")
            
            s_id, name, std, div = student

            # 2. Insert into Archive Table
            cursor.execute("""
                INSERT INTO discontinued_students (original_student_id, admission_number, name, class_standard, division, date_left, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (s_id, admission_number, name, std, div, data.date_left, data.reason))

            # 3. Deactivate in Main Table (Soft Delete)
            cursor.execute("UPDATE students SET is_active = 0 WHERE id = ?", (s_id,))
            
            connection.commit()
            return {"status": "success", "message": f"Student {name} marked as discontinued."}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# --- YEAR-END PROMOTION ENDPOINT ---

# --- YEAR-END PROMOTION (UPDATED WITH YEAR INCREMENT) ---
@app.post("/promote-year-end")
def promote_students(data: PromotionSchema):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            
            # 1. Archive Class 10
            cursor.execute("SELECT admission_number, name, father_phone, address, photo_path, division, school_name FROM students WHERE class_standard = '10' AND is_active = 1")
            graduates = cursor.fetchall()
            for grad in graduates:
                try:
                    cursor.execute("""
                        INSERT INTO alumni (admission_number, name, last_class, division, school_name, year_graduated, phone, address, photo_path)
                        VALUES (?, ?, '10', ?, ?, ?, ?, ?, ?)
                    """, (grad[0], grad[1], grad[5], grad[6], data.graduation_year, grad[2], grad[3], grad[4]))
                except sqlite3.IntegrityError: pass
            
            # 2. Promote Classes (Order is critical: must go top-down to avoid chain promotion)
            # Step A: Class 8 → 9 first (so they don't get caught by the 9→10 update below)
            cursor.execute("UPDATE students SET class_standard = '9' WHERE class_standard = '8' AND is_active = 1")
            # Step B: Class 9 → 10 (original 9s only, 8s already moved to 9 above but is_active check is safe)
            cursor.execute("UPDATE students SET class_standard = '10' WHERE class_standard = '9' AND is_active = 1")
            # Step C: Deactivate graduating Class 10 (must be AFTER 9→10 move)
            cursor.execute("UPDATE students SET is_active = 0 WHERE class_standard = '10'")
            
            if data.reset_fees: cursor.execute("DELETE FROM fees")

            # 3. INCREMENT ACADEMIC YEAR
            cursor.execute("SELECT value FROM system_settings WHERE key='academic_year'")
            current_year = cursor.fetchone()[0] # e.g., "2025-26"
            
            try:
                # Logic: Always produce "YYYY-YY" format e.g. "2025-26" -> "2026-27"
                parts = current_year.split("-")
                start = int(parts[0]) + 1
                end_str = parts[1].strip()
                # Normalize: whether stored as "26" or "2026", always write back as 2-digit
                end_full = int(end_str) + 1
                end_2digit = end_full % 100  # 2027 -> 27, 100 -> 0 (century-safe)
                new_year = f"{start}-{end_2digit:02d}"
                cursor.execute("UPDATE system_settings SET value = ? WHERE key='academic_year'", (new_year,))
            except (ValueError, IndexError) as e:
                print(f"⚠️ Could not increment academic year: {e}")
                new_year = current_year # Keep old value if format is unexpected

            connection.commit()
            return {"status": "success", "message": f"Promotion Complete! Academic Year advanced to {new_year}."}
            
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# --- BATCH DISCONTINUE (For Promotion Prep) ---
@app.post("/students/discontinue-batch")
def discontinue_batch(data: BatchDiscontinueSchema):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            
            count = 0
            for adm in data.admission_numbers:
                # Get info
                cursor.execute("SELECT id, name, class_standard, division FROM students WHERE admission_number = ?", (adm,))
                student = cursor.fetchone()
                
                if student:
                    s_id, name, std, div = student
                    # Archive
                    cursor.execute("""
                        INSERT INTO discontinued_students (original_student_id, admission_number, name, class_standard, division, date_left, reason)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (s_id, adm, name, std, div, data.date_left, data.reason))
                    
                    # Deactivate
                    cursor.execute("UPDATE students SET is_active = 0 WHERE id = ?", (s_id,))
                    count += 1
            
            connection.commit()
            return {"status": "success", "message": f"{count} students marked as Discontinued."}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# --- NEW: REPORT ENDPOINTS FOR DISCONTINUED STUDENTS ---

@app.get("/reports/discontinued-years")
def get_discontinued_years():
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            # Extract just the Year (YYYY) from date_left (YYYY-MM-DD)
            cursor.execute("SELECT DISTINCT substr(date_left, 1, 4) FROM discontinued_students ORDER BY date_left DESC")
            years = [row[0] for row in cursor.fetchall() if row[0]]
            return years
    except Exception as e: return []

@app.get("/reports/discontinued-list")
def get_discontinued_list(year: str):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            
            # Join discontinued table with main students table to get School Name
            query = """
                SELECT d.name, d.admission_number, d.class_standard, d.division, d.date_left, s.school_name
                FROM discontinued_students d
                LEFT JOIN students s ON d.original_student_id = s.id
                WHERE d.date_left LIKE ?
                ORDER BY d.date_left ASC
            """
            cursor.execute(query, (f"{year}%",))
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    "name": row[0], 
                    "adm": row[1], 
                    "class": row[2], 
                    "div": row[3], 
                    "date": row[4], 
                    "school": row[5] or "N/A"
                })
            return results
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# --- ALUMNI ENDPOINTS ---

@app.get("/alumni/years")
def get_alumni_years():
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT DISTINCT year_graduated FROM alumni ORDER BY year_graduated DESC")
            years = [row[0] for row in cursor.fetchall()]
            return years
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/alumni/list")
def get_alumni_list(year: str):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            # UPDATED QUERY: Fetches Class, Division, and School Name
            query = """
                SELECT a.name, a.admission_number, a.last_class, a.division, a.school_name
                FROM alumni a
                WHERE a.year_graduated = ?
                ORDER BY a.name ASC
            """
            cursor.execute(query, (year,))
            results = []
            for row in cursor.fetchall():
                results.append({
                    "name": row[0], 
                    "adm": row[1], 
                    "class": row[2], 
                    "div": row[3], 
                    "school": row[4] or "N/A"
                })
            return results
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# --- PROFILE LOOKUP (Finds Active OR Inactive students) ---

@app.get("/students/lookup/{admission_number}")
def get_student_details_any(admission_number: str):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            
            # --- UPDATED SQL: Added 'admission_date' to the end ---
            sql_query = """
            SELECT 
                admission_number, name, class_standard, division, gender, address, school_name, dob,
                father_name, father_occupation, father_phone, 
                mother_name, mother_occupation, mother_phone, 
                whatsapp_number, bus_stop, panchayat, remarks, photo_path, sslc_number, admission_date, id, is_active
            FROM students 
            WHERE admission_number = ?
            """
            cursor.execute(sql_query, (admission_number,))
            row = cursor.fetchone()
            
            if not row: raise HTTPException(status_code=404, detail="Student not found")
            
            # 1. Capture data into a variable (Don't return yet!)
            student_data = {
                "admission_number": row[0], "name": row[1], "class_standard": row[2], "division": row[3],
                "gender": row[4], "address": row[5], "school_name": row[6], "dob": row[7],
                "father_name": row[8], "father_occupation": row[9], "father_phone": row[10],
                "mother_name": row[11], "mother_occupation": row[12], "mother_phone": row[13],
                "whatsapp_number": row[14], "bus_stop": row[15], "panchayat": row[16],
                "remarks": row[17], "photo_path": row[18], "sslc_number": row[19],
                "admission_date": row[20], "id": row[21], "is_active": row[22]
            }

            # 2. STEP 3 LOGIC: Check why they left (if inactive)
            if student_data["is_active"] == 0:
                # Check Discontinued Table
                cursor.execute("SELECT reason, date_left FROM discontinued_students WHERE admission_number = ?", (admission_number,))
                disc_record = cursor.fetchone()
                
                if disc_record:
                    student_data["discontinued_reason"] = disc_record[0]
                    student_data["discontinued_date"] = disc_record[1]
                else:
                    # Check Alumni Table (Fallback)
                    cursor.execute("SELECT year_graduated FROM alumni WHERE admission_number = ?", (admission_number,))
                    alumni_record = cursor.fetchone()
                    if alumni_record:
                        student_data["discontinued_reason"] = f"Graduated Class 10 ({alumni_record[0]})"
                        student_data["discontinued_date"] = "March 31"

            # 3. NOW return the final data
            return student_data

    except Exception as e: raise HTTPException(status_code=500, detail=str(e))


# --- ATTENDANCE GRAPH STATS ---
@app.get("/attendance/stats/yearly")
def get_yearly_attendance_stats():
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            
            # Fetch all attendance records joined with student info
            query = """
                SELECT s.class_standard, a.date, a.status 
                FROM attendance a 
                JOIN students s ON a.student_id = s.id
                WHERE s.is_active = 1
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            
            # Initialize buckets for Academic Year (April -> March)
            # Structure: stats["10"][0] means Class 10, April
            stats = {
                "8":  [{"p":0, "t":0} for _ in range(12)],
                "9":  [{"p":0, "t":0} for _ in range(12)],
                "10": [{"p":0, "t":0} for _ in range(12)]
            }
            
            # Map Month Numbers (1=Jan) to Academic Indices (0=April)
            month_map = {
                4:0, 5:1, 6:2, 7:3, 8:4, 9:5, 10:6, 11:7, 12:8, 1:9, 2:10, 3:11
            }
            
            for r in rows:
                cls = r["class_standard"]
                date_str = r["date"]
                status = r["status"]
                if cls not in stats: continue
                
                try:
                    # Extract month from "YYYY-MM-DD"
                    month = int(date_str.split("-")[1])
                    if month in month_map:
                        idx = month_map[month]
                        stats[cls][idx]["t"] += 1
                        if status == "Present":
                            stats[cls][idx]["p"] += 1
                except (ValueError, IndexError): continue

            # Format for Chart.js
            datasets = []
            colors = {"8": "#F59E0B", "9": "#EC4899", "10": "#4F46E5"} # Amber, Pink, Indigo
            
            for cls in ["8", "9", "10"]:
                data = []
                for m in stats[cls]:
                    pct = 0
                    if m["t"] > 0:
                        pct = round((m["p"] / m["t"]) * 100, 1)
                    else:
                        pct = None # Don't draw line for future months
                    data.append(pct)
                
                datasets.append({
                    "label": f"Class {cls}",
                    "data": data,
                    "borderColor": colors.get(cls, "#000"),
                    "backgroundColor": colors.get(cls, "#000"),
                    "tension": 0.4 # Curvy lines
                })

            return datasets
            
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/attendance/{admission_number}")
def get_student_attendance(admission_number: str):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            
            # 1. Get Student ID
            cursor.execute("SELECT id FROM students WHERE admission_number = ?", (admission_number,))
            student = cursor.fetchone()
            if not student: raise HTTPException(status_code=404, detail="Student not found")
            
            student_id = student[0]
            
            # 2. Count Total Days & Present Days (Deduplicated by Date)
            cursor.execute("SELECT COUNT(DISTINCT date) FROM attendance WHERE student_id = ?", (student_id,))
            total_days = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(DISTINCT date) FROM attendance WHERE student_id = ? AND status = 'Present' AND session = 'Day'", (student_id,))
            present_days = cursor.fetchone()[0]
            
            percentage = 0
            if total_days > 0:
                percentage = round((present_days / total_days) * 100, 1)
                
            return {
                "total_days": total_days,
                "present_days": present_days,
                "percentage": percentage
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- DASHBOARD STATS ---
# --- DASHBOARD STATS (UPDATED) ---
@app.get("/dashboard/stats")
def get_dashboard_stats():
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            
            # 1. Total Active Students
            cursor.execute("SELECT COUNT(*) FROM students WHERE is_active = 1")
            student_count = cursor.fetchone()[0]

            # 2. Gender Breakdown per Class
            # Returns rows like: ('10', 'Male', 15), ('10', 'Female', 12)
            cursor.execute("""
                SELECT class_standard, gender, COUNT(*) as cnt
                FROM students 
                WHERE is_active = 1 
                GROUP BY class_standard, gender
                ORDER BY class_standard
            """)
            rows = cursor.fetchall()
            
            # Organize data: {"10": {"Male": 15, "Female": 12}, "9": ...}
            demographics = {}
            for r in rows:
                cls = r["class_standard"]
                gender = r["gender"]
                count = r["cnt"]
                if cls not in demographics: demographics[cls] = {"Male": 0, "Female": 0}
                demographics[cls][gender] = count

            # 3. Library Active Count (Keep this if you want, or just ignore)
            cursor.execute("SELECT COUNT(*) FROM library_records WHERE return_date IS NULL")
            lib_count = cursor.fetchone()[0]
            
            return {
                "students": student_count, 
                "demographics": demographics,
                "library": lib_count
            }
    except Exception as e: 
        return {"students": 0, "demographics": {}, "library": 0}

@app.get("/settings/academic-year")
def get_academic_year():
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT value FROM system_settings WHERE key='academic_year'")
            result = cursor.fetchone()
            return {"academic_year": result[0] if result else "2025-26"}
    except Exception as e: return {"academic_year": "2025-26"}

# --- WEEKLY FEE STATS ---
@app.get("/fees/stats/weekly")
def get_weekly_fee_stats():
    try:
        from datetime import date, timedelta
        
        with get_db() as connection:
            cursor = connection.cursor()
            
            today = date.today()
            stats = []
            
            # Loop back 5 weeks (Week 0 is current week)
            for i in range(4, -1, -1):
                start_date = today - timedelta(days=(i * 7) + 6)
                end_date = today - timedelta(days=i * 7)
                
                # SQLite comparison for dates stored as strings YYYY-MM-DD
                cursor.execute("""
                    SELECT SUM(amount) FROM fees 
                    WHERE date_paid BETWEEN ? AND ?
                """, (start_date.isoformat(), end_date.isoformat()))
                
                result = cursor.fetchone()
                total = result[0] if result[0] else 0
                
                # Format label: "Dec 01 - Dec 07"
                label = f"{start_date.strftime('%b %d')} - {end_date.strftime('%b %d')}"
                stats.append({"label": label, "amount": total})
                
            return stats
            
    except Exception as e: return []

# --- SSLC RESULT ENDPOINTS ---

@app.post("/students/sslc-result")
def save_sslc_result(data: SSLCResultSchema):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            
            # Check if record exists
            cursor.execute("SELECT id FROM sslc_results WHERE admission_number = ?", (data.admission_number,))
            exists = cursor.fetchone()
            
            if exists:
                # Update existing
                cursor.execute("""
                    UPDATE sslc_results SET 
                    lang_i=?, lang_ii=?, english=?, hindi=?, maths=?, 
                    physics=?, chemistry=?, biology=?, social=?, it=?
                    WHERE admission_number=?
                """, (data.lang_i, data.lang_ii, data.english, data.hindi, data.maths, 
                      data.physics, data.chemistry, data.biology, data.social, data.it, 
                      data.admission_number))
            else:
                # Insert new
                cursor.execute("""
                    INSERT INTO sslc_results (admission_number, lang_i, lang_ii, english, hindi, maths, physics, chemistry, biology, social, it)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (data.admission_number, data.lang_i, data.lang_ii, data.english, data.hindi, 
                      data.maths, data.physics, data.chemistry, data.biology, data.social, data.it))
            
            connection.commit()
            return {"status": "success", "message": "SSLC Result Saved!"}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/students/{admission_number}/sslc-result")
def get_sslc_result(admission_number: str):
    try:
        with get_db() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                SELECT lang_i, lang_ii, english, hindi, maths, physics, chemistry, biology, social, it 
                FROM sslc_results WHERE admission_number = ?
            """, (admission_number,))
            row = cursor.fetchone()
            
            if row:
                return {
                    "lang_i": row[0], "lang_ii": row[1], "english": row[2], "hindi": row[3],
                    "maths": row[4], "physics": row[5], "chemistry": row[6], "biology": row[7],
                    "social": row[8], "it": row[9]
                }
            else:
                return {} # Return empty object if no result yet
    except Exception as e: return {}

# --- NEW: FEE STATISTICS ENDPOINT (Fixed Column Name) ---
@app.get("/stats/monthly-fees")
def get_monthly_fees():
    results = []
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            query = """
                SELECT f.amount, f.date_paid, s.class_standard, s.division 
                FROM fees f 
                JOIN students s ON f.student_id = s.id
            """
            cursor.execute(query)
            results = cursor.fetchall()
    except sqlite3.OperationalError as e:
        print("SQL Error:", e)
        return []

    # 2. Aggregate Data
    agg_data = {}
    
    for row in results:
        amount = row["amount"]
        date_paid = row["date_paid"]
        class_std = row["class_standard"]
        division = row["division"]
        if not date_paid or not amount:
            continue
            
        try:
            # Parse date "2025-10-24" -> "Oct"
            d_obj = datetime.strptime(str(date_paid), "%Y-%m-%d")
            month_name = d_obj.strftime("%b") 
        except (ValueError, TypeError) as e:
            print(f"⚠️ Skipping bad date format '{date_paid}': {e}")
            continue

        # Create Class Key (e.g., "10A" or "8")
        div_str = division if division else ""
        cls_key = f"{class_std}{div_str}"

        if month_name not in agg_data:
            agg_data[month_name] = {}
        
        if cls_key not in agg_data[month_name]:
            agg_data[month_name][cls_key] = 0
            
        agg_data[month_name][cls_key] += amount

    # 3. Format for Frontend
    month_order = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
    final_output = []

    for m in month_order:
        entry = {"label": m}
        if m in agg_data:
            entry.update(agg_data[m])
        final_output.append(entry)

    return final_output

# --- NEW ENDPOINT: RECENT ACTIVITY FEED (SIMPLE & SMART SORTED) ---
@app.get("/dashboard/activity")
async def get_recent_activity():
    activities = []
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            # STRATEGY: Fetch "High Priority" items first (Fees, Library).
            # Since we sort by Date later, items added FIRST will appear ABOVE items added LAST
            # if they happen on the same day.
        
            # 1. FEES (Priority 1)
            cursor.execute("""
                SELECT f.amount, f.date_paid, s.name, s.class_standard
                FROM fees f JOIN students s ON f.student_id = s.id
                ORDER BY f.id DESC LIMIT 15
            """)
            for f in cursor.fetchall():
                date_str = str(f['date_paid']) if f['date_paid'] else "2024-01-01"
                activities.append({
                    "type": "fee",
                    "title": "Fee Collected",
                    "message": f"Received ₹{f['amount']} from {f['name']} ({f['class_standard']})",
                    "timestamp": date_str,
                    "sort_date": date_str
                })

            # 2. LIBRARY ISSUES (Priority 2)
            cursor.execute("""
                SELECT l.book_name, l.issue_date, s.name, s.class_standard 
                FROM library_records l JOIN students s ON l.student_id = s.id
                ORDER BY l.issue_date DESC LIMIT 15
            """)
            for l in cursor.fetchall():
                activities.append({
                    "type": "library_issue",
                    "title": "Book Issued",
                    "message": f"Issued '{l['book_name']}' to {l['name']} ({l['class_standard']})",
                    "timestamp": l['issue_date'],
                    "sort_date": l['issue_date']
                })

            # 3. LIBRARY RETURNS (Priority 3)
            cursor.execute("""
                SELECT l.book_name, l.return_date, s.name, s.class_standard 
                FROM library_records l JOIN students s ON l.student_id = s.id
                WHERE l.return_date IS NOT NULL
                ORDER BY l.return_date DESC LIMIT 15
            """)
            for l in cursor.fetchall():
                activities.append({
                    "type": "library_return",
                    "title": "Book Returned",
                    "message": f"{l['name']} returned '{l['book_name']}'",
                    "timestamp": l['return_date'],
                    "sort_date": l['return_date']
                })

            # 4. ABSENTEES (Priority 4)
            cursor.execute("""
                SELECT s.name, s.class_standard, a.date 
                FROM attendance a JOIN students s ON a.student_id = s.id
                WHERE a.status = 'Absent'
                ORDER BY a.date DESC LIMIT 15
            """)
            for a in cursor.fetchall():
                activities.append({
                    "type": "absent",
                    "title": "Absentee Alert",
                    "message": f"{a['name']} ({a['class_standard']}) was marked Absent",
                    "timestamp": a['date'],
                    "sort_date": a['date']
                })

            # 5. EXAMS (Priority 5)
            cursor.execute("SELECT name, class_standard, date FROM exams ORDER BY date DESC LIMIT 15")
            for e in cursor.fetchall():
                activities.append({
                    "type": "exam",
                    "title": "Exam Scheduled",
                    "message": f"'{e['name']}' scheduled for Class {e['class_standard']}",
                    "timestamp": e['date'],
                    "sort_date": e['date']
                })

            # 6. ADMISSIONS (Priority 6 - Last)
            # We fetch these LAST so they appear at the BOTTOM of the list for any given day.
            cursor.execute("SELECT name, class_standard, admission_date FROM students ORDER BY id DESC LIMIT 15")
            for s in cursor.fetchall():
                date_str = s['admission_date'] if s['admission_date'] else "2024-01-01"
                # Only use the first 10 chars (YYYY-MM-DD) to be safe
                clean_date = date_str[:10]
                activities.append({
                    "type": "admission",
                    "title": "New Admission",
                    "message": f"Registered {s['name']} into Class {s['class_standard']}",
                    "timestamp": clean_date,
                    "sort_date": clean_date
                })

            # SORT: Newest Date First
            # Because Python sort is "stable", for the same date, Fees (added first) will stay above Admissions (added last).
            activities.sort(key=lambda x: str(x['sort_date']), reverse=True)

    except Exception as e:
        print(f"Error: {e}")

    # Return exactly top 10 items
    return activities[:10]

@app.get("/backup/download")
async def download_backup():
    original_db = "classflow.db"
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_filename = f"ClassFlow_Backup_{timestamp}.db"
    
    shutil.copy(original_db, backup_filename)
    
    def cleanup():
        try:
            os.remove(backup_filename)
            print(f"✅ Temp backup deleted: {backup_filename}")
        except OSError as e:
            print(f"⚠️ Could not delete temp backup: {e}")
    
    return FileResponse(
        path=backup_filename,
        filename=backup_filename,
        media_type='application/x-sqlite3',
        background=BackgroundTask(cleanup)
    )

@app.post("/backup/restore")
async def restore_backup(file: UploadFile = File(...)):
    db_filename = "classflow.db"
    backup_filename = "classflow.db.old"

    # 1. SILENT AUTO-BACKUP: Rename current DB to .old
    if os.path.exists(db_filename):
        # If an old backup exists, remove it first to avoid conflicts
        if os.path.exists(backup_filename):
            os.remove(backup_filename)
        
        os.rename(db_filename, backup_filename)

    # 2. SAVE NEW FILE: Write the uploaded file as the active DB
    content = await file.read()
    with open(db_filename, "wb") as f:
        f.write(content)

    return {"message": "Database restored successfully. Please restart the software."}

@app.get("/")
def check_connection():
    return {"status": "ClassFlow Universal is Online"}

@app.delete("/exams/{exam_id}")
def delete_exam(exam_id: int):
    try:
        with get_db() as connection:
            cursor = connection.cursor()

            # 1. Verify exam exists
            cursor.execute("SELECT name FROM exams WHERE id = ?", (exam_id,))
            exam = cursor.fetchone()
            if not exam:
                raise HTTPException(status_code=404, detail="Exam not found")

            # 2. Delete all marks for this exam first (preserve referential integrity)
            cursor.execute("DELETE FROM marks WHERE exam_id = ?", (exam_id,))

            # 3. Delete the subject metadata row
            cursor.execute("DELETE FROM exam_subjects WHERE exam_id = ?", (exam_id,))

            # 4. Now safely delete the exam itself
            cursor.execute("DELETE FROM exams WHERE id = ?", (exam_id,))

            connection.commit()
            return {"status": "success", "message": f"Exam '{exam[0]}' and all its marks deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))