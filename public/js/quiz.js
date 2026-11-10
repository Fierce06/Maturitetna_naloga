const notice = document.getElementById('notice');
const questions = [...document.querySelectorAll('[data-question]')];
function updateProgress() {
    const answered = questions.filter(q => q.querySelector('input[type="radio"]:checked') || [...q.querySelectorAll('input[type="number"], textarea')].some(el => el.value.trim() !== '')).length;
    document.getElementById('answered-count').textContent = answered + ' of 10 answered';
    document.getElementById('completion-percent').textContent = answered * 10 + '% complete';
    document.querySelector('progress').value = answered;
    return answered;
}
document.querySelector('main').addEventListener('input', updateProgress);
document.getElementById('bookmark').addEventListener('click', function () {
    const active = this.getAttribute('aria-pressed') !== 'true';
    this.setAttribute('aria-pressed', active);
    this.textContent = active ? '◆  Marked for later' : '♧  Save for later';
    notice.textContent = active ? 'Practice marked for later in this preview.' : 'Mark removed.';
});
document.getElementById('previous').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
document.getElementById('next').addEventListener('click', () => {
    const answered = updateProgress();
    notice.textContent = answered === 10 ? 'All 10 questions answered. This frontend preview does not grade or submit answers.' : answered + ' of 10 answered. Complete the remaining questions before finishing.';
});
document.getElementById('back').addEventListener('click', event => {
    event.preventDefault();
    notice.textContent = 'Connect this link to your Study page.';
    notice.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
const deadline = Date.now() + 45 * 60 * 1000;
const timer = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    document.getElementById('time').textContent = String(Math.floor(remaining / 60)).padStart(2, '0') + ':' + String(remaining % 60).padStart(2, '0');
    if (remaining === 0) { clearInterval(timer); notice.textContent = 'Time is up. This preview does not submit answers.'; }
}, 1000);