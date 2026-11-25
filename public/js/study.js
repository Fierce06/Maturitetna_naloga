const studyOverview = document.getElementById("study-overview");
const studyPage = document.getElementById("study-page");
const studySubjectsList = document.getElementById("studySubjectsList");

const examTitle = document.getElementById("exam-title");
const examTopics = document.getElementById("exam-topics");
const examIcon = document.getElementById("exam-icon");
const notice = document.getElementById("notice");
const scoreModal = document.getElementById("scoreModal");
const scoreModalValue = document.getElementById("scoreModalValue");
const scoreModalDetails = document.getElementById("scoreModalDetails");

const battleResultsModal = document.getElementById("battleResultsModal");
const waitingStatus = document.getElementById("waitingStatus");
const battleResultContent = document.getElementById("battleResultContent");

let questions = [];

let timerId = null;
let selectedSubjectId = null;
let subjectsCache = [];

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function validColor(color) {
    return /^#[0-9a-fA-F]{6}$/.test(color)
        ? color
        : "#3b82f6";
}

// Getting all quizzes and storing them in a variable for later use
var quizzes = { quizzes: [] };
function getAllQuizzes(success) {
    $.ajax({
        url: "/api/quiz/",
        method: "GET",
        dataType: "json",
        success: function (response) {
            if (!response.success) {
                showErrorModal(response.error || 'Error occurred while creating the subject.');
                return;
            }
            quizzes = response;
            success();
        }
    });
}

// Function to get practice cards for a subject
function practiceCards(subject) {
    var cards = [];

    for (const quiz of quizzes.quizzes) {
        if (quiz.subject_id === subject.id) {
            cards.push({
                id: quiz.id,
                name: quiz.title,
                title: quiz.title,
                icon: "?",
                bootstrapIcon: "bi-question-circle",
                question_count: quiz.question_count
            });
        }
    }

    return cards;
}
getAllQuizzes();

// Function to create a subject card
function createSubject(subject) {
    const color = validColor(subject.color);
    const cards = practiceCards(subject);
    const isSelected = selectedSubjectId === subject.id;
    const quizCount = cards.length;

    return `
        <button type="button"
            data-select-subject="${escapeHtml(subject.id)}"
            aria-expanded="${isSelected}"
            class="group min-h-[112px] rounded-2xl border p-4 text-left text-white shadow-sm transition
                   hover:-translate-y-0.5 hover:shadow-md ${isSelected ? "ring-4 ring-blue-100" : ""}"
            style="background: ${color}; border-color: ${color}">
            <span class="flex items-start justify-between">
                <i class="bi ${subject.icon || 'bi-calculator'} text-2xl"></i>
                <i class="bi ${isSelected ? 'bi-chevron-up' : 'bi-chevron-down'} text-white/70"></i>
            </span>
            <strong class="mt-5 block text-base leading-tight">${escapeHtml(subject.name)}</strong>
            <span class="mt-1 block text-xs text-white/75">${quizCount} ${quizCount === 1 ? 'quiz' : 'quizzes'}</span>
        </button>
    `;
}

function renderSubjectQuizzes(subject) {
    const panel = document.getElementById("studySubjectQuizzes");
    if (!subject) {
        panel.innerHTML = `
            <div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Select a subject to view its quizzes.
            </div>`;
        return;
    }

    const color = validColor(subject.color);
    const cards = practiceCards(subject);

    panel.innerHTML = `
        <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header class="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <span class="grid h-10 w-10 place-items-center rounded-xl text-white" style="background-color:${color}">
                    <i class="bi ${subject.icon || 'bi-calculator'}"></i>
                </span>
                <div>
                    <p class="text-xs font-bold uppercase tracking-wider" style="color:${color}">${escapeHtml(subject.name)}</p>
                    <h2 class="text-lg font-bold text-slate-900">Available quizzes</h2>
                </div>
            </header>
            <div class="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                ${cards.length ? cards.map(card => `
                    <button type="button" data-open-exam id="${card.id}" data-id="${escapeHtml(card.id)}"
                        data-title="${escapeHtml(card.title)}" data-icon="${escapeHtml(card.icon)}"
                        class="group min-h-[118px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition
                               hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md">
                        <span class="flex items-start justify-between">
                            <i class="bi ${card.bootstrapIcon} text-2xl" style="color:${color}"></i>
                            <i class="bi bi-arrow-up-right text-slate-400"></i>
                        </span>
                        <strong class="mt-4 block text-slate-900">${escapeHtml(card.name)}</strong>
                        <span class="mt-1 block text-xs text-slate-500">${card.question_count} questions · 45 min</span>
                    </button>
                `).join("") : `
                    <div class="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                        <p class="font-medium text-slate-700">No quizzes for this subject yet.</p>
                        <button type="button" id="openAddExamFromSubject" class="mt-3 text-sm font-semibold text-blue-600">
                            Create a quiz
                        </button>
                    </div>
                `}
            </div>
        </section>
    `;
}

