function getTokenUsage() {
    $.ajax({
        url: '/api/auth/tokens',
        method: 'GET',
        success: function(response) {
            if (!response.success) {
                showErrorModal(response.error || 'Error occurred while fetching token usage.');
                return;
            }

            $('#tokensUsed').text(response.tokenUse.tokens_used);
        }
    });
}

function getUsername() {
    $.ajax({
        url: '/api/auth/me',
        method: 'GET',
        success: function(response) {
            if (!response.success) {
                showErrorModal(response.error || 'Error occurred while fetching username.');
                return;
            }
            $('#username').val(response.username);
        }
    });
}

$(document).ready(function () {
    getTokenUsage();
    getUsername();

    $('#accountForm').on('submit', function (e) {
        e.preventDefault();
        const username = $('#username').val().trim();

        $.ajax({
            url: '/api/auth/update-username',
            method: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify({ username }),
            success: function (response) {
                if (!response.success) {
                    showErrorModal(response.error || 'Error occurred while updating username.');
                    return;
                }
                window.location.reload();
            }
        });
    });

    $('#passwordForm').on('submit', function (e) {
        e.preventDefault();
        const currentPassword = $('#currentPassword').val().trim();
        const newPassword = $('#newPassword').val().trim();
        const confirmPassword = $('#confirmPassword').val().trim();

        console.log('Current Password:', currentPassword);
        console.log('New Password:', newPassword);
        console.log('Confirm Password:', confirmPassword);

        $.ajax({
            url: '/api/auth/change-password',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
            success: function (response) {
                if (!response.success) {
                    showErrorModal(response.error || 'Error occurred while changing password.');
                    return;
                }
                $('#currentPassword').val('');
                $('#newPassword').val('');
                $('#confirmPassword').val('');
            }
        });
    });
});