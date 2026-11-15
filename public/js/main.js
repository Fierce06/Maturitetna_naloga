// Fetch all subjects and display them
function allSubjects() {
    $.ajax({
        url: '/api/subjects/',
        method: 'GET',

        success: function (odgovor) {
            if (odgovor.success == false) {
                showErrorModal(odgovor.error || 'An unexpected error occurred while fetching subjects.');
                return;
            }

            // Clear the subject list before appending new subjects
            const subjectList = $('#subjectList');
            subjectList.empty();

            // Loop through each subject and create a list item for it
            odgovor.subjects.forEach(subject => {
                const subjectItem = $(`
                        <li class="max-w-[300px] min-w-[250px] shrink-0 rounded-xl bg-gray-50 p-4 shadow-sm transition hover:shadow-md">
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
        }
    });
}

// Fetch all quizzes and display them
function allQuizzes() {
    $.ajax({
        url: "/api/subjects/",
        method: "GET",
        dataType: "json",
        success: function (data) {
            if (!data.success) {
                showErrorModal(data.error || 'Error occurred while fetching subjects.');
                return;
            }

            // If there are no subjects, display a message
            if (!data.subjects || data.subjects.length === 0) {
                studySubjectsList.innerHTML = `
                        <div class="rounded-xl border border-dashed border-slate-300
                                    bg-slate-50 p-10 text-center">
                            <p class="font-medium text-slate-700">
                                Nimaš še nobenega predmeta.
                            </p>
                            <a href="/subjects"
                            class="mt-3 inline-block text-sm font-medium text-blue-600">
                                Dodaj prvi predmet
                            </a>
                        </div>
                    `;
                return;
            }

            // If there are subjects, fetch quizzes and display them
            getAllQuizzes(function (cards) {
                    studySubjectsList.innerHTML = `
                        ${cards.map(card => `
                            <button
                                type="button"
                                data-open-exam
                                id="${card.id}"
                                data-id="${escapeHtml(card.id)}"
                                data-title="${escapeHtml(card.title)}"
                                data-icon="${escapeHtml(card.icon)}"
                                aria-label="Open quiz ${escapeHtml(card.title)}"
                                class="group relative flex min-h-[155px] w-full flex-col
                                       justify-between overflow-hidden rounded-2xl border
                                       border-slate-200 bg-white p-5 text-left shadow-sm
                                       transition duration-200
                                       hover:border-blue-300">

                                <span class="relative flex items-start justify-between">
                                    <span class="grid size-11 place-items-center rounded-xl
                                                 bg-blue-600 text-white shadow-sm
                                                 shadow-blue-200">
                                        <i class="bi bi-question-circle text-xl"></i>
                                    </span>
                                    <i class="bi bi-arrow-up-right text-lg text-slate-300
                                              transition group-hover:text-blue-600"></i>
                                </span>

                                <span class="relative mt-5">
                                    <strong class="block truncate text-base font-semibold
                                                   text-slate-900">
                                        ${escapeHtml(card.title)}
                                    </strong>
                                    <span class="mt-2 inline-flex items-center gap-1.5
                                                 rounded-full bg-slate-100 px-2.5 py-1
                                                 text-xs font-medium text-slate-600">
                                        <i class="bi bi-list-check text-blue-600"></i>
                                        ${card.question_count} questions
                                    </span>
                                </span>
                            </button>
                        `).join("")}
                    `;
            });
        }
    });
}

// Fetch all quizzes from the API
function getAllQuizzes(success) {
    $.ajax({
        url: "/api/quiz/",
        method: "GET",
        dataType: "json",
        success: function (response) {
            if (!response.success) {
                    showErrorModal(response.error || 'Error occurred while fetching quizzes.');
                return;
            }
            success(response.quizzes || []);
        }
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function redirectToQuiz(card) {
    window.location.assign(`/study?quizId=${encodeURIComponent(card.dataset.id)}`);
}

$(document).ready(function () {
    allSubjects();
    allQuizzes();

    studySubjectsList.addEventListener("click", function (event) {
        const card = event.target.closest("[data-open-exam]");
        if (card) redirectToQuiz(card);
    });
})
