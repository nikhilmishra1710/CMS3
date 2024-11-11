const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  dateStrings: "date",
  database: "cumsdbms",
});

const zeroParamPromise = (sql) => {
  return new Promise((resolve, reject) => {
    db.query(sql, (err, results) => {
      if (err) return reject(err);
      return resolve(results);
    });
  });
};

const queryParamPromise = (sql, queryParam) => {
  return new Promise((resolve, reject) => {
    db.query(sql, queryParam, (err, results) => {
      if (err) return reject(err);
      return resolve(results);
    });
  });
};

exports.getLogin = (req, res, next) => {
  res.render("Staff/login");
};

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  let errors = [];
  const sql1 = "SELECT * FROM staff WHERE email = ?";
  const users = await queryParamPromise(sql1, [email]);
  if (
    users.length === 0 ||
    !(await bcrypt.compare(password, users[0].password))
  ) {
    errors.push({ msg: "Email or Password is Incorrect" });
    res.status(401).render("Staff/login", { errors });
  } else {
    const token = jwt.sign({ id: users[0].st_id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.redirect("/staff/dashboard");
  }
};

exports.getDashboard = async (req, res, next) => {
  const sql1 = "SELECT * FROM staff WHERE st_id = ?";
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);
  res.render("Staff/dashboard", { user: data[0], page_name: "overview" });
};

exports.getProfile = async (req, res, next) => {
  const sql1 = "SELECT * FROM staff WHERE st_id = ?";
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);
  const userDOB = data[0].dob;
  const sql2 = "SELECT d_name FROM department WHERE dept_id = ?";
  const deptData = await queryParamPromise(sql2, [data[0].dept_id]);

  const sql3 =
    "SELECT cl.class_id, cl.section, cl.semester, cl.c_id, co.name FROM class AS cl, course AS co WHERE st_id = ? AND co.c_id = cl.c_id;";
  const classData = await queryParamPromise(sql3, [data[0].st_id]);

  res.render("Staff/profile", {
    user: data[0],
    userDOB,
    deptData,
    classData,
    page_name: "profile",
  });
};

exports.getTimeTable = async (req, res, next) => {
  const staffData = (
    await queryParamPromise("SELECT * FROM staff WHERE st_id = ?", [req.user])
  )[0];
  const timeTableData = await queryParamPromise(
    "select * from time_table where st_id = ? order by day, start_time",
    [req.user]
  );
  console.log(timeTableData);
  const startTimes = ["10:00", "11:00", "12:00", "13:00"];
  const endTimes = ["11:00", "12:00", "13:00", "14:00"];
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  res.render("Staff/timetable", {
    page_name: "timetable",
    timeTableData,
    startTimes,
    staffData,
    endTimes,
    dayNames,
  });
};

exports.getAttendance = async (req, res, next) => {
  const sql1 = "SELECT * FROM staff WHERE st_id = ?";
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);

  const sql3 =
    "SELECT cl.class_id, cl.section, cl.semester, cl.c_id, co.name FROM class AS cl, course AS co WHERE st_id = ? AND co.c_id = cl.c_id ORDER BY cl.semester;";
  const classData = await queryParamPromise(sql3, [data[0].st_id]);

  res.render("Staff/selectClassAttendance", {
    user: data[0],
    classData,
    btnInfo: "Students List",
    page_name: "attendance",
  });
};

exports.markAttendance = async (req, res, next) => {
  const { classdata, date } = req.body;
  const regex1 = /[A-Z]+[0-9]+/g;
  const regex2 = /[A-Z]+-[0-9]+/g;

  const c_id = classdata.match(regex1)[0];
  const class_sec = classdata.match(regex2)[0].split("-");
  const staffId = req.user;

  const sql = `
    SELECT * FROM student WHERE dept_id = ? AND section = ?
`;

  let students = await queryParamPromise(sql, [class_sec[0], class_sec[1]]);
  for (student of students) {
    const status = await queryParamPromise(
      "SELECT status FROM attendance WHERE c_id = ? AND s_id = ? AND date = ?",
      [c_id, student.s_id, date]
    );
    if (status.length !== 0) {
      student.status = status[0].status;
    } else {
      student.status = 0;
    }
  }

  return res.render("Staff/attendance", {
    studentData: students,
    courseId: c_id,
    date,
    page_name: "attendance",
  });
};

