# Dokumentacija tehnološkega sklada

Ta dokument opisuje tehnologije, arhitekturo in razvojno okolje projekta **AI Study Notebook**. Ločuje že uporabljene dele od funkcionalnosti, ki so še v razvoju ali načrtovane.

## 1. Pregled arhitekture

Aplikacija uporablja trinivojsko arhitekturo:

```text
1. Predstavitveni nivo
   HTML + Tailwind CSS + JavaScript

2. Aplikacijski nivo
   Node.js + Express

3. Podatkovni nivo
   MariaDB/MySQL + InnoDB
```

Brskalnik ne dostopa neposredno do podatkovne baze. Frontend pošilja HTTP zahteve Express strežniku, ta preveri sejo uporabnika, izvede SQL poizvedbo in vrne odgovor v obliki JSON ali HTML.

## 2. Frontend

### HTML5

Vsak večji del aplikacije ima svojo HTML-stran, na primer:

- `index.html` – nadzorna plošča,
- `login.html` in `signup.html` – prijava in registracija,
- `subjects.html` – predmeti,
- `notebook.html` – digitalni zapiski,
- `study.html` – izbor vaj po predmetih,
- `exam.html` in `quiz.html` – preverjanje znanja,
- `calendar.html` – koledar.

Semantični elementi HTML izboljšajo preglednost kode, dostopnost in vzdrževanje strani.

### Tailwind CSS 4

