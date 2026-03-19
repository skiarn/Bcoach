export interface Skill {
  name: string;
  type: 'volleyboll' | 'beachvolley';
  videoUrls: string[];
  advice: string[];
  nextSteps: string[];
}

export const skills: Skill[] = [
  {
    name: 'Fingerslag',
    type: 'beachvolley',
    videoUrls: ['https://youtu.be/bpZ5nas5Xjg'],
    advice: [
      'Håll handleden rak och fingrarna ihop.',
      'Slå bollen med fingertopparna för bättre kontroll.',
      'Följ igenom slaget för att ge bollen rätt riktning.',
      'Öva på att placera bollen exakt där du vill.'
    ],
    nextSteps: [
      'Öva fingerslag mot vägg 50 ggr per dag.',
      'Filma dig själv framifrån och bakifrån och jämför.',
      'Öva med partner: växla fingerslag 10 i rad utan tapp.',
      'Fokusera enbart på handledsrörelsen nästa session.'
    ]
  },
  {
    name: 'Bagger',
    type: 'beachvolley',
    videoUrls: ['https://youtu.be/zLgYtTiFUcg'],
    advice: [
      'Använd hela armen för att skapa kraft.',
      'Håll handleden avslappnad för bättre känsla.',
      'Slå bollen framför kroppen.',
      'Fokusera på att få bollen över nätet med precision.'
    ],
    nextSteps: [
      'Öva bagger mot vägg med jämnt tempo.',
      'Träna fotarbete – positionera dig rätt före slag.',
      'Öva med partner: serve–bagger 20 i rad.',
      'Jobba på armvinkeln vid kontakt.'
    ]
  },
  {
    name: 'Underarmsserve',
    type: 'beachvolley',
    videoUrls: ['https://youtu.be/G74FrB5oWB8'],
    advice: [
      'Stå med fötterna axelbrett isär.',
      'Slå bollen med underarmen, inte handen.',
      'Håll bollen stilla innan serve.',
      'Öva på att variera servens riktning och hastighet.'
    ],
    nextSteps: [
      'Öva servens precision: sikta på specifika zoner.',
      'Variera kraft – träna både låg och hög hastighet.',
      'Filma servens från sidan för att kontrollera kroppspositionen.',
      'Öva 20 serves i rad med konsekvent teknik.'
    ]
  },
  {
    name: 'Överarmsserve',
    type: 'beachvolley',
    videoUrls: ['https://youtu.be/mMfx9RruD4M'],
    advice: [
      'Kasta bollen uppåt och slå den när den faller.',
      'Använd hela kroppen för att generera kraft.',
      'Håll blicken på bollen hela tiden.',
      'Öva på att träffa bollen i mitten för bättre kontroll.'
    ],
    nextSteps: [
      'Öva kastet separat – konsekvent höjd och position.',
      'Fokusera på höftrotation för mer kraft.',
      'Träna på att variera riktning (kors/linje).',
      'Filma utifrån sidan – kontrollera armbågens höjd.'
    ]
  },
  {
    name: 'Spike',
    type: 'beachvolley',
    videoUrls: ['https://youtu.be/NqvQi9lGtlk'],
    advice: [
      'Hoppa högt och sträck ut armen helt.',
      'Kontakta bollen framför pannan.',
      'Använd handleden för att styra riktningen.',
      'Följ igenom slaget för maximal kraft.'
    ],
    nextSteps: [
      'Öva ansatsen – 3-stegsansats tills den sitter.',
      'Träna hoppet separat för att bygga explosivitet.',
      'Öva spiken mot med nät utan motståndare.',
      'Filma framifrån – kontrollera höjden på bollkontakten.'
    ]
  },
  {
    name: 'Alternativa anfall',
    type: 'beachvolley',
    videoUrls: ['https://youtu.be/-v8xTpy_t80'],
    advice: [
      'Variera dina anfall för att överraska motståndaren.',
      'Öva på olika typer av slag som tipp och roll.',
      'Använd kroppen för att skapa vinklar.',
      'Kommunicera med din partner om vilket anfall du ska göra.'
    ],
    nextSteps: [
      'Öva tipp och roll 10 ggr vardera per träning.',
      'Träna att bestämma anfallstyp SENT i hoppet.',
      'Öva med partner: blockeraren väljer sida, anfallaren anpassar.',
      'Filma sidoprofil – kontrollera hur väl du döljer anfallsintentionen.'
    ]
  },
  {
    name: 'Block',
    type: 'beachvolley',
    videoUrls: ['https://youtu.be/CGJan-b2264'],
    advice: [
      'Hopp upp samtidigt som motståndaren.',
      'Håll armarna raka och händerna ihop.',
      'Läs motståndarens intention.',
      'Blocka bollen rakt upp för att hjälpa din partner.'
    ],
    nextSteps: [
      'Öva blocktiming med en partner som spikar.',
      'Träna att läsa motståndarens axelriktning.',
      'Öva på att landa stabilt och direkt ta nästa position.',
      'Filma framifrån – kontrollera handens läge vid kontakt.'
    ]
  },
  {
    name: 'Blockback',
    type: 'beachvolley',
    videoUrls: ['https://youtu.be/3pdnVnbyPcs'],
    advice: [
      'Vrid kroppen för att nå bollen bakom dig.',
      'Använd båda händerna för bättre kontroll.',
      'Hopp högt och sträck ut.',
      'Öva på timing för att hinna fram i tid.'
    ],
    nextSteps: [
      'Öva rotering och sträckning utan boll.',
      'Träna blockback med sakta-serve från partner.',
      'Jobba på landningen – direkt balans efter hopp.',
      'Filma bakifrån – kontrollera vridningens full räckvidd.'
    ]
  },
  {
    name: 'Servemottag',
    type: 'beachvolley',
    videoUrls: ['https://youtu.be/kQ74R6AxYTc'],
    advice: [
      'Stå redo med knäna böjda.',
      'Flytta fötterna snabbt för att nå bollen.',
      'Använd platt hand för bättre kontroll.',
      'Passa bollen högt och precist till din partner.'
    ],
    nextSteps: [
      'Öva mottagets precision – sikta på en specifik zon.',
      'Träna reaktionssnabbhet med varierande serveriktningar.',
      'Öva "bagger-position" som grundposition.',
      'Filma framifrån under match för att analysera beslut.'
    ]
  },
  {
    name: 'Hoppfloat',
    type: 'beachvolley',
    videoUrls: ['https://youtu.be/vH9fC1wIizQ'],
    advice: [
      'Hoppa högt och slå bollen med fingertopparna.',
      'Håll handleden rak.',
      'Skapa en flytande rörelse.',
      'Öva på att placera bollen exakt.'
    ],
    nextSteps: [
      'Öva floatrörelsen stående på marken först.',
      'Träna ansats + hopp utan boll.',
      'Öva precision: sikta på specifika fält.',
      'Filma serven från sidan för att kontrollera hoppets höjd.'
    ]
  },
  {
    name: 'Spinnserve',
    type: 'beachvolley',
    videoUrls: ['https://youtu.be/iEwKapegSBg'],
    advice: [
      'Snurra bollen med fingrarna innan serve.',
      'Slå bollen med kraft för att skapa rotation.',
      'Variera spinnet för att göra det svårare för motståndaren.',
      'Öva på att träffa bollen rätt för önskad effekt.'
    ],
    nextSteps: [
      'Öva greppet – håll och snurra bollen utan att serva.',
      'Träna spinnets riktning: topspin vs. sidospin.',
      'Öva 10 spinner i rad mot ett fält.',
      'Filma handen vid kontakt – kontrollera fingerarbetet.'
    ]
  },
  // Volleyboll
  {
    name: 'Fingerslag',
    type: 'volleyboll',
    videoUrls: ['https://youtu.be/0tx12g4zpS0'],
    advice: [
      'Håll handleden rak och fingrarna ihop.',
      'Slå bollen med fingertopparna för bättre kontroll.',
      'Följ igenom slaget för att ge bollen rätt riktning.',
      'Öva på att placera bollen exakt där du vill.'
    ],
    nextSteps: [
      'Öva fingerslag mot vägg 50 ggr per dag.',
      'Filma dig framifrån – kontrollera handpositionen.',
      'Öva med partner i par-fingerslag 10 i rad.',
      'Fokusera på sättningens höjd och precision.'
    ]
  },
  {
    name: 'Bagger',
    type: 'volleyboll',
    videoUrls: ['https://youtu.be/rrxxt9TRYOg'],
    advice: [
      'Använd hela armen för att skapa kraft.',
      'Håll handleden avslappnad för bättre känsla.',
      'Slå bollen framför kroppen.',
      'Fokusera på att få bollen över nätet med precision.'
    ],
    nextSteps: [
      'Öva bagger mot vägg med jämnt tempo.',
      'Träna fotarbete – positionera dig rätt.',
      'Öva serve–mottag med partner 20 i rad.',
      'Jobba på armvinkeln vid kontakt.'
    ]
  },
  {
    name: 'Underarmsserve',
    type: 'volleyboll',
    videoUrls: ['https://youtu.be/UTayLe0-Pig'],
    advice: [
      'Stå med fötterna axelbrett isär.',
      'Slå bollen med underarmen, inte handen.',
      'Håll bollen stilla innan serve.',
      'Öva på att variera servens riktning och hastighet.'
    ],
    nextSteps: [
      'Öva precision: sikta på specifika zoner.',
      'Variera kraft från session till session.',
      'Filma servens från sidan – kontrollera positionen.',
      'Öva 20 serves i rad med konsekvent teknik.'
    ]
  },
  {
    name: 'Överarmsserve',
    type: 'volleyboll',
    videoUrls: ['https://youtu.be/lUBDgm1HAU8'],
    advice: [
      'Kasta bollen uppåt och slå den när den faller.',
      'Använd hela kroppen för att generera kraft.',
      'Håll blicken på bollen hela tiden.',
      'Öva på att träffa bollen i mitten för bättre kontroll.'
    ],
    nextSteps: [
      'Öva kastet separat – konsekvent höjd.',
      'Fokusera på höftrotation.',
      'Träna riktningsvariation (kors/linje).',
      'Filma utifrån sidan – kontrollera armbågens höjd.'
    ]
  },
  {
    name: 'Spike',
    type: 'volleyboll',
    videoUrls: ['https://youtu.be/QJHrK30wYeY'],
    advice: [
      'Hoppa högt och sträck ut armen helt.',
      'Kontakta bollen framför pannan.',
      'Använd handleden för att styra riktningen.',
      'Följ igenom slaget för maximal kraft.'
    ],
    nextSteps: [
      'Öva 3-stegsansatsen tills den sitter.',
      'Träna hoppet för explosivitet.',
      'Öva spiken med nät utan motståndare.',
      'Filma framifrån – kontrollera bollkontaktens höjd.'
    ]
  },
  {
    name: 'Alternativa anfall',
    type: 'volleyboll',
    videoUrls: ['https://youtu.be/a0q9ImY3AF0'],
    advice: [
      'Variera dina anfall för att överraska motståndaren.',
      'Öva på olika typer av slag som tipp och roll.',
      'Använd kroppen för att skapa vinklar.',
      'Kommunicera med din partner om vilket anfall du ska göra.'
    ],
    nextSteps: [
      'Öva tipp och roll 10 ggr vardera.',
      'Träna sen beslutfattning i hoppet.',
      'Öva med partner: blockeraren väljer, anfallaren anpassar.',
      'Filma sidoprofil för att analysera intentions-döljan.'
    ]
  },
  {
    name: 'Block',
    type: 'volleyboll',
    videoUrls: ['https://youtu.be/bGtl_0JVEHY'],
    advice: [
      'Hopp upp samtidigt som motståndaren.',
      'Håll armarna raka och händerna ihop.',
      'Läs motståndarens intention.',
      'Blocka bollen rakt upp för att hjälpa din partner.'
    ],
    nextSteps: [
      'Öva blocktiming med anfallande partner.',
      'Träna att läsa axelriktning.',
      'Öva stabil landning och direktrörelse.',
      'Filma framifrån – handposition vid kontakt.'
    ]
  },
  {
    name: 'Servemottag',
    type: 'volleyboll',
    videoUrls: ['https://youtu.be/NOIUGBE7Kic'],
    advice: [
      'Stå redo med knäna böjda.',
      'Flytta fötterna snabbt för att nå bollen.',
      'Använd platt hand för bättre kontroll.',
      'Passa bollen högt och precist till din partner.'
    ],
    nextSteps: [
      'Öva mottag–pass–sättning i grupp om 3.',
      'Träna reaktionssnabbet med varierande server.',
      'Öva precision: sikt på sättar-positionen.',
      'Filma match för att analysera positionsbeslut.'
    ]
  },
  {
    name: 'Hoppfloat',
    type: 'volleyboll',
    videoUrls: ['https://youtu.be/451YxzRtieU'],
    advice: [
      'Hoppa högt och slå bollen med fingertopparna.',
      'Håll handleden rak.',
      'Skapa en flytande rörelse.',
      'Öva på att placera bollen exakt.'
    ],
    nextSteps: [
      'Öva floatrörelsen stående på marken.',
      'Träna ansats + hopp utan boll.',
      'Öva precision mot specifika fält.',
      'Filma från sidan – kontrollera hoppets höjd.'
    ]
  },
  {
    name: 'Spinnserve',
    type: 'volleyboll',
    videoUrls: ['https://youtu.be/NOEzkALBPnc'],
    advice: [
      'Snurra bollen med fingrarna innan serve.',
      'Slå bollen med kraft för att skapa rotation.',
      'Variera spinnet för att göra det svårare för motståndaren.',
      'Öva på att träffa bollen rätt för önskad effekt.'
    ],
    nextSteps: [
      'Öva greppet och bollrotationen separat.',
      'Träna topspin vs. sidospin.',
      'Öva 10 spinner i rad mot ett fält.',
      'Filma handen vid kontakt – kontrollera fingerarbete.'
    ]
  },
];
