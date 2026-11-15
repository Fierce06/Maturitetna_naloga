const subjectModal = document.getElementById("subjectModal");
const subjectForm = document.getElementById("subjectForm");
const subjectName = document.getElementById("subjectName");
const subjectDescription = document.getElementById("subjectDescription");
const customSubjectColor = document.getElementById("customSubjectColor");

var editMode = false;

let selectedColor = "#3b82f6";
let selectedIcon = "bi-calculator";
let errorToastTimer;

// Function to show error modal
const openModal = () => {
    subjectModal.classList.remove("hidden");
    subjectModal.classList.add("flex");
    subjectName.focus();
    $("#saveSubject").text("Create Subject");
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

// Function to fetch and display all subjects
function allSubjects() {
    $.ajax({
        url: '/api/subjects/',
        method: 'GET',

        success: function (response) {
            if (response.success == false) {
                howErrorModal(response.error || 'Error occurred while fetching subjects.');
                return;
            }

            const subjectList = $('#subjectList');
            subjectList.empty();

            response.subjects.forEach(subject => {
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

        }
    });
}

// Function to edit a subject
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

    // Handle form submission for creating or editing a subject
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

                success: function (response) {
                    if (!response.success) {
                        showErrorModal(response.error || 'Error occurred while creating the subject.');
                        return;
                    }
                    // Predmete ponovno naložimo šele po uspešnem shranjevanju
                    allSubjects();

                    subjectForm.reset();

                    selectedColor = "#3b82f6";
                    customSubjectColor.value = selectedColor;

                    updateColorSelection();
                    closeModal();
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

                        showErrorModal(response.error || 'Error occurred while updating the subject.');
                        return;
                    }

                    editMode = false;
                    subjectId = null;

                    window.location.reload();
                }
            });
        }
    });
});