// Loading subjects when the page is ready
function loadStudySubjects() {

    // Fetching all quizzes first, then fetching subjects
    getAllQuizzes(function () {
        $.ajax({
            url: "/api/subjects/",
            method: "GET",
            dataType: "json",
            success: function (data) {
                if (!data.success) {
                    showErrorModal(response.error || 'Error occurred while creating the subject.');
                    return;
                }

                if (!data.subjects || data.subjects.length === 0) {
                    studySubjectsList.innerHTML = `
                        <div class="rounded-xl border border-dashed border-slate-300
                                    bg-slate-50 p-10 text-center">
                            <p class="font-medium text-slate-700">
                                You don't have any subjects yet.
                            </p>
                            <a href="/subjects"
                            class="mt-3 inline-block text-sm font-medium text-blue-600">
                                Add your first subject
                            </a>
                        </div>
                    `;
                    return;
                }

                subjectsCache = data.subjects;
                if (!selectedSubjectId && data.subjects.length) {
                    selectedSubjectId = data.subjects[0].id;
                }
                studySubjectsList.innerHTML = data.subjects.map(createSubject).join("");
                const selectedSubject = data.subjects.find(subject => subject.id === selectedSubjectId) || null;
                renderSubjectQuizzes(selectedSubject);
            }
        });
    })
}

function loadStudyHistory() {
    $.ajax({
        url: "/api/quiz/history",
        method: "GET",
        success: function (response) {
            const historyList = document.getElementById("studyHistory");
            if (!response.success) {
                historyList.innerHTML = '<p class="rounded-xl bg-red-50 p-4 text-sm text-red-700">History could not be loaded.</p>';
                return;
            }

            if (!response.attempts || response.attempts.length === 0) {
                historyList.innerHTML = `
                    <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                        Completed quizzes will appear here.
                    </div>`;
                return;
            }

            historyList.innerHTML = response.attempts.map(attempt => {
                const percent = attempt.total_questions
                    ? Math.round((attempt.score / attempt.total_questions) * 100)
                    : 0;
                const date = new Date(attempt.completed_at);
                const dateText = Number.isNaN(date.getTime())
                    ? ""
                    : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
                const color = validColor(attempt.subject_color);

                return `
                    <button type="button" data-open-exam data-id="${escapeHtml(attempt.quiz_id)}"
                        class="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40">
                        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white" style="background:${color}">
                            <i class="bi bi-clipboard-check"></i>
                        </span>
                        <span class="min-w-0 flex-1">
                            <strong class="block truncate text-sm text-slate-800">${escapeHtml(attempt.title)}</strong>
                            <span class="mt-0.5 block text-xs text-slate-500">${escapeHtml(attempt.subject_name)} · ${escapeHtml(dateText)}</span>
                        </span>
                        <span class="text-sm font-bold ${percent >= 70 ? 'text-emerald-600' : 'text-amber-600'}">${percent}%</span>
                    </button>`;
            }).join("");
        },
        error: function () {
            document.getElementById("studyHistory").innerHTML =
                '<p class="rounded-xl bg-red-50 p-4 text-sm text-red-700">History could not be loaded.</p>';
        }
    });
}

// Updating the progress of the study session
function updateProgress() {
    const answered = questions.filter(question => {
        const selectedRadio =
            question.querySelector('input[type="radio"]:checked');

        const writtenAnswer = [
            ...question.querySelectorAll('input[type="number"], textarea')
        ].some(element => element.value.trim() !== "");

        return selectedRadio || writtenAnswer;
    }).length;

    const total = questions.length;
    const percent = total === 0 ? 0 : Math.round(answered / total * 100);

    document.getElementById("answered-count").textContent =
        `${answered} of ${total} answered`;

    document.getElementById("completion-percent").textContent =
        `${percent}% complete`;

    document.querySelector("#study-page progress").value = answered;

    return answered;
}

