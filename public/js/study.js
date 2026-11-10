const studyOverview = document.getElementById("study-overview");
const studyPage = document.getElementById("study-page");
const studySubjectsList = document.getElementById("studySubjectsList");

const examTitle = document.getElementById("exam-title");
const examTopics = document.getElementById("exam-topics");
const examIcon = document.getElementById("exam-icon");
const notice = document.getElementById("notice");

const questions = [
    ...document.querySelectorAll("#study-page [data-question]")
];

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

function practiceCards(subject) {
    const name = subject.name.toLowerCase();

    if (name.includes("matem")) {
        return [
            {
                name: "Polinomi",
                title: "Polinomi – Practice Exam",
                topics: "Polinomi, ničle in Hornerjev postopek",
                icon: "Σ",
                bootstrapIcon: "bi-bezier2"
            },
            {
                name: "Trigonometrija",
                title: "Trigonometrija – Practice Exam",
                topics: "Koti, identitete in kotne funkcije",
                icon: "∠",
                bootstrapIcon: "bi-triangle"
            },
            {
                name: "Analitična geometrija",
                title: "Analitična geometrija – Practice Exam",
                topics: "Premice, razdalje, razpolovišča in koti",
                icon: "⌁",
                bootstrapIcon: "bi-graph-up"
            }
        ];
    }

    if (name.includes("sloven")) {
        return [
            {
                name: "Književnost",
                title: "Književnost – Practice Exam",
                topics: "Književna dela, avtorji in interpretacija",
                icon: "Aa",
                bootstrapIcon: "bi-book-half"
            },
            {
                name: "Slovnica",
                title: "Slovnica – Practice Exam",
                topics: "Besedne vrste, skladnja in slovnica",
                icon: "Č",
                bootstrapIcon: "bi-spellcheck"
            },
            {
                name: "Priprava na esej",
                title: "Priprava na esej",
                topics: "Zgradba, argumentacija in primerjava del",
                icon: "✎",
                bootstrapIcon: "bi-pencil-square"
            }
        ];
    }

    if (name.includes("fiz")) {
        return [
            {
                name: "Mehanika",
                title: "Mehanika – Practice Exam",
                topics: "Gibanje, pospešek in gibalna količina",
                icon: "⚛",
                bootstrapIcon: "bi-speedometer2"
            },
            {
                name: "Sile in gibanje",
                title: "Sile in gibanje – Practice Exam",
                topics: "Newtonovi zakoni, sile in pospešek",
                icon: "F",
                bootstrapIcon: "bi-arrows-move"
            },
            {
                name: "Energija in moč",
                title: "Energija in moč – Practice Exam",
                topics: "Delo, energija in moč",
                icon: "E",
                bootstrapIcon: "bi-battery-charging"
            }
        ];
    }

    return [
        {
            name: "Hitro preverjanje",
            title: `${subject.name} – hitro preverjanje`,
            topics: subject.description || subject.name,
            icon: "?",
            bootstrapIcon: "bi-question-circle"
        },
        {
            name: "Ključni pojmi",
            title: `${subject.name} – ključni pojmi`,
            topics: subject.description || subject.name,
            icon: "A",
            bootstrapIcon: "bi-journal-text"
        },
        {
            name: "Mešane naloge",
            title: `${subject.name} – mešane naloge`,
            topics: subject.description || subject.name,
            icon: "✓",
            bootstrapIcon: "bi-check2-square"
        }
    ];
}

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
                        data-title="${escapeHtml(card.title)}"
                        data-topics="${escapeHtml(card.topics)}"
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
                            10 questions · 45 min
                        </span>
                    </button>
                `).join("")}
            </div>
        </section>
    `;
}

async function loadStudySubjects() {
    try {
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

    document.getElementById("answered-count").textContent =
        `${answered} of 10 answered`;

    document.getElementById("completion-percent").textContent =
        `${answered * 10}% complete`;

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

function showExam(card) {
    studyOverview.classList.add("hidden");
    studyPage.classList.remove("hidden");

    examTitle.textContent = card.dataset.title;
    examTopics.textContent = card.dataset.topics;
    examIcon.textContent = card.dataset.icon;

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

    if (card) {
        showExam(card);
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

document.getElementById("bookmark").addEventListener("click", function () {
    const active = this.getAttribute("aria-pressed") !== "true";

    this.setAttribute("aria-pressed", String(active));
    this.textContent = active
        ? "◆  Marked for later"
        : "♧  Save for later";
});

document.getElementById("next").addEventListener("click", () => {
    const answered = updateProgress();

    notice.textContent = answered === 10
        ? "All 10 questions answered."
        : `${answered} of 10 answered. Complete the remaining questions.`;
});

loadStudySubjects();