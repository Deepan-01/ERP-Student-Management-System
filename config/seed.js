// Run with: npm run seed
// Populates the database with demo users, students, fees, and attendance
// so the system is ready to demo immediately.

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./db");

const User = require("../models/User");
const Student = require("../models/Student");
const Fee = require("../models/Fee");
const Attendance = require("../models/Attendance");

const seed = async () => {
  await connectDB();

  console.log("🧹 Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Fee.deleteMany({}),
    Attendance.deleteMany({}),
  ]);

  console.log("👤 Creating demo users...");
  const admin = await User.create({
    name: "Admin User",
    email: "admin@school.com",
    password: "admin123",
    role: "admin",
  });

  const teacher = await User.create({
    name: "Mrs. Priya Sharma",
    email: "teacher@school.com",
    password: "teacher123",
    role: "teacher",
  });

  console.log("🎓 Creating demo students...");
  const studentData = [
    { admissionNo: "ADM2026001", name: "Arjun Kumar", dateOfBirth: "2010-04-12", gender: "Male", classGrade: "10", section: "A", rollNumber: "1", guardianName: "Ravi Kumar", guardianPhone: "9876543210" },
    { admissionNo: "ADM2026002", name: "Sneha Reddy", dateOfBirth: "2010-07-22", gender: "Female", classGrade: "10", section: "A", rollNumber: "2", guardianName: "Suresh Reddy", guardianPhone: "9876543211" },
    { admissionNo: "ADM2026003", name: "Mohammed Imran", dateOfBirth: "2010-01-30", gender: "Male", classGrade: "10", section: "B", rollNumber: "3", guardianName: "Abdul Imran", guardianPhone: "9876543212" },
    { admissionNo: "ADM2026004", name: "Lakshmi Narayan", dateOfBirth: "2011-09-15", gender: "Female", classGrade: "9", section: "A", rollNumber: "4", guardianName: "Ganesh Narayan", guardianPhone: "9876543213" },
    { admissionNo: "ADM2026005", name: "Vikram Singh", dateOfBirth: "2011-11-02", gender: "Male", classGrade: "9", section: "A", rollNumber: "5", guardianName: "Harpreet Singh", guardianPhone: "9876543214" },
  ];

  const students = await Student.insertMany(studentData);

  console.log("🔗 Linking a student login...");
  await User.create({
    name: "Arjun Kumar",
    email: "student@school.com",
    password: "student123",
    role: "student",
    studentProfile: students[0]._id,
  });

  console.log("💰 Creating fee records...");
  for (const student of students) {
    await Fee.create({
      student: student._id,
      feeType: "Tuition",
      academicYear: "2026-2027",
      term: "Term 1",
      totalAmount: 25000,
      paidAmount: Math.random() > 0.5 ? 25000 : 10000,
      dueDate: new Date("2026-08-01"),
    });
  }

  console.log("📅 Creating attendance records (last 5 days)...");
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    for (const student of students) {
      await Attendance.create({
        student: student._id,
        date,
        status: Math.random() > 0.15 ? "present" : "absent",
        classGrade: student.classGrade,
        section: student.section,
        markedBy: teacher._id,
      });
    }
  }

  console.log("\n✅ Seed complete! Demo login credentials:");
  console.log("   Admin   -> admin@school.com / admin123");
  console.log("   Teacher -> teacher@school.com / teacher123");
  console.log("   Student -> student@school.com / student123\n");

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
