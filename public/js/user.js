document.addEventListener('DOMContentLoaded', async () => {
    const usernameElements = document.querySelectorAll('#user-name');

    if (usernameElements.length === 0) {
        return;
    }

    try {
        const response = await fetch('/api/auth/me');

        if (!response.ok) {
            return;
        }

        const data = await response.json();
        const username = data.username || 'User name';

        usernameElements.forEach(element => {
            element.textContent = username;
        });
    } catch (error) {
        console.error('Could not load the username.', error);
    }
});

function logout() {
    $.ajax({
        // Kam se zahteva pošlje
        url: '/api/auth/logout',
        // Tip zahteve
        method: 'POST',

        success: function (odgovor) {
            window.location = '/login';
        },
        error: function (xhr) {
            // Tukaj dobiš 409, 400, 500 status kode
            const msg = xhr.responseJSON?.error || `Napaka: ${xhr.status} ${xhr.statusText}`;
            $('#admin-error').text(`${msg}`);
            $('.admin-success').hide();
            $('#admin-error').show();
        }
    });
}