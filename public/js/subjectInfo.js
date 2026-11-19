const params = new URLSearchParams(window.location.search);
const subjectId = Number(params.get('id'));

const subjectModal = document.getElementById("subjectModal");
const subjectForm = document.getElementById("subjectForm");
const subjectName = document.getElementById("subjectName");
const subjectDescription = document.getElementById("subjectDescription");
const customSubjectColor = document.getElementById("customSubjectColor");

let selectedColor = "#3b82f6";
let selectedIcon = "bi-calculator";

function formatDate(date) {
    return new Date(date).toLocaleDateString('sl-SI', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function showEmptyState(container, message, linkText, linkUrl) {
    const emptyState = $('<div class="rounded-xl bg-slate-50 p-4 text-sm text-slate-500"></div>');
    emptyState.append(document.createTextNode(`${message} `));
    $('<a class="font-semibold text-blue-600 hover:text-blue-500"></a>')
        .attr('href', linkUrl)
        .text(linkText)
        .appendTo(emptyState);
    container.empty().append(emptyState);
}

function renderNotes(notes) {
    const container = $('#subject-notes');
    $('#subject-note-count').text(notes.length);

    if (notes.length === 0) {
        showEmptyState(container, 'No notes have been added yet.', 'Create a note', '/notebook');
        return;
    }

    container.empty();
    notes.forEach(note => {
        const link = $('<a class="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50"></a>')
            .attr('href', `/notebook?note=${encodeURIComponent(note.id)}`);
        const details = $('<span class="min-w-0"></span>');
        $('<strong class="block truncate text-sm font-semibold text-slate-900"></strong>').text(note.title).appendTo(details);
        $('<span class="mt-1 block text-xs text-slate-500"></span>').text(`Updated ${formatDate(note.updated_at)}`).appendTo(details);
        link.append(details, $('<i class="bi bi-chevron-right shrink-0 text-slate-400 transition group-hover:text-blue-600"></i>'));
        container.append(link);
    });
}

function renderExams(exams) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = exams
        .filter(exam => new Date(exam.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    $('#subject-exam-count').text(upcoming.length);
    $('#subject-next-exam').text(upcoming[0] ? formatDate(upcoming[0].date) : 'None scheduled');

    const container = $('#subject-exams');
    if (upcoming.length === 0) {
        showEmptyState(container, 'No upcoming exams have been scheduled.', 'View all exams', '/exam');
        return;
    }

    container.empty();
    upcoming.forEach(exam => {
        const item = $('<a class="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-violet-300 hover:bg-violet-50"></a>')
            .attr('href', '/exam');
        const details = $('<span class="min-w-0"></span>');
        $('<strong class="block truncate text-sm font-semibold text-slate-900"></strong>').text(exam.title).appendTo(details);
        $('<span class="mt-1 block text-xs text-slate-500"></span>').text(formatDate(exam.date)).appendTo(details);
        item.append(details, $('<i class="bi bi-arrow-up-right shrink-0 text-slate-400 transition group-hover:text-violet-600"></i>'));
        container.append(item);
    });
}

function fetchSubjectInfo() {
    if (!Number.isInteger(subjectId) || subjectId < 1) {
        showErrorModal('A valid subject could not be found.');
        return;
    }

    $.when(
        $.get(`/api/subjects/${encodeURIComponent(subjectId)}`),
        $.get('/api/notebook'),
        $.get('/api/exams/')
    ).done(function (subjectResponse, notesResponse, examsResponse) {
        const subject = subjectResponse[0].subject;
        const notes = notesResponse[0].data.filter(note => Number(note.subject_id) === subjectId);
        const exams = examsResponse[0].exams.filter(exam => Number(exam.subject_id) === subjectId);

        $('#subject-name').text(subject.name);
        $('#subject-description').text(subject.description || 'Keep all your study materials and assessments in one place.');
        renderNotes(notes);
        renderExams(exams);

        selectedColor = subject.color || '#3b82f6';
        selectedIcon = subject.icon || 'bi-calculator';
        $("#subjectName").val(subject.name);
        $("#subjectDescription").val(subject.description);
    });
}

$(document).ready(function () {
    fetchSubjectInfo();

    $("#subjectForm").on("submit", function (e) {
        e.preventDefault();

        const podatki = {
            name: subjectName.value.trim(),
            description: subjectDescription.value.trim(),
            color: selectedColor,
            icon: selectedIcon
        };

        $.ajax({
            url: "/api/subjects/" + subjectId,
            method: "PATCH",
            contentType: "application/json",
            data: JSON.stringify(podatki),

            success: function (response) {
                if (!response.success) {
                    editMode = false;
                    subjectId = null;

                    showErrorModal(response.error || 'Error occurred while updating the subject.');
                    return;
                }

                window.location.reload();
            }
        });
    });
});

// Function to show error modal
const openModal = () => {
    subjectModal.classList.remove("hidden");
    subjectModal.classList.add("flex");
    subjectName.focus();
    updateColorSelection();
    updateIconSelection();
};

// Function to close error modal
const closeModal = () => {
    subjectModal.classList.add("hidden");
    subjectModal.classList.remove("flex");
};

// Event listeners for opening and closing the modal
document.getElementById("openSubjectModal").addEventListener("click", openModal);
document.getElementById("closeSubjectModal").addEventListener("click", closeModal);
document.getElementById("cancelSubjectModal").addEventListener("click", closeModal);

subjectModal.addEventListener("click", (event) => {
    if (event.target === subjectModal) closeModal();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !subjectModal.classList.contains("hidden")) {
        closeModal();
    }
});

// Select a preset color
document.querySelectorAll(".color-option").forEach((button) => {
    button.addEventListener("click", () => {
        selectedColor = button.dataset.color;
        customSubjectColor.value = selectedColor;
        updateColorSelection();
    });
});

// Select a custom color
customSubjectColor.addEventListener("input", () => {
    selectedColor = customSubjectColor.value;
    updateColorSelection();
});

// Update the color selection UI
function updateColorSelection() {
    document.querySelectorAll(".color-option").forEach((button) => {
        const active = button.dataset.color === selectedColor;

        button.classList.toggle("ring-2", active);
        button.classList.toggle("ring-offset-2", active);
        button.classList.toggle("ring-blue-500", active);
        button.setAttribute("aria-pressed", String(active));
    });
}

// Select an icon
document.querySelectorAll(".icon-option").forEach((button) => {
    button.addEventListener("click", () => {
        selectedIcon = button.dataset.icon;

        document.querySelectorAll(".icon-option").forEach((option) => {
            const active = option === button;

            option.classList.toggle("border-2", active);
            option.classList.toggle("border-blue-500", active);
            option.classList.toggle("bg-blue-50", active);
            option.classList.toggle("text-blue-600", active);
            option.classList.toggle("border-slate-200", !active);
            option.classList.toggle("text-slate-600", !active);
            option.setAttribute("aria-pressed", String(active));
        });
    });
});

function updateIconSelection() {
    document.querySelectorAll(".icon-option").forEach((button) => {
        const active = button.dataset.icon === selectedIcon;
        button.classList.toggle("border-2", active);
        button.classList.toggle("border-blue-500", active);
        button.classList.toggle("bg-blue-50", active);
        button.classList.toggle("text-blue-600", active);
        button.classList.toggle("border-slate-200", !active);
        button.classList.toggle("text-slate-600", !active);
        button.setAttribute("aria-pressed", String(active));
    });
}