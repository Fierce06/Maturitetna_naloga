
/*
    StudyGraph - Mobilna navigacija

    Na telefonih prikazujemo:
    Home, Notebook, More in Profile.

    Na vecjih zaslonih ostane obstojeca
    navigacija nespremenjena.
*/

if (document.body) {
    pripraviMobilnoNavigacijo();
} else {
    document.addEventListener(
        'DOMContentLoaded',
        pripraviMobilnoNavigacijo
    );
}


// Ustvarimo spodnjo navigacijo.
function pripraviMobilnoNavigacijo() {

    const pot = window.location.pathname;

    const naZacetniStrani =
        pot === '/' ||
        pot === '/index.html';

    const naStraniZapiski =
        pot === '/notebook' ||
        pot === '/notebook.html';

    const naNastavitvah =
        pot === '/settings' ||
        pot === '/settings.html';

    const naDodatniStrani =
        !naZacetniStrani &&
        !naStraniZapiski &&
        !naNastavitvah;


    // Povezave v razsirjenem meniju.
    const povezave = [
        {
            naslov: 'My Subjects',
            opis: 'Your learning subjects',
            ikona: 'bi-book',
            pot: '/subjects',
            skupina: 'Learning'
        },
        {
            naslov: 'Knowledge',
            opis: 'Explore connected notes',
            ikona: 'bi-diagram-3',
            pot: '/knowledge',
            skupina: 'Learning'
        },
        {
            naslov: 'Study',
            opis: 'Your study sessions',
            ikona: 'bi-mortarboard',
            pot: '/study',
            skupina: 'Learning'
        },
        {
            naslov: 'Exams',
            opis: 'Plan your upcoming exams',
            ikona: 'bi-calendar2-check',
            pot: '/exam',
            skupina: 'Planning'
        },
        {
            naslov: 'Settings',
            opis: 'Manage your account',
            ikona: 'bi-gear',
            pot: '/settings',
            skupina: 'Account'
        }
    ];


    // Preverimo obstoj glavne postavitve.
    const glavniOkvir = document.body.querySelector(
        ':scope > div:first-of-type'
    );

    if (
        glavniOkvir &&
        glavniOkvir.querySelector(
            ':scope > aside:first-of-type'
        )
    ) {
        document.body.classList.add(
            'sg-mobile-layout'
        );
    }

    document.body.classList.add(
        'sg-mobile-nav-active'
    );


    // Spodnja navigacija.
    const spodnjaNavigacija = document.createElement('nav');

    spodnjaNavigacija.className = 'sg-mobile-bottom-nav';

    spodnjaNavigacija.setAttribute(
        'aria-label',
        'Mobile navigation'
    );

    spodnjaNavigacija.innerHTML = `
        <a href="/"
           class="sg-mobile-tab${naZacetniStrani ? ' is-active' : ''}"
           ${naZacetniStrani ? 'aria-current="page"' : ''}>

            <i class="bi bi-house-door${naZacetniStrani ? '-fill' : ''}"
               aria-hidden="true"></i>

            <span>Home</span>
        </a>

        <a href="/notebook"
           class="sg-mobile-tab${naStraniZapiski ? ' is-active' : ''}"
           ${naStraniZapiski ? 'aria-current="page"' : ''}>

            <i class="bi bi-journal-text"
               aria-hidden="true"></i>

            <span>Notebook</span>
        </a>

        <button type="button"
                class="sg-mobile-tab sg-mobile-more-button${naDodatniStrani ? ' is-active' : ''}"
                aria-expanded="false"
                aria-controls="sg-mobile-more-menu"
                aria-haspopup="dialog">

            <i class="bi bi-grid"
               aria-hidden="true"></i>

            <span>More</span>
        </button>

        <a href="/settings#profile-photo"
           class="sg-mobile-tab sg-mobile-profile-tab${naNastavitvah ? ' is-active' : ''}"
           aria-label="Open profile settings"
           ${naNastavitvah ? 'aria-current="page"' : ''}>

            <img
                src="https://avatars.githubusercontent.com/u/111075940?s=400"
                alt="Your profile"
                class="sg-mobile-profile-image"
                style="transform: translateY(-9px)"
            >

            <span class="sg-mobile-profile-label"
                  aria-hidden="true">
                Profile
            </span>
        </a>
    `;


    // Temno ozadje ob odprtem meniju.
    const ozadje = document.createElement('div');

    ozadje.className = 'sg-mobile-menu-backdrop';

    ozadje.setAttribute(
        'aria-hidden',
        'true'
    );


    // Razsirjeni meni.
    const meni = document.createElement('section');

    meni.className = 'sg-mobile-more-menu';
    meni.id = 'sg-mobile-more-menu';

    meni.setAttribute('role', 'dialog');
    meni.setAttribute('aria-modal', 'true');
    meni.setAttribute(
        'aria-label',
        'More StudyGraph pages'
    );
    meni.setAttribute('aria-hidden', 'true');
    meni.setAttribute('tabindex', '-1');

    meni.innerHTML = `
        <div class="sg-mobile-menu-grip"
             aria-hidden="true"></div>

        <header class="sg-mobile-menu-header">

            <p class="sg-mobile-menu-eyebrow">
                STUDYGRAPH
            </p>

            <button type="button"
                    class="sg-mobile-menu-close"
                    aria-label="Close menu">

                <i class="bi bi-x-lg"
                   aria-hidden="true"></i>
            </button>

        </header>

        <div class="sg-mobile-menu-content"></div>
    `;


    // Elemente dodamo na stran.
    document.body.appendChild(ozadje);
    document.body.appendChild(meni);
    document.body.appendChild(spodnjaNavigacija);


    // Na strani Settings dodamo mobilno kartico.
    if (naNastavitvah) {
        pripraviNastavitveProfilneSlike();
    }


    // Sinhroniziramo fotografijo v navigaciji.
    poveziMobilnoProfilnoSliko();


    // Gumb za odjavo.
    const odjava = document.createElement('button');

    odjava.type = 'button';
    odjava.className =
        'sg-mobile-menu-item sg-mobile-logout';

    odjava.innerHTML = `
        <span class="sg-mobile-menu-icon">
            <i class="bi bi-box-arrow-left"
               aria-hidden="true"></i>
        </span>

        <span class="sg-mobile-menu-item-text">
            <strong>Log out</strong>
            <small>Sign out of your account</small>
        </span>

        <i class="bi bi-chevron-right sg-mobile-menu-arrow"
           aria-hidden="true"></i>
    `;


    const vsebina = meni.querySelector(
        '.sg-mobile-menu-content'
    );

    const gumbVec = spodnjaNavigacija.querySelector(
        '.sg-mobile-more-button'
    );

    const gumbZapri = meni.querySelector(
        '.sg-mobile-menu-close'
    );


    const opozorilo = document.createElement('p');

    opozorilo.className = 'sg-mobile-menu-error';
    opozorilo.hidden = true;

    opozorilo.setAttribute(
        'role',
        'alert'
    );

    vsebina.appendChild(opozorilo);

    let prejsnjiFokus = null;


    // Povezave razdelimo po skupinah.
    ['Learning', 'Planning', 'Account'].forEach(
        function (skupina) {

            const odsek = document.createElement('div');
            odsek.className = 'sg-mobile-menu-group';

            const naslov = document.createElement('h3');
            naslov.textContent = skupina;

            odsek.appendChild(naslov);


            const mreza = document.createElement('div');
            mreza.className = 'sg-mobile-menu-grid';


            povezave.filter(function (povezava) {
                return povezava.skupina === skupina;
            }).forEach(function (povezava) {

                const aktivna =
                    pot === povezava.pot ||
                    pot === povezava.pot + '.html';

                const element = document.createElement('a');

                element.href = povezava.pot;

                element.className =
                    'sg-mobile-menu-item' +
                    (aktivna ? ' is-current' : '');

                if (aktivna) {
                    element.setAttribute(
                        'aria-current',
                        'page'
                    );
                }

                element.innerHTML = `
                    <span class="sg-mobile-menu-icon">
                        <i class="bi ${povezava.ikona}"
                           aria-hidden="true"></i>
                    </span>

                    <span class="sg-mobile-menu-item-text">
                        <strong>${povezava.naslov}</strong>
                        <small>${povezava.opis}</small>
                    </span>

                    <i class="bi bi-chevron-right sg-mobile-menu-arrow"
                       aria-hidden="true"></i>
                `;

                mreza.appendChild(element);
            });


            if (skupina === 'Account') {
                mreza.appendChild(odjava);
            }

            odsek.appendChild(mreza);
            vsebina.appendChild(odsek);
        }
    );


    // Odpremo razsirjeni meni.
    function odpriMeni() {

        prejsnjiFokus = document.activeElement;

        document.body.classList.add(
            'sg-mobile-menu-open'
        );

        meni.setAttribute('aria-hidden', 'false');

        gumbVec.setAttribute('aria-expanded', 'true');

        gumbZapri.focus();
    }


    // Zapremo razsirjeni meni.
    function zapriMeni() {

        if (!document.body.classList.contains(
            'sg-mobile-menu-open'
        )) {
            return;
        }

        document.body.classList.remove(
            'sg-mobile-menu-open'
        );

        meni.setAttribute('aria-hidden', 'true');

        gumbVec.setAttribute('aria-expanded', 'false');


        if (
            prejsnjiFokus &&
            prejsnjiFokus.focus
        ) {
            prejsnjiFokus.focus();
        }
    }


    // Odjava iz aplikacije.
    odjava.addEventListener('click', async function () {

        odjava.disabled = true;

        try {

            const odgovor = await fetch(
                '/api/auth/logout',
                { method: 'POST' }
            );

            if (!odgovor.ok) {
                throw new Error('Logout failed');
            }

            const podatki = await odgovor.json();

            if (!podatki.success) {
                throw new Error('Logout failed');
            }

            window.location.assign('/login');

        } catch (napaka) {

            console.error(
                'Could not log out.',
                napaka
            );

            opozorilo.textContent =
                'Could not log out. Please try again.';

            opozorilo.hidden = false;
            odjava.disabled = false;
        }
    });


    // Gumb More odpira in zapira meni.
    gumbVec.addEventListener('click', function () {

        if (document.body.classList.contains(
            'sg-mobile-menu-open'
        )) {
            zapriMeni();
        } else {
            odpriMeni();
        }
    });


    gumbZapri.addEventListener('click', zapriMeni);
    ozadje.addEventListener('click', zapriMeni);


    // Tipka Escape zapre meni.
    // Tipka Tab ostane znotraj menija.
    document.addEventListener('keydown', function (dogodek) {

        if (!document.body.classList.contains(
            'sg-mobile-menu-open'
        )) {
            return;
        }

        if (dogodek.key === 'Escape') {

            dogodek.preventDefault();
            zapriMeni();
            return;
        }

        if (dogodek.key !== 'Tab') {
            return;
        }


        const elementi = Array.from(
            meni.querySelectorAll(
                'a[href], button:not([disabled])'
            )
        );

        const prvi = elementi[0];
        const zadnji = elementi[elementi.length - 1];


        if (
            dogodek.shiftKey &&
            document.activeElement === prvi
        ) {
            dogodek.preventDefault();
            zadnji.focus();

        } else if (
            !dogodek.shiftKey &&
            document.activeElement === zadnji
        ) {
            dogodek.preventDefault();
            prvi.focus();
        }
    });


    // Ob prehodu na vecji zaslon zapremo meni.
    const mobilniZaslon = window.matchMedia(
        '(max-width: 767px)'
    );

    mobilniZaslon.addEventListener(
        'change',
        function (dogodek) {

            if (!dogodek.matches) {
                zapriMeni();
            }
        }
    );
}