// Function to start the timer for the study session
function startTimer() {
    clearInterval(timerId);

    let seconds = 45 * 60;

    function displayTime() {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        document.getElementById("time").textContent =
            `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    }

    displayTime();

    timerId = setInterval(() => {
        seconds--;
        displayTime();

        if (seconds <= 0) {
            clearInterval(timerId);
            notice.textContent = "Time is up.";
        }
    }, 1000);
}

// Showing exam with questions for a selected subject
var correctAnswers = {};
var explanation = {};
var currentQuizId = null;
function showExam(card, quizIdFromUrl = null) {
    correctAnswers = {};
    explanation = {};

    var quizId = null;
    if (quizIdFromUrl) {
        quizId = quizIdFromUrl;
    } else if (card) {
        quizId = card.dataset.id;
    }

    currentQuizId = quizId;

    $.ajax({
        url: "/api/quiz/questions/" + quizId,
        method: "GET",
        dataType: "json",
        success: function (data) {
            if (!data.success) {
                showErrorModal(response.error || 'Error occurred while creating the subject.');
                return;
            }
            const main = document.getElementById("exam-questions");
            const quizQuestions = data.questions.questions;

            document.querySelector("#study-page progress").max = quizQuestions.length;

            main.querySelectorAll("[data-question]").forEach(element => element.remove());
            main.insertAdjacentHTML("beforeend", quizQuestions.map((element, index) => {
            const questionId = `question-${index}`;
            correctAnswers[questionId] = element.correct_answer;
            explanation[questionId] = element.explanation;
            return `
                <section class="mb-5 scroll-mt-[25px] rounded-[14px] border border-[#e2e8f1] bg-white p-[25px] max-[650px]:p-[18px]" data-question id="${questionId}">
                    <h2 class="mb-[22px] mt-0 flex gap-[14px] text-lg font-semibold leading-[1.6] max-[650px]:text-base [&>span:first-child]:text-[#5775b4]" id="${questionId}"><span>${index + 1}.</span><span>${escapeHtml(element.question)}</span></h2>
                    <fieldset class="m-0 border-0 p-0" aria-labelledby="${questionId}">
                        ${[
                            ["A", element.answer_a],
                            ["B", element.answer_b],
                            ["C", element.answer_c],
                            ["D", element.answer_d]
                        ].map(([label, answer]) => `
                            <label class="mb-2 flex min-h-[54px] cursor-pointer items-center gap-[18px] rounded-[11px] border border-[#e7ecf4] px-[18px] py-[10px] transition-colors duration-150 hover:bg-[#f7faff] has-[:checked]:border-[#6b9ddd] has-[:checked]:bg-[#f0f6ff]"><input class="peer sr-only" type="radio" name="${questionId}" value="${label}"><span class="grid size-8 shrink-0 place-items-center rounded-[9px] border border-[#dce2e9] text-[#667489] peer-checked:border-[#268ad5] peer-checked:bg-[#268ad5] peer-checked:text-white">${label}</span><span>${escapeHtml(answer)}</span></label>
                        `).join("")}
                    </fieldset>
                </section>
            `;
            }).join(""));
            questions = [...main.querySelectorAll("[data-question]")];
        }
    });

    studyOverview.classList.add("hidden");
    studyPage.classList.remove("hidden");

    startTimer();

    history.replaceState(null, "", "#exam");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function loadBattle(battleId) {
    $.ajax({
        url: "/api/battles/challanger-quiz/" + battleId,
        method: "GET",
        dataType: "json",
        success: function (data) {
            if (!data.success) {
                showErrorModal(data.error || 'Error occurred while loading the battle.');
                return;
            }

            const main = document.getElementById("exam-questions");
            const quizQuestions = data.quizQuestions;

            document.querySelector("#study-page progress").max = quizQuestions.length;

            main.querySelectorAll("[data-question]").forEach(element => element.remove());
            main.insertAdjacentHTML("beforeend", quizQuestions.map((element, index) => {
            const questionId = `question-${index}`;
            correctAnswers[questionId] = element.correct_answer;
            explanation[questionId] = element.explanation;
            return `
                <section class="mb-5 scroll-mt-[25px] rounded-[14px] border border-[#e2e8f1] bg-white p-[25px] max-[650px]:p-[18px]" data-question id="${questionId}">
                    <h2 class="mb-[22px] mt-0 flex gap-[14px] text-lg font-semibold leading-[1.6] max-[650px]:text-base [&>span:first-child]:text-[#5775b4]" id="${questionId}"><span>${index + 1}.</span><span>${escapeHtml(element.question)}</span></h2>
                    <fieldset class="m-0 border-0 p-0" aria-labelledby="${questionId}">
                        ${[
                            ["A", element.answer_a],
                            ["B", element.answer_b],
                            ["C", element.answer_c],
                            ["D", element.answer_d]
                        ].map(([label, answer]) => `
                            <label class="mb-2 flex min-h-[54px] cursor-pointer items-center gap-[18px] rounded-[11px] border border-[#e7ecf4] px-[18px] py-[10px] transition-colors duration-150 hover:bg-[#f7faff] has-[:checked]:border-[#6b9ddd] has-[:checked]:bg-[#f0f6ff]"><input class="peer sr-only" type="radio" name="${questionId}" value="${label}"><span class="grid size-8 shrink-0 place-items-center rounded-[9px] border border-[#dce2e9] text-[#667489] peer-checked:border-[#268ad5] peer-checked:bg-[#268ad5] peer-checked:text-white">${label}</span><span>${escapeHtml(answer)}</span></label>
                        `).join("")}
                    </fieldset>
                </section>
            `;
            }).join(""));
            questions = [...main.querySelectorAll("[data-question]")];
        }
    });

    studyOverview.classList.add("hidden");
    studyPage.classList.remove("hidden");

    startTimer();

    history.replaceState(null, "", "#exam");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Function to show the study overview page
function showStudyOverview() {
    clearInterval(timerId);

    studyPage.classList.add("hidden");
    studyOverview.classList.remove("hidden");

    history.replaceState(null, "", "#study");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Event listeners for user interactions
studyOverview.addEventListener("click", event => {
    const subjectButton = event.target.closest("[data-select-subject]");
    if (subjectButton) {
        selectedSubjectId = Number(subjectButton.dataset.selectSubject);
        studySubjectsList.innerHTML = subjectsCache.map(createSubject).join("");
        const selectedSubject = subjectsCache.find(subject => subject.id === selectedSubjectId) || null;
        renderSubjectQuizzes(selectedSubject);
        return;
    }

    const card = event.target.closest("[data-open-exam]");

    if (card) {
        showExam(card);
        return;
    }

    if (event.target.closest("#openAddExamFromSubject")) {
        document.getElementById("openAddExamModal").click();
    }
});

studyPage.addEventListener("input", updateProgress);

document.getElementById("back").addEventListener("click", event => {
    event.preventDefault();
    showStudyOverview();
});

document.getElementById("previous").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("next").addEventListener("click", () => {
    const answered = updateProgress();

    notice.textContent = answered === questions.length
        ? `All ${questions.length} questions answered.`
        : `${answered} of ${questions.length} answered. Complete the remaining questions.`;

    notice.classList.remove("hidden");

    checkExamAnswers();
});

// Function to check the answers of the exam and display the results
function checkExamAnswers() {
    let correctCount = 0;
    let incorrectCount = 0;

    questions.forEach((question, index) => {
        const questionId = `question-${index}`;
        const selectedRadio = question.querySelector('input[type="radio"]:checked');

        if (selectedRadio) {
            const selectedAnswer = selectedRadio.value;
            const correctAnswer = Object.keys(correctAnswers).includes(questionId) ? correctAnswers[questionId] : null;

            const questionContainer = document.getElementById(questionId);

            if (selectedAnswer === correctAnswer) {
                correctCount++;
                questionContainer.classList.add("border-green-500", "shadow-lg", "shadow-green-200", "border-2");
                questionContainer.classList.remove("border-red-500", "shadow-red-200");
            } else {
                incorrectCount++;
                questionContainer.classList.add("border-red-500", "shadow-lg", "shadow-red-200", "border-2");
                questionContainer.classList.remove("border-green-500", "shadow-green-200");
            }

            questionContainer.insertAdjacentHTML("beforeend", `
                <div class="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    <strong>Correct Answer:</strong> ${correctAnswer || "N/A"}<br>
                    <strong>Explanation:</strong> ${explanation[questionId] || "No explanation available."}
                </div>
            `);
            
        }
    });

    const score = questions.length === 0
        ? 0
        : Math.round((correctCount / questions.length) * 100);

    notice.textContent = `Correct: ${correctCount}, Incorrect: ${incorrectCount} out of ${questions.length} questions. Current score: ${score}%.`;
    scoreModalValue.textContent = `${score}%`;
    scoreModalDetails.textContent = `${correctCount} correct and ${incorrectCount} incorrect out of ${questions.length} questions.`;
    scoreModal.classList.remove("hidden");
    scoreModal.classList.add("flex");

    if (battleId) {
        $.ajax({
            url: `/api/battles/${battleId}/submit`,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                score: correctCount,
                total_questions: questions.length
            }),
            success: function (response) {
                if (!response.success) {
                    showErrorModal(response.error || 'Error occurred while submitting the battle result.');
                    return;
                }

                closeScoreModal();

                if (response.result.status === 'finished') {
                    battleResultsModal.classList.remove("hidden");
                    battleResultsModal.classList.add("flex");
                    battleResultContent.classList.remove("hidden");
                    waitingStatus.classList.add("hidden");

                    displayBattleResults(response.result, response.userId);
                } else {
                    battleResultsModal.classList.remove("hidden");
                    battleResultsModal.classList.add("flex");
                    battleResultContent.classList.add("hidden");
                    waitingStatus.classList.remove("hidden");

                    setInterval(async () => {
                        try {
                            const statusResponse = await $.ajax({
                                url: `/api/battles/battle/${encodeURIComponent(battleId)}`,
                                method: "GET",
                                dataType: "json"
                            });
                            if (statusResponse.battleDetails.status === 'finished') {
                                clearInterval(this);
                                battleResultsModal.classList.remove("hidden");
                                battleResultsModal.classList.add("flex");
                                battleResultContent.classList.remove("hidden");
                                waitingStatus.classList.add("hidden");

                                displayBattleResults(statusResponse.battleDetails, statusResponse.userId);
                            }
                        } catch (error) {
                            console.error('Error occurred while fetching battle status:', error);
                        }
                    }, 2000);
                }
            }
        });
    } else {
        $.ajax({
            url: "/api/quiz/submit",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                quiz_id: currentQuizId,
                score: correctCount,
                total_questions: questions.length
            }),
            success: function (response) {
                if (!response.success) {
                    showErrorModal(response.error || 'Error occurred while submitting the quiz result.');
                    return;
                }
                loadStudyHistory();
            }
        });
    }
}

function displayBattleResults(battleData, userId) {
    if (battleData.status === 'finished') {
        const challengerScore = battleData.challenger_score;
        const opponentScore = battleData.opponent_score;
        const challengerId = battleData.challenger_id;
        const opponentId = battleData.opponent_id;
        const challengerUsername = battleData.challenger_username;
        const opponentUsername = battleData.opponent_username;

        if (challengerId === userId) {
            $("#myPlayerScore").text(challengerScore);
            $("#myPlayerName").text(challengerUsername);
            $("#opponentScore").text(opponentScore);
            $("#opponentName").text(opponentUsername);
            if (challengerScore > opponentScore) {
                $("#battleResultTitle").text("Victory!");
                $("#battleResultDescription").text("You won the battle!");
            } else if (challengerScore < opponentScore) {
                $("#battleResultTitle").text("Defeat!");
                $("#battleResultDescription").text("You lost the battle.");
            } else {
                $("#battleResultTitle").text("Draw!");
                $("#battleResultDescription").text("The battle ended in a draw.");
            }
        } else if (opponentId === userId) {
            $("#myPlayerScore").text(opponentScore);
            $("#myPlayerName").text(opponentUsername);
            $("#opponentScore").text(challengerScore);
            $("#opponentName").text(challengerUsername);
            if (opponentScore > challengerScore) {
                $("#battleResultTitle").text("Victory!");
                $("#battleResultDescription").text("You won the battle!");
            } else if (opponentScore < challengerScore) {
                $("#battleResultTitle").text("Defeat!");
                $("#battleResultDescription").text("You lost the battle.");
            } else {
                $("#battleResultTitle").text("Draw!");
                $("#battleResultDescription").text("The battle ended in a draw.");
            }
        }
    }
}

function closeBattleResultsModal() {
    battleResultsModal.classList.add("hidden");
    battleResultsModal.classList.remove("flex");

    window.location.href = "/study";
}

function closeScoreModal() {
    scoreModal.classList.add("hidden");
    scoreModal.classList.remove("flex");
}

document.getElementById("closeScoreModal").addEventListener("click", closeScoreModal);
scoreModal.addEventListener("click", event => {
    if (event.target === scoreModal) closeScoreModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !scoreModal.classList.contains("hidden")) {
        closeScoreModal();
    }
});

loadStudySubjects();
loadStudyHistory();
window.addEventListener("quiz-created", loadStudySubjects);

// If url contains quizz id show the exam page directly
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get("quizId");
const battleId = urlParams.get("battleId");

if (quizId) {
    // Show the exam page
    showExam(null, quizId);
} else if (battleId) {
    loadBattle(battleId);
}