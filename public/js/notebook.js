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

function showSaveStatus(message = 'Shranjeno', isError = false) {
    saveStatus.innerHTML = '<i class="bi ' + (isError ? 'bi-exclamation-triangle' : 'bi-cloud-check') + '"></i> ' + message;
    saveStatus.classList.toggle('text-emerald-600', !isError);
    saveStatus.classList.toggle('text-red-600', isError);
}

function scheduleSave() {
    showSaveStatus('Shranjujem …');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveCurrentNote, 500);
}

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

var subjectsList = [];
function allSubjectIds() {
    $.ajax({
        url: '/api/subjects/subjectIds',
        method: 'GET',

        success: function (odgovor) {
            if (odgovor.success == false) {
            }

            $('#emptyState').hide();

            const selectSubjects = $('#subjectSelect');

            odgovor.subjectIds.forEach(subject => {
                subjectsList.push(subject);
                const option = $(`<option value="${subject.id}">${subject.name}</option>`)
                selectSubjects.append(option);
            })
        },
        error: function (xhr) {
            const msg = xhr.responseJSON?.error || `Napaka: ${xhr.status} ${xhr.statusText}`;
            showSaveStatus(msg, true);
        }
    });
}

function loadNote(note) {
    if (!note) return;
    activeNote = note;
    noteTitle.value = note.title;
    noteEditor.innerHTML = note.content || '';
    $('#subjectSelect').val(note.subject_id);
    renderNotesList();
}

function request(url, options = {}) {
    const ajaxOptions = {
        url,
        method: options.method || 'GET',
        dataType: 'json'
    };

    if (options.body) {
        ajaxOptions.contentType = 'application/json';
        ajaxOptions.data = options.body;
    }

    return $.ajax(ajaxOptions).then(result => {
        return result.data ?? result.subjects ?? result.newSubject;
    }).catch(xhr => {
        const message = xhr.responseJSON?.error || `Napaka: ${xhr.status} ${xhr.statusText}`;
        throw new Error(message);
    });
}

async function loadNotebook() {
    try {
        const [serverNotes, serverSubjects] = await Promise.all([
            request(API_URL),
            request('/api/subjects/')
        ]);
        notes = Array.isArray(serverNotes) ? serverNotes : [];
        subjects = Array.isArray(serverSubjects) ? serverSubjects : [];
        renderNotesList();
        if (notes[0]) loadNote(notes[0]);
        else showSaveStatus('Ustvari prvi zapisek', false);
    } catch (error) {
        showSaveStatus(error.message, true);
    }
}

async function saveCurrentNote() {
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
    }).then(response => {
            const saved = response.data;
            activeNote = saved;
            notes = notes.map(note => note.id === saved.id ? saved : note);
            noteTitle.value = saved.title;
            renderNotesList();
            showSaveStatus();
            return saved;
        }, xhr => {
            const message = xhr.responseJSON?.error || `Napaka: ${xhr.status} ${xhr.statusText}`;
            showSaveStatus(message, true);
            return null;
    });
}

document.querySelectorAll('[data-command]').forEach(button => button.addEventListener('mousedown', event => {
    event.preventDefault();
    noteEditor.focus();
    document.execCommand(button.dataset.command, false);
    scheduleSave();
}));
document.getElementById('font-name').addEventListener('change', event => { noteEditor.focus(); document.execCommand('fontName', false, event.target.value); scheduleSave(); });
document.getElementById('font-size').addEventListener('change', event => { noteEditor.focus(); document.execCommand('fontSize', false, event.target.value); scheduleSave(); });

notesList.addEventListener('click', async event => {
    const button = event.target.closest('[data-note-id]');
    const noteId = Number(button?.dataset.noteId);
    if (!button || noteId === Number(activeNote?.id)) return;
    const note = notes.find(note => Number(note.id) === noteId);
    if (!note) return;
    await saveCurrentNote();
    loadNote(note);
});

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
            const note = response.data;
            notes.push(note);
            loadNote(note);
            noteTitle.select();
        },
        error: function (xhr) {
            const message = xhr.responseJSON?.error || `Napaka: ${xhr.status} ${xhr.statusText}`;
            showSaveStatus(message, true);
        }
    });
});

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