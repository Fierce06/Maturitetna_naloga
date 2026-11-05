// Prikaz uporabniškega imena in urejanje profilne fotografije.
document.addEventListener('DOMContentLoaded', function () {
    pripraviUporabniskiProfil();
});

function pripraviUporabniskiProfil() {
    const elementiImena = document.querySelectorAll('#user-name');
    const profilneSlike = Array.from(document.querySelectorAll('img[alt="Profile Picture"]'));

    // Če stran nima profila, ni treba izvajati preostale kode.
    if (elementiImena.length === 0 && profilneSlike.length === 0) {
        return;
    }

    // Skupna CSS datoteka poskrbi za enak prikaz na vseh straneh.
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/profile-avatar.css';
    document.head.appendChild(css);

    // Spremenljivke za trenutno stanje urejanja fotografije.
    const privzeteSlike = new Map();
    let prijavljen = false;
    let imaFotografijo = false;
    let izbranaSlika = null;
    let zacasniUrl = null;
    let povecava = 1;
    let premikX = 0;
    let premikY = 0;
    let prejsnjiFokus = null;
    let premikanjeSlike = false;
    let zadnjiX = 0;
    let zadnjiY = 0;
    let shranjevanje = false;
    let casovnikSporocila = null;

    // Sliko v navigaciji spremenimo v gumb za urejanje profila.
    profilneSlike.forEach(function (slika) {
        privzeteSlike.set(slika, slika.getAttribute('src'));
        slika.classList.add('sg-avatar-image');

        const gumb = document.createElement('button');
        gumb.type = 'button';
        gumb.className = 'sg-avatar-trigger';
        gumb.setAttribute('aria-label', 'Change profile photo');
        gumb.title = 'Change profile photo';

        slika.parentNode.insertBefore(gumb, slika);
        gumb.appendChild(slika);

        const kamera = document.createElement('span');
        kamera.className = 'sg-avatar-camera';
        kamera.setAttribute('aria-hidden', 'true');
        kamera.innerHTML = '<i class="bi bi-camera-fill"></i>';
        gumb.appendChild(kamera);

        gumb.addEventListener('click', odpriOkno);
    });

    // Modalno okno ustvarimo enkrat in ga uporabimo za vse profilne slike.
    const modal = document.createElement('div');
    modal.className = 'sg-photo-modal';
    modal.id = 'sg-photo-modal';
    modal.hidden = true;
    modal.innerHTML = `
        <div class="sg-photo-backdrop" data-photo-close="true"></div>
        <section class="sg-photo-dialog" role="dialog" aria-modal="true" aria-labelledby="sg-photo-title" tabindex="-1">
            <header class="sg-photo-header">
                <div>
                    <p class="sg-photo-eyebrow"><i class="bi bi-stars"></i> PERSONALIZE YOUR SPACE</p>
                    <h2 class="sg-photo-title" id="sg-photo-title">Your profile photo</h2>
                    <p class="sg-photo-subtitle">Make your StudyGraph account feel more like you. Your photo will appear across the app.</p>
                </div>
                <button class="sg-photo-close" type="button" data-photo-close="true" aria-label="Close dialog"><i class="bi bi-x-lg"></i></button>
            </header>
            <div class="sg-photo-content">
                <div class="sg-photo-preview-card">
                    <div class="sg-photo-stage-wrap">
                        <div class="sg-photo-stage" id="sg-photo-stage">
                            <img id="sg-photo-current" alt="Current profile photo">
                            <canvas id="sg-photo-canvas" width="512" height="512" class="sg-photo-hidden" aria-label="Photo crop preview"></canvas>
                        </div>
                    </div>
                    <p class="sg-photo-preview-label">Profile preview</p>
                    <p class="sg-photo-preview-help" id="sg-photo-preview-help">Your new photo will look like this in your sidebar.</p>
                </div>
                <div>
                    <div class="sg-photo-drop" id="sg-photo-drop">
                        <span class="sg-photo-upload-icon"><i class="bi bi-cloud-arrow-up"></i></span>
                        <strong>Choose a photo you love</strong>
                        <p>Drop an image here, or browse your files.<br>JPG, PNG, WebP · up to 5 MB</p>
                        <button class="sg-photo-select" type="button" id="sg-photo-choose"><i class="bi bi-image"></i> Choose photo</button>
                        <input id="sg-photo-file" type="file" accept="image/jpeg,image/png,image/webp" hidden>
                    </div>
                    <div class="sg-photo-zoom sg-photo-hidden" id="sg-photo-zoom-controls">
                        <label for="sg-photo-zoom">Adjust image <span>Drag to reposition</span></label>
                        <input id="sg-photo-zoom" type="range" min="1" max="2.5" step="0.05" value="1" aria-label="Zoom profile photo">
                    </div>
                    <p class="sg-photo-notice" id="sg-photo-notice" role="status" aria-live="polite">Your photo is only visible to your account in this app.</p>
                </div>
            </div>
            <footer class="sg-photo-footer">
                <button type="button" class="sg-photo-button sg-photo-remove" id="sg-photo-remove"><i class="bi bi-trash3"></i> Remove photo</button>
                <div class="sg-photo-footer-right">
                    <button type="button" class="sg-photo-button sg-photo-cancel" data-photo-close="true">Cancel</button>
                    <button type="button" class="sg-photo-button sg-photo-save" id="sg-photo-save" disabled><i class="bi bi-check2-circle"></i> Save photo</button>
                </div>
            </footer>
        </section>`;
    document.body.appendChild(modal);

    // Elemente modala poiščemo enkrat, da jih ne iščemo ob vsakem kliku.
    const okno = modal.querySelector('.sg-photo-dialog');
    const prostorZaSliko = modal.querySelector('#sg-photo-stage');
    const platno = modal.querySelector('#sg-photo-canvas');
    const trenutnaSlika = modal.querySelector('#sg-photo-current');
    const kontekst = platno.getContext('2d');
    const vnosDatoteke = modal.querySelector('#sg-photo-file');
    const gumbIzberi = modal.querySelector('#sg-photo-choose');
    const obmocjeNalaganja = modal.querySelector('#sg-photo-drop');
    const drsnik = modal.querySelector('#sg-photo-zoom');
    const nastavitvePovecave = modal.querySelector('#sg-photo-zoom-controls');
    const pomocPredogleda = modal.querySelector('#sg-photo-preview-help');
    const sporocilo = modal.querySelector('#sg-photo-notice');
    const gumbShrani = modal.querySelector('#sg-photo-save');
    const gumbOdstrani = modal.querySelector('#sg-photo-remove');

    // Kratko obvestilo po uspešnem shranjevanju ali odstranitvi.
    const obvestilo = document.createElement('div');
    obvestilo.className = 'sg-photo-toast';
    obvestilo.hidden = true;
    obvestilo.setAttribute('role', 'status');
    document.body.appendChild(obvestilo);

    // Izpis informacij oziroma napak znotraj modalnega okna.
    function prikaziSporocilo(besedilo, tip) {
        sporocilo.textContent = besedilo;
        sporocilo.className = 'sg-photo-notice' + (tip ? ` is-${tip}` : '');
    }

    function prikaziObvestilo(besedilo) {
        obvestilo.textContent = '✓ ' + besedilo;
        obvestilo.hidden = false;

        clearTimeout(casovnikSporocila);
        casovnikSporocila = setTimeout(function () {
            obvestilo.hidden = true;
        }, 3500);
    }

    // Prikaz fotografije v vseh navigacijah na strani.
    function posodobiProfilneSlike(url) {
        profilneSlike.forEach(function (slika) {
            slika.src = url || privzeteSlike.get(slika);
        });
    }

    // Odpremo modal in ponastavimo morebitno prejšnje urejanje.
    function odpriOkno() {
        prejsnjiFokus = document.activeElement;
        izbranaSlika = null;
        povecava = 1;
        premikX = 0;
        premikY = 0;
        drsnik.value = '1';
        vnosDatoteke.value = '';

        platno.classList.add('sg-photo-hidden');
        trenutnaSlika.classList.remove('sg-photo-hidden');
        trenutnaSlika.src = profilneSlike.length ? profilneSlike[0].src : '';
        nastavitvePovecave.classList.add('sg-photo-hidden');
        pomocPredogleda.textContent = 'Your new photo will look like this in your sidebar.';

        gumbShrani.disabled = true;
        gumbOdstrani.disabled = !imaFotografijo || !prijavljen;

        if (prijavljen) {
            prikaziSporocilo('Drag a new image here to get started.');
        } else {
            prikaziSporocilo('Log in to upload a profile photo.', 'error');
        }

        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        okno.focus();
    }

    function zapriOkno() {
        if (shranjevanje) {
            return;
        }

        modal.hidden = true;
        document.body.style.overflow = '';

        if (zacasniUrl) {
            URL.revokeObjectURL(zacasniUrl);
        }

        zacasniUrl = null;
        izbranaSlika = null;

        if (prejsnjiFokus && prejsnjiFokus.focus) {
            prejsnjiFokus.focus();
        }
    }

    // Omejimo premikanje tako, da izrez ne vsebuje praznega prostora.
    function omejiPremik() {
        if (!izbranaSlika) {
            return;
        }

        const velikostPredogleda = prostorZaSliko.getBoundingClientRect().width || 200;
        const osnovnoMerilo = Math.max(
            velikostPredogleda / izbranaSlika.naturalWidth,
            velikostPredogleda / izbranaSlika.naturalHeight
        );
        const merilo = osnovnoMerilo * povecava;
        const sirina = izbranaSlika.naturalWidth * merilo;
        const visina = izbranaSlika.naturalHeight * merilo;
        const maksimalniX = Math.max(0, (sirina - velikostPredogleda) / 2);
        const maksimalniY = Math.max(0, (visina - velikostPredogleda) / 2);

        premikX = Math.max(-maksimalniX, Math.min(maksimalniX, premikX));
        premikY = Math.max(-maksimalniY, Math.min(maksimalniY, premikY));
    }

    // Fotografijo narišemo na platno z izrezom velikosti 512 × 512.
    function narisiIzrez() {
        if (!izbranaSlika) {
            return;
        }

        omejiPremik();

        const velikost = platno.width;
        const velikostPredogleda = prostorZaSliko.getBoundingClientRect().width || 200;
        const osnovnoMerilo = Math.max(
            velikost / izbranaSlika.naturalWidth,
            velikost / izbranaSlika.naturalHeight
        );
        const merilo = osnovnoMerilo * povecava;
        const sirina = izbranaSlika.naturalWidth * merilo;
        const visina = izbranaSlika.naturalHeight * merilo;
        const x = (velikost - sirina) / 2 + premikX * velikost / velikostPredogleda;
        const y = (velikost - visina) / 2 + premikY * velikost / velikostPredogleda;

        kontekst.clearRect(0, 0, velikost, velikost);
        kontekst.drawImage(izbranaSlika, x, y, sirina, visina);
    }

    // Preverimo format, velikost in dimenzije datoteke.
    function naloziDatoteko(datoteka) {
        if (!prijavljen) {
            prikaziSporocilo('Log in to upload a profile photo.', 'error');
            return;
        }

        if (!datoteka) {
            return;
        }

        const dovoljeniTipi = ['image/jpeg', 'image/png', 'image/webp'];

        if (!dovoljeniTipi.includes(datoteka.type)) {
            prikaziSporocilo('Please choose a JPG, PNG or WebP image.', 'error');
            return;
        }

        if (datoteka.size > 5 * 1024 * 1024) {
            prikaziSporocilo('Photo must be smaller than 5 MB.', 'error');
            return;
        }

        if (zacasniUrl) {
            URL.revokeObjectURL(zacasniUrl);
        }

        zacasniUrl = URL.createObjectURL(datoteka);
        const slika = new Image();

        slika.onload = function () {
            if (slika.naturalWidth < 64 || slika.naturalHeight < 64) {
                prikaziSporocilo('Please select a photo that is at least 64 × 64 pixels.', 'error');
                return;
            }

            izbranaSlika = slika;
            povecava = 1;
            premikX = 0;
            premikY = 0;
            drsnik.value = '1';

            trenutnaSlika.classList.add('sg-photo-hidden');
            platno.classList.remove('sg-photo-hidden');
            nastavitvePovecave.classList.remove('sg-photo-hidden');
            pomocPredogleda.textContent = 'Drag to reposition and adjust the zoom before saving.';
            gumbShrani.disabled = false;

            narisiIzrez();
            prikaziSporocilo('Looks good! Adjust your crop and click Save photo.', 'success');
        };

        slika.onerror = function () {
            prikaziSporocilo('Could not read this image. Please choose another file.', 'error');
        };

        slika.src = zacasniUrl;
    }

    // Zaklep gumbov med pošiljanjem zahtevka, da ne nastanejo dvojni vnosi.
    function nastaviShranjevanje(vrednost) {
        shranjevanje = vrednost;
        gumbShrani.disabled = vrednost || !izbranaSlika;
        gumbOdstrani.disabled = vrednost || !imaFotografijo;
        gumbIzberi.disabled = vrednost;

        if (vrednost) {
            gumbShrani.innerHTML = '<i class="bi bi-arrow-repeat"></i> Saving...';
        } else {
            gumbShrani.innerHTML = '<i class="bi bi-check2-circle"></i> Save photo';
        }
    }

    // Pošiljanje obrezane fotografije na Node.js strežnik.
    async function shraniFotografijo() {
        if (!izbranaSlika || shranjevanje || !prijavljen) {
            return;
        }

        nastaviShranjevanje(true);
        prikaziSporocilo('Saving your new profile photo...');

        try {
            narisiIzrez();
            const imageData = platno.toDataURL('image/jpeg', 0.87);

            const odgovor = await fetch('/api/profile-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageData })
            });

            const podatki = await odgovor.json();

            if (!odgovor.ok || !podatki.success) {
                throw new Error(podatki.error || 'Could not save profile photo.');
            }

            imaFotografijo = true;
            posodobiProfilneSlike('/api/profile-photo/image?t=' + Date.now());
            nastaviShranjevanje(false);
            zapriOkno();
            prikaziObvestilo('Profile photo updated!');
        } catch (napaka) {
            prikaziSporocilo(napaka.message || 'An error occurred while saving.', 'error');
            nastaviShranjevanje(false);
        }
    }

    // Brisanje fotografije na strežniku in vrnitev na privzeto sliko.
    async function odstraniFotografijo() {
        if (!imaFotografijo || shranjevanje || !prijavljen) {
            return;
        }

        nastaviShranjevanje(true);

        try {
            const odgovor = await fetch('/api/profile-photo', {
                method: 'DELETE'
            });
            const podatki = await odgovor.json();

            if (!odgovor.ok || !podatki.success) {
                throw new Error(podatki.error || 'Could not remove photo.');
            }

            imaFotografijo = false;
            posodobiProfilneSlike(null);
            nastaviShranjevanje(false);
            zapriOkno();
            prikaziObvestilo('Profile photo removed.');
        } catch (napaka) {
            prikaziSporocilo(napaka.message || 'An error occurred while removing the photo.', 'error');
            nastaviShranjevanje(false);
        }
    }

    // Izbira datoteke, povleci in spusti ter povečava fotografije.
    gumbIzberi.addEventListener('click', function () {
        vnosDatoteke.click();
    });

    vnosDatoteke.addEventListener('change', function () {
        naloziDatoteko(vnosDatoteke.files[0]);
    });

    ['dragenter', 'dragover'].forEach(function (tipDogodka) {
        obmocjeNalaganja.addEventListener(tipDogodka, function (dogodek) {
            dogodek.preventDefault();
            obmocjeNalaganja.classList.add('is-dragging');
        });
    });

    ['dragleave', 'drop'].forEach(function (tipDogodka) {
        obmocjeNalaganja.addEventListener(tipDogodka, function (dogodek) {
            dogodek.preventDefault();
            obmocjeNalaganja.classList.remove('is-dragging');
        });
    });

    obmocjeNalaganja.addEventListener('drop', function (dogodek) {
        if (dogodek.dataTransfer && dogodek.dataTransfer.files.length) {
            naloziDatoteko(dogodek.dataTransfer.files[0]);
        }
    });

    drsnik.addEventListener('input', function () {
        povecava = Number(drsnik.value);
        narisiIzrez();
    });

    // Premikanje izreza deluje z miško in na zaslonu na dotik.
    platno.addEventListener('pointerdown', function (dogodek) {
        if (!izbranaSlika) {
            return;
        }

        premikanjeSlike = true;
        zadnjiX = dogodek.clientX;
        zadnjiY = dogodek.clientY;
        platno.setPointerCapture(dogodek.pointerId);
    });

    platno.addEventListener('pointermove', function (dogodek) {
        if (!premikanjeSlike || !izbranaSlika) {
            return;
        }

        premikX += dogodek.clientX - zadnjiX;
        premikY += dogodek.clientY - zadnjiY;
        zadnjiX = dogodek.clientX;
        zadnjiY = dogodek.clientY;
        narisiIzrez();
    });

    ['pointerup', 'pointercancel'].forEach(function (tipDogodka) {
        platno.addEventListener(tipDogodka, function () {
            premikanjeSlike = false;
        });
    });

    // Gumbi za shranjevanje, odstranjevanje in zapiranje modalnega okna.
    gumbShrani.addEventListener('click', shraniFotografijo);
    gumbOdstrani.addEventListener('click', odstraniFotografijo);

    modal.addEventListener('click', function (dogodek) {
        if (dogodek.target.closest('[data-photo-close="true"]')) {
            zapriOkno();
        }
    });

    // Modal zapremo z Escape; tipka Tab ostane znotraj okna.
    document.addEventListener('keydown', function (dogodek) {
        if (modal.hidden) {
            return;
        }

        if (dogodek.key === 'Escape') {
            dogodek.preventDefault();
            zapriOkno();
        }

        if (dogodek.key === 'Tab') {
            const kontrolniki = Array.from(okno.querySelectorAll(
                'button:not([disabled]),input:not([disabled]):not([hidden])'
            ));

            const vidniKontrolniki = kontrolniki.filter(function (element) {
                return element.offsetParent !== null;
            });

            if (vidniKontrolniki.length === 0) {
                return;
            }

            const prvi = vidniKontrolniki[0];
            const zadnji = vidniKontrolniki[vidniKontrolniki.length - 1];

            if (dogodek.shiftKey && document.activeElement === prvi) {
                dogodek.preventDefault();
                zadnji.focus();
            } else if (!dogodek.shiftKey && document.activeElement === zadnji) {
                dogodek.preventDefault();
                prvi.focus();
            }
        }
    });

    // Ko se stran naloži, preverimo prijavo, ime in obstoječo fotografijo.
    async function naloziProfil() {
        try {
            const odgovor = await fetch('/api/auth/me');

            if (!odgovor.ok) {
                return;
            }

            const podatki = await odgovor.json();
            prijavljen = true;
            const uporabniskoIme = podatki.username || 'User name';

            elementiImena.forEach(function (element) {
                element.textContent = uporabniskoIme;
            });

            const odgovorSlike = await fetch('/api/profile-photo/status');

            if (!odgovorSlike.ok) {
                return;
            }

            const podatkiSlike = await odgovorSlike.json();
            imaFotografijo = Boolean(podatkiSlike.hasPhoto);

            if (imaFotografijo) {
                posodobiProfilneSlike('/api/profile-photo/image');
            }
        } catch (napaka) {
            console.error('Could not load user profile.', napaka);
        }
    }

    naloziProfil();
}

// Obstoječa funkcija za odjavo ostane enaka kot v originalnem projektu.
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
