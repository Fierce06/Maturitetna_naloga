const subjectModal = document.getElementById("subjectModal");
const subjectForm = document.getElementById("subjectForm");
const subjectName = document.getElementById("subjectName");
const subjectDescription = document.getElementById("subjectDescription");
const customSubjectColor = document.getElementById("customSubjectColor");

let selectedColor = "#3b82f6";
let selectedIcon = "bi-calculator";
let errorToastTimer;

// Function to show error modal
const openModal = () => {
    subjectModal.classList.remove("hidden");
    subjectModal.classList.add("flex");
    subjectName.focus();
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
                    <li class="group min-w-0 w-full rounded-2xl border border-gray-100 bg-white p-5
                            shadow-sm transition-all duration-200 hover:-translate-y-1
                            hover:border-blue-100 hover:shadow-lg">

                        <!-- Header -->
                        <div class="flex items-center gap-3 min-w-0">
                            <div style="background-color: ${subject.color}"
                                class="flex size-12 shrink-0 items-center justify-center
                                        rounded-xl text-white shadow-sm">

                                <i class="bi ${subject.icon || 'bi-calculator'} text-xl"></i>

                            </div>

                            <div class="min-w-0 flex-1">
                                <h3 class="truncate text-base font-semibold text-gray-800">
                                    ${subject.name}
                                </h3>
                                <p class="mt-1 text-xs text-gray-400">Study subject</p>
                            </div>

                            <a href="/subject-info?id=${subject.id}"  class="bi bi-arrow-up-right text-gray-300 transition
                                    group-hover:text-blue-600"></a>
                        </div>

                        <!-- Notes -->
                        <div class="mt-6 flex items-center justify-between">
                            <span class="text-sm text-gray-500">
                                <i class="bi bi-journal-text mr-1"></i>
                                Notes
                            </span>
                            <span class="text-sm font-semibold text-gray-800">
                                ${subject.total_notes}
                            </span>
                        </div>

                        <!-- Progress -->
                        <div class="mt-5">
                            <div class="mb-2 flex items-center justify-between">
                                <span class="text-xs font-medium text-gray-500">
                                    Learning progress
                                </span>
                                <span class="text-sm font-bold" style="color: ${subject.color}">
                                    70%
                                </span>
                            </div>

                            <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div class="h-full rounded-full transition-all duration-500"
                                    style="width: 70%; background-color: ${subject.color}">
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                            <span class="text-xs text-gray-400">Keep learning</span>
                            <a href="/subject-info?id=${subject.id}" class="flex items-center gap-1 text-xs font-semibold text-blue-600">
                                View subject
                                <i class="bi bi-chevron-right"></i>
                            </a>
                        </div>

                    </li>

                `);

                subjectList.append(subjectItem);
            });

        }
    });
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
    });
});