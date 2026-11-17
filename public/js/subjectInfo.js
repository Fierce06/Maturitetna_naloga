const params = new URLSearchParams(window.location.search);
const subjectId = params.get('id');

console.log(subjectId);

function fetchSubjectInfo() {
    $.ajax({
        url: `/api/subjects/${encodeURIComponent(subjectId)}`,
        method: 'GET',
        success: function (subject) {
            console.log(subject);
            $('#subject-name').text(subject.subject.name);
            $('#subject-description').text(subject.subject.description);
        }
    });
}

$(document).ready(function () {
    fetchSubjectInfo();
});