exports.postAttendance = async (req, res, next) => {
  const { date, courseId, ...students } = req.body;
  let attedData = await queryParamPromise(
    "SELECT * FROM attendance WHERE date = ? AND c_id = ?",
    [date, courseId]
  );

  if (attedData.length === 0) {
    for (const s_id in students) {
      const isPresent = students[s_id];
      await queryParamPromise("insert into attendance set ?", {
        s_id: s_id,
        date: date,
        c_id: courseId,
        status: isPresent == "True" ? 1 : 0,
      });
    }
    req.flash("success_msg", "Attendance done successfully");
    return res.redirect("/staff/student-attendance");
  }

  for (const s_id in students) {
    const isPresent = students[s_id] === "True" ? 1 : 0;
    await queryParamPromise(
      "update attendance set status = ? WHERE s_id = ? AND date = ? AND c_id = ?",
      [isPresent, s_id, date, courseId]
    );
  }

  req.flash("success_msg", "Attendance updated successfully");
  return res.redirect("/staff/student-attendance");
};

exports.getStudentReport = async (req, res, next) => {
  const sql1 = "SELECT * FROM staff WHERE st_id = ?";
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);

  const sql3 =
    "SELECT cl.class_id, cl.section, cl.semester, cl.c_id, co.name FROM class AS cl, course AS co WHERE st_id = ? AND co.c_id = cl.c_id ORDER BY cl.semester;";
  const classData = await queryParamPromise(sql3, [data[0].st_id]);

  res.render("Staff/selectClass", {
    user: data[0],
    classData,
    btnInfo: "Students",
    page_name: "stu-report",
  });
};

exports.selectClassReport = async (req, res, next) => {
  const sql1 = "SELECT * FROM staff WHERE st_id = ?";
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);

  const sql3 =
    "SELECT cl.class_id, cl.section, cl.semester, cl.c_id, co.name FROM class AS cl, course AS co WHERE st_id = ? AND co.c_id = cl.c_id ORDER BY cl.semester;";
  const classData = await queryParamPromise(sql3, [data[0].st_id]);

  res.render("Staff/selectClassReport", {
    user: data[0],
    classData,
    btnInfo: "Check Status",
    page_name: "cls-report",
  });
};

exports.getClassReport = async (req, res, next) => {
  const courseId = req.params.id;
  const staffId = req.user;
  const section = req.query.section;
  console.log(courseId, staffId, section);
  const classData = await queryParamPromise(
    "SELECT * FROM class WHERE c_id = ? AND st_id = ? AND section = ?",
    [courseId, staffId, section]
  );
  const sql1 = "SELECT * FROM staff WHERE st_id = ?";
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);
  console.log(classData);
  res.render("Staff/getClassReport", {
    user: data[0],
    classData,
    page_name: "cls-report",
  });
};

exports.getClassMarks = async (req, res, next) => {
  const courseId = req.params.id;
  const staffId = req.user;

  const classData = await queryParamPromise(
    "SELECT * FROM class WHERE c_id = ? AND st_id = ?",
    [courseId, staffId]
  );
  const studentMarks = await queryParamPromise(
    "SELECT s.s_id, m.obtained_marks FROM student AS s LEFT JOIN marks AS m ON s.s_id = m.s_id WHERE m.c_id = ?",
    [courseId]
  );

  const staffData = await queryParamPromise(
    "SELECT * FROM staff WHERE st_id = ?",
    [staffId]
  );

  res.render("Staff/marks", {
    user: staffData[0],
    classData,
    studentMarks,
    page_name: "marks",
  });
};

