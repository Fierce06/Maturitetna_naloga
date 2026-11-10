(() => {
    const openButton =
        document.getElementById('openAddExamModal');

    const modal =
        document.getElementById('addExamModal');

    const closeButton =
        document.getElementById('closeAddExamModal');

    const cancelButton =
        document.getElementById('cancelAddExam');

    const form =
        document.getElementById('addExamForm');

    const titleInput =
        document.getElementById('practiceExamTitle');

    const notesList =
        document.getElementById('examNotesList');

    const errorMessage =
        document.getElementById('addExamError');

    const selectedCount =
        document.getElementById('selectedNotesCount');

    const submitButton =
        document.getElementById('createPracticeExam');

    const examsSection =
        document.getElementById(
            'customPracticeExamsSection'
        );

    const examsList =
        document.getElementById(
            'customPracticeExamsList'
        );

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function validColor(color) {
        return /^#[0-9a-fA-F]{6}$/.test(color)
            ? color
            : '#3b82f6';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.textContent = '';
        errorMessage.classList.add('hidden');
    }

    function updateSelectedCount() {
        const count = notesList.querySelectorAll(
            'input[name="note_ids"]:checked'
        ).length;

        selectedCount.textContent = `${count} selected`;
    }

    function closeModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        hideError();
    }

    async function openModal() {
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        form.reset();
        updateSelectedCount();
        hideError();

        titleInput.focus();

        await loadNotes();
    }

    async function loadNotes() {
        notesList.innerHTML = `
            <p class="rounded-xl bg-slate-50 p-5 text-center
                      text-sm text-slate-500">
                Loading notes...
            </p>
        `;

        try {
            const response = await fetch('/api/notebook/');

            if (!response.ok) {
                throw new Error(
                    'Notes could not be loaded.'
                );
            }

            const result = await response.json();
            const notes = result.data || [];

            if (notes.length === 0) {
                notesList.innerHTML = `
                    <div class="rounded-xl border border-dashed
                                border-slate-300 bg-slate-50 p-6
                                text-center">
                        <p class="font-medium text-slate-700">
                            You do not have any notes yet.
                        </p>

                        <a href="/notebook"
                           class="mt-2 inline-block text-sm
                                  font-semibold text-blue-600">
                            Create your first note
                        </a>
                    </div>
                `;

                return;
            }

            const subjects = new Map();

            notes.forEach(note => {
                const key = String(note.subject_id);

                if (!subjects.has(key)) {
                    subjects.set(key, {
                        name: note.subject_name || 'Other',
                        color: validColor(note.subject_color),
                        notes: []
                    });
                }

                subjects.get(key).notes.push(note);
            });

            notesList.innerHTML = [
                ...subjects.values()
            ].map(subject => `
                <section
                    class="overflow-hidden rounded-xl border
                           border-slate-200"
                >
                    <div
                        class="flex items-center gap-3 bg-slate-50
                               px-4 py-3"
                    >
                        <span
                            class="h-3 w-3 rounded-full"
                            style="background-color:
                                ${subject.color}"
                        ></span>

                        <h3
                            class="font-semibold text-slate-800"
                        >
                            ${escapeHtml(subject.name)}
                        </h3>

                        <span
                            class="ml-auto text-xs text-slate-500"
                        >
                            ${subject.notes.length}
                            ${subject.notes.length === 1
                                ? 'note'
                                : 'notes'}
                        </span>
                    </div>

                    <div class="divide-y divide-slate-100">
                        ${subject.notes.map(note => `
                            <label
                                class="flex cursor-pointer items-center
                                       gap-3 px-4 py-3 transition
                                       hover:bg-blue-50/60"
                            >
                                <input
                                    type="checkbox"
                                    name="note_ids"
                                    value="${Number(note.id)}"
                                    class="h-4 w-4 rounded border-slate-300
                                           text-blue-600 focus:ring-blue-500"
                                >

                                <span
                                    class="min-w-0 flex-1 truncate
                                           text-sm text-slate-700"
                                >
                                    ${escapeHtml(note.title)}
                                </span>
                            </label>
                        `).join('')}
                    </div>
                </section>
            `).join('');

            updateSelectedCount();
        } catch (error) {
            console.error(error);

            notesList.innerHTML = `
                <p class="rounded-xl bg-red-50 p-4
                          text-sm text-red-700">
                    Notes could not be loaded.
                </p>
            `;
        }
    }

    async function loadPracticeExams() {
        try {
            const response =
                await fetch('/api/practice-exams/');

            if (!response.ok) {
                throw new Error(
                    'Practice exams could not be loaded.'
                );
            }

            const result = await response.json();
            const exams = result.exams || [];

            if (exams.length === 0) {
                examsSection.classList.add('hidden');
                examsList.innerHTML = '';
                return;
            }

            examsSection.classList.remove('hidden');

            examsList.innerHTML = exams.map(exam => {
                const noteTitles = exam.note_titles
                    ? exam.note_titles.split('||')
                    : [];

                const subjects = exam.subject_names
                    ? exam.subject_names.split('||')
                    : [];

                const topics =
                    noteTitles.join(', ') ||
                    'Selected notes';

                return `
                    <button
                        type="button"
                        data-open-exam
                        data-title="${escapeHtml(exam.title)}"
                        data-topics="${escapeHtml(topics)}"
                        data-icon="✦"
                        class="group min-h-[135px] rounded-xl
                               border border-blue-100 bg-white p-4
                               text-left transition
                               hover:-translate-y-0.5
                               hover:border-blue-300
                               hover:shadow-md"
                    >
                        <span
                            class="flex items-start justify-between"
                        >
                            <span
                                class="grid h-10 w-10 place-items-center
                                       rounded-xl bg-blue-100
                                       text-lg text-blue-600"
                            >
                                <i class="bi bi-stars"></i>
                            </span>

                            <i
                                class="bi bi-arrow-up-right
                                       text-slate-400"
                            ></i>
                        </span>

                        <strong
                            class="mt-4 block text-slate-900"
                        >
                            ${escapeHtml(exam.title)}
                        </strong>

                        <span
                            class="mt-1 block truncate text-xs
                                   text-slate-500"
                        >
                            ${escapeHtml(subjects.join(', '))}
                        </span>

                        <span
                            class="mt-2 block text-xs font-medium
                                   text-blue-600"
                        >
                            ${Number(exam.note_count)} selected notes
                        </span>
                    </button>
                `;
            }).join('');
        } catch (error) {
            console.error(error);
        }
    }

    openButton.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);

    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', event => {
        if (
            event.key === 'Escape' &&
            !modal.classList.contains('hidden')
        ) {
            closeModal();
        }
    });

    notesList.addEventListener(
        'change',
        updateSelectedCount
    );

    form.addEventListener('submit', async event => {
        event.preventDefault();
        hideError();

        const title = titleInput.value.trim();

        const noteIds = [
            ...notesList.querySelectorAll(
                'input[name="note_ids"]:checked'
            )
        ].map(input => Number(input.value));

        if (!title) {
            showError('Enter an exam title.');
            titleInput.focus();
            return;
        }

        if (noteIds.length === 0) {
            showError('Select at least one note.');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Creating...';

        try {
            const response = await fetch(
                '/api/practice-exams/',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title,
                        note_ids: noteIds
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    'The exam could not be created.'
                );
            }

            closeModal();
            form.reset();

            await loadPracticeExams();
        } catch (error) {
            console.error(error);
            showError(error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Create exam';
        }
    });

    loadPracticeExams();
})();