const studyOverview = document.getElementById("study-overview");
const studyPage = document.getElementById("study-page");
const studySubjectsList = document.getElementById("studySubjectsList");

const examTitle = document.getElementById("exam-title");
const examTopics = document.getElementById("exam-topics");
const examIcon = document.getElementById("exam-icon");
const notice = document.getElementById("notice");

let questions = [];

let timerId = null;

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

var quizzes = { quizzes: [] };
async function getAllQuizzes() {
    try {
        const response = await fetch("/api/quiz/");
        if (response.redirected) {
            window.location.href = response.url;
            return;
        }

        if (!response.ok) {
            throw new Error("Predmetov ni bilo mogoče pridobiti.");
        }

        quizzes = await response.json();
    } catch (error) {
        console.error(error);
    }
}

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

function createSubject(subject) {
    const color = validColor(subject.color);
    const cards = practiceCards(subject);

    return `
        <section
            class="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4
                   md:grid-cols-[150px_minmax(0,1fr)]">

            <div class="flex min-h-[145px] flex-col justify-between rounded-xl
                        p-5 text-white shadow-md"
                 style="background-color: ${color}">

                <i class="bi bi-book text-3xl"></i>

                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-white/70">
                        Subject
                    </p>

                    <h2 class="mt-1 text-xl font-bold">
                        ${escapeHtml(subject.name)}
                    </h2>
                </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                ${cards.map(card => `
                    <button
                        type="button"
                        data-open-exam
                        id="${card.id}"
                        data-id="${escapeHtml(card.id)}"
                        data-title="${escapeHtml(card.title)}"
                        data-icon="${escapeHtml(card.icon)}"
                        class="group min-h-[145px] rounded-xl border border-slate-200
                               bg-slate-50 p-4 text-left transition
                               hover:-translate-y-0.5 hover:border-blue-300
                               hover:bg-blue-50 hover:shadow-md">

                        <span class="flex items-start justify-between">
                            <i class="bi ${card.bootstrapIcon} text-2xl"
                               style="color: ${color}"></i>

                            <i class="bi bi-arrow-up-right text-slate-400"></i>
                        </span>

                        <strong class="mt-5 block text-slate-900">
                            ${escapeHtml(card.name)}
                        </strong>

                        <span class="mt-1 block text-xs text-slate-500">
                            ${card.question_count} questions · 45 min
                        </span>
                    </button>
                `).join("")}
            </div>
        </section>
    `;
}

async function loadStudySubjects() {
    try {
        await getAllQuizzes();
        const response = await fetch("/api/subjects/");

        if (response.redirected) {
            window.location.href = response.url;
            return;
        }

        if (!response.ok) {
            throw new Error("Predmetov ni bilo mogoče pridobiti.");
        }

        const data = await response.json();

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

        studySubjectsList.innerHTML =
            data.subjects.map(createSubject).join("");

    } catch (error) {
        console.error(error);

        studySubjectsList.innerHTML = `
            <p class="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                Pri nalaganju predmetov je prišlo do napake.
            </p>
        `;
    }
}

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

async function showExam(card) {
    try {
        const quizId = card.dataset.id;
        const response = await fetch("/api/quiz/questions/" + quizId);
        if (response.redirected) {
            window.location.href = response.url;
            return;
        }

        if (!response.ok) {
            throw new Error("Predmetov ni bilo mogoče pridobiti.");
        }

        const data = await response.json();
        const main = document.getElementById("study-page");
        const quizQuestions = data.questions.questions;

        main.querySelectorAll("[data-question]").forEach(element => element.remove());
        main.insertAdjacentHTML("beforeend", quizQuestions.map((element, index) => {
            const questionId = `question-${index}`;
            return `
                <section class="mb-5 scroll-mt-[25px] rounded-[14px] border border-[#e2e8f1] bg-white p-[25px] max-[650px]:p-[18px]" data-question>
                    <div class="mb-[18px] flex items-center justify-between"><span class="rounded-lg bg-[#eaf4fd] px-3 py-[7px] text-xs font-bold text-[#1764a5]">Multiple Choice</span><span class="text-[13px] text-[#788396]">1 mark</span></div>
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
    } catch (error) {
        console.error(error);
    }

    studyOverview.classList.add("hidden");
    studyPage.classList.remove("hidden");

    // examTitle.textContent = card.dataset.title;
    // examTopics.textContent = card.dataset.topics;
    // examIcon.textContent = card.dataset.icon;

    startTimer();

    history.replaceState(null, "", "#exam");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showStudyOverview() {
    clearInterval(timerId);

    studyPage.classList.add("hidden");
    studyOverview.classList.remove("hidden");

    history.replaceState(null, "", "#study");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

studyOverview.addEventListener("click", event => {
    const card = event.target.closest("[data-open-exam]");
    console.log(card);

    if (card) {
        showExam(card);
    }
});

studyPage.addEventListener("input", updateProgress);

document.getElementById("back").addEventListener("click", event => {
    event.preventDefault();
    showStudyOverview();
});

// document.getElementById("previous").addEventListener("click", () => {
//     window.scrollTo({ top: 0, behavior: "smooth" });
// });

// document.getElementById("bookmark").addEventListener("click", function () {
//     const active = this.getAttribute("aria-pressed") !== "true";

//     this.setAttribute("aria-pressed", String(active));
//     this.textContent = active
//         ? "◆  Marked for later"
//         : "♧  Save for later";
// });

// document.getElementById("next").addEventListener("click", () => {
//     const answered = updateProgress();

//     notice.textContent = answered === questions.length
//         ? `All ${questions.length} questions answered.`
//         : `${answered} of ${questions.length} answered. Complete the remaining questions.`;
// });

loadStudySubjects();