exports.postClassMarks = async (req, res, next) => {
  const courseId = req.params.id;
  const { marks } = req.body;
  console.log(marks, courseId);
  for (const s_id in marks) {
    const mark = marks[s_id];
    await queryParamPromise(
      "INSERT INTO marks (s_id, c_id, marks) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE marks = ?",
      [s_id, courseId, mark, mark]
    );
  }

  req.flash("success_msg", "Marks updated successfully");
  res.redirect(`/staff/marks/class/${courseId}`);
};

exports.getAddExam = async (req, res, next) => {
  const user = req.user;
  const sql1 = "SELECT * FROM staff WHERE st_id = ?";
  const data = await queryParamPromise(sql1, [user]);
  console.log(user);
  const sql2 = `
    SELECT cl.class_id, cl.section, cl.semester, cl.c_id, co.name
    FROM class AS cl
    JOIN course AS co ON co.c_id = cl.c_id
    WHERE cl.st_id = ?
  `;
  const subjects = await queryParamPromise(sql2, [user]);
  console.log(subjects);
  res.render("Staff/addExam", {
    user: data[0],
    subjects,
    page_name: "add-exam",
  });
};

exports.postAddExam = async (req, res, next) => {
  const { subject, date, startTime, endTime } = req.body;
  const staffId = req.user;

  const sql = `
    INSERT INTO exams (c_id, st_id, date, start_time, end_time)
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    await queryParamPromise(sql, [subject, staffId, date, startTime, endTime]);
    req.flash("success_msg", "Exam added successfully");
    res.redirect("/staff/exams");
  } catch (error) {
    req.flash("error_msg", "Failed to add exam");
    res.redirect("/staff/add-exam");
  }
};

exports.getExams = async (req, res, next) => {
  const staffId = req.user;

  const sql = `
    SELECT ex.exam_id, co.name AS course_name, ex.date, ex.start_time, ex.end_time, cl.section, cl.semester
    FROM exams AS ex
    JOIN course AS co ON ex.c_id = co.c_id
    JOIN class AS cl ON ex.c_id = cl.c_id AND ex.st_id = cl.st_id
    WHERE ex.st_id = ?
    ORDER BY ex.date, ex.start_time
  `;

  try {
    const exams = await queryParamPromise(sql, [staffId]);
    res.render("Staff/exams", {
      exams,
      page_name: "exams",
    });
  } catch (error) {
    console.error("Error fetching exams:", error);
    res.redirect("/staff/dashboard");
  }
};

exports.getUpdateExam = async (req, res, next) => {
  const { examId } = req.params;

  try {
    const examQuery = "SELECT * FROM exams WHERE exam_id = ?";
    const exams = await queryParamPromise(examQuery, [examId]);

    const studentsQuery = `
            SELECT s.s_id, s.s_name, m.obtained_marks
            FROM student s
            LEFT JOIN marks m ON s.s_id = m.s_id AND m.exam_id = ?
            WHERE s.dept_id = (SELECT dept_id FROM course WHERE c_id = ?)
        `;
    const students = await queryParamPromise(studentsQuery, [
      examId,
      exams[0].c_id,
    ]);

    res.render("Staff/update_marks", {
      exam: exams,
      students,
      page_name: "exams",
    });
  } catch (error) {
    console.error("Error fetching exam or students:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.putUpdateExam = async (req, res, next) => {
  console.log("PUT /exams/:examId/marks", req.body);
  const { examId } = req.params;
  const { studentMarks } = req.body;
  console.log(examId, studentMarks);
  if (!Array.isArray(studentMarks) || studentMarks.length === 0) {
    return res.status(400).json({
      error: "Invalid input: studentMarks should be a non-empty array",
    });
  }

  try {
    const updateMarksPromises = studentMarks.map(async ({ s_id, marks }) => {
      console.log(s_id, marks, examId);
      const checkSql = "SELECT * FROM marks WHERE exam_id = ? AND s_id = ?";
      const ans = await queryParamPromise(checkSql, [examId, s_id]);
      if (ans.length === 0) {
        const data = await queryParamPromise(
          "SELECT c_id FROM exams WHERE exam_id = ?",
          [examId]
        );
        console.log(data);
        const sql =
          "INSERT INTO marks (exam_id,c_id, s_id, total_marks, obtained_marks) VALUES (?, ?, ?, ?, ?)";
        return queryParamPromise(sql, [examId, data[0].c_id, s_id, 100, marks]);
      } else {
        const sql =
          "UPDATE marks SET obtained_marks = ? WHERE exam_id = ? AND s_id = ?";
        return queryParamPromise(sql, [marks, examId, s_id]);
      }
    });

    await Promise.all(updateMarksPromises);
    console.log("Marks updated successfully");
    res.status(200).json({ message: "Marks updated successfully" });
  } catch (error) {
    console.error("Error updating marks:", error);
    res.status(500).json({ error: "An error occurred while updating marks" });
  }
};

exports.getMonthlyAttendanceReport = async (req, res, next) => {
  const { courseId, year, month } = req.params;
  const staffId = req.user;
  console.log(courseId, year, month);
  const attendanceData = await queryParamPromise(
    `
    SELECT s.s_id, s.s_name, a.date, a.status
    FROM student AS s
    JOIN attendance AS a ON s.s_id = a.s_id
    WHERE a.c_id = ? AND YEAR(a.date) = ? AND MONTH(a.date) = ?
    ORDER BY s.s_id, a.date
    `,
    [courseId, year, month]
  );
  console.log(courseId, year, month, attendanceData);

  const groupedData = {};
  attendanceData.forEach((record) => {
    let { s_id, s_name, date, status } = record;
    if (!groupedData[s_id]) {
      groupedData[s_id] = { s_name, attendance: {} };
    }
    date = new Date(date);
    groupedData[s_id].attendance[date.toISOString().split("T")[0]] = status;
  });
  console.log(courseId, year, month, groupedData);
  const doc = new PDFDocument();
  const fileName = `Monthly_Attendance_Report_${courseId}_${year}_${month}.pdf`;
  const filePath = `./reports/${fileName}`;

  const fileStream = fs.createWriteStream(filePath);
  doc.pipe(fileStream);

  doc
    .fontSize(16)
    .text(`Monthly Attendance Report for Course ID: ${courseId}`, {
      align: "center",
    });
  doc.fontSize(12).text(`Month: ${year}-${month}`, { align: "center" });
  doc.moveDown();
  console.log(courseId, year, month);

  const daysInMonth = new Date(year, month, 0).getDate();
  const headers = [
    "Student ID",
    "Student Name",
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  headers.forEach((header, index) => {
    doc.text(header, 50 + index * 50, 100, {
      continued: index < headers.length - 1,
    });
  });
  doc.moveDown();
  console.log("@", courseId, year, month);

  Object.keys(groupedData).forEach((s_id, index) => {
    const student = groupedData[s_id];
    doc.text(index + 1, 50, 120 + index * 20);
    doc.text(student.s_name, 100, 120 + index * 20);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const status =
        student.attendance[date] !== undefined
          ? student.attendance[date] === 1
            ? "P"
            : "A"
          : "-";
      doc.text(status, 150 + (day - 1) * 50, 120 + index * 20, {
        continued: day < daysInMonth,
      });
    }
  });

  doc.end();
  console.log("doc.end() called, PDF creation should be finalizing.");

  fileStream.on("finish", () => {
    console.log("File has been written to disk successfully.");

    fs.stat(filePath, (err, stats) => {
      if (err) {
        console.error("Error checking file stats:", err);
        return res.status(500).send("Error accessing report file.");
      }

      if (stats.size > 0) {
        console.log(
          `File size is ${stats.size} bytes. Proceeding with download.`
        );
        res.download(filePath, fileName, (err) => {
          if (err) {
            console.error("Error downloading file:", err);
            return res.status(500).send("Error downloading report.");
          } else {
            console.log("File downloaded successfully.");
          }
        });
      } else {
        console.error("File is empty, cannot download.");
        return res.status(500).send("Error: The generated file is empty.");
      }
    });
  });
};

exports.getLogout = (req, res, next) => {
  res.cookie("jwt", "", { maxAge: 1 });
  req.flash("success_msg", "You are logged out");
  res.redirect("/staff/login");
};
