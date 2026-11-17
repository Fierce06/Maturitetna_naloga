const noteEditor = document.getElementById('note-editor');
const noteTitle = document.getElementById('note-title');
const notesList = document.getElementById('notes-list');
const noteCount = document.getElementById('note-count');
const saveStatus = document.getElementById('save-status');
const photoInput = document.getElementById('photo-input');
const API_URL = '/api/notebook';
let notes = [];
let subjects = [];
let activeNote = null;
let saveTimer;

// Function to display save status messages
function showSaveStatus(message = 'Shranjeno', isError = false) {
    saveStatus.innerHTML = '<i class="bi ' + (isError ? 'bi-exclamation-triangle' : 'bi-cloud-check') + '"></i> ' + message;
    saveStatus.classList.toggle('text-emerald-600', !isError);
    saveStatus.classList.toggle('text-red-600', isError);
}

// Function to schedule saving the current note after a delay
function scheduleSave() {
    showSaveStatus('Shranjujem …');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveCurrentNote, 3000);
}

// Function to render the list of notes in the sidebar
function renderNotesList() {
    notesList.innerHTML = '';
    noteCount.textContent = notes.length;
    [...notes].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).forEach(note => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.noteId = note.id;
        button.className = 'rounded-xl border p-3 text-left transition ' + (Number(activeNote?.id) === Number(note.id) ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50');
        const title = document.createElement('strong');
        title.className = 'block truncate text-sm text-slate-900';
        title.textContent = note.title;
        const meta = document.createElement('span');
        meta.className = 'mt-1 block text-xs text-slate-500';
        meta.textContent = new Date(note.updated_at).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short' });
        button.append(title, meta);
        notesList.appendChild(button);
    });
}

// Function to fetch all subject IDs and populate the subject select dropdown
var subjectsList = [];
function allSubjectIds() {
    $.ajax({
        url: '/api/subjects/subjectIds',
        method: 'GET',
        dataType: 'json',

        success: function (response) {
            if (response.success == false) {
                showErrorModal(response.error || 'Error occurred while fetching subjects.');
                return;
            }

            $('#emptyState').hide();

            const selectSubjects = $('#subjectSelect');

            response.subjectIds.forEach(subject => {
                subjectsList.push(subject);
                const option = $(`<option value="${subject.id}">${subject.name}</option>`)
                selectSubjects.append(option);
            })
        }
    });
}

// Function to load a specific note into the editor
function loadNote(note) {
    if (!note) return;
    activeNote = note;
    noteTitle.value = note.title;
    noteEditor.innerHTML = note.content || '';
    $('#subjectSelect').val(note.subject_id);
    renderNotesList();
}

// Function to load the notebook data and subjects from the server
function loadNotebook() {
    $.ajax({
        url: API_URL,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.success === false) {
                showSaveStatus(response.error || 'Napaka pri nalaganju zapiskov.', true);
                return;
            }

            notes = Array.isArray(response.data) ? response.data : [];
            renderNotesList();
            if (notes[0]) loadNote(notes[0]);
            else showSaveStatus('Ustvari prvi zapisek', false);
        }
    });

    $.ajax({
        url: '/api/subjects/',
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.success === false) {
                showSaveStatus(response.error || 'Napaka pri nalaganju predmetov.', true);
                return;
            }

            subjects = Array.isArray(response.subjects) ? response.subjects : [];
        }
    });
}

// Function to save the current note to the server
function saveCurrentNote() {
    if (!activeNote) return;
    clearTimeout(saveTimer);
    const payload = { title: noteTitle.value.trim() || 'Nov zapisek', content: noteEditor.innerHTML || '<p><br></p>', subject_id: $('#subjectSelect').val() };
    showSaveStatus('Shranjujem …');
    return $.ajax({
        url: `${API_URL}/${activeNote.id}`,
        method: 'PATCH',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload),
        success: function (response) {
            if (!response.success) {
                showSaveStatus(response.error || 'Napaka pri shranjevanju zapiska.', true);
                return;
            }
            const saved = response.data;
            activeNote = saved;
            notes = notes.map(note => note.id === saved.id ? saved : note);
            noteTitle.value = saved.title;
            renderNotesList();
            showSaveStatus();
        }
    });
}

