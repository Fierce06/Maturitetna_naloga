### Maturitetna naloga


# AI Study Notebook

AI Study Notebook je spletna aplikacija za organizacijo šolskih zapiskov, učenje in pripravo na ocenjevanja s pomočjo umetne inteligence.

Glavni cilj projekta je na enem mestu združiti:

* šolske zapiske,
* AI pomočnika,
* preverjanje znanja,
* pripravo na teste in maturo,
* koledar,
* opomnike,
* spremljanje napredka.

Aplikacija je namenjena predvsem dijakom, ki želijo svoje šolsko gradivo organizirati na pregleden način in ga hkrati uporabiti za učinkovitejše učenje.

---

## Namen projekta

Pri učenju dijaki uporabljajo veliko različnih virov in aplikacij:

* zapiske,
* PDF datoteke,
* predstavitve,
* dokumente,
* spletne učilnice,
* koledarje,
* aplikacije za zapiske,
* AI orodja.

Namen projekta **AI Study Notebook** je čim več teh funkcij združiti v eno aplikacijo.

Uporabnik lahko svoje zapiske razvrsti po predmetih in temah, nato pa lahko umetna inteligenca te zapiske uporabi kot vir za:

* razlago snovi,
* ustvarjanje povzetkov,
* odgovarjanje na vprašanja,
* preverjanje znanja,
* ustvarjanje vprašalnikov,
* ustvarjanje testov,
* pripravo na maturo.

---

# Glavne funkcionalnosti

## Digitalni zapiski

Uporabnik lahko ustvarja in ureja zapiske ter jih organizira glede na:

* predmet,
* temo,
* poglavje,
* datum,
* šolsko leto.

Primer organizacije:

```text
Matematika
│
├── Polinomi
├── Trigonometrija
├── Statistika
└── Analitična geometrija
```

Na ta način ima uporabnik vse gradivo posameznega predmeta shranjeno na enem mestu.

---

## AI pomočnik

Vsak predmet oziroma zapisek ima dostop do AI pomočnika.

AI lahko uporablja uporabnikove zapiske kot kontekst in na njihovi podlagi:

* razloži določeno snov,
* poenostavi težje pojme,
* odgovarja na vprašanja,
* ustvari primere,
* izdela povzetek,
* izpostavi najpomembnejše informacije,
* razloži snov korak za korakom.

Primer vprašanja:

> Razloži mi polinome na podlagi mojih zapiskov.

AI nato analizira ustrezne zapiske in pripravi razlago.

---

## Preverjanje znanja

Aplikacija lahko na podlagi izbranih zapiskov samodejno ustvarja vprašanja.

Možni tipi vprašanj:

* vprašanja z več možnimi odgovori,
* drži / ne drži,
* kratki odgovori,
* odprta vprašanja,
* dopolnjevanje,
* povezovanje pojmov.

Primer:

```text
Predmet: Biologija
Tema: Celica
Število vprašanj: 20
Težavnost: Srednja
```

AI nato ustvari vprašalnik samo iz izbrane snovi.

Po končanem vprašalniku lahko uporabnik vidi:

* rezultat,
* pravilne odgovore,
* napačne odgovore,
* razlago napak,
* teme, ki jih mora še ponoviti.

---

## Simulacija testa oziroma izpita

Poleg krajših vprašalnikov lahko aplikacija ustvari tudi daljši test.

Uporabnik lahko določi:

* predmet,
* teme,
* zahtevnost,
* število vprašanj,
* čas reševanja,
* tip vprašanj.

Primer:

```text
Matematika

Teme:
- Polinomi
- Trigonometrija
- Analitična geometrija

Čas: 45 minut
Število nalog: 15
```

Po končanem testu aplikacija prikaže rezultat in analizo znanja.

---

## Priprava na maturo

Poseben del aplikacije je namenjen pripravi na maturo.

Uporabnik lahko izbere predmet in snov, iz katere želi vaditi.

AI lahko nato:

