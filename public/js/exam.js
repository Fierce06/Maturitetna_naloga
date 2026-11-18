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
                    <div class="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-slate-900">${exam.title}</h3>
                            <span class="text-sm text-slate-500">${new Date(exam.date).toLocaleDateString()}</span>
                        </div>
                        <p class="text-sm text-slate-500">Subject: ${subjectsList.find(s => s.id === exam.subject_id)?.name || 'Unknown'}</p>
                    </div>
                `);
                examsList.append(examElement);
            })

            $('#scheduledCount').html(`${response.exams.length}`);
            console.log(response);
            $("#nextExamText").html(response.exams.length > 0 ? `${new Date(response.exams[0].date).toLocaleDateString()}` : 'None');
        }
    });
}

$(document).ready(function () {
    allSubjectIds();  

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