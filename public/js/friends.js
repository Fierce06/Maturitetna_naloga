function getAllFriends() {
    $.ajax({
        url: '/api/friends/all-friends',
        method: 'GET',

        success: function (response) {
            if (response.success == false) {
                showErrorModal(response.error || 'An unexpected error occurred while fetching exams for the current user.');
                return;
            }

            $('#friendCount').html(`${response.friends.length}`);

            const friendsList = $('#friendsList');  
            friendsList.empty();

            response.friends.forEach(friend => {
                const friendcard = `
                        <article class="rounded-2xl border border-slate-200 bg-white p-4">
                            <div class="flex items-center gap-3">
                                <img src="/api/profile-photo/image/${encodeURIComponent(friend.id)}" alt="${friend.username}'s profile photo" class="h-12 w-12 rounded-full object-cover" onerror="this.style.display='none'">
                                <div class="min-w-0">
                                    <h3 class="truncate font-semibold text-slate-900">${friend.username}</h3>
                                    <p class="text-sm text-emerald-600">Online</p>
                                </div>
                            </div>
                        </article>
                `;  
                friendsList.append(friendcard);
            });
        }
    });
}

function openAddFriendModal() {
    $('#addFriendModal').removeClass('hidden').addClass('flex');
    $('#friendUsername').trigger('focus');
}

function closeAddFriendModal() {
    $('#addFriendModal').removeClass('flex').addClass('hidden');
    $('#friendSearchResults').empty();
    $('#friendSearchMessage').addClass('hidden').text('');
}

function renderSearchResults(users) {
    const results = $('#friendSearchResults').empty();

    users.forEach(user => {
        const result = $('<div class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"></div>');
        const details = $('<div class="min-w-0"></div>');
        $('<p class="truncate font-semibold text-slate-900"></p>').text(`@${user.username}`).appendTo(details);
        $('<p class="text-xs text-slate-500"></p>').text(`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Student').appendTo(details);
        const addButton = $('<button type="button" class="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500">Add</button>');
        addButton.on('click', function () {
            $.ajax({
                url: `/api/friends/add-friend/${encodeURIComponent(user.id)}`,
                method: 'POST',
                success: function (response) {
                    if (!response.success) {
                        showErrorModal(response.error || 'Unable to add this friend.');
                        return;
                    }
                    closeAddFriendModal();
                    getAllFriends();
                }
            });
        });
        result.append(details, addButton);
        results.append(result);
    });
}

$(document).ready(function () {
    getAllFriends();

    $('#openAddFriendModal, #openAddFriendLink, #openAddFriendBottom').on('click', openAddFriendModal);
    $('#closeAddFriendModal').on('click', closeAddFriendModal);
    $('#addFriendModal').on('click', function (event) {
        if (event.target === this) closeAddFriendModal();
    });

    $('#friendSearchForm').on('submit', function (event) {
        event.preventDefault();
        const username = $('#friendUsername').val().trim();
        if (!username) return;

        $('#friendSearchMessage').removeClass('hidden').text('Searching...');
        $('#friendSearchResults').empty();

        $.ajax({
            url: `/api/friends/search?username=${encodeURIComponent(username)}`,
            method: 'GET',
            success: function (response) {
                if (!response.success || response.users.length === 0) {
                    $('#friendSearchMessage').text('No users found with that username.');
                    return;
                }
                $('#friendSearchMessage').addClass('hidden').text('');
                renderSearchResults(response.users);
            }
        });
    });

    $(document).on('keydown', function (event) {
        if (event.key === 'Escape') closeAddFriendModal();
    });
});