* pripravi vprašanja,
* sestavi simulacijo maturitetnega izpita,
* predlaga snov za ponavljanje,
* spremlja napredek,
* analizira šibka področja.

Na podlagi preteklih rezultatov lahko aplikacija na primer predlaga:

> Pri trigonometriji imaš trenutno največ napačnih odgovorov. Priporočeno je dodatno ponavljanje te teme.

---

# Spremljanje napredka

Aplikacija shranjuje rezultate vprašalnikov in testov.

Uporabnik lahko spremlja:

* povprečen rezultat,
* rezultate posameznih predmetov,
* napredek skozi čas,
* število rešenih vprašanj,
* najmočnejše teme,
* najšibkejše teme.

Primer:

```text
Matematika       82 %
Slovenščina      76 %
Angleščina       91 %
Fizika           68 %
```

Na podlagi teh podatkov lahko AI uporabniku pomaga določiti, katero snov mora še ponoviti.

---

# Koledar

Aplikacija vključuje tudi šolski koledar.

Uporabnik lahko vanj dodaja:

* teste,
* spraševanja,
* predstavitve,
* seminarske naloge,
* domače naloge,
* maturo,
* druge pomembne roke.

Primer dogodka:

```text
Naslov: Test iz matematike
Datum: 15. 10. 2026
Predmet: Matematika

Teme:
- Polinomi
- Trigonometrija
```

---

# Opomniki

Za dogodke v koledarju lahko uporabnik nastavi opomnike.

Primer:

```text
Test iz matematike čez 3 dni.
```

Aplikacija lahko uporabnika opozori tudi, da se mora začeti pripravljati.

V prihodnosti bi lahko sistem glede na količino snovi in datum testa samodejno predlagal načrt učenja.

---

# Organizacija predmetov

Vsak uporabnik ima svoje predmete.

Primer:

```text
Moji predmeti

Matematika
Slovenščina
Angleščina
Fizika
Kemija
Informatika
```

Vsak predmet lahko vsebuje:

* zapiske,
* teme,
* AI pogovore,
* vprašalnike,
* teste,
* statistiko,
* prihajajoča ocenjevanja.

---

# Iskanje po zapiskih

Uporabnik lahko išče po vseh svojih zapiskih.

Primer:

```text
Iskanje: "mitohondrij"
```

Aplikacija poišče vse zapiske, kjer se iskani pojem pojavi.

V prihodnosti bi lahko AI omogočal tudi semantično iskanje, kjer uporabniku ni treba poznati popolnoma enakega izraza kot v zapiskih.

---

# Uvoz gradiva

V prihodnosti želimo omogočiti tudi uvoz različnih vrst datotek:

* PDF,
* Word dokumenti,
* PowerPoint predstavitve,
* slike zapiskov,
* tekstovne datoteke.

AI bi lahko vsebino dokumenta analiziral in jo uporabil kot dodatno učno gradivo.

---

# Uporabniški račun

Vsak uporabnik ima svoj račun.

Račun omogoča:

* shranjevanje zapiskov,
* shranjevanje predmetov,
* zgodovino vprašalnikov,
* rezultate testov,
* koledar,
* opomnike,
* statistiko napredka.

---

# Predvidena struktura aplikacije

```text
Dashboard
│
├── Predmeti
│   │
│   ├── Zapiski
│   ├── AI pomočnik
│   ├── Vprašalniki
│   └── Statistika
│
├── AI Chat
│
├── Quiz
│
├── Test / Exam
│
├── Koledar
│
├── Opomniki
│
└── Profil
```

---

# Dashboard

Po prijavi uporabnik pride na glavno stran, kjer lahko vidi:

* prihajajoče teste,
* zadnje zapiske,
* rezultate zadnjih vprašalnikov,
* predmete,
* predloge za učenje.

Primer:

```text
Dobrodošel nazaj!

Prihajajoče:

Matematika
Test čez 3 dni

Fizika
Spraševanje čez 7 dni

--------------------

Zadnji rezultati:

Matematika Quiz     8/10
Fizika Quiz         6/10
Angleščina Quiz     10/10
```

