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

$(document).ready(function () {

    // Registracija uporabnika
    $('#register').on('submit', function (e) {
        // Preprečitev osvežitve strani
        e.preventDefault();

        const gesloPonovitev = $(this).find('[name=passwordConfirm]').val();
        const geslo = $(this).find('[name=password]').val();

        const podatki = {
            username: $(this).find('[name=username]').val(),
            email: $(this).find('[name=email]').val(),
            password: geslo,
            passwordConfirm: gesloPonovitev
        };

        $.ajax({
            // Kam se zahteva pošlje
            url: '/api/auth/register',
            // Tip zahteve
            method: 'POST',
            contentType: 'application/json', // Poveži strežniku format
            data: JSON.stringify(podatki), // Pretvori objekt v JSON


            success: function (odgovor) {
                if (!odgovor.success) {
                    $('#admin-error').text(`${odgovor.error}`);
                    // $('#admin-success').hide();
                    $('#admin-error').show();
                    return;
                }
                
                $('#admin-error').text('Uspešna registracija! Sedaj se lahko prijavite.');
                $('#admin-error').show();
            },
            error: function (xhr) {
                // Tukaj dobiš 409, 400, 500 status kode
                const msg = xhr.responseJSON?.error || `Napaka: ${xhr.status} ${xhr.statusText}`;
                $('#admin-error').text(`${msg}`);
                // $('.admin-success').hide();
                $('#admin-error').show();
            }
        });
    });

    // Login
    $('#login').on('submit', function (e) {
        // Preprečitev osvežitve strani
        e.preventDefault();

        const podatki = {
            username: $(this).find('[name=username]').val(),
            password: $(this).find('[name=password]').val()
        };

        $.ajax({
            // Kam se zahteva pošlje
            url: '/api/auth/login',
            // Tip zahteve
            method: 'POST',
            contentType: 'application/json', // Poveži strežniku format
            data: JSON.stringify(podatki), // Pretvori objekt v JSON


            success: function (odgovor) {
                if (!odgovor.success) {
                    $('#admin-error').text(`${odgovor.error}`);
                    // $('#admin-success').hide();
                    $('#admin-error').show();
                    return;
                }
                // $('#sporocilo').empty();
                // $('#forma-dodaj')[0].reset(); 

                $('#admin-error').text('Uspešna prijava!');
                $('#admin-error').show();

                window.location = '/';
            },
            error: function (xhr) {
                // Tukaj dobiš 409, 400, 500 status kode
                const msg = xhr.responseJSON?.error || `Napaka: ${xhr.status} ${xhr.statusText}`;
                $('#admin-error').text(`${msg}`);
                // $('#admin-success').hide();
                $('#admin-error').show();
            }
        });
    });
    // $('#forma-spremeni-geslo').on('submit', function (e) {
    //     e.preventDefault();

    //     const podatki = {
    //         staroGeslo: $(this).find('[name=staroGeslo]').val(),
    //         novoGeslo: $(this).find('[name=novoGeslo]').val(),
    //         confirmPassword: $(this).find('[name=gesloPonovitev]').val(),
    //     };

    //     $.ajax({
    //         // Kam se zahteva pošlje
    //         url: '/api/auth/changePassword',
    //         // Tip zahteve
    //         method: 'POST',
    //         contentType: 'application/json', // Poveži strežniku format
    //         data: JSON.stringify(podatki), // Pretvori objekt v JSON

    //         success: function (odgovor) {
    //             if (!odgovor.success) {
    //                 $('#sporocilo').html(`<div class="alert alert-danger">${odgovor.error}</div>`);
    //                 return;
    //             }
    //             $('#sporocilo').empty();
    //             // $('#forma-dodaj')[0].reset(); 

    //             $('#sporocilo').html(`<div class="alert alert-success">Uspešno spremenjeno!</div>`);
    //         },
    //         error: function (xhr) {
    //             // Tukaj dobiš 409, 400, 500 status kode
    //             const msg = xhr.responseJSON?.error || `Napaka: ${xhr.status} ${xhr.statusText}`;
    //             $('#sporocilo').html(`<div class="alert alert-danger">${msg}</div>`);
    //         }
    //     })
    // });
});