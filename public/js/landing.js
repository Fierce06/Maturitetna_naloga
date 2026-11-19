/*
    StudyGraph - javna predstavitvena stran.

    Ta datoteka upravlja samo mobilni meni in prikaz funkcij.
    Prijavo ter registracijo se vedno obdeluje obstojeci auth.js.
*/

document.addEventListener('DOMContentLoaded', function () {
    pripraviMobilniMeni();
    pripraviPrikazFunkcij();
});


// Odpiranje in zapiranje navigacije na telefonu.
function pripraviMobilniMeni() {
    const gumb = document.getElementById('mobileMenuButton');
    const meni = document.getElementById('mobileMenu');

    if (!gumb || !meni) {
        return;
    }

    function nastaviStanjeMenija(odprt) {
        meni.hidden = !odprt;
        gumb.setAttribute('aria-expanded', String(odprt));
        gumb.setAttribute('aria-label', odprt ? 'Close menu' : 'Open menu');
        gumb.querySelector('i').className = odprt ? 'bi bi-x-lg' : 'bi bi-list';
    }

    gumb.addEventListener('click', function () {
        nastaviStanjeMenija(meni.hidden);
    });

    meni.querySelectorAll('a').forEach(function (povezava) {
        povezava.addEventListener('click', function () {
            nastaviStanjeMenija(false);
        });
    });

    document.addEventListener('keydown', function (dogodek) {
        if (dogodek.key === 'Escape' && !meni.hidden) {
            nastaviStanjeMenija(false);
            gumb.focus();
        }
    });

    document.addEventListener('click', function (dogodek) {
        if (!meni.hidden && !meni.contains(dogodek.target) && !gumb.contains(dogodek.target)) {
            nastaviStanjeMenija(false);
        }
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 600) {
            nastaviStanjeMenija(false);
        }
    });
}


// Primeri vsebine treh obstojecih modulov.
function pridobiPrimerFunkcije(ime) {
    if (ime === 'knowledge') {
        return {
            naslov: 'Knowledge Graph',
            vsebina: `
                <div class="demo-knowledge">
                    <svg viewBox="0 0 520 290" role="img" aria-label="Example of connected notes about physics">
                        <line class="graph-line" x1="260" y1="139" x2="133" y2="66" />
                        <line class="graph-line" x1="260" y1="139" x2="390" y2="74" />
                        <line class="graph-line" x1="260" y1="139" x2="162" y2="218" />
                        <line class="graph-line" x1="260" y1="139" x2="371" y2="215" />
                        <circle class="graph-node primary" cx="260" cy="139" r="58" />
                        <circle class="graph-node" cx="133" cy="66" r="46" />
                        <circle class="graph-node" cx="390" cy="74" r="46" />
                        <circle class="graph-node" cx="162" cy="218" r="46" />
                        <circle class="graph-node" cx="371" cy="215" r="46" />
                        <text x="260" y="136"><tspan x="260">Newton's</tspan><tspan x="260" dy="17">Laws</tspan></text>
                        <text x="133" y="70">Motion</text>
                        <text x="390" y="78">Forces</text>
                        <text x="162" y="223">Mass</text>
                        <text x="371" y="220">Energy</text>
                    </svg>
                    <span class="graph-caption"><i class="bi bi-diagram-3" aria-hidden="true"></i> Ideas that connect</span>
                </div>
            `
        };
    }

    if (ime === 'exams') {
        return {
            naslov: 'Exam planning',
            vsebina: `
                <div class="demo-exams">
                    <div class="exam-highlight">
                        <div class="exam-day"><strong>24</strong><small>NOV</small></div>
                        <div class="exam-info"><strong>Physics test</strong><small>Stay ready for what's next</small></div>
                    </div>
                    <div class="exam-row"><span><i class="bi bi-book" aria-hidden="true"></i> Mathematics</span><small>Coming up</small></div>
                    <div class="exam-row"><span><i class="bi bi-journal-text" aria-hidden="true"></i> English</span><span class="exam-tag">Scheduled</span></div>
                </div>
            `
        };
    }

    return {
        naslov: 'Notebook',
        vsebina: `
            <div class="demo-notebook">
                <div class="demo-document-label"><i class="bi bi-file-earmark-text" aria-hidden="true"></i> Physics / My notes</div>
                <h3>Newton's Laws</h3>
                <p>An object stays in motion unless a force acts on it.</p>
                <div class="demo-writing-lines" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
                <div class="demo-note-tag"><i class="bi bi-check2-circle" aria-hidden="true"></i> Notes in one place</div>
            </div>
        `
    };
}


// Ob kliku na zavihek prikazemo vzorcni zaslon izbranega modula.
function pripraviPrikazFunkcij() {
    const zavihki = Array.from(document.querySelectorAll('.showcase-tab'));
    const okvir = document.getElementById('feature-panel');
    const naslov = document.getElementById('featureWindowTitle');
    const vsebina = document.getElementById('featureWindowContent');

    if (!zavihki.length || !okvir || !naslov || !vsebina) {
        return;
    }

    function prikaziFunkcijo(gumb) {
        const primer = pridobiPrimerFunkcije(gumb.dataset.feature);

        zavihki.forEach(function (zavihek) {
            const izbran = zavihek === gumb;
            zavihek.classList.toggle('is-selected', izbran);
            zavihek.setAttribute('aria-selected', String(izbran));
            zavihek.tabIndex = izbran ? 0 : -1;
        });

        naslov.textContent = primer.naslov;
        vsebina.innerHTML = primer.vsebina;
        okvir.setAttribute('aria-labelledby', gumb.id);
    }

    zavihki.forEach(function (gumb, indeks) {
        gumb.addEventListener('click', function () {
            prikaziFunkcijo(gumb);
        });

        // Tudi s tipkovnico lahko premikamo izbrane zavihke.
        gumb.addEventListener('keydown', function (dogodek) {
            let naslednjiIndeks = indeks;

            if (dogodek.key === 'ArrowRight') {
                naslednjiIndeks = (indeks + 1) % zavihki.length;
            } else if (dogodek.key === 'ArrowLeft') {
                naslednjiIndeks = (indeks + zavihki.length - 1) % zavihki.length;
            } else if (dogodek.key === 'Home') {
                naslednjiIndeks = 0;
            } else if (dogodek.key === 'End') {
                naslednjiIndeks = zavihki.length - 1;
            } else {
                return;
            }

            dogodek.preventDefault();
            prikaziFunkcijo(zavihki[naslednjiIndeks]);
            zavihki[naslednjiIndeks].focus();
        });
    });
}