---

# Delovanje AI sistema

AI pri vprašanjih o šolski snovi ne uporablja samo splošnega znanja, ampak lahko kot glavni vir uporablja uporabnikove zapiske.

Poenostavljen proces:

```text
Uporabnik postavi vprašanje
          ↓
Sistem poišče relevantne zapiske
          ↓
Relevantni deli zapiskov se posredujejo AI modelu
          ↓
AI pripravi odgovor
          ↓
Odgovor se prikaže uporabniku
```

Podoben sistem se lahko uporabi tudi za:

* ustvarjanje vprašanj,
* generiranje testov,
* pripravo povzetkov,
* analizo znanja.

---

# Primer podatkovnega modela

Aplikacija bi lahko vsebovala naslednje glavne entitete:

```text
USER
│
├── SUBJECT
│   │
│   ├── NOTE
│   ├── TOPIC
│   ├── QUIZ
│   └── EXAM
│
├── CALENDAR_EVENT
│
└── REMINDER
```

Možne tabele:

```text
users
subjects
notes
topics
quizzes
questions
quiz_results
exams
exam_results
calendar_events
reminders
```

---

# Tehnologije

Končne tehnologije se lahko skozi razvoj projekta še spremenijo.

## Frontend

Možne tehnologije:

```text
HTML
CSS
JavaScript
```

oziroma sodobno frontend ogrodje.

## Backend

Možne tehnologije:

```text
Python
C#
JavaScript / Node.js
```

## Podatkovna baza

```text
SQL
```

## AI

Aplikacija uporablja AI API oziroma Large Language Model (LLM).

AI se uporablja za:

* analizo zapiskov,
* odgovarjanje na vprašanja,
* generiranje vprašanj,
* generiranje testov,
* ustvarjanje povzetkov,
* razlago napačnih odgovorov.

---

# Cilji projekta

Glavni cilji projekta so:

1. Izdelati uporabniški sistem.
2. Omogočiti ustvarjanje predmetov.
3. Omogočiti ustvarjanje in urejanje zapiskov.
4. Organizirati zapiske po predmetih in temah.
5. Povezati zapiske z AI pomočnikom.
6. Omogočiti ustvarjanje vprašalnikov.
7. Omogočiti ustvarjanje testov.
8. Omogočiti shranjevanje rezultatov.
9. Izdelati koledar šolskih obveznosti.
10. Omogočiti opomnike.
11. Prikazati statistiko napredka uporabnika.
12. Omogočiti pripravo na teste in maturo.

---

# Možne prihodnje nadgradnje

Projekt bi bilo mogoče kasneje razširiti z dodatnimi funkcijami:

* avtomatsko ustvarjanje flashcards,
* OCR za fotografije zapiskov,
* uvoz PDF dokumentov,
* uvoz PowerPoint predstavitev,
* uvoz Word dokumentov,
* AI generirani učni načrti,
* skupni zapiski med uporabniki,
* deljenje zapiskov,
* mobilna aplikacija,
* gamifikacija,
* XP sistem,
* achievements,
* AI analiza šibkih področij,
* avtomatsko načrtovanje učenja pred testom,
* glasovni AI pomočnik,
* generiranje povzetkov celotnih predmetov,
* simulacija maturitetnih izpitov.

---

# Avtorji

Projekt je izdelan v okviru maturitetne oziroma projektne naloge.

**Avtorji:**

* Ime in priimek
* Ime in priimek
* Ime in priimek

**Šola:** Ime šole

**Šolsko leto:** 2026/2027

---

# Status projekta

 **Projekt je trenutno v razvoju.**

Funkcionalnosti, podatkovni model in uporabniški vmesnik se lahko med razvojem še spremenijo.

---

# Licenca

Projekt je izdelan predvsem za izobraževalne namene v okviru šolske oziroma maturitetne naloge.
