/////////////////////
// FRIEND MANAGEMENT
/////////////////////

// Function to fetch and display all friends of the current user
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

// Function to open the modal for adding a new friend
function openAddFriendModal() {
    $('#addFriendModal').removeClass('hidden').addClass('flex');
    $('#friendUsername').trigger('focus');
}

// Function to close the modal for adding a new friend
function closeAddFriendModal() {
    $('#addFriendModal').removeClass('flex').addClass('hidden');
    $('#friendSearchResults').empty();
    $('#friendSearchMessage').addClass('hidden').text('');
}

// Function to render the search results for friends
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

let friendToDelete = null;
// Function to open the modal for deleting a friend
function openDeleteFriendModal(friendId, friendName) {
    friendToDelete = friendId;

    $('#deleteFriendName').text(friendName);

    $('#deleteFriendModal')
        .removeClass('hidden')
        .addClass('flex');
}

// Function to close the modal for deleting a friend
function closeDeleteFriendModal() {
    $('#deleteFriendModal')
        .addClass('hidden')
        .removeClass('flex');

    friendToDelete = null;
}

// Event listeners for the delete friend modal buttons
$('#closeDeleteFriendModal, #cancelDeleteFriend').on('click', function () {
    closeDeleteFriendModal();
});

// Event listener for the confirm delete friend button
$('#confirmDeleteFriend').on('click', async function () {
    if (!friendToDelete) return;

    const friendId = friendToDelete;

    removeFriend(friendId);

    closeDeleteFriendModal();
});

// Function to remove a friend by sending a DELETE request to the server
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

// Function to fetch and update the online status of friends
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


/////////////////////
// QUIZ BATTLE MANAGEMENT
/////////////////////

// Function to fetch quizzes available for a friend to challenge
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

const quizBattleModal = document.getElementById("quizBattleModal");
const quizBattleFriendName = document.getElementById("quizBattleFriendName");
const quizBattleSelect = document.getElementById("quizBattleSelect");

const sendQuizBattle = document.getElementById("sendQuizBattle");

let selectedFriendId = null;

// Function to open the quiz battle modal for a specific friend
function openQuizBattleModal(friendId, friendUsername) {
    selectedFriendId = friendId;

    quizBattleFriendName.textContent = friendUsername;
    quizBattleSelect.value = "";

    sendQuizBattle.disabled = true;

    quizBattleModal.classList.remove("hidden");
    quizBattleModal.classList.add("flex");

    getQuizzesForFriend();
}

// Function to close the quiz battle modal
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

            setInterval(() => {
                $.ajax({
                    url: `/api/battles/battle/${encodeURIComponent(response.result.insertId)}`,
                    method: 'GET',
                    success: function (battleResponse) {
                        console.log('Battle response:', battleResponse);
                        if (!battleResponse.success) {
                            console.error('Error fetching battle details:', battleResponse.error);
                            return;
                        }
                        if (battleResponse.battleDetails.status === 'accepted') {
                            $('#battleRequestPendingModal').removeClass('flex').addClass('hidden');
                            window.location.href = `/study?battleId=${battleResponse.battleDetails.id}`;
                        }
                        if (battleResponse.battleDetails.status === 'declined') {
                            $('#battleRequestPendingModal').removeClass('flex').addClass('hidden');
                            showErrorModal('Your friend has declined the battle request.');
                        }
                    }
                });
            }, 3000);
        }
    });

    closeQuizBattleModal();

    $('#battleRequestPendingModal').removeClass('hidden').addClass('flex');
});

quizBattleModal.addEventListener("click", (event) => {
    if (event.target === quizBattleModal) {
        closeQuizBattleModal();
    }
});

setInterval(() => {
    checkForPendingBattleRequests();
}, 10000);

// Function to load the battle history of the current user
function loadBattleHistory() {
    $.ajax({
        url: '/api/battles/history',
        method: 'GET',
        success: function (response) {
            if (!response.success) {
                showErrorModal(response.error || 'Unable to load battle history.');
                return;
            }

            const history = response.history;
            let historyHtml = '';

            if (history.length === 0) {
                historyHtml = '<p class="text-slate-500">No battle history available.</p>';
            } else {
                history.forEach(function (battle) {
                    const challenger = Number(battle.challenger_score);
                    const opponent = Number(battle.opponent_score);
                    const userId = String(response.userId);

                    const isDraw = challenger === opponent;
                    const winnerId = challenger > opponent
                        ? String(battle.challenger_id)
                        : String(battle.opponent_id);

                    const won = !isDraw && winnerId === userId;

                    const color = isDraw ? 'amber' : won ? 'emerald' : 'red';
                    const result = isDraw ? 'Draw' : won ? 'You won!' : 'You lost!';
                    const icon = isDraw ? 'bi-flag' : won ? 'bi-trophy' : 'bi-x-circle';

                    historyHtml += `
                        <div class="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-3 justify-between">

                            <div class="flex items-center justify-center h-11 w-11 shrink-0 rounded-full bg-${color}-100 text-${color}-600">
                                <i class="bi ${icon} text-xl"></i>
                            </div>

                            <div class="flex-1 min-w-0">
                                <p class="font-semibold text-${color}-600">${result}</p>
                                <p class="font-medium text-slate-900">${battle.challenger_username} vs ${battle.opponent_username}</p>
                                <p class="text-sm text-slate-500">${battle.quiz_title}</p>
                                <p class="text-xs text-slate-400">${new Date(battle.created_at).toLocaleDateString('en-GB')}</p>
                            </div>

                            <div class="text-right shrink-0">
                                <p class="font-bold text-slate-900">${challenger * 10}%</p>
                                <p class="text-xs text-slate-400">vs</p>
                                <p class="font-bold text-slate-900">${opponent * 10}%</p>
                            </div>

                        </div>
                    `;
                });
            }

            $('#battleHistory').html(historyHtml);
        }
    });
}


/////////////////////
// BATTLE REQUEST MANAGEMENT
/////////////////////

// Function to check for incoming battle requests
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
                
                const challangerInfo = `
                                <div class="flex items-center gap-3 bg-slate-100 p-3 rounded-xl border border-slate-200">
                                    <img
                                        src="/api/profile-photo/image/${encodeURIComponent(battleRequest.opponent_id)}"
                                        alt="${battleRequest.opponent_username}'s profile photo"
                                        class="h-12 w-12 rounded-full object-cover"
                                        onerror="this.onerror=null; this.src='/assets/background.jpg';"
                                    />
                                    <div class="min-w-0">
                                        <h1 class="truncate font-semibold text-slate-900">${battleRequest.opponent_username}</h1>
                                        <p class="text-sm text-slate-500">has challenged you to a quiz battle: <strong>${battleRequest.quiz_title}</strong></p>
                                    </div>
                                </div>
                            `;

                $('#battleRequestFriendInfo').html(challangerInfo);

                $('#acceptBattleRequest').off('click').on('click', function () {
                    acceptBattleRequest(battleRequest.id);
                });

                $('#declineBattleRequest').off('click').on('click', function () {
                    declineBattleRequest(battleRequest.id);
                });
            }
        }
    });
}

// Function to accept a battle request
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

            window.location.href = `/study?battleId=${battleId}`;
        }
    });
}

// Function to decline a battle request
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


// When the document is ready, initialize the friends and battle history, and set up event listeners for modals and forms
$(document).ready(function () {
    getAllFriends();
    loadBattleHistory();

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