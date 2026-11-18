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
function showSaveStatus(message = 'Saved', isError = false) {
    saveStatus.innerHTML = '<i class="bi ' + (isError ? 'bi-exclamation-triangle' : 'bi-cloud-check') + '"></i> ' + message;
    saveStatus.classList.toggle('text-emerald-600', !isError);
    saveStatus.classList.toggle('text-red-600', isError);
}

// Function to schedule saving the current note after a delay
function scheduleSave() {
    showSaveStatus('Saving …');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveCurrentNote, 30000);
}

// Function to render the list of notes in the sidebar
function renderNotesList() {
    // Clear the existing list and update the note count
    notesList.innerHTML = '';
    noteCount.textContent = notes.length;
    // Sort notes by updated_at in descending order and create buttons for each note
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
    // If the note is not found, return early
    if (!note) return;
    activeNote = note;
    noteTitle.value = note.title;
    noteEditor.innerHTML = note.content || '';
    $('#subjectSelect').val(note.subject_id);
    // Update the active note button in the sidebar
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
                showSaveStatus(response.error || 'Error occurred while loading notes.', true);
                return;
            }

            // Populate the notes array with the response data
            notes = Array.isArray(response.data) ? response.data : [];
            renderNotesList();
            if (notes[0]) loadNote(notes[0]);
            else showSaveStatus('Create new note', false);
        }
    });

    $.ajax({
        url: '/api/subjects/',
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.success === false) {
                showSaveStatus(response.error || 'Error occurred while loading subjects.', true);
                return;
            }

            // Populate the subjects array with the response data
            subjects = Array.isArray(response.subjects) ? response.subjects : [];
        }
    });
}

// Function to save the current note to the server
function saveCurrentNote() {
    if (!activeNote) return;
    clearTimeout(saveTimer);
    // Prepare the payload with the note title, content, and selected subject ID
    const payload = { title: noteTitle.value.trim() || 'Nov zapisek', content: noteEditor.innerHTML || '<p><br></p>', subject_id: $('#subjectSelect').val() };
    showSaveStatus('Saving …');
    return $.ajax({
        url: `${API_URL}/${activeNote.id}`,
        method: 'PATCH',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(payload),
        success: function (response) {
            if (!response.success) {
                showSaveStatus(response.error || 'Error occurred while saving the note.', true);
                return;
            }
            const saved = response.data;
            activeNote = saved;
            // Update the notes array with the saved note
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
// Event listeners for font name and size changes
document.getElementById('font-name').addEventListener('change', event => { noteEditor.focus(); document.execCommand('fontName', false, event.target.value); scheduleSave(); });
document.getElementById('font-size').addEventListener('change', event => { noteEditor.focus(); document.execCommand('fontSize', false, event.target.value); scheduleSave(); });

// Event listener for selecting a note from the sidebar
notesList.addEventListener('click', async event => {
    // If the clicked element is not a note button or if it's the currently active note, return early
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
        showSaveStatus('First, create a subject', true);
        return;
    }

    $.ajax({
        url: API_URL,
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({ subject_id: subject.id, title: 'New note', content: '<p><br></p>' }),
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

// Event listeners for photo input and quick photo button
document.getElementById('add-photo').addEventListener('click', () => photoInput.click());
document.getElementById('quick-photo').addEventListener('click', () => photoInput.click());
// Event listener for handling photo input changes and adding images to the note editor
photoInput.addEventListener('change', event => {
    // Loop through the selected files and read them as data URLs
    [...event.target.files].forEach(file => {
        const reader = new FileReader();
        // When the file is loaded, create an image element and append it to the note editor
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

// Event listeners for note editor and title input changes to schedule saving
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
            title: noteTitle.value.trim() || 'New note',
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
            showSaveStatus('Quiz generated successfully', false);
        }
    });
}