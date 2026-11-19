var subjectsList = [];

function allSubjectIds() {
    $.ajax({
        url: '/api/subjects/subjectIds',
        method: 'GET',

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

            allExam();
        }
    });
}

function openDeleteModal(examId, title) {
    $('#deleteExamId').val(examId);
    $('#deleteExamTitle').text(title);
    $('#deleteExamModal').removeClass('hidden').attr('aria-hidden', 'false');
}

function closeDeleteModal() {
    $('#deleteExamModal').addClass('hidden').attr('aria-hidden', 'true');
}

function deleteExam(examId) {
    $.ajax({
        url: `/api/exams/${examId}`,
        method: 'DELETE',
        success: function (response) {
            if (!response.success) {
                showErrorModal(response.error || 'Error occurred while deleting the exam.');
                return;
            }
            allExam();
            closeDeleteModal();
            window.location.reload();
        }
    });
}

function openEditModal(exam) {
    $('#editExamId').val(exam.id);
    $('#editExamTitle').val(exam.title);
    $('#editExamDate').val(exam.date.split('T')[0]);
    $('#editExamModal').removeClass('hidden').attr('aria-hidden', 'false');
    $('#editExamTitle').trigger('focus');
}

function closeEditModal() {
    $('#editExamModal').addClass('hidden').attr('aria-hidden', 'true');
}

function editExam(examId, newTitle, newDate) {
    $.ajax({
        url: `/api/exams/${examId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ title: newTitle, date: newDate }),
        success: function (response) {
            if (!response.success) {
                showErrorModal(response.error || 'Error occurred while editing the exam.');
                return;
            }
            
            allExam();
            closeEditModal();
            window.location.reload();
        }
    });
}

function allExam() {
    $.ajax({
        url: '/api/exams/',
        method: 'GET',

        success: function (response) {
            if (response.success == false) {
                showErrorModal(response.error || 'Error occurred while fetching exams.');
                return;
            }

            examsList = $('#upcomingContainer');
            examsList.empty();  

            response.exams.forEach(exam => {
                const examElement = $(`
                        <div class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">

                            <div class="flex items-start justify-between gap-4">

                                <!-- Exam Information -->
                                <div class="min-w-0 flex-1">
                                    <h3 class="truncate text-lg font-bold tracking-tight text-slate-800">
                                        ${exam.title}
                                    </h3>

                                    <p class="mt-2 flex items-center gap-2 text-sm text-slate-500">
                                        <i class="bi bi-book text-base text-slate-400"></i>
                                        ${subjectsList.find(s => s.id === exam.subject_id)?.name || 'Unknown'}
                                    </p>

                                    <p class="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                                        <i class="bi bi-calendar-event text-base text-blue-500"></i>
                                        ${new Date(exam.date).toLocaleDateString()}
                                    </p>
                                </div>

                                <!-- Actions -->
                                <div class="flex shrink-0  gap-2">

                                    <button
                                        type="button"
                                        class="edit-exam-button inline-flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-600 hover:text-white"
                                        data-exam='${JSON.stringify(exam).replace(/'/g, '&#39;')}'
                                    >
                                        <i class="bi bi-pencil-square"></i>
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        class="delete-exam-button inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white"
                                        data-exam-id="${exam.id}"
                                        data-exam-title="${exam.title}">
                                        <i class="bi bi-trash3"></i>
                                        Delete
                                    </button>

                                </div>
                            </div>
                        </div>
                `);
                examsList.append(examElement);
            })

            $('#scheduledCount').html(`${response.exams.length}`);
            $("#nextExamText").html(response.exams.length > 0 ? `${new Date(response.exams[0].date).toLocaleDateString()}` : 'None');
        }
    });
}

$(document).ready(function () {
    allSubjectIds();  

    $(document).on('click', '.edit-exam-button', function () {
        openEditModal(JSON.parse($(this).attr('data-exam').replace(/&#39;/g, "'")));
    });

    $(document).on('click', '.delete-exam-button', function () {
        openDeleteModal($(this).data('exam-id'), $(this).data('exam-title'));
    });

    $('#editExamForm').on('submit', function (e) {
        e.preventDefault();
        editExam(
            $('#editExamId').val(),
            $('#editExamTitle').val().trim(),
            $('#editExamDate').val()
        );
    });

    $('#confirmDeleteButton').on('click', function () {
        deleteExam($('#deleteExamId').val());
    });

    $('.close-exam-modal').on('click', function () {
        closeEditModal();
        closeDeleteModal();
    });

    $('#examForm').on('submit', function (e) {
        e.preventDefault();

        const podatki = {
            subject_id: $(this).find('[name=subjectSelect]').val(),
            title: $(this).find('[name=examTitle]').val(),
            date: $(this).find('[name=examDate]').val()
        };

        $.ajax({
            url: '/api/exams/',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(podatki),


            success: function (response) {
                if (!response.success) {
                    showErrorModal(response.error || 'Error occurred while creating the exam.');
                    return;
                }

                allExam();
            }
        });
    });
})