/* Aqua Noir – date de EXEMPLU (machetă demo). Aici se schimbă prețurile, duratele și programul clientului real.
   Duratele sunt în minute. Prețurile sunt în lei, cu TVA. */

/* Programul studioului – singura sursă folosită peste tot (secțiunea Studio, sloturile de programare, zilele închise).
   Cheia = ziua săptămânii (0 = duminică … 6 = sâmbătă); null = închis. */
var PROGRAM = {
  1: ['08:00', '19:00'],
  2: ['08:00', '19:00'],
  3: ['08:00', '19:00'],
  4: ['08:00', '19:00'],
  5: ['08:00', '19:00'],
  6: ['08:00', '19:00'],
  0: null
};

var MARIMI = { compact: 'Compactă', suv: 'SUV', van: 'Van' };

var PACHETE = {
  ext: { nume: 'Exterior', pret: { compact: 190, suv: 240, van: 290 }, durata: { compact: 60, suv: 60, van: 120 } },
  int: { nume: 'Interior', pret: { compact: 340, suv: 420, van: 490 }, durata: { compact: 120, suv: 120, van: 180 } },
  cer: { nume: 'Protecție ceramică', pret: { compact: 2400, suv: 2900, van: 3400 }, durata: { compact: 360, suv: 420, van: 480 } }
};

/* Extra-uri la programare: preț și durată adăugată. */
var EXTRA = {
  motor: { nume: 'Curățare motor', pret: 150, durata: 30 },
  jante: { nume: 'Tratament ceramic jante', pret: 350, durata: 60 },
  par: { nume: 'Îndepărtare păr de animale', pret: 120, durata: 30 },
  ozon: { nume: 'Ozonizare habitaclu', pret: 100, durata: 30 },
  geamuri: { nume: 'Protecție geamuri (hidrofob)', pret: 180, durata: 30 }
};

/* Abonament lunar: spălări Exterior pe lună, preț redus pe mărime. Economia se calculează față de prețul Exterior la bucată. */
var ABONAMENTE = {
  ab2: { nume: '2 spălări exterior / lună', spalari: 2, pret: { compact: 320, suv: 410, van: 490 } },
  ab4: { nume: '4 spălări exterior / lună', spalari: 4, pret: { compact: 600, suv: 760, van: 920 } }
};

/* Card cadou: valori fixe sau un pachet (prețul pachetului pe mărimea aleasă). */
var CARD_CADOU = {
  valori: [200, 500, 1000],
  valabilitateLuni: 12
};