// Ustvarimo mobilni razdelek za profil v Settings.
function pripraviNastavitveProfilneSlike() {

    const glavniDel = document.querySelector('main');

    if (
        !glavniDel ||
        document.getElementById('profile-photo')
    ) {
        return;
    }


    const razdelek = document.createElement('section');

    razdelek.id = 'profile-photo';

    razdelek.className =
        'mb-6 rounded-2xl border border-slate-200 ' +
        'bg-white/90 p-5 shadow-lg shadow-slate-200/50 md:hidden';

    razdelek.setAttribute(
        'aria-labelledby',
        'sg-settings-profile-title'
    );


    // Kartica je vidna samo na telefonu.
    const slog = document.createElement('style');

    slog.textContent = `
        #profile-photo {
            scroll-margin-top: 16px;
        }

        @media (min-width: 768px) {
            #profile-photo {
                display: none !important;
            }
        }
    `;

    document.head.appendChild(slog);


    // Videz kartice za profilno fotografijo.
    razdelek.innerHTML = `
        <div class="mb-5 flex items-center gap-3">

            <span class="flex h-12 w-12 shrink-0 items-center
                         justify-center rounded-2xl bg-blue-100
                         text-xl text-blue-600">

                <i class="bi bi-person-heart"
                   aria-hidden="true"></i>
            </span>

            <div>
                <p class="text-[11px] font-bold tracking-widest
                          text-blue-600">
                    YOUR SPACE
                </p>

                <h2 id="sg-settings-profile-title"
                    class="text-lg font-bold text-slate-900">
                    Your profile
                </h2>

                <p class="text-sm text-slate-500">
                    Make StudyGraph yours.
                </p>
            </div>
        </div>

        <div class="flex items-center gap-4 rounded-2xl
                    border border-blue-100 bg-gradient-to-br
                    from-blue-50 to-violet-50 p-4">

            <img
                id="sg-settings-photo-preview"
                src="https://avatars.githubusercontent.com/u/111075940?s=400"
                alt="Your current profile photo"
                class="h-20 w-20 shrink-0 rounded-full
                       border-4 border-white object-cover shadow-md"
            >

            <div class="min-w-0">

                <h3 class="font-semibold text-slate-900">
                    Profile photo
                </h3>

                <p class="mt-1 text-sm leading-5 text-slate-600">
                    Choose a photo, adjust the crop or remove it.
                </p>

            </div>
        </div>

        <button
            id="sg-settings-change-photo"
            type="button"
            class="mt-4 flex w-full items-center justify-center
                   gap-2 rounded-xl bg-blue-600 px-4 py-3
                   text-sm font-semibold text-white shadow-sm
                   transition hover:bg-blue-500
                   focus-visible:outline-2
                   focus-visible:outline-offset-2
                   focus-visible:outline-blue-600">

            <i class="bi bi-camera"
               aria-hidden="true"></i>

            Change profile photo

            <i class="bi bi-arrow-right"
               aria-hidden="true"></i>
        </button>

        <p class="mt-3 text-center text-xs text-slate-500">
            JPG, PNG or WebP · Maximum 5 MB
        </p>
    `;


    // Novo kartico dodamo pred ostale nastavitve.
    const obvestilo = glavniDel.querySelector('#notice');

    if (obvestilo) {
        obvestilo.insertAdjacentElement(
            'afterend',
            razdelek
        );
    } else {
        glavniDel.prepend(razdelek);
    }


    // Uporabimo obstojeci modal iz user.js.
    document.addEventListener(
        'DOMContentLoaded',
        function () {

            const gumb = document.getElementById(
                'sg-settings-change-photo'
            );

            const glavniProfil = document.querySelector(
                'aside .sg-avatar-trigger'
            );

            if (gumb && glavniProfil) {

                gumb.addEventListener('click', function () {
                    glavniProfil.click();
                });

            } else if (gumb) {

                gumb.disabled = true;
            }
        }
    );
}


