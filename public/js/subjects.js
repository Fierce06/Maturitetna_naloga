const subjectModal = document.getElementById("subjectModal");
const subjectForm = document.getElementById("subjectForm");
const subjectName = document.getElementById("subjectName");
const subjectDescription = document.getElementById("subjectDescription");
const customSubjectColor = document.getElementById("customSubjectColor");
const subjectsErrorToast = document.getElementById("subjectsErrorToast");
const subjectsErrorMessage = document.getElementById("subjectsErrorMessage");
const closeSubjectsError = document.getElementById("closeSubjectsError");

var editMode = false;

let selectedColor = "#3b82f6";
let selectedIcon = "bi-calculator";
let errorToastTimer;

function showErrorToast(message) {
    subjectsErrorMessage.textContent = message;
    subjectsErrorToast.classList.remove("hidden");
    subjectsErrorToast.classList.add("flex");

    clearTimeout(errorToastTimer);
    errorToastTimer = setTimeout(hideErrorToast, 5000);
}

function hideErrorToast() {
    subjectsErrorToast.classList.add("hidden");
    subjectsErrorToast.classList.remove("flex");
}

closeSubjectsError.addEventListener("click", hideErrorToast);

const openModal = () => {
    subjectModal.classList.remove("hidden");
    subjectModal.classList.add("flex");
    subjectName.focus();
    $("#saveSubject").text("Create Subject");
};

const closeModal = () => {
    subjectModal.classList.add("hidden");
    subjectModal.classList.remove("flex");
};

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
        updatePreview();
    });
});

// Select a custom color
customSubjectColor.addEventListener("input", () => {
    selectedColor = customSubjectColor.value;
    updateColorSelection();
    updatePreview();
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

        updatePreview();
    });
});

// Update the preview of the subject card
function allSubjects() {
    $.ajax({
        url: '/api/subjects/',
        method: 'GET',

        success: function (odgovor) {
            if (odgovor.success == false) {
                const msg = odgovor.error || 'Napaka pri pridobivanju predmetov.';
                console.error(msg);
                showErrorToast(msg);
                return;
            }

            const subjectList = $('#subjectList');
            subjectList.empty();

            odgovor.subjects.forEach(subject => {
                const subjectItem = $(`
                    <li class="min-w-[280px] shrink-0 rounded-xl bg-gray-50 p-4 shadow-sm transition hover:shadow-md">
                        <div class="flex items-center">
                            <div style="background-color: ${subject.color}"
                                class="p-2 px-3 rounded-lg text-white">
                                <i class="bi ${subject.icon || 'bi-calculator'}"></i>
                            </div>
                            <span class="ml-4 font-medium text-gray-800">${subject.name}</span>

                            <button class="ml-auto text-gray-400 hover:text-gray-600"
                                onclick="editSubject(${subject.id})" aria-label="Edit Subject">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </div>

                        <div class="my-4">
                            <p class="text-sm text-gray-500">${subject.description}</p>
                        </div>

                        <div class="mt-4">
                            <div class="h-2 w-full rounded-full bg-gray-200">
                                <div class="h-2 rounded-full"
                                    style="width: 70%; background-color: ${subject.color}"></div>
                            </div>
                            <p class="mt-2 text-sm text-gray-500">70% completed</p>
                        </div>
                    </li>
                `);

                subjectList.append(subjectItem);
            });

        },
        error: function (xhr) {
            const msg = xhr.responseJSON?.error || `Napaka: ${xhr.status} ${xhr.statusText}`;
            console.error(msg);
            showErrorToast(msg);
        }
    });
}

var subjectId = null;
function editSubject(subject_Id) {
    editMode = true;
    subjectId = subject_Id;
    subjectModal.classList.remove("hidden");
    subjectModal.classList.add("flex");
    subjectName.focus();
    $("#saveSubject").text("Save Changes");
}
    

$(document).ready(function () {
    // Load all subjects when the page is ready
    allSubjects();

    $("#subjectForm").on("submit", function (e) {
        e.preventDefault();

        const podatki = {
            name: subjectName.value.trim(),
            description: subjectDescription.value.trim(),
            color: selectedColor,
            icon: selectedIcon
        };

        // Validate required fields
        if (!editMode) {

            $.ajax({
                url: "/api/subjects/",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(podatki),

                success: function () {
                    // Predmete ponovno naložimo šele po uspešnem shranjevanju
                    allSubjects();

                    subjectForm.reset();

                    selectedColor = "#3b82f6";
                    customSubjectColor.value = selectedColor;

                    updateColorSelection();
                    closeModal();
                },

                error: function (xhr) {
                    const msg =
                        xhr.responseJSON?.error ||
                        `Napaka: ${xhr.status} ${xhr.statusText}`;

                    showErrorToast(msg);
                }
            });
        } else {
            $.ajax({
                url: "/api/subjects/" + subjectId,
                method: "PATCH",
                contentType: "application/json",
                data: JSON.stringify(podatki),

                success: function (response) {
                    if (!response.success) {
                        editMode = false;
                        subjectId = null;

                        const msg = response.error || "Napaka pri urejanju predmeta.";
                        showErrorToast(msg);
                        return;
                    }

                    editMode = false;
                    subjectId = null;

                    window.location.reload();
                },

                error: function (xhr) {
                    editMode = false;
                    subjectId = null;
                    const msg =
                        xhr.responseJSON?.error ||
                        `Napaka: ${xhr.status} ${xhr.statusText}`;

                    showErrorToast(msg);
                }
            });
        }
    });
});