// Event listeners for toolbar buttons and inputs
document.querySelectorAll('[data-command]').forEach(button => button.addEventListener('mousedown', event => {
    event.preventDefault();
    noteEditor.focus();
    document.execCommand(button.dataset.command, false);
    scheduleSave();
}));
document.getElementById('font-name').addEventListener('change', event => { noteEditor.focus(); document.execCommand('fontName', false, event.target.value); scheduleSave(); });
document.getElementById('font-size').addEventListener('change', event => { noteEditor.focus(); document.execCommand('fontSize', false, event.target.value); scheduleSave(); });

// Event listener for selecting a note from the sidebar
notesList.addEventListener('click', async event => {
    const button = event.target.closest('[data-note-id]');
    const noteId = Number(button?.dataset.noteId);
    if (!button || noteId === Number(activeNote?.id)) return;
    const note = notes.find(note => Number(note.id) === noteId);
    if (!note) return;
    await saveCurrentNote();
    loadNote(note);
});

// Event listener for creating a new note
document.getElementById('new-note').addEventListener('click', async () => {
    await saveCurrentNote();
    const subject = subjects[0];
    if (!subject) {
        showSaveStatus('Najprej ustvari predmet', true);
        return;
    }

    $.ajax({
        url: API_URL,
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({ subject_id: subject.id, title: 'Nov zapisek', content: '<p><br></p>' }),
        success: function (response) {
            if (!response.success) {
                showSaveStatus(response.error || 'Error occurred while creating a new note.', true);
                return;
            }
            const note = response.data;
            notes.push(note);
            loadNote(note);
            noteTitle.select();
        }
    });
});

// Event listener for deleting the current note
document.getElementById('add-photo').addEventListener('click', () => photoInput.click());
document.getElementById('quick-photo').addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', event => {
    [...event.target.files].forEach(file => {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            const image = document.createElement('img');
            image.src = reader.result;
            image.alt = file.name;
            image.className = 'w-full rounded-xl object-contain';
            noteEditor.appendChild(image);
            scheduleSave();
        });
        reader.readAsDataURL(file);
    });
    event.target.value = '';
});

noteEditor.addEventListener('input', scheduleSave);
noteTitle.addEventListener('input', scheduleSave);
document.getElementById('save-note').addEventListener('click', saveCurrentNote);

loadNotebook();
allSubjectIds();

// Function to remove all HTML tags except <p> and <br>
function removeAllHTMLTagsExceptPAndBr(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const elements = tempDiv.querySelectorAll('*');
    elements.forEach(el => {
        if (el.tagName !== 'P' && el.tagName !== 'BR') {
            el.replaceWith(...el.childNodes);
        }
    });
    return tempDiv.innerHTML;
}

// Function to generate a quiz based on the current note
function generateQuiz() {
    const topic = removeAllHTMLTagsExceptPAndBr(noteEditor.innerHTML);
    const difficulty = 'medium';
    const questionCount = 10;

    $.ajax({
        url: '/api/quiz',
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            subject_id: $('#subjectSelect').val(),
            note_id: activeNote.id,
            title: noteTitle.value.trim() || 'Nov zapisek',
            topic: topic,
            difficulty: difficulty,
            number_of_questions: questionCount
        }),
        success: function (response) {
            if (!response.success) {
                showSaveStatus(response.error || 'Error occurred while generating the quiz.', true);
                return;
            }
            const newQuiz = response.newQuiz;
            console.log('Kviz uspešno ustvarjen:', newQuiz);
            showSaveStatus('Kviz uspešno ustvarjen', false);
        }
    });
}