// Posodobimo profilno fotografijo na telefonu.
function poveziMobilnoProfilnoSliko() {

    const slikaVMeniju = document.querySelector(
        '.sg-mobile-profile-image'
    );

    const slikaVNastavitvah = document.getElementById(
        'sg-settings-photo-preview'
    );

    const glavnaSlika = document.querySelector(
        'aside img[alt="Profile Picture"]'
    );


    // Posodobimo obe mobilni fotografiji.
    function posodobiSlike(naslovSlike) {

        if (!naslovSlike) {
            return;
        }

        if (slikaVMeniju) {
            slikaVMeniju.src = naslovSlike;
        }

        if (slikaVNastavitvah) {
            slikaVNastavitvah.src = naslovSlike;
        }
    }


    if (glavnaSlika) {

        posodobiSlike(glavnaSlika.src);


        // Ko user.js spremeni fotografijo,
        // posodobimo tudi mobilne prikaze.
        const opazovalec = new MutationObserver(
            function () {

                posodobiSlike(glavnaSlika.src);
            }
        );

        opazovalec.observe(glavnaSlika, {
            attributes: true,
            attributeFilter: ['src']
        });

        return;
    }


    // Samostojne strani lahko nimajo stranske navigacije.
    fetch('/api/profile-photo/status')

        .then(function (odgovor) {

            if (!odgovor.ok) {
                return null;
            }

            return odgovor.json();
        })

        .then(function (podatki) {

            if (
                podatki &&
                podatki.hasPhoto
            ) {
                posodobiSlike(
                    '/api/profile-photo/image'
                );
            }
        })

        .catch(function (napaka) {

            console.error(
                'Could not load mobile profile photo.',
                napaka
            );
        });
}
