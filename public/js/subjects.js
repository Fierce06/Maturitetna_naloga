const subjectModal = document.getElementById("subjectModal");
const subjectForm = document.getElementById("subjectForm");
const subjectName = document.getElementById("subjectName");
const subjectDescription = document.getElementById("subjectDescription");
const customSubjectColor = document.getElementById("customSubjectColor");

let selectedColor = "#3b82f6";
let selectedIcon = "bi-calculator";

const openModal = () => {
    subjectModal.classList.remove("hidden");
    subjectModal.classList.add("flex");
    subjectName.focus();
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

function allSubjects() {
    $.ajax({
        url: '/api/subjects/',
        method: 'GET',

        success: function (odgovor) {
            if (odgovor.success == false) {
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
                        </div>

                        <div class="my-4">
                            <p class="text-sm text-gray-500">153 notes</p>
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

        }
    });
}

$(document).ready(function () {
    allSubjects();  

    $('#subjectForm').on('submit', function (e) {
        e.preventDefault();

        const name = $(this).find('[name=name]').val();
        const description = $(this).find('[name=description]').val();
        const color = $(this).find('[name=color]').val();

        const podatki = {
            name: name,
            description: description,
            color: color
        };

        $.ajax({
            url: '/api/subjects/',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(podatki),


            success: function (odgovor) {
                
            },
            error: function (xhr) {
                const msg = xhr.responseJSON?.error || `Napaka: ${xhr.status} ${xhr.statusText}`;

            }
        });

        allSubjects();

        closeModal();
    });
})