Uporabniški vmesnik je oblikovan z utility razredi Tailwind CSS. V trenutni razvojni različici se Tailwind naloži prek CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
```

Prednosti pri tem projektu:

- hiter razvoj enotnega uporabniškega vmesnika,
- odzivna postavitev z razredi `sm:`, `md:`, `lg:` in `2xl:`,
- preprosto oblikovanje kartic, navigacije in obrazcev,
- manj potrebe po ločenih CSS pravilih.

CDN je primeren za razvoj in predstavitev. Za produkcijsko različico bi bilo bolje Tailwind vključiti v build proces, da se izdela manjša optimizirana CSS-datoteka.

### Bootstrap Icons

Ikone se nalagajo prek Bootstrap Icons CDN:

```html
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
```

Uporabljajo se v stranskem meniju, gumbih, karticah in orodni vrstici notebooka.

### Vanilla JavaScript

Projekt ne uporablja frontend ogrodja, kot sta React ali Vue. JavaScript neposredno upravlja DOM in uporabniške dogodke.

Glavne naloge frontend JavaScripta so:

- odziv na klike in vnos uporabnika,
- preklapljanje med pogledi,
- delo s koledarjem,
- izbiranje odgovorov pri vprašalnikih,
- pridobivanje podatkov prek Fetch API-ja,
- urejanje besedila v notebooku,
- risanje na Canvas element,
- izbira oziroma fotografiranje slik.

### Fetch API

Frontend komunicira z Express API-jem z vgrajenim Fetch API-jem:

```js
const response = await fetch('/api/subjects');
const data = await response.json();
```

Za pošiljanje JSON podatkov se uporablja:

```js
await fetch('/api/notes', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(note)
});
```

### Canvas API

Canvas omogoča risanje s pisalom, miško ali dotikom. Predstavitvena različica lahko risbo pretvori v PNG Base64:

```js
const drawingData = canvas.toDataURL('image/png');
```

Ta vrednost se lahko shrani v stolpec `notes.drawing_data`. Pri večjem številu risb je bolj smiselno shraniti datoteko ali JSON posameznih potez in v bazo zapisati samo pot do datoteke.

### File API in kamera

Za dodajanje fotografij se uporablja HTML datotečni vnos. Na telefonu ali tablici lahko atribut `capture` ponudi neposredno uporabo kamere:

```html
<input type="file" accept="image/*" capture="environment">
```

Datoteka se pozneje pošlje strežniku kot `multipart/form-data`. Metapodatki se lahko hranijo v tabeli `materials`, sama slika pa v namenski mapi ali zunanji shrambi.

## 3. Backend

### Node.js

Node.js izvaja strežniško JavaScript kodo. Projekt trenutno nima določene minimalne različice Node.js v `package.json`, zato je priporočena aktualna LTS različica.

Node.js skrbi za:

- zagon spletnega strežnika,
- obdelavo zahtev iz brskalnika,
- preverjanje prijavne seje,
- izvajanje poizvedb v bazi,
- vračanje HTML ali JSON odgovorov.

### Express 5

Express je glavno backend ogrodje. V projektu je nameščena različica `^5.3.0`.

Glavna datoteka `app.js`:

- ustvari Express aplikacijo,
- vključi middleware,
- nastavi uporabniške seje,
- objavi statične datoteke iz `public/`,
- definira zaščitene strani,
- priključi API routerje,
- zažene strežnik na izbranem portu.

Primer priklopa API-ja:

```js
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/exams', require('./routes/exams'));
```

Za notebook bo dodano:

```js
app.use('/api/notes', require('./routes/notes'));
```

### Modularne poti

Mapa `routes/` ločuje HTTP poti glede na funkcionalnost:

| Datoteka | Odgovornost |
| --- | --- |
| `auth.js` | registracija, prijava in odjava |
| `subjects.js` | branje in ustvarjanje predmetov |
| `exams.js` | delo z ocenjevanji |
| `notes.js` | načrtovano delo z zapiski |

Takšna razdelitev prepreči, da bi bila vsa logika zapisana v `app.js`.

### Modeli oziroma dostop do baze

Mapa `model/` vsebuje SQL poizvedbe in dostop do podatkov:

| Datoteka | Odgovornost |
| --- | --- |
| `db.js` | skupni MySQL connection pool |
| `dbUsers.js` | uporabniki in prijava |
| `dbSubjects.js` | predmeti |
| `dbExams.js` | ocenjevanja |
| `dbNotes.js` | načrtovani zapiski |

Router obravnava HTTP zahtevo, model pa izvede SQL poizvedbo. S tem sta spletna in podatkovna logika ločeni.

### mysql2/promise

Paket `mysql2` je nameščen v različici `^3.24.5`. Projekt uporablja Promise API:

```js
const mysql = require('mysql2/promise');
```

Povezave upravlja connection pool:

```js
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
```

Parametrizirane poizvedbe z znaki `?` zmanjšajo nevarnost SQL injection napadov:

```js
const [rows] = await pool.query(
    'SELECT * FROM subjects WHERE user_id = ?',
    [userId]
);
```

### express-session

Paket `express-session` je nameščen v različici `^1.19.0`. Po prijavi se v sejo shrani ID uporabnika:

```js
req.session.userId = user.id;
```

Middleware `requireAuth.js` preveri, ali seja vsebuje uporabnika:

```js
module.exports = function (req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    next();
};
```

Trenutne nastavitve piškotka vključujejo:

- `httpOnly: true`, zato JavaScript v brskalniku ne more prebrati sejne vrednosti,
- `sameSite: 'lax'`, kar pomaga omejiti nekatere CSRF napade,
- čas veljavnosti osem ur.

Privzeti pomnilniški session store je primeren samo za razvoj. Za produkcijo bi bilo treba seje shranjevati v trajno shrambo, na primer MySQL ali Redis.

### bcrypt

Paket `bcrypt` je nameščen v različici `^6.0.0`. Geslo se pred shranjevanjem pretvori v varno zgoščeno vrednost. V tabelo `users` se shrani `password_hash`, ne izvirno geslo.

Ob prijavi se geslo preveri z `bcrypt.compare`. Gesel se ne sme zapisovati v loge ali vračati frontendu.

### dotenv

Paket `dotenv` je nameščen v različici `^16.0.7`. Na začetku `app.js` se naloži z:

```js
require('dotenv').config();
```

Skrivnosti in nastavitve zato niso zapisane neposredno v kodi.

## 4. Podatkovna baza

### MariaDB/MySQL

Lokalno okolje uporablja MariaDB iz XAMPP-a. MariaDB je združljiva s poizvedbami in gonilnikom MySQL, zato aplikacija uporablja `mysql2`.

Podatkovna baza se imenuje:

```text
studygraph
```

Kodiranje:

```sql
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci
```

To omogoča pravilno shranjevanje črk `č`, `š`, `ž`, drugih jezikov in večine Unicode znakov.

### InnoDB

Tabele uporabljajo pogon InnoDB, ker podpira:

- tuje ključe,
- transakcije,
- `ON DELETE CASCADE`,
- `ON UPDATE CASCADE`,
- obnovitev po nepravilnem izklopu.

### Glavne tabele

| Tabela | Namen |
| --- | --- |
| `users` | uporabniški računi in zaščita prijave |
| `subjects` | predmeti uporabnika |
| `notes` | digitalni zapiski |
| `materials` | slike in druge datoteke |
| `note_connections` | povezave med dvema zapiskoma |
| `quizzes` | podatki o vprašalnikih |
| `quiz_questions` | vprašanja, odgovori in razlage |
| `quiz_attempts` | rezultati uporabnikov |
| `exams` | prihajajoča ocenjevanja |

### Notebook podatki

Tabela `notes` mora vsebovati najmanj:

```text
id
subject_id
title
content
drawing_data
created_at
updated_at
```

- `content` vsebuje HTML iz urejevalnika,
- `drawing_data` lahko začasno vsebuje PNG Base64,
- `subject_id` poveže zapisek s predmetom.

Če je tabela že ustvarjena, se stolpec za risbo doda z:

```sql
ALTER TABLE notes
ADD COLUMN drawing_data LONGTEXT NULL AFTER content;
```

## 5. Avtentikacija in pot zahteve

Primer branja predmetov:

```text
1. Prijavljeni uporabnik odpre stran Subjects.
2. Frontend pošlje GET /api/subjects.
3. requireAuth preveri req.session.userId.
4. Router prebere ID uporabnika iz seje.
5. dbSubjects izvede parametrizirano SQL poizvedbo.
6. Express vrne uporabnikove predmete kot JSON.
7. Frontend izriše kartice predmetov.
```

Pomembno je, da `user_id` ne pride iz skritega polja ali poljubnega frontend podatka. Strežnik ga mora vzeti iz preverjene seje.

## 6. API

Trenutne skupine poti:

| Osnovna pot | Namen |
| --- | --- |
| `/api/auth` | registracija, prijava in odjava |
| `/api/subjects` | predmeti uporabnika |
| `/api/exams` | šolska ocenjevanja |

Predvidene poti za notebook:

| Metoda in pot | Namen |
| --- | --- |
| `GET /api/notes` | seznam zapiskov prijavljenega uporabnika |
| `GET /api/notes/:id` | en zapisek |
| `POST /api/notes` | ustvarjanje zapiska |
| `PUT /api/notes/:id` | posodobitev zapiska |
| `DELETE /api/notes/:id` | brisanje zapiska |

Vsaka pot mora preveriti, ali zapisek oziroma njegov predmet pripada trenutno prijavljenemu uporabniku.

## 7. Okoljske spremenljivke

Datoteka `.env.example` naj vsebuje samo imena nastavitev in varne primerne vrednosti:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=studygraph
DB_USER=root
DB_PASSWORD=
SESSION_SECRET=zamenjaj_z_dolgim_nakljucnim_nizom
PORT=3100
```

