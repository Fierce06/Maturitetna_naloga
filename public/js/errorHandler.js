// Error modal handling
const errorModal = document.getElementById('errorModal');
const errorModalMessage = document.getElementById('errorModalMessage');
const closeErrorModal = document.getElementById('closeErrorModal');
const errorModalOk = document.getElementById('errorModalOk');

function hideErrorModal() {
    errorModal.classList.add('hidden');
    errorModal.classList.remove('flex');
}

function showErrorModal(message) {
    errorModalMessage.textContent = message || 'An unexpected error occurred. Please try again.';
    errorModal.classList.remove('hidden');
    errorModal.classList.add('flex');
    errorModalOk.focus();
}

closeErrorModal.addEventListener('click', hideErrorModal);
errorModalOk.addEventListener('click', hideErrorModal);
errorModal.addEventListener('click', event => {
    if (event.target === errorModal) {
        hideErrorModal();
    }
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !errorModal.classList.contains('hidden')) {
        hideErrorModal();
    }
});

// Handle AJAX errors globally
$(document).ajaxError(function (_event, xhr) {
    const message = xhr.responseJSON?.error || `Napaka: ${xhr.status} ${xhr.statusText}`;
    showErrorModal(message);
});