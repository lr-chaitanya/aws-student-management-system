
const express = require("express");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Database file
const dataDirectory = path.join(__dirname, "data");
const databaseFile = path.join(dataDirectory, "students.json");

// Create database automatically
if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory);
}

if (!fs.existsSync(databaseFile)) {
    fs.writeFileSync(databaseFile, JSON.stringify([], null, 2));
}

// Database helpers
function getStudents() {
    return JSON.parse(fs.readFileSync(databaseFile, "utf8"));
}

function saveStudents(students) {
    fs.writeFileSync(databaseFile, JSON.stringify(students, null, 2));
}

// GET: Fetch all students
app.get("/api/students", (req, res) => {
    const students = getStudents();
    res.json(students);
});

// POST: Add a student
app.post("/api/students", (req, res) => {
    const { name, email, course, year, status } = req.body;

    if (!name?.trim() || !email?.trim() || !course?.trim() || !year) {
        return res.status(400).json({
            message: "Please provide all required student details."
        });
    }

    const students = getStudents();

    const duplicate = students.some(
        student => student.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (duplicate) {
        return res.status(409).json({
            message: "A student with this email already exists."
        });
    }

    const newStudent = {
        id: randomUUID(),
        name: name.trim(),
        email: email.trim(),
        course: course.trim(),
        year: String(year),
        status: status === "Inactive" ? "Inactive" : "Active",
        createdAt: new Date().toISOString()
    };

    students.push(newStudent);
    saveStudents(students);

    res.status(201).json(newStudent);
});

// PUT: Update a student
app.put("/api/students/:id", (req, res) => {
    const students = getStudents();
    const index = students.findIndex(
        student => student.id === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({ message: "Student not found." });
    }

    const { name, email, course, year, status } = req.body;

    if (!name?.trim() || !email?.trim() || !course?.trim() || !year) {
        return res.status(400).json({
            message: "Please provide all required student details."
        });
    }

    const duplicate = students.some(
        (student, i) =>
            i !== index &&
            student.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (duplicate) {
        return res.status(409).json({
            message: "Another student already uses this email."
        });
    }

    students[index] = {
        ...students[index],
        name: name.trim(),
        email: email.trim(),
        course: course.trim(),
        year: String(year),
        status: status === "Inactive" ? "Inactive" : "Active"
    };

    saveStudents(students);
    res.json(students[index]);
});

// DELETE: Remove a student
app.delete("/api/students/:id", (req, res) => {
    const students = getStudents();
    const updatedStudents = students.filter(
        student => student.id !== req.params.id
    );

    if (students.length === updatedStudents.length) {
        return res.status(404).json({ message: "Student not found." });
    }

    saveStudents(updatedStudents);
    res.json({ message: "Student deleted successfully." });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Student Management Server running on port ${PORT}`);
});