Prava `.env` datoteka mora biti navedena v `.gitignore`.

Če se port MariaDB v XAMPP-u spremeni na `3307`, mora biti enaka sprememba tudi v `.env`:

```env
DB_PORT=3307
```

## 8. Lokalni razvoj

### Namestitev

```bash
npm install
```

### Ustvarjanje baze

1. Zaženi XAMPP kot skrbnik.
2. Zaženi modul MySQL.
3. Odpri phpMyAdmin.
4. Uvozi `database.sql`.
5. Preveri nastavitve v `.env`.

### Zagon strežnika

```bash
node app.js
```

Privzeti naslov:

```text
http://localhost:3100
```

## 9. Nameščeni npm paketi

Glede na trenutni `package.json`:

| Paket | Različica | Namen |
| --- | --- | --- |
| `bcrypt` | `^6.0.0` | zgoščevanje gesel |
| `dotenv` | `^16.0.7` | nalaganje `.env` nastavitev |
| `env` | `^0.0.2` | trenutno nameščena pomožna odvisnost |
| `express` | `^5.3.0` | HTTP strežnik in API |
| `express-session` | `^1.19.0` | prijavne seje |
| `mysql2` | `^3.24.5` | povezava z MariaDB/MySQL |

Če paket `env` ni nikjer uporabljen, se ga lahko pozneje odstrani po preverjanju kode. Za nalaganje `.env` že skrbi `dotenv`.

## 10. Varnostne smernice

- Gesla se shranjujejo samo kot bcrypt hash.
- SQL poizvedbe morajo biti parametrizirane.
- `SESSION_SECRET` mora biti dolg in naključen.
- `.env` se ne objavi v repozitoriju.
- Strežnik mora preveriti lastništvo vsakega predmeta, zapiska in izpita.
- HTML iz notebook urejevalnika je treba pred prikazom očistiti, če bo dovoljen vnos iz nezaupanja vrednih virov.
- Pri nalaganju datotek je treba omejiti velikost in dovoljene MIME tipe.
- Produkcijska različica mora uporabljati HTTPS in piškotek `secure: true`.
- Privzeti MemoryStore za seje se v produkciji zamenja s trajno shrambo.

## 11. Trenutne omejitve

- Notebook uporabniški vmesnik še ni v celoti povezan z bazo.
- Risbe v Base64 lahko zavzamejo veliko prostora.
- Fotografije še potrebujejo strežniški upload mehanizem.
- Tailwind CDN ni optimiziran za produkcijo.
- AI API še ni povezan.
- Avtomatski testi v `package.json` še niso nastavljeni.
- Različica Node.js še ni določena v polju `engines`.

## 12. Priporočeni naslednji koraki

1. Dodati `model/dbNotes.js`.
2. Dodati `routes/notes.js`.
3. Priključiti `/api/notes` v `app.js`.
4. Notebookov `localStorage` zamenjati z zahtevami Fetch API.
5. Dodati strežniško nalaganje fotografij.
6. Dodati validacijo vhodnih podatkov.
7. Dodati avtomatske teste za prijavo, predmete in zapiske.
8. Določiti podprto različico Node.js v `package.json`.
9. Pred objavo zamenjati razvojne seje in Tailwind CDN s produkcijsko konfiguracijo.

## 13. Načrtovana AI plast

AI še ni del trenutnega izvedenega sklada. Ko bo dodan, naj se API ključ nahaja samo v `.env` na strežniku.

Predviden proces:

```text
Frontend pošlje vprašanje in ID izbranega zapiska
                         ↓
Express preveri sejo in lastništvo zapiska
                         ↓
Strežnik pridobi dovoljeno vsebino iz MariaDB
                         ↓
Strežnik pokliče AI API
                         ↓
Uporabniku vrne razlago, povzetek ali vprašanja
```

S tem se prepreči razkritje API ključa v brskalniku in omeji dostop do zapiskov drugih uporabnikov.
