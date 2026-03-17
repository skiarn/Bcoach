export interface Skill {
  name: string;
  type: 'volleyboll' | 'beachvolley';
  videoUrls: string[];
  advice: string[];
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
    ]
  },
];