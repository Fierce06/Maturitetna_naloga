function logout() {
    $.ajax({
        url: '/api/auth/logout',
        method: 'POST',

        success: function (response) {
            window.location = '/login';
        },
        error: function (xhr) {
            const msg = xhr.responseJSON?.error || `Error: ${xhr.status} ${xhr.statusText}`;
            $('#admin-error').text(`${msg}`);
            $('.admin-success').hide();
            $('#admin-error').show();
        }
    });
}

$(document).ready(function () {

    $('#register').on('submit', function (e) {
        e.preventDefault();

        const passwordConfirm = $(this).find('[name=passwordConfirm]').val();
        const password = $(this).find('[name=password]').val();

        const data = {
            username: $(this).find('[name=username]').val(),
            email: $(this).find('[name=email]').val(),
            password: password,
            passwordConfirm: passwordConfirm
        };

        $.ajax({
            url: '/api/auth/register',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),


            success: function (response) {
                if (!response.success) {
                    $('#admin-error').text(`${response.error}`);
                    $('#admin-success').hide();
                    $('#admin-error').show();
                    return;
                }
                
                $('#admin-success').text('Sucesful registration! You can now log in.');
                $('#admin-success').show();
            },
            error: function (xhr) {
                const msg = xhr.responseJSON?.error || `Error: ${xhr.status} ${xhr.statusText}`;
                $('#admin-error').text(`${msg}`);
                $('#admin-error').show();
            }
        });
    });

    $('#login').on('submit', function (e) {
        e.preventDefault();

        const data = {
            username: $(this).find('[name=username]').val(),
            password: $(this).find('[name=password]').val()
        };

        $.ajax({
            url: '/api/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),



            success: function (response) {
                if (!response.success) {
                    $('#admin-error').text(`${response.error}`);
                    $('#admin-success').hide();
                    $('#admin-error').show();
                    return;
                }

                $('#admin-success').text('Successful login! You are now logged in.');
                $('#admin-success').show();

                window.location = '/';
            },
            error: function (xhr) {
                const msg = xhr.responseJSON?.error || `Napaka: ${xhr.status} ${xhr.statusText}`;
                $('#admin-error').text(`${msg}`);
                $('#admin-success').hide();
                $('#admin-error').show();
            }
        });
    });
    // $('#forma-spremeni-password').on('submit', function (e) {
    //     e.preventDefault();

    //     const data = {
    //         staropassword: $(this).find('[name=staropassword]').val(),
    //         novopassword: $(this).find('[name=novopassword]').val(),
    //         confirmPassword: $(this).find('[name=passwordPonovitev]').val(),
    //     };

    //     $.ajax({
    //         // Kam se zahteva pošlje
    //         url: '/api/auth/changePassword',
    //         // Tip zahteve
    //         method: 'POST',
    //         contentType: 'application/json', // Poveži strežniku format
    //         data: JSON.stringify(data), // Pretvori objekt v JSON

    //         success: function (response) {
    //             if (!response.success) {
    //                 $('#sporocilo').html(`<div class="alert alert-danger">${response.error}</div>`);
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