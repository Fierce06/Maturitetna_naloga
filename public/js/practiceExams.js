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

        const difficulty = document.getElementById('difficultySelect').value;
        const questionCount = document.getElementById('numberOfQuestions').value;

        $.ajax({
            url: '/api/quiz/create',
            method: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                note_ids: noteIds,
                title: title,
                difficulty: difficulty,
                number_of_questions: questionCount
            }),
            success: function (response) {
                const newQuiz = response.newQuiz;
                console.log('Kviz uspešno ustvarjen:', newQuiz);
                closeModal();
            },
            error: function (xhr) {
                const message = xhr.responseJSON?.error || `Napaka: ${xhr.status} ${xhr.statusText}`;
                showError(message);
            },
            finally: function () {
                submitButton.disabled = false;
                submitButton.textContent = 'Create exam';
            }
        });
    });
})();