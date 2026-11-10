
const API_URL = "/api/students";

let students = [];

// 1. Fetch students from the backend
async function loadStudents() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Could not load students");
    }

    students = await response.json();

    updateDashboard();
    renderStudents();

  } catch (error) {
    console.error("Loading error:", error);
    alert("Unable to connect to the server. Please check the backend.");
  }
}

// 2. Update dashboard statistics
function updateDashboard() {
  const active = students.filter(
    student => student.status === "Active"
  );

  const inactive = students.filter(
    student => student.status === "Inactive"
  );

  const courses = [...new Set(
    students.map(student => student.course)
  )];

  document.getElementById("totalStudents").textContent =
    students.length;

  document.getElementById("activeStudents").textContent =
    active.length;

  document.getElementById("inactiveStudents").textContent =
    inactive.length;

  document.getElementById("totalCourses").textContent =
    courses.length;

  updateCourseFilter(courses);
}

// 3. Populate course filter
function updateCourseFilter(courses) {
  const filter = document.getElementById("courseFilter");
  const selected = filter.value;

  filter.innerHTML = '<option value="">All courses</option>';

  courses.forEach(course => {
    const option = document.createElement("option");
    option.value = course;
    option.textContent = course;
    filter.appendChild(option);
  });

  if (courses.includes(selected)) {
    filter.value = selected;
  }
}

// 4. Safely display student information
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

// 5. Display students in the table
function renderStudents() {
  const tbody = document.getElementById("studentsTableBody");
  const emptyState = document.getElementById("emptyState");

  const search = document.getElementById("searchInput")
    .value.toLowerCase().trim();

  const selectedCourse =
    document.getElementById("courseFilter").value;

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(search) ||
      student.email.toLowerCase().includes(search);

    const matchesCourse =
      !selectedCourse || student.course === selectedCourse;

    return matchesSearch && matchesCourse;
  });

  tbody.innerHTML = "";

  emptyState.style.display =
    filteredStudents.length === 0 ? "block" : "none";

  filteredStudents.forEach(student => {
    const row = document.createElement("tr");

    const statusClass =
      student.status === "Active" ? "active" : "inactive";

    row.innerHTML = `
      <td>
        <div class="student-name">
          ${escapeHTML(student.name)}
        </div>
        <div class="student-email">
          ${escapeHTML(student.email)}
        </div>
      </td>

      <td>${escapeHTML(student.course)}</td>

      <td>Year ${escapeHTML(student.year)}</td>

      <td>
        <span class="status ${statusClass}">
          ${escapeHTML(student.status)}
        </span>
      </td>

      <td>
        <button class="action-btn edit-btn"
          data-id="${escapeHTML(student.id)}">
          Edit
        </button>

        <button class="action-btn delete delete-btn"
          data-id="${escapeHTML(student.id)}">
          Delete
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });
}

// 6. Open the student modal
function openModal(student = null) {
  const modal = document.getElementById("studentModal");
  const form = document.getElementById("studentForm");

  form.reset();

  document.getElementById("studentId").value =
    student ? student.id : "";

  document.getElementById("modalTitle").textContent =
    student ? "Edit student" : "Add new student";

  if (student) {
    document.getElementById("studentName").value = student.name;
    document.getElementById("studentEmail").value = student.email;
    document.getElementById("studentCourse").value = student.course;
    document.getElementById("studentYear").value = String(student.year);
    document.getElementById("studentStatus").value = student.status;
  }

  modal.classList.add("show");
}

// 7. Close the modal
function closeModal() {
  document.getElementById("studentModal").classList.remove("show");
}

// 8. Add or update a student
async function saveStudent(event) {
  event.preventDefault();

  const id = document.getElementById("studentId").value;

  const studentData = {
    name: document.getElementById("studentName").value.trim(),
    email: document.getElementById("studentEmail").value.trim(),
    course: document.getElementById("studentCourse").value,
    year: document.getElementById("studentYear").value,
    status: document.getElementById("studentStatus").value
  };

  const url = id ? `${API_URL}/${encodeURIComponent(id)}` : API_URL;
  const method = id ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(studentData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to save student");
    }

    closeModal();
    await loadStudents();

  } catch (error) {
    alert(error.message);
  }
}

// 9. Delete a student
async function deleteStudent(id) {
  const confirmed = confirm(
    "Are you sure you want to delete this student?"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_URL}/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to delete student");
    }

    await loadStudents();

  } catch (error) {
    alert(error.message);
  }
}

// 10. Connect all buttons and inputs
document.getElementById("openAddModal")
  .addEventListener("click", () => openModal());

document.getElementById("closeModal")
  .addEventListener("click", closeModal);

document.getElementById("cancelModal")
  .addEventListener("click", closeModal);

document.getElementById("studentForm")
  .addEventListener("submit", saveStudent);

document.getElementById("searchInput")
  .addEventListener("input", renderStudents);

document.getElementById("courseFilter")
  .addEventListener("change", renderStudents);

document.getElementById("studentsTableBody")
  .addEventListener("click", event => {
    const editButton = event.target.closest(".edit-btn");
    const deleteButton = event.target.closest(".delete-btn");

    if (editButton) {
      const student = students.find(
        item => item.id === editButton.dataset.id
      );

      if (student) openModal(student);
    }

    if (deleteButton) {
      deleteStudent(deleteButton.dataset.id);
    }
  });

// Close modal when clicking outside it
document.getElementById("studentModal")
  .addEventListener("click", event => {
    if (event.target.id === "studentModal") {
      closeModal();
    }
  });

// 11. Start the application
loadStudents();
