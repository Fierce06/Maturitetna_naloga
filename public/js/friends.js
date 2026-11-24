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
                        <article data-user-id="${friend.id}" class="rounded-2xl border border-slate-200 bg-white p-4">
                            <div class="flex items-center gap-3 justify-between">
                                <div class="flex items-center gap-3">
                                    <img
                                        src="/api/profile-photo/image/${encodeURIComponent(friend.id)}"
                                        alt="${friend.username}'s profile photo"
                                        class="h-12 w-12 rounded-full object-cover"
                                        onerror="this.onerror=null; this.src='/assets/background.jpg';"
                                    />
                                    <div class="min-w-0">
                                        <h3 class="truncate font-semibold text-slate-900">${friend.username}</h3>
                                        <p class="text-sm text-slate-500" data-presence-status>Checking...</p>
                                    </div>
                                </div>

                                <div class="flex gap-3">
                                    <button id="quizBattleButton${friend.id}" type="button" class="shrink-0 rounded-lg bg-blue-600 px-3.5 py-3 text-xs font-semibold text-white hover:bg-blue-500 ml-2 disabled:cursor-not-allowed disabled:opacity-50" onclick="openQuizBattleModal(${friend.id}, '${friend.username}')"><i class="bi bi-joystick"></i></button>
                                    <button type="button" class="shrink-0 rounded-lg bg-red-600 px-3.5 py-3 text-xs font-semibold text-white hover:bg-red-500" onclick="openDeleteFriendModal(${friend.id}, '${friend.username}')"><i class="bi bi-person-x"></i></button>
                                </div>
                            </div>
                        </article>
                `;  
                friendsList.append(friendcard);
            });

            getOnlineUsers();
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

function getQuizzesForFriend() {
    $.ajax({
        url: '/api/quiz/',
        method: 'GET',
        success: function (response) {
            if (!response.success) {
                showErrorModal(response.error || 'An unexpected error occurred while fetching quizzes.');
                return;
            }

            const quizSelect = $('#quizBattleSelect').empty();
            quizSelect.append('<option value="">Select a quiz...</option>');

            console.log('Fetched quizzes:', response.quizzes);

            response.quizzes.forEach(quiz => {
                const createdAt = new Date(quiz.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });

                quizSelect.append(`
                    <option value="${quiz.id}">
                        ${quiz.title} — ${quiz.question_count} Questions — ${createdAt}
                    </option>
                `);
            });
        }
    });
}

let friendToDelete = null;

function openDeleteFriendModal(friendId, friendName) {
    friendToDelete = friendId;

    $('#deleteFriendName').text(friendName);

    $('#deleteFriendModal')
        .removeClass('hidden')
        .addClass('flex');
}

function closeDeleteFriendModal() {
    $('#deleteFriendModal')
        .addClass('hidden')
        .removeClass('flex');

    friendToDelete = null;
}

$('#closeDeleteFriendModal, #cancelDeleteFriend').on('click', function () {
    closeDeleteFriendModal();
});

$('#confirmDeleteFriend').on('click', async function () {
    if (!friendToDelete) return;

    const friendId = friendToDelete;

    removeFriend(friendId);

    closeDeleteFriendModal();
});

function removeFriend(friendId) {
    $.ajax({
        url: `/api/friends/remove-friend/${encodeURIComponent(friendId)}`,
        method: 'DELETE',
        success: function (response) {
            if (!response.success) {
                showErrorModal(response.error || 'Unable to remove this friend.');
                return;
            }
            getAllFriends();
        }
    });
}

function getOnlineUsers() {
    $.ajax({
        url: '/api/friends/presence',
        method: 'GET',
        success(response) {
            if (!response.success) return;

            const onlineIds = new Set(response.onlineIds.map(String));
            var onlineCount = 0;

            $('#friendsList article[data-user-id]').each(function () {
                const userId = String($(this).attr('data-user-id'));
                const isOnline = onlineIds.has(userId);
                const statusElement = $(this).find('[data-presence-status]');

                if (isOnline) {
                    onlineCount++;
                }

                $("#quizBattleButton" + userId).prop("disabled", !isOnline);

                statusElement
                    .text(isOnline ? 'Online' : 'Offline')
                    .toggleClass('text-emerald-600', isOnline)
                    .toggleClass('text-slate-500', !isOnline);
            });

            $('#onlineCount').text(onlineCount);
        }
    });
}

getOnlineUsers();
setInterval(getOnlineUsers, 30 * 1000);

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


const quizBattleModal = document.getElementById("quizBattleModal");
const quizBattleFriendName = document.getElementById("quizBattleFriendName");
const quizBattleSelect = document.getElementById("quizBattleSelect");

const sendQuizBattle = document.getElementById("sendQuizBattle");

let selectedFriendId = null;

function openQuizBattleModal(friendId, friendUsername) {
    selectedFriendId = friendId;

    quizBattleFriendName.textContent = friendUsername;
    quizBattleSelect.value = "";

    sendQuizBattle.disabled = true;

    quizBattleModal.classList.remove("hidden");
    quizBattleModal.classList.add("flex");

    getQuizzesForFriend();
}

function closeQuizBattleModal() {
    quizBattleModal.classList.add("hidden");
    quizBattleModal.classList.remove("flex");

    selectedFriendId = null;
}

quizBattleSelect.addEventListener("change", () => {
    sendQuizBattle.disabled = !quizBattleSelect.value;
});

document.getElementById("closeQuizBattleModal")
    .addEventListener("click", closeQuizBattleModal);

document.getElementById("cancelQuizBattle")
    .addEventListener("click", closeQuizBattleModal);

sendQuizBattle.addEventListener("click", async () => {
    const quizId = quizBattleSelect.value;

    if (!selectedFriendId || !quizId) return;

    // Send challenge to backend
    console.log({
        friendId: selectedFriendId,
        quizId: quizId
    });

    $.ajax({
        url: '/api/battles/request',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            receiver_id: selectedFriendId,
            quiz_id: quizId
        }),
        success: function (response) {
            if (!response.success) {
                showErrorModal(response.error || 'Unable to send quiz battle request.');
                return;
            }
        }
    });

    closeQuizBattleModal();
});

quizBattleModal.addEventListener("click", (event) => {
    if (event.target === quizBattleModal) {
        closeQuizBattleModal();
    }
});

setInterval(() => {
    checkForPendingBattleRequests();
}, 10000);

function checkForPendingBattleRequests() {
    $.ajax({
        url: '/api/battles/incoming',
        method: 'GET',
        success: function (response) {
            if (!response.success) {
                console.error('Error fetching pending battle requests:', response.error);
                return;
            }

            console.log('Pending battle requests:', response.incomingBattles);

            if (response.incomingBattles && response.incomingBattles.length > 0) {
                $('#battleRequestModal').removeClass('hidden').addClass('flex');
                const battleRequest = response.incomingBattles[0];
                $('#battleRequestFriendName').text(battleRequest.challenger_username);
            }
        }
    });
}

function acceptBattleRequest(battleId) {
    $.ajax({
        url: `/api/battles/${battleId}/accept`,
        method: 'POST',
        success: function (response) {
            if (!response.success) {
                showErrorModal(response.error || 'Unable to accept the battle request.');
                return;
            }

            $('#battleRequestModal').removeClass('flex').addClass('hidden');
        }
    });
}

function declineBattleRequest(battleId) {
    $.ajax({
        url: `/api/battles/${battleId}/decline`,
        method: 'POST',
        success: function (response) {
            if (!response.success) {
                showErrorModal(response.error || 'Unable to decline the battle request.');
                return;
            }
            
            $('#battleRequestModal').removeClass('flex').addClass('hidden');
        }
    });
}