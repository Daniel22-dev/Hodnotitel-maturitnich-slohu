/* 00-release-rubric.js */
const RELEASE = Object.freeze({version:'1.4.0', build:'__BUILD__', appId:'essay-evaluator', status:'controlled-pilot'});
const APP_VERSION = RELEASE.version;
const RUBRIC_PROMPT = "ANALYTICKÁ RUBRIKA PRO MATURITNÍ SLOH – VERZE 2026.04.27-r1\n\nROLE MODELU\nJsi pouze analytická vrstva. Vyhledáváš důkazy, jazykové jevy a chyby. Konečné body, FAIL podmínky, počet slov, penalizace, součet a známku vždy vypočítá aplikace. Nepřepisuj závazný lokální word-count audit a nevytvářej vlastní výslednou známku.\n\nOBECNÁ PRAVIDLA\n- Hodnoť přesně zadaný útvar: opinion essay, for and against essay, review, narration, letter of complaint nebo motivation letter.\n- Každé tvrzení opři o konkrétní důkaz ze studentského textu. Citace musí být doslovná a označená P1, P2 atd.\n- Nevymýšlej citace ani obsah, který v textu není. K uznání bodu zadání smí být potřeba nejvýše jeden rozumný inferenční krok.\n- Parafráze zadání je plně přípustná. Jeden odstavec může plnit více bodů zadání a jeden bod může být rozvinut napříč textem.\n- Zachovej původní chyby. Nevytvářej kompletně opravenou verzi slohu.\n- Zpětnou vazbu piš česky, konkrétně a pedagogicky.\n\n1. ZADÁNÍ A ROZSAH – ANALÝZA\nPro každý požadavek R1–Rn vrať verdikt splněno / částečně / nesplněno, 1–2 přesné citace a stručné zdůvodnění. Urči skutečný útvar, hlavní komunikační záměr, relevanci k tématu a případné chybějící povinné prvky. U formálních dopisů zjisti oslovení a ukončení; u review a narration zjisti nadpis. Spočítej výskyty kontrakcí, ale žádnou penalizaci sám neaplikuj.\nKomunikační kontrakty:\n- opinion: jasný osobní názor, argumentace a závěr;\n- for and against: téma, argumenty pro i proti a vyvážený závěr;\n- review: identifikace díla/akce/služby, hodnocení pozitiv a negativ a doporučení;\n- narration: příběh s dějem, časovou posloupností, prostředím a pointou či závěrem;\n- complaint: konkrétní problém, důkazy nebo podrobnosti, požadovaná náprava a formát dopisu;\n- motivation: účel, důvody, kvalifikace či kompetence, motivace a formát dopisu.\nZáměna opinion a for-and-against není sama o sobě automatický FAIL; popiš pouze skutečný rozdíl v komunikačním záměru.\n\n2. ODSTAVCE A KOHERENCE\nPosuď smysluplné členění na odstavce, logické pořadí, návaznost vět a odstavců, úvod a závěr. Upozorni, pokud závěr přidává nový argument nebo téma, které nebylo v hlavním textu. Výzva k akci ani shrnutí postoje nejsou novou myšlenkou.\n\n3.–4. CHYBY\nKaždou chybu zařaď právě jednou jako lexikální/spellingovou nebo gramatickou a zároveň jako lokální či globální. Uveď přesnou chybnou citaci, opravu, stručné vysvětlení a repeat_count. Stejná příčina opakovaná vícekrát se eviduje jednou s počtem opakování. Členy patří vždy do gramatiky. Nedvoj chybu mezi lexikou a gramatikou.\nLokální chyba nebrání porozumění; globální chyba význam zásadně mění, znejasňuje nebo blokuje.\n\n5. OBSAH\nPosuď relevanci, konkrétnost, rozvinutí myšlenek, argumentů či děje a přiměřenost detailů. Nestrhávej obsahové body pouze za jazykové chyby, pokud je myšlenka srozumitelná.\n\n6. PTN A KOHÉZE\nNajdi a přesně cituj prostředky textové návaznosti ve skupinách PTN1, PTN2 a PTN3. Posuď jejich správnost, rozmanitost a přirozenost. Aplikace sama provede případnou penalizaci za chybějící skupinu.\n\n7. ÚROVEŇ SLOVNÍ ZÁSOBY\nPosuď, zda rozsah, přesnost, kolokace, idiomy a stylová přiměřenost odpovídají alespoň B2. Vyjmenuj konkrétní B2 nebo pokročilé výrazy. Opakování stejného slova označ jako problém až při nejméně třech výskytech v krátkém sledu; nepočítej je současně jako lexikální chybu.\n\n8. ÚROVEŇ GRAMATIKY\nPosuď rozsah a kontrolu gramatiky vzhledem k B2. Uveď konkrétní použité B2 struktury a případné pokročilé jevy, například podmínkové věty, pasivum, modální konstrukce, vztažné věty, nepřímou řeč, gerundium/infinitiv, participiální vazby nebo inverzi. Vyšší úroveň pouze pochval, skóre zůstává omezené schématem.\n\nAUTENTICITA A ČITELNOST\nU rukopisu uveď procento čitelnosti a nejistá místa. Odhad neautentického nebo šablonovitého projevu je pouze upozornění pro učitele, nikdy bodová penalizace. Vrať odhad 0–100 %, jistotu a 3–6 konkrétních signálů; u každého přidej alternativní ne-AI vysvětlení, například naučenou frázi, školní dril, šablonu, korektor nebo pečlivou revizi. Neobviňuj studenta z použití AI.\n\nZPĚTNÁ VAZBA\nUveď silné stránky, slabší stránky a konkrétní kroky ke zlepšení. Radikální nebo znepokojivý obsah pouze neutrálně označ pro pozornost učitele; nehodnoť názor sám o sobě. Neuváděj vlastní finální body, součet ani známku.";
const STORAGE_KEY = 'maturitniHodnotitelStateV130';
const TASK_STORAGE_KEY = 'maturitniHodnotitelTasksV100';
const SENSITIVE_SAVE_PREF_SK = 'maturitniHodnotitelSensitiveSaveV073';
const LEGACY_STATE_KEYS = ['maturitniHodnotitelStateV070','maturitniHodnotitelStateV071','maturitniHodnotitelStateV072','maturitniHodnotitelStateV073','maturitniHodnotitelStateV074','maturitniHodnotitelStateV075','maturitniHodnotitelStateV076','maturitniHodnotitelStateV077','maturitniHodnotitelStateV078'];
const SENSITIVE_STATE_FIELDS = ['studentText','studentIdentity','extraPii','result','privacyApprovedHash','teacherReview','roster','lastEvaluation'];
const GEMINI_KEY_SK = 'maturitniHodnotitelGeminiKeyV061';
const GEMINI_KEY_SESSION_SK = 'maturitniHodnotitelGeminiKeySessionV061';
const GEMINI_MODEL_SK = 'maturitniHodnotitelModelV061';
const PRIVACY_ACK_SK = 'maturitniHodnotitelPrivacyAckV071';
const GEMINI_MODEL_DEFAULT = 'gemini-3.5-flash';
const GEMINI_API_VERSION_PRIMARY = 'v1';
const GEMINI_API_VERSION_FALLBACK = 'v1beta';
const GEMINI_RETRY_MAX_ATTEMPTS = 4;
const GEMINI_RETRY_BASE_MS = 1400;
const GEMINI_RETRY_MAX_MS = 18000;
const GEMINI_BATCH_BETWEEN_MS = 1300;
const BATCH_PROGRESS_SESSION_SK = 'maturitniHodnotitelBatchProgressSessionV078';
const BATCH_PROGRESS_LOCAL_SK = 'maturitniHodnotitelBatchProgressLocalV078';
const IMAGE_MAX_DIM = 2000;
const IMAGE_JPEG_QUALITY = 0.82;
const GENRES = [
  {id:'opinion', label:'Opinion essay', desc:'Jasný osobní názor, argumentace, závěr.'},
  {id:'for_against', label:'For and against essay', desc:'Argumenty pro i proti, vyvážený závěr.'},
  {id:'review', label:'Review', desc:'Identifikace díla/akce/služby, hodnocení, doporučení.'},
  {id:'narration', label:'Narration', desc:'Příběh s dějem, časová posloupnost, prostředí, pointa.'},
  {id:'complaint', label:'Letter of complaint', desc:'Stížnost, detaily problému, požadovaná náprava, formální dopis.'},
  {id:'motivation', label:'Motivation letter', desc:'Účel, důvody, kvalifikace, motivace, formální dopis.'}
];

/* 05-rubric-spec.js */
const RUBRIC_VERSION='2026.04.27-r1';
const RUBRIC_SCHEMA_VERSION='2.0';
const RUBRIC_SECTIONS=Object.freeze([
  {id:'zadani_a_rozsah',label:'Zadání a rozsah'},
  {id:'odstavce_a_koherence',label:'Odstavce a koherence'},
  {id:'lexikalni_a_spellingove_chyby',label:'Lexikální a spellingové chyby'},
  {id:'gramaticke_chyby',label:'Gramatické chyby'},
  {id:'obsah',label:'Obsah'},
  {id:'ptn_a_koheze',label:'PTN a koheze'},
  {id:'uroven_slovni_zasoby',label:'Úroveň slovní zásoby'},
  {id:'uroven_gramatiky',label:'Úroveň gramatiky'}
]);
const RUBRIC_SECTION_IDS=Object.freeze(RUBRIC_SECTIONS.map(x=>x.id));
const RUBRIC_GRADE_BANDS=Object.freeze([
  {min:21,max:24,grade:1,label:'výborný'},
  {min:18,max:20,grade:2,label:'chvalitebný'},
  {min:14,max:17,grade:3,label:'dobrý'},
  {min:11,max:13,grade:4,label:'dostatečný'},
  {min:0,max:10,grade:5,label:'nedostatečný'}
]);
const RUBRIC_SPEC=Object.freeze({
  version:RUBRIC_VERSION,
  wordCount:{minimum:195,longPenaltyFrom:300,longPenaltyPoints:1},
  assignment:{minimumWithoutFail:1,failCodes:['FAIL-1','FAIL-2','FAIL-3','FAIL-4'],formalGenres:['complaint','motivation'],headingRequiredGenres:['review','narration'],contractionsPenalizedGenres:['complaint','motivation','opinion','for_against'],contractionsFreeAllowance:2,essayPairException:['opinion','for_against']},
  ptn:{required:['PTN1','PTN2','PTN3'],missingPenalty:1},
  errorScoring:{local:[[0,5,3],[6,11,2],[12,17,1],[18,99999,0]],global:[[0,1,3],[2,3,2],[4,5,1],[6,99999,0]]},
  gradeBands:RUBRIC_GRADE_BANDS
});
const SECTION_RESPONSE_SCHEMA={type:'object',properties:{score_suggested:{type:'integer',minimum:0,maximum:3},verdict:{type:'string',enum:['splneno','castecne','nesplneno']},evidence:{type:'array',minItems:1,items:{type:'string'}},reasoning:{type:'string'}},required:['score_suggested','verdict','evidence','reasoning']};
const ERROR_RESPONSE_SCHEMA={type:'object',properties:{paragraph:{type:'string'},quote:{type:'string'},correction:{type:'string'},reason:{type:'string'},cause_key:{type:'string'},repeat_count:{type:'integer'},subtype:{type:'string'}},required:['paragraph','quote','correction','reason','cause_key','repeat_count','subtype']};
const EVALUATION_RESPONSE_SCHEMA=Object.freeze({
  type:'object',
  properties:{
    schema_version:{type:'string'},rubric_version:{type:'string'},student_code:{type:'string'},
    transcription:{type:'object',properties:{source_type:{type:'string'},legibility_percent:{type:['integer','null']},uncertain_fragments:{type:'array',items:{type:'string'}}},required:['source_type','legibility_percent','uncertain_fragments']},
    input_lock:{type:'object',properties:{first_sentence:{type:'string'},last_sentence:{type:'string'},confirmed_exact_input:{type:'boolean'}},required:['first_sentence','last_sentence','confirmed_exact_input']},
    assignment_analysis:{type:'object',properties:{genre_match:{type:'boolean'},detected_genre:{type:'string',enum:['opinion','for_against','review','narration','complaint','motivation','other']},off_topic:{type:'boolean'},formal_salutation_present:{type:['boolean','null']},formal_closing_present:{type:['boolean','null']},formal_pair_correct:{type:['boolean','null']},heading_present:{type:['boolean','null']},contractions_count:{type:'integer'},requirements:{type:'array',items:{type:'object',properties:{id:{type:'string'},verdict:{type:'string',enum:['splneno','castecne','nesplneno']},evidence:{type:'array',maxItems:2,items:{type:'object',properties:{paragraph:{type:'string'},quote:{type:'string'}},required:['paragraph','quote']}},reason:{type:'string'}},required:['id','verdict','evidence','reason']}},fail_codes_suggested:{type:'array',items:{type:'string'}}},required:['genre_match','detected_genre','off_topic','formal_salutation_present','formal_closing_present','formal_pair_correct','heading_present','contractions_count','requirements','fail_codes_suggested']},
    sections:{type:'object',properties:{zadani_a_rozsah:SECTION_RESPONSE_SCHEMA,odstavce_a_koherence:SECTION_RESPONSE_SCHEMA,lexikalni_a_spellingove_chyby:SECTION_RESPONSE_SCHEMA,gramaticke_chyby:SECTION_RESPONSE_SCHEMA,obsah:SECTION_RESPONSE_SCHEMA,ptn_a_koheze:SECTION_RESPONSE_SCHEMA,uroven_slovni_zasoby:SECTION_RESPONSE_SCHEMA,uroven_gramatiky:SECTION_RESPONSE_SCHEMA},required:RUBRIC_SECTION_IDS},
    errors:{type:'object',properties:{lexical_local:{type:'array',items:ERROR_RESPONSE_SCHEMA},lexical_global:{type:'array',items:ERROR_RESPONSE_SCHEMA},grammar_local:{type:'array',items:ERROR_RESPONSE_SCHEMA},grammar_global:{type:'array',items:ERROR_RESPONSE_SCHEMA}},required:['lexical_local','lexical_global','grammar_local','grammar_global']},
    ptn:{type:'object',properties:{PTN1:{type:'array',items:{type:'string'}},PTN2:{type:'array',items:{type:'string'}},PTN3:{type:'array',items:{type:'string'}}},required:['PTN1','PTN2','PTN3']},
    advanced_language:{type:'object',properties:{b2_grammar:{type:'array',items:{type:'string'}},advanced_grammar:{type:'array',items:{type:'string'}},b2_vocabulary:{type:'array',items:{type:'string'}}},required:['b2_grammar','advanced_grammar','b2_vocabulary']},
    authenticity:{type:'object',properties:{estimate_percent:{type:'integer'},certainty:{type:'string',enum:['nizka','stredni','vysoka']},signals:{type:'array',minItems:3,maxItems:6,items:{type:'object',properties:{paragraph:{type:'string'},quote:{type:'string'},reason:{type:'string'},alternative_explanation:{type:'string'}},required:['paragraph','quote','reason','alternative_explanation']}}},required:['estimate_percent','certainty','signals']},
    feedback:{type:'object',properties:{teacher_markdown:{type:'string'},student_markdown:{type:'string'},positive:{type:'array',minItems:1,items:{type:'string'}},negative:{type:'array',minItems:1,items:{type:'string'}},improvements:{type:'array',minItems:1,items:{type:'string'}},extreme_content_note:{type:['string','null']}},required:['teacher_markdown','student_markdown','positive','negative','improvements','extreme_content_note']}
  },
  required:['schema_version','rubric_version','student_code','transcription','input_lock','assignment_analysis','sections','errors','ptn','advanced_language','authenticity','feedback']
});
function rubricVersionLabel(){return `Rubrika ${RUBRIC_VERSION}`;}
function scoreBandPoints(count,bands){const n=Math.max(0,Number(count)||0);const row=bands.find(([min,max])=>n>=min&&n<=max);return row?row[2]:0;}
function gradeFromTotal(total){const n=Math.max(0,Math.min(24,Math.round(Number(total)||0)));return (RUBRIC_GRADE_BANDS.find(x=>n>=x.min&&n<=x.max)||RUBRIC_GRADE_BANDS.at(-1)).grade;}

/* 10-task-database.js */
const EMBEDDED_TASKS = {
  "practice": {
    "opinion": [
      {
        "id": "practice-opinion-1",
        "set": "practice",
        "genre": "opinion",
        "number": 1,
        "title": "Cvičná sada – Opinion essay 1 – Life is harder for young people now",
        "taskText": "Napište opinion essay na téma Life is harder for young people now than in the past, v rozsahu 200-250 slov, ve které:\nPovinné body zadání:\n• stručně uveďte téma a zmiňte, že se často diskutuje, zda dnešní mladí lidé čelí větším výzvám než předchozí generace,\n• zaujměte jasný postoj už v úvodu (souhlasíte / nesouhlasíte / do jaké míry),\n• podpořte svůj názor 2–3 argumenty a příklady (např. studium, tlak na výkon, bydlení, budoucí uplatnění),\n• stručně zmiňte opačný pohled a vysvětlete, proč s ním nesouhlasíte,\n• v závěru shrňte své argumenty a jednoznačně potvrďte svůj názor, zda je život mladých lidí dnes skutečně náročnější než dříve.",
        "requirements": [
          "R1: stručně uveďte téma a zmiňte, že se často diskutuje, zda dnešní mladí lidé čelí větším výzvám než předchozí generace,",
          "R2: zaujměte jasný postoj už v úvodu (souhlasíte / nesouhlasíte / do jaké míry),",
          "R3: podpořte svůj názor 2–3 argumenty a příklady (např. studium, tlak na výkon, bydlení, budoucí uplatnění),",
          "R4: stručně zmiňte opačný pohled a vysvětlete, proč s ním nesouhlasíte,",
          "R5: v závěru shrňte své argumenty a jednoznačně potvrďte svůj názor, zda je život mladých lidí dnes skutečně náročnější než dříve."
        ],
        "sourceFile": "opinion essay 1.docx",
        "isPlaceholder": false
      },
      {
        "id": "practice-opinion-2",
        "set": "practice",
        "genre": "opinion",
        "number": 2,
        "title": "Cvičná sada – Opinion essay 2 – Large shopping centres",
        "taskText": "Napište opinion essay na téma Some people say that large shopping centres are a bad idea. What do you think? v rozsahu 200-250 slov, ve které:\nPovinné body zadání:\n• stručně uveďte téma velkých nákupních center a zmiňte, že vyvolává různé reakce,\n• jasně vyjádřete svůj postoj už v úvodu,\n• podpořte svůj názor 2–3 argumenty a vlastními příklady či zkušenostmi,\n• stručně zmiňte opačný názor a vysvětlete, proč s ním nesouhlasíte,\n• v závěru své argumenty shrňte a jednoznačně potvrďte, zda jsou podle vás velká nákupní centra spíše přínosem, nebo problémem.",
        "requirements": [
          "R1: stručně uveďte téma velkých nákupních center a zmiňte, že vyvolává různé reakce,",
          "R2: jasně vyjádřete svůj postoj už v úvodu,",
          "R3: podpořte svůj názor 2–3 argumenty a vlastními příklady či zkušenostmi,",
          "R4: stručně zmiňte opačný názor a vysvětlete, proč s ním nesouhlasíte,",
          "R5: v závěru své argumenty shrňte a jednoznačně potvrďte, zda jsou podle vás velká nákupní centra spíše přínosem, nebo problémem."
        ],
        "sourceFile": "opinion essay 2 docx.docx",
        "isPlaceholder": false
      }
    ],
    "for_against": [
      {
        "id": "practice-for_against-1",
        "set": "practice",
        "genre": "for_against",
        "number": 1,
        "title": "Cvičná sada – For and against essay 1 – Online Education",
        "taskText": "Napište for and against essay na téma Online Education – Benefit or Drawback? v rozsahu 200-250 slov, ve které:\nPovinné body zadání:\n• nastiňte, jak se online výuka stala běžnou součástí vzdělávání, zejména po pandemii, uveďte, že se zaměříte na její klady i zápory,\n• dejte příklady výhod online výuky,\n• upozorněte na nevýhody, je vhodné uvést příklady nebo osobní úvahy,\n• shrňte obě strany argumentace, vyjádřete svůj názor na to, zda by online výuka měla být trvalou součástí vzdělávání.",
        "requirements": [
          "R1: nastiňte, jak se online výuka stala běžnou součástí vzdělávání, zejména po pandemii, uveďte, že se zaměříte na její klady i zápory,",
          "R2: dejte příklady výhod online výuky,",
          "R3: upozorněte na nevýhody, je vhodné uvést příklady nebo osobní úvahy,",
          "R4: shrňte obě strany argumentace, vyjádřete svůj názor na to, zda by online výuka měla být trvalou součástí vzdělávání."
        ],
        "sourceFile": "for and against essay 1.docx",
        "isPlaceholder": false
      },
      {
        "id": "practice-for_against-2",
        "set": "practice",
        "genre": "for_against",
        "number": 2,
        "title": "Cvičná sada – For and against essay 2 – City or Countryside",
        "taskText": "Napište for and against essay na téma Is It Better to Live in the City or in the Countryside? v rozsahu 200-250 slov, ve které:\nPovinné body zadání:\n• uveďte, že volba mezi životem ve městě a na venkově je důležitá a ovlivňuje kvalitu života, naznačte, že každá varianta má svá pozitiva i negativa,\n• zmiňte výhody života ve městě,\n• upozorněte na nevýhody, je vhodné uvést příklady nebo osobní úvahy,\n• shrňte výhody obou možností, vyjádřete svůj osobní postoj – kde byste chtěli žít a proč.",
        "requirements": [
          "R1: uveďte, že volba mezi životem ve městě a na venkově je důležitá a ovlivňuje kvalitu života, naznačte, že každá varianta má svá pozitiva i negativa,",
          "R2: zmiňte výhody života ve městě,",
          "R3: upozorněte na nevýhody, je vhodné uvést příklady nebo osobní úvahy,",
          "R4: shrňte výhody obou možností, vyjádřete svůj osobní postoj – kde byste chtěli žít a proč."
        ],
        "sourceFile": "for and against essay 2.docx",
        "isPlaceholder": false
      }
    ],
    "review": [
      {
        "id": "practice-review-1",
        "set": "practice",
        "genre": "review",
        "number": 1,
        "title": "Cvičná sada – Review 1 – Travel agency",
        "taskText": "Napište recenzi cestovní kanceláře v rozsahu 200–250 slov, ve které:\nPovinné body zadání:\n• uvedete, jaký zájezd jste s kanceláří absolvovali (kam, kdy, jaký typ dovolené),\n• popíšete služby cestovní kanceláře (komunikace, organizace, průvodce, doprava, ubytování),\n• zhodnotíte, co se vám líbilo a co by podle vás mohli zlepšit,\n• uzavřete, zda byste tuto cestovní kancelář doporučili ostatním cestovatelům a proč.",
        "requirements": [
          "R1: uvedete, jaký zájezd jste s kanceláří absolvovali (kam, kdy, jaký typ dovolené),",
          "R2: popíšete služby cestovní kanceláře (komunikace, organizace, průvodce, doprava, ubytování),",
          "R3: zhodnotíte, co se vám líbilo a co by podle vás mohli zlepšit,",
          "R4: uzavřete, zda byste tuto cestovní kancelář doporučili ostatním cestovatelům a proč."
        ],
        "sourceFile": "review 1.docx",
        "isPlaceholder": false
      },
      {
        "id": "practice-review-2",
        "set": "practice",
        "genre": "review",
        "number": 2,
        "title": "Cvičná sada – Review 2 – Mobile phone",
        "taskText": "Napište recenzi mobilního telefonu v rozsahu 200–250 slov, ve které:\nPovinné body zadání:\n• představíte značku a model telefonu, který používáte nebo jste vyzkoušeli,\n• popíšete jeho hlavní funkce (např. fotoaparát, baterie, displej, aplikace),\n• zhodnotíte výhody i nevýhody telefonu (rychlost, spolehlivost, design, cena),\n• porovnáte ho krátce s jiným modelem, který znáte,\n• rozhodnete, zda byste tento mobil doporučili ostatním a proč.",
        "requirements": [
          "R1: představíte značku a model telefonu, který používáte nebo jste vyzkoušeli,",
          "R2: popíšete jeho hlavní funkce (např. fotoaparát, baterie, displej, aplikace),",
          "R3: zhodnotíte výhody i nevýhody telefonu (rychlost, spolehlivost, design, cena),",
          "R4: porovnáte ho krátce s jiným modelem, který znáte,",
          "R5: rozhodnete, zda byste tento mobil doporučili ostatním a proč."
        ],
        "sourceFile": "review 2.docx",
        "isPlaceholder": false
      }
    ],
    "narration": [
      {
        "id": "practice-narration-1",
        "set": "practice",
        "genre": "narration",
        "number": 1,
        "title": "Cvičná sada – Narration 1 – A mistake that taught me a lesson",
        "taskText": "Napište vypravování na téma “A mistake that taught me a lesson“ v rozsahu 200–250 slov, ve kterém:\nPovinné body zadání:\n• představíte situaci, kdy a kde se příběh odehrávál,\n• popíšete, co přesně se stalo a jaké bylo vaše chybné rozhodnutí,\n• vysvětlíte, jaké mělo vaše rozhodnutí důsledky,\n• napíšete, co jste se z celé situace naučili.",
        "requirements": [
          "R1: představíte situaci, kdy a kde se příběh odehrávál,",
          "R2: popíšete, co přesně se stalo a jaké bylo vaše chybné rozhodnutí,",
          "R3: vysvětlíte, jaké mělo vaše rozhodnutí důsledky,",
          "R4: napíšete, co jste se z celé situace naučili."
        ],
        "sourceFile": "Narration 1.docx",
        "isPlaceholder": false
      },
      {
        "id": "practice-narration-2",
        "set": "practice",
        "genre": "narration",
        "number": 2,
        "title": "Cvičná sada – Narration 2 – An Unexpected Visitor",
        "taskText": "Anglický časopis vaší školy vyhlásil soutěž o nejlepší vypravování na téma:\n“An Unexpected Visitor“\nNapište vypravování na dané téma v rozsahu 200-250 slov, ve kterém\nPovinné body zadání:\n• napíšete, co jste právě dělal/ dělala, když se nečekaná návštěva objevila,\n• uvedete, kdo vás nečekaně navštívil,\n• budete vypravovat, jak návštěva probíhala,\n• sdělíte, jaké pocity ve vás návštěva vyvolala a proč.",
        "requirements": [
          "R1: napíšete, co jste právě dělal/ dělala, když se nečekaná návštěva objevila,",
          "R2: uvedete, kdo vás nečekaně navštívil,",
          "R3: budete vypravovat, jak návštěva probíhala,",
          "R4: sdělíte, jaké pocity ve vás návštěva vyvolala a proč."
        ],
        "sourceFile": "Narration 2.docx",
        "isPlaceholder": false
      }
    ],
    "complaint": [
      {
        "id": "practice-complaint-1",
        "set": "practice",
        "genre": "complaint",
        "number": 1,
        "title": "Cvičná sada – Complaint 1 – Hostel accommodation",
        "taskText": "Představte si, že jste byli ubytováni v hostelu během školního výletu do zahraničí. Bohužel ubytování neodpovídalo inzerované nabídce. Napište vedení hostu stížnost na téma Problems with Hostel Accommodation v rozsahu 200–250 slov, ve které:\nPovinné body zadání:\n• popíšete, jaké ubytování vám bylo slíbeno, a co jste skutečně obdrželi,\n• uvedete konkrétní problémy (např. čistota, hluk, vybavení pokoje),\n• vysvětlíte, jak vás situace ovlivnila,\n• navrhnete, jak by se měl hostel zachovat (náhrada, omluva apod.).",
        "requirements": [
          "R1: popíšete, jaké ubytování vám bylo slíbeno, a co jste skutečně obdrželi,",
          "R2: uvedete konkrétní problémy (např. čistota, hluk, vybavení pokoje),",
          "R3: vysvětlíte, jak vás situace ovlivnila,",
          "R4: navrhnete, jak by se měl hostel zachovat (náhrada, omluva apod.)."
        ],
        "sourceFile": "complaint 1.docx",
        "isPlaceholder": false
      },
      {
        "id": "practice-complaint-2",
        "set": "practice",
        "genre": "complaint",
        "number": 2,
        "title": "Cvičná sada – Complaint 2 – Online order",
        "taskText": "Objednali jste si online elektroniku (např. sluchátka, powerbanku, mobilní příslušenství), ale s dodávkou nastaly velké problémy. Napište stížnost zákaznickému servisu e-shopu na téma Problems with an Online Order v rozsahu 200–250 slov, ve které:\nPovinné body zadání:\n• popíšete, co jste si objednali, a co jste obdrželi (nebo neobdrželi),\n• vysvětlíte, proč jste s produktem či službou nespokojeni,\n• uvedete, jaké komplikace vám to způsobilo,\n• napíšete, jakou nápravu požadujete (výměnu, vrácení peněz, slevu apod.).",
        "requirements": [
          "R1: popíšete, co jste si objednali, a co jste obdrželi (nebo neobdrželi),",
          "R2: vysvětlíte, proč jste s produktem či službou nespokojeni,",
          "R3: uvedete, jaké komplikace vám to způsobilo,",
          "R4: napíšete, jakou nápravu požadujete (výměnu, vrácení peněz, slevu apod.)."
        ],
        "sourceFile": "complaint 2.docx",
        "isPlaceholder": false
      },
      {
        "id": "practice-complaint-3",
        "set": "practice",
        "genre": "complaint",
        "number": 3,
        "title": "Cvičná sada – Complaint 3 – Public transport",
        "taskText": "Cestovali jste autobusem nebo vlakem na důležitou akci (koncert, přijímací zkoušky, sportovní utkání), ale cesta probíhala velmi problematicky. Napište stížnost dopravní společnosti na téma Problems with Public Transport v rozsahu 200–250 slov, ve které:\nPovinné body zadání:\n• uvedete, kdy a kam jste cestovali,\n• popíšete konkrétní problémy (zpoždění, nefunkční klimatizace, chybějící informace, chování personálu),\n• vysvětlíte, jaké následky pro vás problémy měly,\n• navrhnete, jak by společnost měla situaci vyřešit.",
        "requirements": [
          "R1: uvedete, kdy a kam jste cestovali,",
          "R2: popíšete konkrétní problémy (zpoždění, nefunkční klimatizace, chybějící informace, chování personálu),",
          "R3: vysvětlíte, jaké následky pro vás problémy měly,",
          "R4: navrhnete, jak by společnost měla situaci vyřešit."
        ],
        "sourceFile": "complaint 3.docx",
        "isPlaceholder": false
      }
    ],
    "motivation": [
      {
        "id": "practice-motivation-1",
        "set": "practice",
        "genre": "motivation",
        "number": 1,
        "title": "Cvičná sada – Motivation letter 1 – Environmental project in Scotland",
        "taskText": "Na vývěsce ve škole jste viděl/a následující nabídku:\nVolunteer needed for an environmental project in Scotland\nWe are organizing a two-month summer project focused on protecting local forests and rivers. Volunteers will help with tree planting, cleaning river banks, and organizing workshops for local children.\nIf interested, send us your covering letter.\nNapište motivační dopis v rozsahu 200–250 slov, ve kterém:\nPovinné body zadání:\n• uvedete, proč píšete,\n• stručně se představíte a popíšete své zájmy a zkušenosti s prací v přírodě,\n• vysvětlíte, proč byste byl/a dobrým kandidátem,\n• požádáte o více informací týkajících se ubytování a stravy.",
        "requirements": [
          "R1: uvedete, proč píšete,",
          "R2: stručně se představíte a popíšete své zájmy a zkušenosti s prací v přírodě,",
          "R3: vysvětlíte, proč byste byl/a dobrým kandidátem,",
          "R4: požádáte o více informací týkajících se ubytování a stravy."
        ],
        "sourceFile": "Motivation letter 1.docx",
        "isPlaceholder": false
      },
      {
        "id": "practice-motivation-2",
        "set": "practice",
        "genre": "motivation",
        "number": 2,
        "title": "Cvičná sada – Motivation letter 2 – Adventure Park, Austria",
        "taskText": "Na internetu jste našel/a tento inzerát:\nSummer jobs at Adventure Park, Austria\nWe are looking for enthusiastic young people to work as activity assistants in our adventure park. Duties include helping visitors, supervising children, and organizing games.\nIf interested, send us your covering letter.\nNapište motivační dopis v rozsahu 200–250 slov, ve kterém:\nPovinné body zadání:\n• uvedete, proč píšete,\n• popíšete své zájmy a zkušenosti, které se k práci hodí (sport, hry, práce s dětmi),\n• vysvětlíte, proč jste pro tuto pozici vhodný/á kandidát/ka,\n• sdělíte, kdy byste mohl/a nastoupit do zaměstnání.",
        "requirements": [
          "R1: uvedete, proč píšete,",
          "R2: popíšete své zájmy a zkušenosti, které se k práci hodí (sport, hry, práce s dětmi),",
          "R3: vysvětlíte, proč jste pro tuto pozici vhodný/á kandidát/ka,",
          "R4: sdělíte, kdy byste mohl/a nastoupit do zaměstnání."
        ],
        "sourceFile": "Motivation letter 2.docx",
        "isPlaceholder": false
      }
    ]
  },
  "exam": {
    "opinion": [
      {
        "id": "exam-opinion-1",
        "set": "exam",
        "genre": "opinion",
        "number": 1,
        "title": "Ostrá maturitní verze – Opinion essay 1 – Internet and Enjoying Life",
        "taskText": "Napište opinion essay na téma Do we really need the internet to enjoy life to the full? v rozsahu 200-250 slov, ve které:\nPovinné body zadání:\n• stručně představte roli internetu v každodenním životě a uveďte, že lidé mají na jeho „nezbytnost“ různé názory,\n• jasně vyjádřete svůj názor už v úvodu (souhlas / nesouhlas / do jaké míry),\n• uveďte 2–3 hlavní důvody a příklady, které váš názor podporují (např. komunikace, informace, zábava, studium/práce),\n• krátce zmiňte jeden protinázor a vysvětlete, proč s ním úplně nesouhlasíte,\n• v závěru shrňte argumenty a jednoznačně potvrďte svůj postoj.",
        "requirements": [
          "R1: stručně představte roli internetu v každodenním životě a uveďte, že lidé mají na jeho „nezbytnost“ různé názory,",
          "R2: jasně vyjádřete svůj názor už v úvodu (souhlas / nesouhlas / do jaké míry),",
          "R3: uveďte 2–3 hlavní důvody a příklady, které váš názor podporují (např. komunikace, informace, zábava, studium/práce),",
          "R4: krátce zmiňte jeden protinázor a vysvětlete, proč s ním úplně nesouhlasíte,",
          "R5: v závěru shrňte argumenty a jednoznačně potvrďte svůj postoj."
        ],
        "sourceFile": "opinion essay 1(2).docx",
        "isPlaceholder": false
      },
      {
        "id": "exam-opinion-2",
        "set": "exam",
        "genre": "opinion",
        "number": 2,
        "title": "Ostrá maturitní verze – Opinion essay 2 – Individuals and the Environment",
        "taskText": "Napište opinion essay na téma There is little that individuals can do to help the environment. Do you agree? v rozsahu 200-250 slov, ve které:\nPovinné body zadání:\n• stručně uveďte téma ochrany životního prostředí a naznačte, že se vedou debaty o roli jednotlivců ve srovnání s vládami a velkými firmami,\n• jasně vyjádřete svůj postoj už v úvodu (souhlasíte / nesouhlasíte / do jaké míry),\n• podpořte svůj názor 2–3 argumenty a příklady,\n• stručně zmiňte, že někteří lidé mají opačný názor, a vysvětlete, proč s ním nesouhlasíte,\n• v závěru své myšlenky shrňte a jednoznačně svůj názor potvrďte.",
        "requirements": [
          "R1: stručně uveďte téma ochrany životního prostředí a naznačte, že se vedou debaty o roli jednotlivců ve srovnání s vládami a velkými firmami,",
          "R2: jasně vyjádřete svůj postoj už v úvodu (souhlasíte / nesouhlasíte / do jaké míry),",
          "R3: podpořte svůj názor 2–3 argumenty a příklady,",
          "R4: stručně zmiňte, že někteří lidé mají opačný názor, a vysvětlete, proč s ním nesouhlasíte,",
          "R5: v závěru své myšlenky shrňte a jednoznačně svůj názor potvrďte."
        ],
        "sourceFile": "opinion essay 2(1).docx",
        "isPlaceholder": false
      }
    ],
    "for_against": [
      {
        "id": "exam-for_against-1",
        "set": "exam",
        "genre": "for_against",
        "number": 1,
        "title": "Ostrá maturitní verze – For and against essay 1 – Being Your Own Boss",
        "taskText": "Napište for and against essay na téma The Advantages and Disadvantages of Being Your Own Boss v rozsahu 200-250 slov, ve které:\nPovinné body zadání:\n• představte téma podnikání a myšlenku „být sám sobě šéfem“, zamyslete se nad tím, proč je tento životní styl pro některé lidi lákavý,\n• uveďte výhody podnikání, můžete doplnit konkrétní příklady ze života,\n• upozorněte na nevýhody, opět je vhodné uvést příklady nebo osobní úvahy,\n• shrňte hlavní myšlenky, vyjádřete svůj osobní názor – zda byste chtěli být sami sobě šéfem, nebo byste raději pracovali pro někoho jiného, a proč.",
        "requirements": [
          "R1: představte téma podnikání a myšlenku „být sám sobě šéfem“, zamyslete se nad tím, proč je tento životní styl pro některé lidi lákavý,",
          "R2: uveďte výhody podnikání, můžete doplnit konkrétní příklady ze života,",
          "R3: upozorněte na nevýhody, opět je vhodné uvést příklady nebo osobní úvahy,",
          "R4: shrňte hlavní myšlenky, vyjádřete svůj osobní názor – zda byste chtěli být sami sobě šéfem, nebo byste raději pracovali pro někoho jiného, a proč."
        ],
        "sourceFile": "for and against essay 1(2).docx",
        "isPlaceholder": false
      },
      {
        "id": "exam-for_against-2",
        "set": "exam",
        "genre": "for_against",
        "number": 2,
        "title": "Ostrá maturitní verze – For and against essay 2 – Homework-Free Schools",
        "taskText": "Napište for and against essay, na téma Should Schools Be Homework-Free? v rozsahu 200-250 slov, ve které:\nPovinné body zadání:\n• představte téma domácích úkolů a zmiňte, že se o jejich smyslu často diskutuje,\n• uveďte argumenty pro domácí úkoly,\n• upozorněte na argumenty proti domácím úkolům, je vhodné uvést příklady nebo osobní úvahy,\n• shrňte, co přinášejí i co berou, vyjádřete svůj názor – zda by podle vás měla škola domácí úkoly omezit, zrušit nebo ponechat.",
        "requirements": [
          "R1: představte téma domácích úkolů a zmiňte, že se o jejich smyslu často diskutuje,",
          "R2: uveďte argumenty pro domácí úkoly,",
          "R3: upozorněte na argumenty proti domácím úkolům, je vhodné uvést příklady nebo osobní úvahy,",
          "R4: shrňte, co přinášejí i co berou, vyjádřete svůj názor – zda by podle vás měla škola domácí úkoly omezit, zrušit nebo ponechat."
        ],
        "sourceFile": "for and against essay 2(2).docx",
        "isPlaceholder": false
      }
    ],
    "review": [
      {
        "id": "exam-review-1",
        "set": "exam",
        "genre": "review",
        "number": 1,
        "title": "Ostrá maturitní verze – Review 1 – Product Review",
        "taskText": "Napište recenzi výrobku v rozsahu 200–250 slov, ve které:\nPovinné body zadání:\n• představíte produkt, který vlastníte nebo jste nedávno vyzkoušeli (např. fén, chytré hodinky, sportovní vybavení),\n• popíšete jeho hlavní funkce a design,\n• zhodnotíte silné i slabé stránky produktu (např. kvalita, spolehlivost, cena, jednoduchost použití),\n• vyjádříte, zda byste tento produkt doporučili ostatním uživatelům a proč.",
        "requirements": [
          "R1: představíte produkt, který vlastníte nebo jste nedávno vyzkoušeli (např. fén, chytré hodinky, sportovní vybavení),",
          "R2: popíšete jeho hlavní funkce a design,",
          "R3: zhodnotíte silné i slabé stránky produktu (např. kvalita, spolehlivost, cena, jednoduchost použití),",
          "R4: vyjádříte, zda byste tento produkt doporučili ostatním uživatelům a proč."
        ],
        "sourceFile": "review 1(2).docx",
        "isPlaceholder": false
      },
      {
        "id": "exam-review-2",
        "set": "exam",
        "genre": "review",
        "number": 2,
        "title": "Ostrá maturitní verze – Review 2 – Hotel Review",
        "taskText": "Napište recenzi hotelu, který jste navštívili, v rozsahu 200–250 slov, ve které:\nPovinné body zadání:\n• představíte hotel, jeho polohu a typ (např. luxusní hotel u moře, horský penzion, městský hotel),\n• popíšete vybavení a služby (pokoje, restaurace, wellness, Wi-Fi, personál),\n• zhodnotíte klady i zápory pobytu (např. čistota, cena, kvalita jídla, dostupnost),\n• uvedete, zda byste tento hotel doporučili ostatním a proč.",
        "requirements": [
          "R1: představíte hotel, jeho polohu a typ (např. luxusní hotel u moře, horský penzion, městský hotel),",
          "R2: popíšete vybavení a služby (pokoje, restaurace, wellness, Wi-Fi, personál),",
          "R3: zhodnotíte klady i zápory pobytu (např. čistota, cena, kvalita jídla, dostupnost),",
          "R4: uvedete, zda byste tento hotel doporučili ostatním a proč."
        ],
        "sourceFile": "review 2(2).docx",
        "isPlaceholder": false
      }
    ],
    "narration": [
      {
        "id": "exam-narration-1",
        "set": "exam",
        "genre": "narration",
        "number": 1,
        "title": "Ostrá maturitní verze – Narration 1 – Journey by Public Transport",
        "taskText": "Rozhodla/a jste se napsat vypravování do školního anglického časopisu o tom, co se přihodilo během vaší cesty dopravní prostředkem.\nNapište vypravování v rozsahu 200-250 slov, ve kterém\nPovinné body zadání:\n• uvedete kdy, kde a jakým dopravním prostředkem jste cestoval/a,\n• budete vypravovat o tom, co se v průběhu vaší cesty dopravním prostředkem přihodilo,\n• popíšete pocity, které ve vás tato příhoda vyvolala,\n• uvedete, zda byste tento dopravní prostředek doporučili ostatním a proč.",
        "requirements": [
          "R1: uvedete kdy, kde a jakým dopravním prostředkem jste cestoval/a,",
          "R2: budete vypravovat o tom, co se v průběhu vaší cesty dopravním prostředkem přihodilo,",
          "R3: popíšete pocity, které ve vás tato příhoda vyvolala,",
          "R4: uvedete, zda byste tento dopravní prostředek doporučili ostatním a proč."
        ],
        "sourceFile": "Narration 1(2).docx",
        "isPlaceholder": false
      },
      {
        "id": "exam-narration-2",
        "set": "exam",
        "genre": "narration",
        "number": 2,
        "title": "Ostrá maturitní verze – Narration 2 – A Time I Helped Someone",
        "taskText": "Napište vypravování na téma: “A Time I helped Someone“ v rozsahu 200–250 slov, ve kterém:\nPovinné body zadání:\n• uvedete, kdy a kde se celá situace odehrála,\n• popíšete konkrétní problém nebo obtíže druhé osoby,\n• popíšete, jak přesně jste druhé osobě pomohl/a, jaké překážky jste musel/a překonat,\n• napíšete, jak celá situace dopadla a jak jste se po poskytnutí pomoci cítil/a.",
        "requirements": [
          "R1: uvedete, kdy a kde se celá situace odehrála,",
          "R2: popíšete konkrétní problém nebo obtíže druhé osoby,",
          "R3: popíšete, jak přesně jste druhé osobě pomohl/a, jaké překážky jste musel/a překonat,",
          "R4: napíšete, jak celá situace dopadla a jak jste se po poskytnutí pomoci cítil/a."
        ],
        "sourceFile": "Narration 2(2).docx",
        "isPlaceholder": false
      }
    ],
    "complaint": [
      {
        "id": "exam-complaint-1",
        "set": "exam",
        "genre": "complaint",
        "number": 1,
        "title": "Ostrá maturitní verze – Complaint 1 – Restaurant",
        "taskText": "Se spolužáky jste oslavovali narozeniny v restauraci. Bohužel služby i jídlo byly velmi nekvalitní. Napište manažerovi restaurace stížnost na téma Problems in a Restaurant v rozsahu 200–250 slov, ve které:\nPovinné body zadání:\n• popíšete, proč jste si restauraci vybrali,\n• vysvětlíte, co bylo v nepořádku (např. chování personálu, kvalita jídla, dlouhé čekání),\n• popíšete, jak jste se cítili vy i ostatní hosté,\n• navrhnete, co by měla restaurace změnit, aby se to neopakovalo.",
        "requirements": [
          "R1: popíšete, proč jste si restauraci vybrali,",
          "R2: vysvětlíte, co bylo v nepořádku (např. chování personálu, kvalita jídla, dlouhé čekání),",
          "R3: popíšete, jak jste se cítili vy i ostatní hosté,",
          "R4: navrhnete, co by měla restaurace změnit, aby se to neopakovalo."
        ],
        "sourceFile": "complaint 1(2).docx",
        "isPlaceholder": false
      },
      {
        "id": "exam-complaint-2",
        "set": "exam",
        "genre": "complaint",
        "number": 2,
        "title": "Ostrá maturitní verze – Complaint 2 – Music Festival",
        "taskText": "V létě jste navštívili svůj oblíbený letní festival. Neproběhl ale podle vašich představ. Napište stížnost na téma Problems at a Music Festival v rozsahu 200–250 slov, ve které:\nPovinné body zadání:\n• uvedete, jakou akci jste navštívili a proč jste se na ni těšili,\n• popíšete, co bylo špatně zorganizováno (např. dlouhé fronty, špatný zvuk, chování personálu, drahé občerstvení),\n• vysvětlíte, jak vás tato situace zklamala nebo omezila,\n• navrhnete, jak by organizátoři měli akci zlepšit do budoucna.",
        "requirements": [
          "R1: uvedete, jakou akci jste navštívili a proč jste se na ni těšili,",
          "R2: popíšete, co bylo špatně zorganizováno (např. dlouhé fronty, špatný zvuk, chování personálu, drahé občerstvení),",
          "R3: vysvětlíte, jak vás tato situace zklamala nebo omezila,",
          "R4: navrhnete, jak by organizátoři měli akci zlepšit do budoucna."
        ],
        "sourceFile": "complaint 2(2).docx",
        "isPlaceholder": false
      }
    ],
    "motivation": [
      {
        "id": "exam-motivation-1",
        "set": "exam",
        "genre": "motivation",
        "number": 1,
        "title": "Ostrá maturitní verze – Motivation letter 1 – Waiter/Waitress in Prague",
        "taskText": "Na stránce jobsworld.com jste našel/a tuto nabídku:\nWaiter/Waitress wanted for an Italian restaurant in Prague\nWe are looking for energetic and polite staff to join our team. Good knowledge of English required, knowledge of Italian is an advantage.\nIf interested, please send your covering letter.\nNapište motivační dopis v rozsahu 200–250 slov, ve kterém:\nPovinné body zadání:\n• uvedete, proč píšete,\n• popíšete své zkušenosti s prací v restauraci nebo s komunikací s lidmi,\n• vysvětlíte, proč si myslíte, že byste byl/a vhodným kandidátem,\n• navrhnete termín, kdy můžete přijít na pohovor.",
        "requirements": [
          "R1: uvedete, proč píšete,",
          "R2: popíšete své zkušenosti s prací v restauraci nebo s komunikací s lidmi,",
          "R3: vysvětlíte, proč si myslíte, že byste byl/a vhodným kandidátem,",
          "R4: navrhnete termín, kdy můžete přijít na pohovor."
        ],
        "sourceFile": "Motivation letter 1(2).docx",
        "isPlaceholder": false
      },
      {
        "id": "exam-motivation-2",
        "set": "exam",
        "genre": "motivation",
        "number": 2,
        "title": "Ostrá maturitní verze – Motivation letter 2 – Receptionist in Dublin",
        "taskText": "Na internetu jste našel/a tento inzerát:\nReceptionist wanted for a language school in Dublin\nWe are looking for a friendly and reliable person to work at the reception desk of our international language school. Duties include answering phone calls, helping students with information, and assisting teachers with basic administration.\nIf interested, send us your covering letter.\nNapište motivační dopis v rozsahu 200–250 slov, ve kterém:\nPovinné body zadání:\n• uvedete, proč píšete,\n• vysvětlíte, proč vás práce zajímá a proč se na tuto pozici hodíte,\n• uvedete, jaké máte zkušenosti s prací s lidmi nebo s administrativou,\n• sdělíte, kdy byste mohl/a nastoupit do zaměstnání.",
        "requirements": [
          "R1: uvedete, proč píšete,",
          "R2: vysvětlíte, proč vás práce zajímá a proč se na tuto pozici hodíte,",
          "R3: uvedete, jaké máte zkušenosti s prací s lidmi nebo s administrativou,",
          "R4: sdělíte, kdy byste mohl/a nastoupit do zaměstnání."
        ],
        "sourceFile": "Motivation letter 2(2).docx",
        "isPlaceholder": false
      }
    ]
  }
};
function cloneTaskData(obj){ return JSON.parse(JSON.stringify(obj)); }
function placeholderTask(setId, genreId, number){
  const genre = GENRES.find(g => g.id === genreId);
  const setLabel = setId === 'exam' ? 'Ostrá maturitní verze' : 'Cvičná sada';
  const genreLabel = genre ? genre.label : genreId;
  return {
    id: `${setId}-${genreId}-${number}`,
    set: setId,
    genre: genreId,
    number: number,
    title: `${setLabel} – ${genreLabel} ${number}`,
    taskText: '',
    requirements: [],
    sourceFile: '',
    isPlaceholder: true
  };
}
function makeDefaultTasks(){
  const data = cloneTaskData(EMBEDDED_TASKS);
  for(const setId of ['practice','exam']){
    if(!data[setId]) data[setId] = {};
    for(const g of GENRES){
      if(!Array.isArray(data[setId][g.id]) || data[setId][g.id].length === 0){
        data[setId][g.id] = [placeholderTask(setId,g.id,1), placeholderTask(setId,g.id,2)];
      }
    }
  }
  return data;
}

/* 15-series-domain.js */
const SERIES_MAX_WORKS=20;
const SERIES_TYPICAL_WORKS=15;
const DAILY_USAGE_KEY='maturitniHodnotitelDailyUsageV110';
function localIsoDate(date=new Date()){const y=date.getFullYear();const m=String(date.getMonth()+1).padStart(2,'0');const d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`;}
const GEMINI_PRICE_TABLE=Object.freeze({
  'gemini-3.5-flash':{standard:{input:1.50,output:9.00},batch:{input:0.75,output:4.50}},
  'gemini-3.1-flash-lite':{standard:{input:0.25,output:1.50},batch:{input:0.125,output:0.75}},
  'gemini-3-flash-preview':{standard:{input:0.50,output:3.00},batch:{input:0.25,output:1.50}}
});
function defaultSeriesState(){return {id:'SERIE_'+localIsoDate().replace(/-/g,'')+'_'+Math.random().toString(36).slice(2,6).toUpperCase(),name:'',className:'',assessmentDate:localIsoDate(),teacherName:'Daniel Baláž',rubricVersion:RUBRIC_VERSION,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),processingMode:'immediate',queueRpm:5,batchJob:null,status:'draft'};}
function defaultDistributionSettings(){return {appsScriptUrl:'',sharedSecret:'',mode:'drafts',subjectTemplate:'Zpětná vazba – {series}',senderName:'Daniel Baláž',includeScore:true,includeOriginal:false};}
function ensureBatchStudentShape(s,i=0){if(!s||typeof s!=='object')return s;s.code=s.code||`STUDENT_${String(i+1).padStart(3,'0')}`;s.identity=s.identity||'';s.displayName=s.displayName||s.identity||'';s.email=s.email||'';s.rosterId=s.rosterId||'';s.text=s.text||'';s.files=Array.isArray(s.files)?s.files:[];s.sourceFiles=Array.isArray(s.sourceFiles)?s.sourceFiles:[];s.pairingStatus=s.pairingStatus||((s.email||s.rosterId)?'paired':'unpaired');s.transcriptConfirmed=Boolean(s.transcriptConfirmed||(!s.files.length&&String(s.text).trim()));s.transcriptStatus=s.transcriptStatus||((s.files.length&&!s.transcriptConfirmed)?'needs-review':'ready');s.status=s.status||'čeká';s.approved=Boolean(s.approved);s.deliveryStatus=s.deliveryStatus||'not-ready';s.validation=s.validation||null;s.usage=s.usage||{promptTokens:0,outputTokens:0,totalTokens:0,costUsd:0};return s;}
function ensureBatchResultShape(r){if(!r||typeof r!=='object')return r;r.approved=Boolean(r.approved);r.deliveryStatus=r.deliveryStatus||'not-ready';r.validation=r.validation||null;r.usage=r.usage||{promptTokens:0,outputTokens:0,totalTokens:0,costUsd:0};r.finalEvaluation=r.finalEvaluation||null;return r;}
function ensureWorkflowState(){if(!state.series||typeof state.series!=='object')state.series=defaultSeriesState();state.series=Object.assign(defaultSeriesState(),state.series,{rubricVersion:RUBRIC_VERSION});if(!Array.isArray(state.roster))state.roster=[];if(!state.distribution||typeof state.distribution!=='object')state.distribution=defaultDistributionSettings();state.distribution=Object.assign(defaultDistributionSettings(),state.distribution);if(!state.usage||typeof state.usage!=='object')state.usage={promptTokens:0,outputTokens:0,totalTokens:0,estimatedCostUsd:0,requests:0};if(!state.backend||typeof state.backend!=='object')state.backend={mode:'browser',baseUrl:'',accessToken:'',lastHealth:null};if(!state.processingMode)state.processingMode=state.series.processingMode||'immediate';if(!Number.isFinite(Number(state.queueRpm)))state.queueRpm=5;if(!state.batchJob&&state.series.batchJob)state.batchJob=state.series.batchJob;batchStudents.forEach(ensureBatchStudentShape);batchResults.forEach(ensureBatchResultShape);}
function seriesDisplayName(){ensureWorkflowState();return state.series.name||[state.series.className,state.taskTitle||currentTask().title].filter(Boolean).join(' – ')||'Hodnocení maturitních slohů';}
function syncSeriesFromFields(){ensureWorkflowState();state.series.name=$('seriesName')?.value.trim()||'';state.series.className=$('seriesClass')?.value.trim()||'';state.series.assessmentDate=$('seriesDate')?.value||state.series.assessmentDate;state.series.teacherName=$('seriesTeacher')?.value.trim()||'';state.queueRpm=Math.max(1,Math.min(30,Number($('queueRpm')?.value)||5));state.series.queueRpm=state.queueRpm;state.series.updatedAt=new Date().toISOString();}
function syncSeriesToFields(){ensureWorkflowState();if($('seriesName'))$('seriesName').value=state.series.name||'';if($('seriesClass'))$('seriesClass').value=state.series.className||'';if($('seriesDate'))$('seriesDate').value=state.series.assessmentDate||'';if($('seriesTeacher'))$('seriesTeacher').value=state.series.teacherName||'';if($('queueRpm'))$('queueRpm').value=state.queueRpm||5;if($('rubricVersionLabel'))$('rubricVersionLabel').textContent=rubricVersionLabel();}
function priceForModel(model,mode='standard'){const key=Object.keys(GEMINI_PRICE_TABLE).find(k=>String(model||'').startsWith(k))||'gemini-3.5-flash';return GEMINI_PRICE_TABLE[key]?.[mode]||GEMINI_PRICE_TABLE['gemini-3.5-flash'][mode];}
function estimateUsageCost(promptTokens,outputTokens,model=resolveGeminiModel(),mode='standard'){const p=priceForModel(model,mode);return ((Number(promptTokens)||0)/1e6)*p.input+((Number(outputTokens)||0)/1e6)*p.output;}
function approximatePromptTokensForStudent(student){try{return estimateTokens(buildPrompt(student));}catch(_){return 9000;}}
function estimateSeriesBudget(){const ready=batchStudents.filter(s=>String(s.text||'').trim()||(s.files||[]).length);const input=ready.reduce((a,s)=>a+approximatePromptTokensForStudent(s),0);const output=ready.length*(state.evalMode==='deep'?5500:3000);const mode=state.processingMode==='batch'?'batch':'standard';return {count:ready.length,promptTokens:input,outputTokens:output,costUsd:estimateUsageCost(input,output,resolveGeminiModel(),mode)};}
function registerUsage(usage,mode='standard'){ensureWorkflowState();const promptTokens=Number(usage?.promptTokenCount||usage?.prompt_tokens||usage?.promptTokens)||0;const outputTokens=Number(usage?.candidatesTokenCount||usage?.output_tokens||usage?.outputTokens)||0;const totalTokens=Number(usage?.totalTokenCount)||promptTokens+outputTokens;const costUsd=estimateUsageCost(promptTokens,outputTokens,resolveGeminiModel(),mode);const item={promptTokens,outputTokens,totalTokens,costUsd};state.usage.promptTokens+=promptTokens;state.usage.outputTokens+=outputTokens;state.usage.totalTokens+=totalTokens;state.usage.estimatedCostUsd+=costUsd;state.usage.requests+=1;const day=getTodayUsage();day.promptTokens+=promptTokens;day.outputTokens+=outputTokens;day.totalTokens+=totalTokens;day.costUsd+=costUsd;day.requests+=1;safeLocalSet(DAILY_USAGE_KEY,JSON.stringify(day));return item;}
function getTodayUsage(){const today=localIsoDate();try{const x=JSON.parse(safeLocalGet(DAILY_USAGE_KEY)||'{}');if(x.date===today)return Object.assign({date:today,promptTokens:0,outputTokens:0,totalTokens:0,costUsd:0,requests:0},x);}catch(_){}return {date:today,promptTokens:0,outputTokens:0,totalTokens:0,costUsd:0,requests:0};}
function formatUsd(value){return new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:3}).format(Number(value)||0);}

/* 20-state-ui.js */
let tasks = loadTasks();
let state = {
  step:0, appMode:'advanced', workMode:'offline', set:'practice', genre:'opinion', taskIndex:0, evalMode:'deep', outputStyle:'teacher', resultView:'teacher',
  taskTitle:'', taskText:'', taskReqs:'', studentText:'', studentIdentity:'', studentCode:'STUDENT_001', extraPii:'', inputMode:'single', privacyMode:'strict', privacyApprovedHash:'', result:'', teacherReview:{sections:{}, score_total:null, grade:null, note:'', verified:false, verifiedAt:''}
};
let abortController = null;
let geminiApiKey = '';
let geminiKeyScope = 'session';
let geminiModel = GEMINI_MODEL_DEFAULT;
let geminiAvailableModels = [];
let geminiAvailableModelsApiVersion = '';
let attachedFiles = [];
let batchStudents = [];
let batchResults = [];
let showRaw = false;
const $ = id => document.getElementById(id);

const RESULT_JSON_START = '=== MACHINE_SUMMARY_JSON ===';
const RESULT_JSON_END = '=== END_MACHINE_SUMMARY_JSON ===';
const RESULT_FEEDBACK_START = '=== FEEDBACK_MARKDOWN ===';
const RESULT_VIEW_MARKERS = {teacher:'=== TEACHER_DETAIL ===', student:'=== STUDENT_FEEDBACK ===', record:'=== RECORD_TABLE ==='};
const RESULT_SECTION_KEYS = ['zadani_a_rozsah','odstavce_a_koherence','lexikalni_a_spellingove_chyby','gramaticke_chyby','obsah','ptn_a_koheze','uroven_slovni_zasoby','uroven_gramatiky'];
const RESULT_SECTION_LABELS = {zadani_a_rozsah:'Zadání a rozsah',odstavce_a_koherence:'Odstavce a koherence',lexikalni_a_spellingove_chyby:'Lexikální a spellingové chyby',gramaticke_chyby:'Gramatické chyby',obsah:'Obsah',ptn_a_koheze:'PTN a koheze',uroven_slovni_zasoby:'Úroveň slovní zásoby',uroven_gramatiky:'Úroveň gramatiky'};
const RESULT_SUMMARY_INSTRUCTIONS = `VÝSTUPNÍ FORMÁT – STRUKTUROVANÝ SOUHRN + ČITELNÁ ZPĚTNÁ VAZBA:
1) Úplně na začátek odpovědi vlož validní JSON mezi přesné značky:
=== MACHINE_SUMMARY_JSON ===
{
  "schema_version": "1.0",
  "student_code": "STUDENT_001",
  "final_word_count": 0,
  "raw_word_count": 0,
  "deducted_word_count": 0,
  "score_total": 0,
  "grade": 5,
  "fail_signal": false,
  "fail_reason": null,
  "sections": {
    "zadani_a_rozsah": 0,
    "odstavce_a_koherence": 0,
    "lexikalni_a_spellingove_chyby": 0,
    "gramaticke_chyby": 0,
    "obsah": 0,
    "ptn_a_koheze": 0,
    "uroven_slovni_zasoby": 0,
    "uroven_gramatiky": 0
  },
  "ai_language_estimate_percent": 0,
  "json_confidence": "vysoká"
}
=== END_MACHINE_SUMMARY_JSON ===
2) JSON musí být validní: žádné komentáře, žádné trailing commas, žádný Markdown ani code fence uvnitř JSON bloku.
3) Pokud hodnotíš pouze počet slov v režimu NEHODNOŤ, nech score_total, grade a sections jako null, ale final_word_count/raw_word_count/deducted_word_count vyplň.
4) Hned po JSON bloku vlož značku:
=== FEEDBACK_MARKDOWN ===
5) Teprve potom napiš čitelnou zpětnou vazbu v Markdownu pro učitele.
6) Čitelná zpětná vazba nesmí měnit body oproti JSONu. Pokud v textu uvedeš body/známku/slova, musí přesně odpovídat JSONu.
7) Nepiš HTML. Nepiš programátorské code fences. JSON blok je jediná strojově čitelná část výstupu.
8) Po značce === FEEDBACK_MARKDOWN === musí následovat přesně tři oddělené Markdown sekce v tomto pořadí:
=== TEACHER_DETAIL ===
plná učitelská zpětná vazba podle rubriky
=== STUDENT_FEEDBACK ===
stručná a srozumitelná zpětná vazba pro studenta bez interních technických poznámek a bez domněnek o AI jako obvinění
=== RECORD_TABLE ===
tabulka pro evidenci: body v 8 kategoriích, součet, známka, final_word_count, fail signál a 3–6 hlavních důvodů.
9) Všechny tři sekce vycházejí ze stejného hodnocení a nesmí si odporovat.`;
function toast(msg,type='ok'){
  const el=document.createElement('div'); el.className=`toast ${type==='err'?'err':type==='warn'?'warn':''}`; el.textContent=msg; $('toastStack').appendChild(el);
  setTimeout(()=>el.classList.add('visible'),20); setTimeout(()=>{el.classList.remove('visible'); setTimeout(()=>el.remove(),220)},4200);
}

function safeLocalGet(k){ try{return localStorage.getItem(k)}catch(_){return null} }
function safeLocalSet(k,v){ try{localStorage.setItem(k,v); return true}catch(_){return false} }
function safeLocalRemove(k){ try{localStorage.removeItem(k); return true}catch(_){return false} }
function safeSessionGet(k){ try{return sessionStorage.getItem(k)}catch(_){return null} }
function safeSessionSet(k,v){ try{sessionStorage.setItem(k,v); return true}catch(_){return false} }
function safeSessionRemove(k){ try{sessionStorage.removeItem(k); return true}catch(_){return false} }

let modalReturnFocus=null;
function hideModal(){
  $('uiModal')?.classList.add('hidden');
  const target=modalReturnFocus;
  modalReturnFocus=null;
  if(target&&typeof target.focus==='function'&&document.contains(target)) setTimeout(()=>target.focus(),0);
}
function showModal(title,body,actions){
  const modal=$('uiModal');
  if(modal?.classList.contains('hidden')) modalReturnFocus=document.activeElement;
  $('uiModalTitle').textContent=title;
  $('uiModalBody').innerHTML=body;
  const a=$('uiModalActions');
  a.innerHTML='';
  actions.forEach(x=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='ui-modal-btn '+(x.className||'');
    b.textContent=x.label;
    if(x.id) b.id=x.id;
    if(x.ariaLabel) b.setAttribute('aria-label',x.ariaLabel);
    b.onclick=()=>{ if(x.close!==false) hideModal(); x.onClick&&x.onClick(); };
    a.appendChild(b);
  });
  modal.classList.remove('hidden');
  setTimeout(()=>a.querySelector('button')?.focus(),0);
}
function uiConfirm(body,title='Potvrzení'){ return new Promise(resolve=>showModal(title, escapeHtml(body).replace(/\n/g,'<br>'), [{label:'Zrušit',onClick:()=>resolve(false)},{label:'Potvrdit',className:'primary',onClick:()=>resolve(true)}])); }
function privacyIntroHtml(){ return `<div class="warn-box"><strong>Než začneš hodnotit:</strong> tento nástroj pracuje se studentskými texty, proto je nutné hlídat osobní údaje ještě před odesláním do AI.</div>
<p><span class="privacy-intro-strong">Co nástroj dělá automaticky:</span></p>
<ul class="privacy-intro-list"><li>u textu a Wordu nahrazuje e-maily, telefony, URL, možné rodné číslo a další rozpoznatelné identifikátory; zadané jméno nahrazuje jako celek i po jednotlivých částech dlouhých alespoň tři znaky,</li><li>při dávce přiděluje kódy typu STUDENT_001, STUDENT_002,</li><li>před odesláním spouští kontrolu citlivých údajů a v Privacy režimu zastaví odeslání, pokud něco najde,</li><li>studentské texty, identitu a výsledky ve výchozím stavu neukládá do trvalého úložiště prohlížeče; obnovu citlivé relace je nutné zapnout ručně,</li><li>mapu anonymizace drží jen lokálně v prohlížeči a neposílá ji do Gemini.</li></ul>
<p style="margin-top:10px"><span class="privacy-intro-strong">Co musí udělat uživatel:</span></p>
<ul class="privacy-intro-list"><li>zkontrolovat náhled „co odejde do AI“,</li><li>doplnit do anonymizačního seznamu jména, školu, třídu, město, adresu nebo jiné údaje, které aplikace nemusela poznat; skloňované tvary, přezdívky a varianty jmen je nutné uvést samostatně,</li><li>u fotek a PDF zkontrolovat, zda není jméno vidět přímo v obrázku; jednosouborový nástroj neumí obrázek lokálně spolehlivě začernit,</li><li>neukládat API klíč trvale na sdíleném zařízení,</li><li>zvolit API režim pouze tehdy, když opravdu chceš automatické hodnocení přes Gemini; offline příprava a ruční AI režim API klíč nepotřebují.</li></ul>
<div class="ok-box" style="margin-top:12px"><strong>Doporučený bezpečný postup:</strong> Word nebo vložený text → doplnit jméno a další údaje → spustit kontrolu citlivých údajů → nahradit nebo potvrdit nálezy → zvolit offline / ruční AI / Gemini API podle potřeby.</div>`; }
function showPrivacyIntro(force=false){
  if(!force){ if(safeLocalGet(PRIVACY_ACK_SK)===APP_VERSION) return; }
  showModal('Ochrana osobních údajů a anonymizace', privacyIntroHtml(), [{label:'Rozumím, pokračovat',className:'primary',id:'privacyAckBtn',onClick:()=>{safeLocalSet(PRIVACY_ACK_SK,APP_VERSION)}}]);
}
function showTooltipFor(el){ const tt=$('tooltip'); if(!tt || !el) return; const txt=el.getAttribute('data-tip')||''; if(!txt) return; tt.textContent=txt; tt.classList.add('visible'); const r=el.getBoundingClientRect(); const pad=10; const maxW=Math.min(310, window.innerWidth-24); tt.style.maxWidth=maxW+'px'; let left=Math.min(Math.max(pad, r.left + r.width/2 - maxW/2), window.innerWidth - maxW - pad); let top=r.bottom + 10; tt.style.left=left+'px'; tt.style.top=top+'px'; const tr=tt.getBoundingClientRect(); if(tr.bottom > window.innerHeight - pad){ top=Math.max(pad, r.top - tr.height - 10); tt.style.top=top+'px'; } }
function hideTooltip(){ $('tooltip')?.classList.remove('visible'); }
function initTooltips(){ document.querySelectorAll('.tt-icon[data-tip]').forEach(el=>{ el.setAttribute('aria-label','Nápověda: '+(el.getAttribute('data-tip')||'')); el.addEventListener('mouseenter',()=>showTooltipFor(el)); el.addEventListener('mouseleave',hideTooltip); el.addEventListener('focus',()=>showTooltipFor(el)); el.addEventListener('blur',hideTooltip); el.addEventListener('click',e=>{e.preventDefault(); e.stopPropagation(); const tt=$('tooltip'); if(tt?.classList.contains('visible') && tt.textContent===(el.getAttribute('data-tip')||'')) hideTooltip(); else showTooltipFor(el);}); }); document.addEventListener('click',hideTooltip); window.addEventListener('scroll',hideTooltip,{passive:true}); window.addEventListener('resize',hideTooltip); }

const CHANGELOG_MAX_ENTRIES = 10;
const CHANGELOG = [
  {version:APP_VERSION+' AI STUDIO EDITION', items:['Přidán úplný interaktivní manuál dostupný samostatným tlačítkem 📖 v pravém horním rohu.', 'Manuál se otevírá v nové kartě, takže zachová rozpracovanou hodnoticí sérii a nekoliduje s kontextovými otazníky, ochranou údajů ani deníkem změn.', 'Přímý přístup k manuálu používá stejné oprávnění AI Studia jako Hodnotitel a manuál je součástí offline PWA balíčku.']},
  {version:'1.3.5 AI STUDIO EDITION', items:['Sjednoceno školní logo a název školy s ostatními aplikacemi AI Studia.', 'Autorské údaje v zápatí používají společný dvouřádkový formát celé sady.']},
  {version:'1.3.4 AI STUDIO EDITION', items:['Opraven křehký CI test, který blokoval celé nasazení kvůli volitelnému oznámení AI Studiu.', 'Build a GitHub Pages se spustí i bez volitelného repository dispatch.', 'Tehdejší verzovaná PWA identita řešila cache; ve verzi 1.3.6 byla nahrazena stabilním manifestem.', 'Import seznamu z IS je ověřen pro čárky, středníky, tabulátory i nové řádky.']},
  {version:'1.3.3 AI STUDIO EDITION', items:['Byly zavedeny samostatně pojmenované varianty školního loga; po pozdějším sjednocení se ukázaly jako totožné a verze 1.3.6 je nahradila jediným kanonickým souborem.', 'Tehdejší verzovaný manifest a identita byly ve verzi 1.3.6 nahrazeny stabilním PWA modelem.', 'Instalační ikona používá vycentrovaný motiv štítu, pera a potvrzení v běžné i maskable variantě.', 'Regresní test potvrzuje import 16 e-mailů z jednoho čárkového exportu IS jako 16 samostatných studentů.']},
  {version:'1.3.2 AI STUDIO EDITION', items:['Opraven import skupiny z IS: jeden řádek e-mailů oddělených čárkou nebo středníkem se nyní správně rozdělí na jednotlivé studenty.', 'Import skupiny dostal živý náhled počtu rozpoznaných studentů, podporu kombinovaných oddělovačů, odstranění duplicit a upozornění na chybně zapsané položky.', 'Barevnost hlavního názvu byla sjednocena; zlatá zůstává pouze jako akcent rozhraní.', 'Obnoveno ostré černobílé školní logo bez chybné průhlednosti.', 'PWA ikona byla nahrazena novým vycentrovaným motivem štítu, pera a potvrzení a připravena také pro maskable instalaci.']},
  {version:'1.3.0 AI STUDIO EDITION', items:['Dokončeno Report Studio: formální a studentský vizuální režim, přesný A4 náhled, podpis učitele, bodová mapa osmi kategorií a karty tří priorit.', 'DOCX export je nyní skutečně formátovaný dokument Word se školním logem, styly nadpisů, tabulkami, barevnou hierarchií a podpisem.', 'Přidán automatický revizní miniúkol odvozený z konkrétních chyb a nejslabší hodnocené oblasti.', 'Přidána komentářová banka učitele s vlastními opakovaně použitelnými větami.', 'Chyby se v reportu třídí na kritické, opakující se a jednorázové.', 'Nová kontrola upozorní na rozpor mezi komentářem, kategoriemi, součtem bodů a známkou.', 'Dávkové výsledky doplňuje anonymní třídní analytika bez jmen, kódů, e-mailů a textů.', 'Přidána bezpečně opt-in pseudonymní historie pokroku, která ukládá pouze kód, datum a bodové výsledky; nikdy text práce ani kontakt.', 'Reportové doplňky se propisují do náhledu, TXT, DOCX, tisku/PDF a studentské e-mailové šablony.', 'DOCX import i ZIP/DOCX/XLSX exporty nyní používají lokální knihovnu bez CDN; běžný Word dokument lze načíst i bez internetu.', 'Odstraněny překryté staré generátory reportu, DOCX a PDF; každá kritická exportní funkce má jedinou implementaci.', 'Podpis a vlastní komentáře se bez výslovného povolení citlivého ukládání po zavření aplikace neuchovávají; analytika používá jen schválené validní výsledky a historie jen finálně zkontrolované práce.']},
  {version:'1.2.0 AI STUDIO EDITION', items:['Přepracován studentský i učitelský report do profesionálního školního dokumentu s logem, hlavičkou, výsledkovým panelem, metadaty práce a jasnou vizuální hierarchií.', 'Opraven kritický přenos odečteného počtu slov do strojového souhrnu a exportů.', 'Opraveno pokračování dávky: výsledky ve stavu vyžadujícím kontrolu se už neposílají znovu a lze je korektně vymazat při vědomém restartu.', 'Učitelská ruční korekce jednoho výsledku se už nemůže propsat do reportů ostatních studentů v dávce.', 'Opraven výběr ověřených Gemini modelů, synchronizace jména a e-mailu mezi skupinou a výsledkem a zneplatnění schválení po změně kontaktu.', 'Distribuce nyní vyžaduje syntakticky platný e-mail; neplatné adresy nelze schválit ani odeslat.', 'Studentská zpětná vazba dostala přehlednější strukturu: výsledek, silné stránky, hlavní prostor ke zlepšení, tři další kroky, konkrétní chyby a doporučený postup opravy.', 'Odstraněny nepoužívané legacy funkce a doplněny přístupnější kroky workflow a modální dialogy.']},
  {version:'1.1.0 AI STUDIO EDITION', items:['Přidán kompletní třídní workflow pro série do 20 prací: skupina, import, párování, fronta, kontrola a distribuce.', 'Školní prompt byl převeden do verzované strojově čitelné rubriky; aplikace přepočítává matematické body, FAIL pravidla, výjimku opinion ↔ for-and-against, PTN, pravidlo nuly a známku.', 'Gemini nyní vrací strukturovaný JSON; validační brána kontroluje všech osm sekcí, důkazní mapu, vstupní zámek i skutečný výskyt citací a při chybě provede jeden opravný pokus.', 'Přidán import skupiny z IS, ZIP import a seskupení vícestránkových prací, kontrola přepisu rukopisu a povinné potvrzení učitelem.', 'Přidána okamžitá řízená fronta, úsporné Gemini Batch API, měření tokenů a orientačních nákladů.', 'Přidáno schvalování výsledků učitelem, export distribučního balíku a Gmail bridge pro koncepty, přímé odeslání i kompatibilní přenos v nové kartě.', 'Doplněn kontrakt budoucího školního backendu a bezpečné oddělení klientského a serverového provozu.']},
  {version:'1.0.0 AI STUDIO EDITION', items:['Kompletní produktová přestavba do originálního prostředí Maturitního hodnoticího studia.', 'Zdrojový kód rozdělen do tematických modulů; nasazovací build vytváří čistý app.js a kontroluje kritické vazby.', 'Přidána PWA vrstva, školní logo, jednotné autorství, bezpečnostní dokumentace a živý manifest pro AI Studio.', 'Přidána ochrana přímé adresy přes podepsané oprávnění AI Studia a samostatné ID essay-evaluator.', 'Zachovány a auditovány: anonymizace, dávkové hodnocení, offline/ruční/API režim, tři výstupy, finální kontrola učitele a exporty.']},
  {version:'0.7.9 CHANGELOG LIMIT', items:['Deník změn nově uchovává a zobrazuje maximálně 10 nejnovějších verzí.', 'Starší položky changelogu jsou z aktuálního souboru odstraněny; při další verzi se nejstarší položka z desítky postupně vyřadí.', 'Přidána pojistka CHANGELOG_MAX_ENTRIES, aby se v modálním okně nikdy nezobrazilo více než 10 položek ani při budoucí ruční chybě.']},
];
function latestChangelog(){ return CHANGELOG.slice(0, CHANGELOG_MAX_ENTRIES); }
function showChangelog(){ const items=latestChangelog(); const html=`<p class="small-muted" style="margin-bottom:10px">Zobrazuje se posledních ${items.length} změn. Starší položky se v nových verzích průběžně odstraňují.</p>`+items.map(v=>`<h3 style="color:var(--acc);margin:8px 0 4px">${escapeHtml(v.version)}</h3><ul style="margin-left:18px">${v.items.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul>`).join(''); showModal('Co je nového',html,[{label:'Zavřít',className:'primary'}]); }

function loadTasks(){
  try{ const raw=safeLocalGet(TASK_STORAGE_KEY); if(raw) return mergeTasks(makeDefaultTasks(), JSON.parse(raw)); }catch(e){}
  return makeDefaultTasks();
}
function mergeTasks(base, incoming){
  if(!incoming || typeof incoming !== 'object') return base;
  for(const setId of ['practice','exam']){
    if(!incoming[setId]) continue;
    for(const g of GENRES){
      const arr=incoming[setId][g.id];
      if(Array.isArray(arr) && arr.length){
        base[setId][g.id] = arr.map((item,i) => Object.assign(placeholderTask(setId,g.id,i+1), item||{}));
      }
    }
  }
  return base;
}
function saveTasks(){ safeLocalSet(TASK_STORAGE_KEY, JSON.stringify(tasks)); }
function sensitiveSaveEnabled(){ return safeLocalGet(SENSITIVE_SAVE_PREF_SK)==='1'; }
function purgeLegacySensitiveStorage(){ LEGACY_STATE_KEYS.forEach(k=>safeLocalRemove(k)); }
function clearAllSavedState(){ safeLocalRemove(STORAGE_KEY); safeLocalRemove(SENSITIVE_SAVE_PREF_SK); safeLocalRemove('maturitniHodnotitelPseudonymousHistoryV130'); clearBatchProgress(); purgeLegacySensitiveStorage(); }
function purgeSensitiveSavedState(){
  try{
    const raw=safeLocalGet(STORAGE_KEY); if(raw){ const data=JSON.parse(raw); SENSITIVE_STATE_FIELDS.forEach(k=>{ data[k]=k==='roster'?[]:''; }); if(data.reportSettings)data.reportSettings={...data.reportSettings,signature:'',customComments:[]}; safeLocalSet(STORAGE_KEY, JSON.stringify(data)); }
  }catch(_){}
  safeLocalRemove('maturitniHodnotitelPseudonymousHistoryV130');
  clearBatchProgress();
  purgeLegacySensitiveStorage();
}

function batchResultDone(code){
  return batchResults.some(r=>r&&r.code===code&&['hotovo','kontrola'].includes(r.status)&&String(r.result||'').trim());
}
function batchResultByCode(code){ return batchResults.find(r=>r && r.code===code); }
function upsertBatchResult(item){
  const idx=batchResults.findIndex(r=>r && r.code===item.code);
  if(idx>=0) batchResults[idx]=Object.assign({},batchResults[idx],item);
  else batchResults.push(item);
  saveBatchProgress();
}
function resetBatchResultsOnly(){
  batchResults=[];
  batchStudents.forEach(s=>{ if(['hotovo','kontrola','chyba','čeká na pokračování'].includes(s.status)) s.status='čeká'; });
  clearBatchProgress();
  renderBatchList(); renderResult(); saveState();
  toast('Výsledky dávky byly vymazány. Studenti v dávce zůstali.','warn');
}
let batchProgressSaveTimer=0;
let batchPersistenceWarningShown=false;
function warnBatchPersistenceFailure(){if(batchPersistenceWarningShown)return;batchPersistenceWarningShown=true;toast('Průběh dávky se nepodařilo uložit do úložiště prohlížeče. Stáhni si průběžný export nebo zmenši dávku; přílohy se do snapshotu neukládají.','warn');}
function saveBatchProgress(){
  if(!batchStudents.length && !batchResults.length){ clearBatchProgress(); return true; }
  let raw='';
  try{raw=JSON.stringify(buildBatchProgressSnapshot());}catch(_){warnBatchPersistenceFailure();return false;}
  const sessionOk=safeSessionSet(BATCH_PROGRESS_SESSION_SK,raw);
  const localOk=sensitiveSaveEnabled()?safeLocalSet(BATCH_PROGRESS_LOCAL_SK,raw):safeLocalRemove(BATCH_PROGRESS_LOCAL_SK);
  if(!sessionOk||!localOk){warnBatchPersistenceFailure();return false;}
  batchPersistenceWarningShown=false;return true;
}
function scheduleBatchProgressSave(delay=550){clearTimeout(batchProgressSaveTimer);batchProgressSaveTimer=setTimeout(()=>saveBatchProgress(),delay);}
function clearBatchProgress(){ safeSessionRemove(BATCH_PROGRESS_SESSION_SK); safeLocalRemove(BATCH_PROGRESS_LOCAL_SK); }
function init(){
  purgeLegacySensitiveStorage();
  const restored = loadState(); const batchRestored = tryRestoreBatchProgress(); if(restored || batchRestored) $('restoreBanner').classList.remove('hidden');
  const theme=safeLocalGet('maturitniHodnotitelTheme'); if(theme==='light') document.body.classList.add('light'); updateThemeBtn();
  loadGeminiKey(); loadGeminiModel();
  bindEvents(); initTooltips(); renderAll(); renderPrivacyMode(); renderWorkMode();
  if(!String(state.taskText||'').trim() && !String(state.taskTitle||'').trim()) fillTaskFieldsFromSelection(); else syncFieldsFromState();
  renderFiles(); renderBatchList(); updateStats(); updatePromptPreview(); applyKeyEnvUI(); setTimeout(()=>showPrivacyIntro(false),80);
}

async function toggleAppFullscreen(){
  const active=document.body.classList.toggle('focus-fullscreen');
  const btn=$('btnFs');
  if(btn){
    btn.textContent=active?'⤢':'⛶';
    btn.title=active?'Ukončit zvětšené zobrazení':'Zvětšené zobrazení';
    btn.setAttribute('aria-label', active?'Ukončit zvětšené zobrazení':'Zvětšit zobrazení');
  }

  const isMobileLayout = window.matchMedia && window.matchMedia('(max-width: 700px)').matches;
  const isLocalContent = String(location.protocol || '').startsWith('content') || String(location.href || '').startsWith('content:');
  const allowNativeFullscreen = !isMobileLayout && !isLocalContent && document.fullscreenEnabled;

  try{
    if(active && allowNativeFullscreen && !document.fullscreenElement && document.documentElement.requestFullscreen){
      await document.documentElement.requestFullscreen();
    }
    if(!active && document.fullscreenElement && document.exitFullscreen){
      await document.exitFullscreen();
    }
  }catch(e){
    // Nativní fullscreen je jen bonus. Bezpečný CSS režim zůstává funkční i na mobilech a content:// souborech.
  }

  if(active){
    setTimeout(()=>{ try{ window.scrollTo({top:0,left:0,behavior:'smooth'}); }catch(_){ window.scrollTo(0,0); } }, 30);
  }
  toast(active?'Zvětšené zobrazení zapnuto.':'Zvětšené zobrazení vypnuto.');
}
function bindEvents(){
  $('btnTheme').onclick=()=>{document.body.classList.toggle('light');safeLocalSet('maturitniHodnotitelTheme',document.body.classList.contains('light')?'light':'dark');updateThemeBtn();};
  $('btnFs').onclick=toggleAppFullscreen;
  $('changesBtn').onclick=showChangelog; $('privacyIntroBtn').onclick=()=>showPrivacyIntro(true); $('clearSavedBtn').onclick=()=>{clearAllSavedState(); location.reload();};
  $('next0').onclick=()=>goTo(1); $('back1').onclick=()=>goTo(0); if($('againBtn')) $('againBtn').onclick=()=>goTo(2); $('next1').onclick=()=>{commitTaskFieldsToDb();goTo(2)}; $('back2').onclick=()=>goTo(1); $('next2').onclick=()=>goTo(3); $('back3').onclick=()=>goTo(2); $('next3').onclick=()=>goTo(4); $('back4').onclick=()=>goTo(3); $('newEvalBtn').onclick=()=>{state.studentText='';state.result='';state.studentIdentity='';state.extraPii='';state.teacherReview=defaultTeacherReview();attachedFiles=[];batchStudents=[];batchResults=[];clearBatchProgress();state.privacyApprovedHash='';goTo(0);syncFieldsFromState();renderFiles();renderBatchList();renderResult();updateStats();saveState();};
  ['taskTitle','taskText','taskReqs','studentText','studentIdentity','studentCode','extraPii'].forEach(id=>$(id).addEventListener('input',()=>{state.privacyApprovedHash='';syncStateFromFields();updateStats();updatePromptPreview();saveState();renderPrivacyMode();}));
  $('studentText').addEventListener('input',()=>{updateStats();updatePromptPreview();});
  $('anonymizeBtn').onclick=applyPseudonymizationToField; $('previewAnonBtn').onclick=showAnonPreview; $('clearTextBtn').onclick=()=>{$('studentText').value=''; attachedFiles=[]; syncStateFromFields(); renderFiles(); updateStats(); updatePromptPreview(); saveState();}; $('togglePrivacyBtn')?.addEventListener('click',togglePrivacyMode); $('runPrivacyCheckBtn')?.addEventListener('click',()=>{syncStateFromFields(); renderPrivacyReport(runPrivacyScan(), false);}); $('applyPrivacyFixBtn')?.addEventListener('click',applySelectedPrivacyFindings); $('approvePrivacyBtn')?.addEventListener('click',approvePrivacyCheck); $('toggleSensitiveSaveBtn')?.addEventListener('click',toggleSensitiveStateSaving); $('clearSensitiveSavedBtn')?.addEventListener('click',clearSensitiveSavedData);
  $('fileInput').addEventListener('change',handleFiles); const ua=$('uploadArea'); ua.onclick=()=>$('fileInput').click(); ua.addEventListener('dragover',e=>{e.preventDefault(); ua.classList.add('dragover')}); ua.addEventListener('dragleave',()=>ua.classList.remove('dragover')); ua.addEventListener('drop',e=>{e.preventDefault(); ua.classList.remove('dragover'); handleFileList(e.dataTransfer.files)});
  $('batchFileInput')?.addEventListener('change',handleBatchFiles); $('pickBatchFilesBtn')?.addEventListener('click',()=>$('batchFileInput').click()); $('addBatchStudentBtn')?.addEventListener('click',()=>addBatchStudent()); $('clearBatchBtn')?.addEventListener('click',()=>{batchStudents=[];batchResults=[];clearBatchProgress();state.privacyApprovedHash='';renderBatchList();updateStats();saveState();renderPrivacyMode();}); $('clearBatchResultsBtn')?.addEventListener('click',()=>{resetBatchResultsOnly();});
  $('exportTasksBtn').onclick=()=>{$('taskJson').value=JSON.stringify(tasks,null,2); toast('Databáze zadání vypsána do JSON pole.');};
  $('importTasksBtn').onclick=importTasks; $('resetTasksBtn').onclick=()=>{tasks=makeDefaultTasks(); saveTasks(); renderTasks(); fillTaskFieldsFromSelection(); toast('Vrácena výchozí vestavěná databáze.','warn');};
  document.querySelectorAll('[data-work-mode]').forEach(el=>{el.onclick=()=>{state.workMode=el.dataset.workMode; renderWorkMode(); updateStats(); updatePromptPreview(); saveState();};});
  $('copyManualPromptBtn')?.addEventListener('click',copyPromptWithPrivacyGate); $('downloadPromptBundleBtn')?.addEventListener('click',downloadPromptBundleTxt); $('importManualResultBtn')?.addEventListener('click',importManualResult);
  $('btnUseKeySession').onclick=useGeminiKeyForSession; $('btnSaveKeyPermanent').onclick=saveGeminiKeyPermanent; $('btnClearKey').onclick=clearGeminiKey; $('geminiKeyInput').addEventListener('input',()=>{ if(geminiKeyScope==='session'){ safeSessionSet(GEMINI_KEY_SESSION_SK,getGeminiInputKey()) } if(geminiKeyScope==='permanent'){ safeLocalSet(GEMINI_KEY_SK,getGeminiInputKey()) } geminiApiKey=getGeminiInputKey(); updateGeminiStatus(); }); $('geminiModelInput').addEventListener('input',updateGeminiModelUI); $('geminiModelInput').addEventListener('change',e=>setGeminiModel(e.target.value)); $('geminiModelSelect')?.addEventListener('change',e=>{ if(e.target.value) setGeminiModel(e.target.value); }); $('resetModelBtn').onclick=resetGeminiModel; $('checkModelsBtn')?.addEventListener('click',checkGeminiModels); $('toggleKey').onclick=()=>{const i=$('geminiKeyInput'); i.type=i.type==='password'?'text':'password';};
  $('copyPromptBtn').onclick=copyPromptWithPrivacyGate;
  document.querySelectorAll('[data-result-view]').forEach(el=>{el.onclick=()=>{state.resultView=el.dataset.resultView||'teacher'; renderResultViewControls(); renderResult(); saveState();};});
  $('copyResultBtn').onclick=()=>copyText(state.result?composeExportMarkdown(state.resultView,state.result,null):$('resultBox').textContent, 'Zobrazený report zkopírován.');
  $('downloadTxtBtn').onclick=downloadTxt; $('downloadDocxBtn')?.addEventListener('click',downloadDocx); $('printPdfBtn')?.addEventListener('click',printPdfExport); $('downloadCsvBtn')?.addEventListener('click',downloadCsvSummary); $('downloadXlsxBtn')?.addEventListener('click',downloadXlsxSummary); $('downloadEmailBtn')?.addEventListener('click',downloadEmailTemplate); if($('downloadZipBtn')) $('downloadZipBtn').onclick=downloadBatchZip; $('teacherReviewPanel')?.addEventListener('input',handleTeacherReviewInput); $('recalcReviewBtn')?.addEventListener('click',()=>{recalculateTeacherReviewTotal(); syncTeacherReviewFromFields(false); renderResultSummary(state.result); saveState();}); $('applyTeacherReviewBtn')?.addEventListener('click',()=>{syncTeacherReviewFromFields(true); saveState(); renderResult(); toast('Finální kontrola učitele uložena.');}); $('resetTeacherReviewBtn')?.addEventListener('click',()=>{state.teacherReview=defaultTeacherReview(); saveState(); renderResult(); toast('Vrácen AI návrh.','warn');}); if($('toggleRawBtn')) $('toggleRawBtn').onclick=()=>{showRaw=!showRaw; renderResult();}; $('runBtn').onclick=runEvaluation; $('cancelBtn').onclick=cancelRun;
}
function updateThemeBtn(){ $('btnTheme').textContent = document.body.classList.contains('light')?'🌙':'☀️'; }
function renderAll(){ renderProgress(); renderMode(); renderGenres(); renderTasks(); renderEvalMode(); renderOutputStyle(); renderInputMode(); renderWorkMode(); renderStep(); }
function renderMode(){ document.querySelectorAll('.advanced-only').forEach(el=>el.classList.remove('hidden')); }

function renderWorkModeLegacy(){
  const mode=state.workMode||'offline';
  document.querySelectorAll('[data-work-mode]').forEach(el=>el.classList.toggle('active',el.dataset.workMode===mode));
  const notes={
    offline:'Offline příprava nic neodesílá mimo prohlížeč. Vytvoří pouze lokální protokol: anonymizace, kontrola citlivých údajů, mechanický RAW počet slov a odstavce. Jazykové hodnocení bez AI neprovádí.',
    manual:'Ruční AI režim API klíč nepotřebuje. Aplikace připraví anonymizovaný prompt, ty ho vložíš do zvoleného AI nástroje a hotovou odpověď můžeš vložit zpět pro export.',
    api:'Gemini API režim automaticky odešle pseudonymizovaný vstup do Gemini až po kliknutí na hodnoticí tlačítko. Používej samostatný API projekt/klíč pro hodnotitel.'
  };
  if($('workModeNote')) $('workModeNote').textContent=notes[mode]||notes.offline;
  $('offlinePanel')?.classList.toggle('hidden',mode!=='offline');
  $('manualPanel')?.classList.toggle('hidden',mode!=='manual');
  $('geminiPanel')?.classList.toggle('api-hidden',mode!=='api');
  if($('runBtn')){
    if(mode==='offline') $('runBtn').innerHTML=state.inputMode==='batch'?'🧭 Vytvořit offline přípravu dávky':'🧭 Vytvořit offline přípravu';
    else if(mode==='manual') $('runBtn').innerHTML=state.inputMode==='batch'?'📋 Připravit prompty pro dávku':'📋 Zkopírovat prompt pro ruční AI';
    else $('runBtn').innerHTML=state.inputMode==='batch'?'📦 Ohodnotit dávku přes Gemini API':'✍️ Ohodnotit sloh přes Gemini API';
  }
}
function renderStep(){
  for(let i=0;i<=4;i++) $('step'+i).classList.toggle('hidden',state.step!==i);
  [...document.querySelectorAll('.progress-seg')].forEach((el,i)=>{el.classList.toggle('done',i<state.step); el.classList.toggle('active',i===state.step);});
  [...document.querySelectorAll('.prog-label')].forEach((el,i)=>{el.classList.toggle('done',i<state.step); el.classList.toggle('active',i===state.step);});
  updateNavState(); updatePromptPreview(); renderChips(); renderWorkMode(); renderResult();
}
function goTo(step){ syncStateFromFields(); state.step=step; renderStep(); saveState(); window.scrollTo({top:0,behavior:'smooth'}); }
function renderGenres(){
  const box=$('genreCards'); box.innerHTML='';
  GENRES.forEach(g=>{const card=document.createElement('div'); card.className='task-card'; card.dataset.genre=g.id; card.innerHTML=`<div class="tc-title">${escapeHtml(g.label)}</div><div class="tc-desc">${escapeHtml(g.desc)}</div><span class="tc-tag">${g.id}</span>`; card.onclick=()=>{state.genre=g.id; state.taskIndex=0; fillTaskFieldsFromSelection(); renderGenres(); renderTasks(); renderChips(); updatePromptPreview(); saveState();}; box.appendChild(card);});
  document.querySelectorAll('[data-genre]').forEach(el=>el.classList.toggle('active',el.dataset.genre===state.genre));
}
function renderTasks(){
  const box=$('taskCards'); box.innerHTML=''; const arr=getTaskArray();
  arr.forEach((t,i)=>{ const missing=!String(t.taskText||'').trim(); const card=document.createElement('div'); card.className='task-card'; card.dataset.taskIndex=i; card.innerHTML=`<div class="tc-title">${escapeHtml(t.title||`Zadání ${i+1}`)}</div><div class="tc-desc">${missing?'Zatím bez pevně vloženého textu zadání.':'Zadání je uložené v databázi.'}</div><span class="tc-tag ${missing?'warn':''}">${missing?'doplnit':'připraveno'}</span>`; card.onclick=()=>{state.taskIndex=i; fillTaskFieldsFromSelection(); renderTasks(); renderChips(); updatePromptPreview(); saveState();}; box.appendChild(card); });
  document.querySelectorAll('[data-task-index]').forEach(el=>el.classList.toggle('active',Number(el.dataset.taskIndex)===state.taskIndex));
  document.querySelectorAll('[data-set]').forEach(el=>el.classList.toggle('active',el.dataset.set===state.set));
  $('examWarning').classList.toggle('hidden',state.set!=='exam');
  document.querySelectorAll('[data-set]').forEach(el=>el.onclick=()=>{state.set=el.dataset.set; state.taskIndex=0; fillTaskFieldsFromSelection(); renderTasks(); renderChips(); updatePromptPreview(); saveState();});
}
function renderInputMode(){
  document.querySelectorAll('[data-input-mode]').forEach(el=>{el.onclick=()=>{state.inputMode=el.dataset.inputMode; renderInputMode(); updateStats(); updatePromptPreview(); saveState();}; el.classList.toggle('active',el.dataset.inputMode===state.inputMode);});
  const batch=state.inputMode==='batch';
  $('batchBox')?.classList.toggle('hidden',!batch); $('singleStudentField')?.classList.toggle('hidden',batch); $('singleAnonField')?.classList.toggle('hidden',batch);
  renderWorkMode();
  renderBatchList();
}
function nextBatchCode(){ return 'STUDENT_'+String(batchStudents.length+1).padStart(3,'0'); }
function addBatchStudent(data={}){
  batchStudents.push(Object.assign({code:nextBatchCode(),identity:'',extraPii:'',text:'',files:[],sourceName:'ruční vstup',status:'čeká'},data));
  renderBatchList(); updateStats(); updatePromptPreview(); saveState();
}
async function handleBatchFiles(e){ await handleBatchFileList(e.target.files); e.target.value=''; }
async function handleBatchFileList(list){
  const files=Array.from(list||[]); if(!files.length) return;
  for(const f of files){ await processBatchFile(f); }
  renderBatchList(); updateStats(); updatePromptPreview(); saveState();
}
async function processBatchFile(f){
  const code=nextBatchCode(); const ext=fileExt(f.name);
  const item={code,identity:f.name.replace(/\.[^.]+$/,''),extraPii:f.name.replace(/\.[^.]+$/,''),text:'',files:[],sourceName:f.name,status:'čeká'};
  try{
    if(['txt','md','markdown','csv','tsv'].includes(ext) || /^text\//.test(f.type)) item.text=await f.text();
    else if(ext==='docx') item.text=await extractDocxText(f);
    else if(/^image\//.test(f.type) || ['jpg','jpeg','png','webp','gif','heic','heif'].includes(ext)) item.files=[await prepareImageAttachment(f)];
    else if(ext==='pdf' || f.type==='application/pdf') item.files=[{name:'PŘÍLOHA_1.pdf',size:f.size,originalSize:f.size,mime:'application/pdf',dataUrl:await readAsDataUrl(f),wasDownscaled:false}];
    else { toast('Nepodporovaný typ souboru v dávce: '+f.name,'err'); return; }
    batchStudents.push(item); state.privacyApprovedHash=''; saveBatchProgress(); toast('Do dávky přidáno: '+f.name);
  }catch(e){ toast('Soubor '+f.name+' se nepodařilo načíst: '+(e.message||e),'err'); }
}
function renderEvalMode(){
  document.querySelectorAll('[data-mode]').forEach(el=>{el.onclick=()=>{state.evalMode=el.dataset.mode; renderEvalMode(); updateStats(); updatePromptPreview(); saveState();}; el.classList.toggle('active',el.dataset.mode===state.evalMode);});
}
function renderOutputStyle(){
  if(!state.outputStyle) state.outputStyle='teacher';
  if(!state.resultView) state.resultView=state.outputStyle;
  document.querySelectorAll('[data-output-style]').forEach(el=>{
    el.onclick=()=>{state.outputStyle=el.dataset.outputStyle||'teacher'; state.resultView=state.outputStyle; renderOutputStyle(); renderResultViewControls(); renderResult(); updatePromptPreview(); saveState();};
    el.classList.toggle('active',el.dataset.outputStyle===state.outputStyle);
  });
}
function outputStyleLabel(v){ return ({teacher:'Učitelský detail',student:'Pro studenta',record:'Evidence'})[v||'teacher']||'Učitelský detail'; }
function renderResultViewControls(){
  const view=state.resultView||state.outputStyle||'teacher';
  document.querySelectorAll('[data-result-view]').forEach(el=>el.classList.toggle('active',el.dataset.resultView===view));
}
function getTaskArray(){ return tasks[state.set]?.[state.genre] || []; }
function currentTask(){ return getTaskArray()[state.taskIndex] || placeholderTask(state.set,state.genre,state.taskIndex+1); }
function fillTaskFieldsFromSelection(){ const t=currentTask(); state.taskTitle=t.title||''; state.taskText=t.taskText||''; state.taskReqs=(t.requirements||[]).join('\n'); syncFieldsFromState(); updateNavState(); }
function syncFieldsFromState(){ ['taskTitle','taskText','taskReqs','studentText','studentIdentity','studentCode','extraPii'].forEach(id=>{ if($(id)) $(id).value=state[id]||''; }); }
function syncStateFromFields(doCommit=true){ ['taskTitle','taskText','taskReqs','studentText','studentIdentity','studentCode','extraPii'].forEach(id=>{ if($(id)) state[id]=$(id).value; }); if(doCommit && state.step===1) commitTaskFieldsToDb(false); }
function commitTaskFieldsToDb(show=true){
  const arr=getTaskArray(); if(!arr[state.taskIndex]) return;
  arr[state.taskIndex].title=$('taskTitle').value.trim() || arr[state.taskIndex].title;
  arr[state.taskIndex].taskText=$('taskText').value.trim();
  arr[state.taskIndex].requirements=$('taskReqs').value.split('\n').map(x=>x.trim()).filter(Boolean);
  arr[state.taskIndex].isPlaceholder=!arr[state.taskIndex].taskText;
  saveTasks(); renderTasks(); if(show) toast('Zadání je uloženo do lokální databáze v tomto prohlížeči.');
}
function importTasks(){
  try{ const parsed=JSON.parse($('taskJson').value); tasks=mergeTasks(makeDefaultTasks(), parsed); saveTasks(); renderTasks(); fillTaskFieldsFromSelection(); toast('Databáze zadání importována.'); }
  catch(e){ toast('JSON se nepodařilo načíst: '+e.message,'err'); }
}
function hasTaskBasics(){ return String($('taskText').value||state.taskText).trim().length>20 && String($('taskReqs').value||state.taskReqs).trim().length>3; }
function hasStudentText(){ return String($('studentText').value||state.studentText).trim().length>20; }
function hasStudentInput(){ return state.inputMode==='batch' ? batchStudents.some(s=>String(s.text||'').trim() || (s.files||[]).length) : (hasStudentText() || attachedFiles.length>0); }
function updateNavState(){
  if($('next1')) $('next1').disabled = !hasTaskBasics();
  if($('next2')) $('next2').disabled = !hasStudentInput();
  const missing=!String(currentTask().taskText||state.taskText).trim(); $('missingTaskBox')?.classList.toggle('hidden',!missing);
  $('next3').disabled=!state.result;
}
function renderChips(){
  const g=GENRES.find(x=>x.id===state.genre); const setLabel=state.set==='exam'?'Ostrá verze':'Cvičná sada'; const modeLabel={count:'Jen počet slov',standard:'Standardní hodnocení',deep:'Hloubková analýza'}[state.evalMode];
  const workLabel={offline:'Offline příprava',manual:'Ruční AI',api:'Gemini API'}[state.workMode||'offline']; const html=`<span class="chip">${escapeHtml(setLabel)}</span><span class="chip">${escapeHtml(g?.label||state.genre)}</span><span class="chip">Zadání ${state.taskIndex+1}</span><span class="chip">${escapeHtml(workLabel)}</span><span class="chip ${state.evalMode==='deep'?'ok':''}">${escapeHtml(modeLabel)}</span>`;
  ['selectionChips','taskChips2','resultChips'].forEach(id=>{ if($(id)) $(id).innerHTML=html; });
}
function updateStats(){
  syncStateFromFields(false);
  let stats, approxPrompt=0;
  const resultBudget = state.evalMode==='deep'?16000:state.evalMode==='standard'?6500:1600;
  if(state.inputMode==='batch'){
    const total=batchStudents.length;
    const ready=batchStudents.filter(s=>String(s.text||'').trim() || (s.files||[]).length).length;
    const files=batchStudents.reduce((a,s)=>a+(s.files||[]).length,0);
    const sample=batchStudents.find(s=>String(s.text||'').trim() || (s.files||[]).length) || null;
    approxPrompt = sample ? estimateTokens(buildPrompt(sample)) : estimateTokens(buildPrompt());
    stats=[['Studentů v dávce',total],['Připraveno',ready],['Přílohy',files],['Odhad / 1 sloh',approxPrompt+' + výstup']];
  } else {
    const text=getOutboundStudentText().text||''; const wc=localWordCountReport(state.studentText||text, state.taskText||'', state.taskTitle||currentTask().title||'', state.genre||''); approxPrompt=estimateTokens(buildPrompt());
    stats=[['RAW tokeny',wc.rawCount],['Finální slova',wc.finalCount],['Odstavce',wc.paragraphs],['Přílohy',attachedFiles.length]];
  }
  const html=stats.map(x=>`<div class="sum-card"><b>${x[1]}</b><span>${x[0]}</span></div>`).join('');
  if($('localStats')) $('localStats').innerHTML=html;
  if($('finalStats')) $('finalStats').innerHTML=html.replace(' + výstup', state.workMode==='api'?` + cca ${resultBudget}`:(state.workMode==='manual'?' + ruční AI':' + offline'));
  updateNavState(); renderChips(); renderInputMode();
}

/* 25-roster-import.js */
function normalizeMatchText(value){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\.[^.]+$/,'').replace(/[^a-z0-9]+/g,' ').trim();
}
const ROSTER_EMAIL_SOURCE='[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}';
function rosterEmails(value){return String(value||'').match(new RegExp(ROSTER_EMAIL_SOURCE,'ig'))||[];}
function isValidRosterEmail(value){return new RegExp(`^${ROSTER_EMAIL_SOURCE}$`,'i').test(String(value||'').trim());}
function rosterIdFor(name,email,index){
  return 'R_'+btoa(unescape(encodeURIComponent(`${name}|${email}|${index}`))).replace(/[^a-z0-9]/gi,'').slice(0,14);
}
function titleCaseNamePart(value){
  return String(value||'').split(/([ -])/).map(part=>/^[ -]$/.test(part)?part:(part?part.charAt(0).toUpperCase()+part.slice(1).toLowerCase():part)).join('');
}
function inferNameFromEmail(email){
  const local=String(email||'').split('@')[0]||'';
  return local.split(/[._-]+/).filter(Boolean).map(titleCaseNamePart).join(' ');
}
function isRosterHeaderLine(line){
  const low=String(line||'').toLowerCase();
  const hasHeader=/\b(jméno|prijmeni|příjmení|name|surname|student|žák|zak|e-?mail|třída|trida|skupina|class)\b/.test(low);
  const hasRealEmail=rosterEmails(line).length>0;
  return hasHeader&&!hasRealEmail;
}
function isRosterNoiseCell(cell){
  const value=String(cell||'').trim();
  if(!value)return true;
  if(/^\d+$/.test(value))return true;
  if(/^\d+\.?[A-Za-z]?$/.test(value))return true;
  if(/^(student|žák|zak|aktivní|active)$/i.test(value))return true;
  if(/^\d+\.[A-Za-z0-9-]+$/.test(value))return true;
  return false;
}
function cleanRosterName(line,email){
  const withoutEmail=String(line||'').replace(email,' ');
  const cells=withoutEmail.split(/[\t;|,]+/).map(x=>x.trim()).filter(Boolean);
  const useful=cells.filter(cell=>!isRosterNoiseCell(cell)&&!isValidRosterEmail(cell));
  return useful.join(' ').replace(/\s+/g,' ').replace(/^[\s;,|]+|[\s;,|]+$/g,'').trim();
}
function pushRosterPerson(out,seen,name,email){
  const cleanEmail=String(email||'').trim();
  const cleanName=String(name||'').replace(/\s+/g,' ').trim()||(cleanEmail?inferNameFromEmail(cleanEmail):'');
  if(!cleanName&&!cleanEmail)return false;
  const dedupe=cleanEmail.toLowerCase()||normalizeMatchText(cleanName);
  if(!dedupe||seen.has(dedupe))return false;
  seen.add(dedupe);
  out.push({id:rosterIdFor(cleanName,cleanEmail,out.length),name:cleanName,email:cleanEmail,code:`STUDENT_${String(out.length+1).padStart(3,'0')}`});
  return true;
}
function parseRosterLine(line,out,seen){
  if(!line||isRosterHeaderLine(line)||out.length>=SERIES_MAX_WORKS)return;
  const emails=rosterEmails(line);
  if(emails.length===0){
    const name=cleanRosterName(line,'');
    if(name)pushRosterPerson(out,seen,name,'');
    return;
  }
  if(emails.length===1){
    const email=emails[0];
    pushRosterPerson(out,seen,cleanRosterName(line,email),email);
    return;
  }
  // IS často vrací jeden dlouhý řádek e-mailů oddělených čárkou nebo středníkem.
  // Buňky před e-mailem se zároveň využijí jako jméno u formátu „Jméno; e-mail“.
  const cells=String(line).split(/[\t;|,]+/).map(x=>x.trim()).filter(Boolean);
  if(cells.length<=1){
    emails.forEach(email=>{if(out.length<SERIES_MAX_WORKS)pushRosterPerson(out,seen,'',email);});
    return;
  }
  let pendingName=[];
  for(const cell of cells){
    if(out.length>=SERIES_MAX_WORKS)break;
    const cellEmails=rosterEmails(cell);
    if(cellEmails.length){
      if(cellEmails.length===1){
        const email=cellEmails[0];
        const inlineName=cleanRosterName(cell,email);
        pushRosterPerson(out,seen,inlineName||pendingName.join(' '),email);
      }else{
        cellEmails.forEach(email=>{if(out.length<SERIES_MAX_WORKS)pushRosterPerson(out,seen,'',email);});
      }
      pendingName=[];
    }else if(!isRosterNoiseCell(cell)){
      pendingName.push(cell);
    }
  }
}
function parseRosterText(raw){
  const lines=String(raw||'').replace(/\u00a0/g,' ').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const out=[];
  const seen=new Set();
  for(const line of lines){
    parseRosterLine(line,out,seen);
    if(out.length>=SERIES_MAX_WORKS)break;
  }
  return out;
}
function rosterPreviewData(raw){
  const text=String(raw||'');
  const students=parseRosterText(text);
  const invalid=[];
  const seen=new Set();
  text.split(/[\r\n,;\t|]+/).map(x=>x.trim()).filter(Boolean).forEach(fragment=>{
    if(!fragment.includes('@'))return;
    if(rosterEmails(fragment).some(isValidRosterEmail))return;
    const normalized=fragment.toLowerCase();
    if(seen.has(normalized))return;
    seen.add(normalized);
    invalid.push(fragment);
  });
  return {students,invalidEntries:invalid};
}
function renderRosterInputPreview(){
  const box=$('rosterParseStatus');
  if(!box)return;
  const raw=$('rosterInput')?.value||'';
  if(!raw.trim()){
    box.className='roster-parse-status';
    box.innerHTML='<span>Podporované oddělovače: čárka, středník nebo nový řádek.</span>';
    return;
  }
  const data=rosterPreviewData(raw);
  box.className=`roster-parse-status ${data.students.length?'ok':'warn'} ${data.invalidEntries.length?'has-errors':''}`;
  const limit=data.students.length>=SERIES_MAX_WORKS?` · načte se maximálně ${SERIES_MAX_WORKS}`:'';
  const invalid=data.invalidEntries.length?`<span class="roster-invalid">Nerozpoznané položky: ${data.invalidEntries.slice(0,3).map(escapeHtml).join(' · ')}${data.invalidEntries.length>3?' …':''}</span>`:'';
  box.innerHTML=`<strong>Rozpoznáno studentů: ${data.students.length}</strong><span>${data.students.length?'Seznam je připraven k načtení':'Zkontroluj formát e-mailů'}${limit}</span>${invalid}`;
}
function importRosterFromText(){
  ensureWorkflowState();
  const data=rosterPreviewData($('rosterInput')?.value||'');
  if(!data.students.length){toast('Vložený seznam se nepodařilo rozpoznat. E-maily odděl čárkou, středníkem nebo novým řádkem.','err');renderRosterInputPreview();return;}
  state.roster=data.students;
  renderRosterTable();
  pairAllStudentsToRoster();
  renderRosterInputPreview();
  saveState();
  toast(`Načteno ${data.students.length} studentů${data.students.length===SERIES_MAX_WORKS?' (dosažen limit série)':''}.`);
}
async function clearRoster(){
  if(!(await uiConfirm('Vymazat seznam studentů a všechna párování?','Vymazat skupinu')))return;
  state.roster=[];
  batchStudents.forEach(s=>{s.rosterId='';s.email='';s.pairingStatus='unpaired';});
  renderRosterTable();
  renderBatchList();
  saveState();
}
function rosterCandidateScore(student,person){
  const source=normalizeMatchText([student.identity,student.sourceName,...(student.sourceFiles||[])].join(' '));
  const target=normalizeMatchText(person.name);
  if(!source||!target)return 0;
  if(source===target)return 100;
  const parts=target.split(' ').filter(x=>x.length>2);
  let score=parts.reduce((n,p)=>n+(source.includes(p)?20:0),0);
  if(parts.length&&score===parts.length*20)score+=20;
  const emailLocal=normalizeMatchText(String(person.email||'').split('@')[0]);
  if(emailLocal&&source.includes(emailLocal))score+=40;
  return score;
}
function bestRosterMatch(student){
  let best=null;
  for(const person of state.roster||[]){
    const score=rosterCandidateScore(student,person);
    if(!best||score>best.score)best={person,score};
  }
  return best&&best.score>=20?best:null;
}
function syncStudentContactToResult(student){
  if(!student)return;
  const result=batchResults.find(r=>r&&r.code===student.code);
  if(!result)return;
  result.displayName=student.displayName||student.identity||'';
  result.identity=student.identity||student.displayName||'';
  result.email=student.email||'';
  result.rosterId=student.rosterId||'';
  result.approved=false;
  result.deliveryStatus='not-ready';
  student.approved=false;
}
function applyRosterPair(student,person){
  if(!student)return;
  student.rosterId=person?.id||'';
  student.displayName=person?.name||student.displayName||student.identity||'';
  student.identity=person?.name||student.identity||'';
  student.email=person?.email||'';
  student.pairingStatus=person?'paired':(student.email?'paired':'unpaired');
  student.approved=false;
  syncStudentContactToResult(student);
}
function pairAllStudentsToRoster(){
  ensureWorkflowState();
  const used=new Set(batchStudents.map(s=>s.rosterId).filter(Boolean));
  for(const s of batchStudents){
    if(s.rosterId)continue;
    const match=bestRosterMatch(s);
    if(match&&!used.has(match.person.id)){
      applyRosterPair(s,match.person);
      used.add(match.person.id);
    }
  }
  renderBatchList();
  renderRosterTable();
  updateWorkflowDashboard();
  saveState();
}
function setStudentRosterPair(index,rosterId){
  const s=batchStudents[index];
  const p=(state.roster||[]).find(x=>x.id===rosterId)||null;
  applyRosterPair(s,p);
  renderBatchList();
  renderRosterTable();
  saveState();
}
function renderRosterTable(){
  const box=$('rosterTable');
  if(!box)return;
  const rows=state.roster||[];
  if(!rows.length){box.innerHTML='<div class="empty-workflow">Skupina zatím není načtena.</div>';return;}
  box.innerHTML=`<div class="roster-head"><span>Kód</span><span>Jméno</span><span>E-mail</span><span>Práce</span></div>`+rows.map(p=>{
    const paired=batchStudents.find(s=>s.rosterId===p.id);
    return `<div class="roster-row"><span>${escapeHtml(p.code)}</span><strong>${escapeHtml(p.name||'—')}</strong><span>${escapeHtml(p.email||'bez e-mailu')}</span><span class="status-chip ${paired?'ok':'warn'}">${paired?escapeHtml(paired.code):'čeká'}</span></div>`;
  }).join('');
}
function fileStem(name){return String(name||'').replace(/\.[^.]+$/,'');}
function explicitPageStem(name){
  return fileStem(name).replace(/(?:[_\s-](?:page|strana|scan|foto|img|p))[_\s-]*\d{1,3}$/i,'').trim();
}
function genericNumberedStem(name){
  const stem=fileStem(name);
  const m=stem.match(/^(.*?)[_\s-](\d{1,2})$/);
  return m?{root:m[1].trim(),number:Number(m[2])}:null;
}
function stripPageSuffix(name){
  const explicit=explicitPageStem(name);
  return explicit||fileStem(name);
}
function parentPath(path){const parts=String(path||'').split('/').filter(Boolean);return parts.length>1?parts.slice(0,-1).join('/'):'';}
function parentLabel(path){const p=parentPath(path);return p?p.split('/').pop():'';}
function meaningfulParent(path,allPaths){
  const parent=parentPath(path);
  if(!parent)return '';
  const parents=allPaths.map(parentPath).filter(Boolean);
  if(new Set(parents).size<=1)return '';
  return parentLabel(path);
}
function canUseGenericPageGroup(path,allPaths){
  const name=String(path||'').split('/').pop();
  if(!/\.(jpe?g|png|webp|gif)$/i.test(name))return null;
  const parsed=genericNumberedStem(name);
  if(!parsed||!parsed.root)return null;
  if(/^(img|image|foto|scan|page|strana|student)$/i.test(parsed.root))return null;
  const peers=allPaths.map(p=>String(p).split('/').pop()).filter(n=>{
    const x=genericNumberedStem(n);
    return x&&normalizeMatchText(x.root)===normalizeMatchText(parsed.root)&&/\.(jpe?g|png|webp|gif)$/i.test(n);
  }).map(n=>genericNumberedStem(n).number);
  if(peers.length<2||!peers.includes(1))return null;
  return parsed.root;
}
function importGroupDescriptor(path,allPaths){
  const name=String(path||'').split('/').pop();
  const parent=meaningfulParent(path,allPaths);
  if(parent)return {key:'folder:'+normalizeMatchText(parent),label:parent};
  const explicit=explicitPageStem(name);
  if(explicit!==fileStem(name))return {key:'page:'+normalizeMatchText(explicit),label:explicit};
  const generic=canUseGenericPageGroup(path,allPaths);
  if(generic)return {key:'page:'+normalizeMatchText(generic),label:generic};
  const label=fileStem(name);
  return {key:'file:'+normalizeMatchText(label)+':'+normalizeMatchText(name),label};
}
function importGroupKey(path,allPaths=[]){return importGroupDescriptor(path,allPaths.length?allPaths:[path]).key;}
async function handleZipImport(e){
  const f=e.target.files?.[0];
  e.target.value='';
  if(!f)return;
  try{await importWorksZip(f);}catch(err){toast(err.message||String(err),'err');}
}
async function importWorksZip(file){
  if(file.size>100*1024*1024)throw new Error('ZIP je větší než 100 MB.');
  const JSZip=await ensureJSZip();
  const zip=await JSZip.loadAsync(file);
  const entries=Object.values(zip.files).filter(x=>!x.dir&&!x.name.startsWith('__MACOSX/'));
  if(entries.length>100)throw new Error('ZIP obsahuje více než 100 souborů.');
  const supported=entries.filter(e=>/\.(txt|md|csv|tsv|docx|pdf|jpe?g|png|webp|gif)$/i.test(e.name));
  if(!supported.length)throw new Error('ZIP neobsahuje podporované soubory.');
  const allPaths=supported.map(e=>e.name);
  const groups=new Map();
  for(const entry of supported){
    const descriptor=importGroupDescriptor(entry.name,allPaths);
    if(!groups.has(descriptor.key))groups.set(descriptor.key,{label:descriptor.label,items:[]});
    groups.get(descriptor.key).items.push(entry);
  }
  if(batchStudents.length+groups.size>SERIES_MAX_WORKS)throw new Error(`Po importu by série překročila limit ${SERIES_MAX_WORKS} prací.`);
  for(const group of groups.values()){
    const items=group.items.sort((a,b)=>a.name.localeCompare(b.name,'cs',{numeric:true}));
    const student={
      code:nextBatchCode(),identity:group.label,displayName:'',email:'',rosterId:'',extraPii:'',text:'',files:[],
      sourceFiles:items.map(x=>x.name),sourceName:items.map(x=>x.name).join(', '),status:'čeká',transcriptConfirmed:false,
      transcriptStatus:'needs-review',pairingStatus:'unpaired'
    };
    for(const entry of items){
      const blob=await entry.async('blob');
      const name=entry.name.split('/').pop();
      const f=new File([blob],name,{type:mimeFromExtension(name)});
      const ext=fileExt(name);
      if(['txt','md','csv','tsv'].includes(ext))student.text+=(student.text?'\n\n':'')+await f.text();
      else if(ext==='docx')student.text+=(student.text?'\n\n':'')+await extractDocxText(f);
      else if(/^image\//.test(f.type))student.files.push(await prepareImageAttachment(f));
      else if(ext==='pdf')student.files.push({name:`PŘÍLOHA_${student.files.length+1}.pdf`,originalName:name,size:f.size,originalSize:f.size,mime:'application/pdf',dataUrl:await readAsDataUrl(f),wasDownscaled:false});
    }
    student.transcriptConfirmed=!student.files.length&&Boolean(student.text.trim());
    student.transcriptStatus=student.transcriptConfirmed?'ready':'needs-review';
    batchStudents.push(ensureBatchStudentShape(student,batchStudents.length));
  }
  pairAllStudentsToRoster();
  state.inputMode='batch';
  renderInputMode();
  renderBatchList();
  updateWorkflowDashboard();
  saveBatchProgress();
  toast(`ZIP načten: ${groups.size} studentských prací.`);
}
function mimeFromExtension(name){
  const ext=fileExt(name);
  return {txt:'text/plain',md:'text/markdown',csv:'text/csv',tsv:'text/tab-separated-values',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif'}[ext]||'application/octet-stream';
}
function exportPairingCsv(){
  ensureWorkflowState();
  const rows=[['kod','jmeno','email','soubory','stav']];
  for(const s of batchStudents)rows.push([s.code,s.displayName||s.identity||'',s.email||'',(s.sourceFiles||[s.sourceName]).filter(Boolean).join(' | '),s.pairingStatus||'unpaired']);
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\n');
  downloadBlob(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),`${safeFileName(seriesDisplayName())}_parovani.csv`);
}

/* 30-privacy-input.js */

function tokenizeSpaces(text){ return String(text||'').trim()?String(text).trim().split(/\s+/).filter(Boolean):[]; }
function estimateTokens(s){ return Math.ceil(String(s||'').length/4); }

function escapeRegExp(s){ return String(s||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function getOutboundStudentText(){
  syncStateFromFields(false);
  return getOutboundStudentTextFromValues(state.studentText, state.studentIdentity, state.studentCode, state.extraPii);
}
function getOutboundStudentTextFromValues(rawText, identity, codeValue, extraPiiValue){
  const code=(codeValue||'STUDENT_001').trim()||'STUDENT_001';
  let text=rawText||''; const map=[];
  const add=(repl,label,wholeToken=false)=>{ if(!repl) return; const clean=String(repl).trim(); const esc=escapeRegExp(clean); if(!esc) return; const re=wholeToken?new RegExp(`(^|[^\\p{L}\\p{N}_])(${esc})(?=$|[^\\p{L}\\p{N}_])`,'giu'):new RegExp(esc,'gi'); if(re.test(text)){ re.lastIndex=0; text=wholeToken?text.replace(re,(_,prefix)=>prefix+label):text.replace(re,label); map.push(`${clean} → ${label}`); } };
  const identityTerms=Array.from(new Set([String(identity||'').trim(),...String(identity||'').trim().split(/[\s,;]+/).map(x=>x.trim()).filter(x=>x.length>=3)])).filter(Boolean).sort((a,b)=>b.length-a.length);
  identityTerms.forEach(term=>add(term,code,true));
  String(extraPiiValue||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).forEach((x,i)=>add(x,`[OSOBA_UDÁJ_${i+1}]`));
  let n=0; text=text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,m=>{map.push(`${m} → [EMAIL_${++n}]`); return `[EMAIL_${n}]`;});
  n=0; text=text.replace(/(?<!\d)(?:(?:\+?420[\s.-]*)?\d{3}[\s.-]+\d{3}[\s.-]+\d{3}|\+?420\d{9})(?!\d)/g,m=>{map.push(`${m} → [TELEFON_${++n}]`); return `[TELEFON_${n}]`;});
  n=0; text=text.replace(/https?:\/\/\S+/gi,m=>{map.push(`${m} → [URL_${++n}]`); return `[URL_${n}]`;});
  n=0; text=text.replace(/\b\d{6}\/\d{3,4}\b/g,m=>{map.push(`${m} → [RODNÉ_ČÍSLO_${++n}]`); return `[RODNÉ_ČÍSLO_${n}]`;});
  return {text,map,code};
}
function applyPseudonymizationToField(){ const out=getOutboundStudentText(); if(!out.text.trim()){toast('Nejdřív vlož text.','warn');return;} $('studentText').value=out.text; state.studentText=out.text; renderAnonMap(out); updateStats(); updatePromptPreview(); saveState(); toast('Text v poli byl nahrazen pseudonymizovanou verzí.','warn'); }
function showAnonPreview(){ const out=getOutboundStudentText(); renderAnonMap(out); $('anonPreviewBox').classList.remove('hidden'); $('anonPreview').textContent=out.text||'[Žádný text – hodnotit se budou přílohy.]'; }
function renderAnonMap(out){ $('anonMapBox').classList.remove('hidden'); $('anonMap').textContent=out.map.length?out.map.join('\n'):'Zatím nebyly nalezeny/nahrazeny žádné údaje. Přidej jméno nebo údaje do polí výše.'; }

const PRIVACY_STOP_PHRASES = new Set(['Dear Sir','Dear Madam','Dear Sir or Madam','Yours Faithfully','Yours Sincerely','Kind Regards','Czech Republic','United Kingdom','United States','Present Perfect','Simple Past','Online Education','Public Transport','Music Festival','Adventure Park','Language School','Italian Restaurant','Shopping Centres','Young People','Austrian','Austria','Scotland','Dublin','Prague']);
const PRIVACY_LOCATION_WORDS = ['Ostrava','Praha','Prague','Brno','Olomouc','Plzeň','Pilsen','Liberec','Opava','Karviná','Havířov','Frýdek','Místek','České Budějovice','Hradec Králové','Pardubice','Zlín','Jihlava','Třebíč','Kroměříž','Vyškov'];
let privacyLastScan = null;
function privacyNormalizeValue(v){ return String(v||'').replace(/[.,;:!?()\[\]{}"“”'’]+$/,'').trim(); }
function privacyIsStopPhrase(v){ const x=privacyNormalizeValue(v); if(!x || x.length<2) return true; if(PRIVACY_STOP_PHRASES.has(x)) return true; if(/^STUDENT_\d+/i.test(x) || /^\[(EMAIL|TELEFON|URL|RODNÉ_ČÍSLO|OSOBA_UDÁJ)_\d+\]$/i.test(x)) return true; return false; }
function privacySnippet(text,value){ const t=String(text||''); const idx=t.toLowerCase().indexOf(String(value||'').toLowerCase()); if(idx<0) return ''; return t.slice(Math.max(0,idx-32), Math.min(t.length,idx+String(value).length+32)).replace(/\s+/g,' ').trim(); }
function privacyDedup(items){ const seen=new Set(); return items.filter(it=>{ const key=(it.scope||'')+'|'+(it.type||'')+'|'+privacyNormalizeValue(it.value).toLowerCase(); if(seen.has(key) || privacyIsStopPhrase(it.value)) return false; seen.add(key); it.value=privacyNormalizeValue(it.value); return true; }); }
function collectKnownPrivacyTerms(identity,extraPii){ return [identity, ...String(extraPii||'').split(/\n+/)].map(x=>String(x||'').trim()).filter(Boolean); }
function scanSensitiveText(text, identity='', extraPii='', scope='student'){
  const raw=String(text||''); const findings=[]; const known=collectKnownPrivacyTerms(identity,extraPii).map(x=>x.toLowerCase());
  const add=(type,value,reason,severity='warn',auto=false)=>{ value=privacyNormalizeValue(value); if(!value || value.length<2) return; const low=value.toLowerCase(); if(known.some(k=>k && low===k)) return; findings.push({scope,type,value,reason,severity,auto,selected:!auto,snippet:privacySnippet(raw,value)}); };
  const each=(re,type,reason,severity='warn',auto=false,group=0)=>{ let m; const r=new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'); while((m=r.exec(raw))){ add(type,m[group]||m[0],reason,severity,auto); if(m[0].length===0) r.lastIndex++; } };
  each(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'e-mail','e-mail se nahrazuje automaticky', 'ok', true);
  each(/(?<!\d)(?:(?:\+?420[\s.-]*)?\d{3}[\s.-]+\d{3}[\s.-]+\d{3}|\+?420\d{9})(?!\d)/g,'telefon','telefonní číslo se nahrazuje automaticky', 'ok', true);
  each(/https?:\/\/\S+/gi,'URL','odkaz se nahrazuje automaticky', 'ok', true);
  each(/\b\d{9,10}\b/g,'číselný identifikátor','devítimístná sekvence může být telefon nebo jiný identifikátor; ověř ručně', 'warn', false);
  each(/\b\d{6}\/\d{3,4}\b/g,'rodné číslo','rodné číslo / podobný číselný identifikátor', 'ok', true);
  each(/\b\d{3}\s?\d{2}\b/g,'PSČ','poštovní směrovací číslo může identifikovat adresu', 'warn', false);
  each(/\b[1-9]\.?\s?[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]\b/g,'třída','možné označení třídy', 'warn', false);
  each(/\b(?:Gymnázium|ZŠ|SŠ|SOŠ|SOU|Střední škola|Základní škola|school|college)\b[^\n.,;:!?]{0,70}/gi,'škola','možný název školy nebo instituce', 'warn', false);
  each(/\b(?:ulice|street|road|avenue|náměstí|namesti|č\.p\.|číslo popisné)\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽA-Za-zÁ-ž0-9 .-]{2,70}/gi,'adresa','možná adresa', 'warn', false);
  each(/(?:my name is|I am|I’m|jmenuji se|jsem)\s+([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][A-Za-zÁ-ž-]+(?:\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][A-Za-zÁ-ž-]+){0,2})/g,'jméno','možné představení jménem', 'warn', false, 1);
  each(/\b[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+(?:[- ][A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+){1,2}\b/g,'jméno / název','možné osobní jméno nebo vlastní název', 'warn', false);
  PRIVACY_LOCATION_WORDS.forEach(loc=>{ const re=new RegExp('\\b'+escapeRegExp(loc)+'\\b','i'); if(re.test(raw)) add('lokace',loc,'možná konkrétní lokace; zvaž anonymizaci, pokud identifikuje studenta', 'warn', false); });
  return privacyDedup(findings).slice(0,80);
}
function privacyFingerprint(){
  syncStateFromFields(false);
  const base={mode:state.inputMode,studentText:state.studentText,identity:state.studentIdentity,code:state.studentCode,extraPii:state.extraPii,files:attachedFiles.map(f=>[f.name,f.size,f.mime]),batch:batchStudents.map(s=>({code:s.code,text:s.text,identity:s.identity,extraPii:s.extraPii,files:(s.files||[]).map(f=>[f.name,f.size,f.mime])}))};
  return simpleHash(JSON.stringify(base));
}
function simpleHash(str){ let h=2166136261; for(let i=0;i<String(str).length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return String(h>>>0); }
function runPrivacyScan(){
  syncStateFromFields(false);
  const scan={hash:privacyFingerprint(),mode:state.inputMode,items:[],attachmentWarnings:[],allFindings:[]};
  if(state.inputMode==='batch'){
    batchStudents.forEach((s,i)=>{
      const hasText=String(s.text||'').trim(); const hasFiles=(s.files||[]).length>0; const scope=s.code||('STUDENT_'+String(i+1).padStart(3,'0'));
      const findings=scanSensitiveText(s.text||'',s.identity||'',s.extraPii||'',scope);
      scan.allFindings.push(...findings);
      if(hasFiles) scan.attachmentWarnings.push({scope,message:`${scope}: má ${(s.files||[]).length} příloh(y), které nelze lokálně plně zkontrolovat. Ověř, že na fotce/PDF není jméno, třída ani podpis.`});
    });
  } else {
    const findings=scanSensitiveText(state.studentText||'',state.studentIdentity||'',state.extraPii||'',state.studentCode||'STUDENT_001');
    scan.allFindings.push(...findings);
    if(attachedFiles.length) scan.attachmentWarnings.push({scope:state.studentCode||'STUDENT_001',message:`Přiloženo ${attachedFiles.length} souborů. Obrázky/PDF nelze před odesláním spolehlivě lokálně začernit; potvrď, že neobsahují viditelné osobní údaje.`});
  }
  scan.blocking=scan.allFindings.filter(x=>!x.auto);
  scan.auto=scan.allFindings.filter(x=>x.auto);
  privacyLastScan=scan;
  return scan;
}
function renderPrivacyMode(){
  const strict=state.privacyMode!=='off';
  $('privacyPanel')?.classList.toggle('strict',strict); $('privacyPanel')?.classList.toggle('warn',!strict);
  if($('privacyModeStatus')){ $('privacyModeStatus').textContent=strict?'přísný režim zapnutý':'privacy režim vypnutý'; $('privacyModeStatus').className='privacy-status '+(strict?'ok':'warn'); }
  if($('togglePrivacyBtn')) $('togglePrivacyBtn').textContent=strict?'Privacy režim: zapnuto':'Privacy režim: vypnuto';
  renderSensitiveStorageMode();
}
function renderSensitiveStorageMode(){
  const enabled=sensitiveSaveEnabled();
  const btn=$('toggleSensitiveSaveBtn');
  if(btn){ btn.textContent=enabled?'Obnova citlivé relace: zapnuto':'Obnova citlivé relace: vypnuto'; btn.classList.toggle('active', enabled); }
  const note=$('sensitiveSaveNote');
  if(note){ note.innerHTML=enabled ? 'Citlivá obnova je <strong>zapnutá</strong>: studentský text, identita, anonymizační údaje, potvrzení kontroly a výsledek se mohou uložit do localStorage tohoto prohlížeče. Používej jen na vlastním zařízení.' : 'Bezpečné výchozí nastavení: studentské texty, identita, anonymizační údaje, potvrzení kontroly a výsledky se do trvalého úložiště prohlížeče neukládají. Obnovu citlivé relace zapínej jen na vlastním zařízení.'; }
}
async function toggleSensitiveStateSaving(){
  if(sensitiveSaveEnabled()){
    safeLocalRemove(SENSITIVE_SAVE_PREF_SK);
    purgeSensitiveSavedState();
    saveState();
    renderSensitiveStorageMode();
    toast('Obnova citlivé relace vypnuta. Uložené citlivé údaje byly odstraněny.','warn');
    return;
  }
  const ok=await uiConfirm('Zapnout obnovu citlivé relace?\n\nStudentský text, identita, anonymizační údaje, potvrzení privacy kontroly a výsledek se budou ukládat do localStorage tohoto prohlížeče. Zapínej pouze na vlastním zařízení, ne na sdíleném nebo školním počítači.','Obnova citlivé relace');
  if(!ok) return;
  safeLocalSet(SENSITIVE_SAVE_PREF_SK,'1');
  saveState();
  renderSensitiveStorageMode();
  toast('Obnova citlivé relace zapnuta pro toto zařízení.','warn');
}
function clearSensitiveSavedData(){
  safeLocalRemove(SENSITIVE_SAVE_PREF_SK);
  purgeSensitiveSavedState();
  saveState();
  renderSensitiveStorageMode();
  toast('Uložené citlivé údaje byly vymazány a obnova citlivé relace je vypnutá.','warn');
}
function togglePrivacyMode(){ state.privacyMode=state.privacyMode==='off'?'strict':'off'; state.privacyApprovedHash=''; renderPrivacyMode(); saveState(); toast(state.privacyMode==='off'?'Privacy režim vypnutý. Kontrola nebude blokovat odeslání.':'Privacy režim zapnutý. Odeslání se zastaví při podezřelých údajích.','warn'); }
function renderPrivacyReport(scan=runPrivacyScan(),scroll=true){
  renderPrivacyMode(); const box=$('privacyList'); if(!box) return; const parts=[];
  if(!scan.blocking.length && !scan.attachmentWarnings.length){ parts.push('<div class="ok-box" style="margin:0">✓ Kontrola nenašla nevyřešené podezřelé údaje v textu.</div>'); }
  if(scan.auto.length){ parts.push(`<div class="small-muted">Automaticky řešené vzory: ${scan.auto.length}× e-mail/telefon/URL/rodné číslo apod. Tyto položky se při odeslání nahradí kódy.</div>`); }
  if(scan.attachmentWarnings.length){ parts.push('<div class="warn-box" style="margin:0"><strong>Přílohy vyžadují ruční potvrzení:</strong><br>'+scan.attachmentWarnings.map(w=>escapeHtml(w.message)).join('<br>')+'</div>'); }
  if(scan.blocking.length){ parts.push('<div class="warn-box" style="margin:0"><strong>Nalezené podezřelé údaje:</strong> nech zaškrtnuté položky, které se mají nahradit kódem. Falešné nálezy můžeš odškrtnout a potom kontrolu potvrdit.</div>'); parts.push(scan.blocking.map((it,i)=>`<label class="privacy-item"><input type="checkbox" data-privacy-finding="${i}" checked><span><b>${escapeHtml(it.type)}</b> · <code>${escapeHtml(it.value)}</code><br><span class="small-muted">${escapeHtml(it.scope||'student')} · ${escapeHtml(it.reason||'')} ${it.snippet?'<br>Kontext: '+escapeHtml(it.snippet):''}</span></span></label>`).join('')); }
  box.innerHTML=parts.join('') || '<div class="small-muted">Kontrola zatím neproběhla.</div>';
  if(scroll){ goTo(2); setTimeout(()=>{$('privacyPanel')?.scrollIntoView({behavior:'smooth',block:'center'});},80); }
}
function selectedPrivacyFindings(){ if(!privacyLastScan) return []; return Array.from(document.querySelectorAll('[data-privacy-finding]')).map(ch=>({idx:Number(ch.dataset.privacyFinding),checked:ch.checked})).filter(x=>x.checked).map(x=>privacyLastScan.blocking[x.idx]).filter(Boolean); }
function applySelectedPrivacyFindings(){
  const selected=selectedPrivacyFindings(); if(!selected.length){ toast('Není vybrán žádný nález k nahrazení.','warn'); return; }
  if(state.inputMode==='batch'){
    selected.forEach(it=>{ const s=batchStudents.find(x=>(x.code||'')===it.scope); if(s && s.text){ s.text=replaceAllLiteral(s.text,it.value,`[OSOBA_UDÁJ]`); } });
    renderBatchList();
  } else {
    let txt=$('studentText').value||''; selected.forEach((it,i)=>{ txt=replaceAllLiteral(txt,it.value,`[OSOBA_UDÁJ_${i+1}]`); }); $('studentText').value=txt; syncStateFromFields(false);
  }
  state.privacyApprovedHash=''; updateStats(); updatePromptPreview(); saveState(); renderPrivacyReport(runPrivacyScan(),false); toast('Vybrané nálezy byly nahrazeny v textu.');
}
function replaceAllLiteral(text,value,label){ if(!value) return text; return String(text||'').replace(new RegExp(escapeRegExp(value),'gi'),label); }
function approvePrivacyCheck(){ const scan=privacyLastScan || runPrivacyScan(); state.privacyApprovedHash=scan.hash; saveState(); renderPrivacyReport(scan,false); toast('Kontrola potvrzena. Teď můžeš bezpečněji pokračovat k odeslání.'); goTo(3); }
async function privacyGateBeforeSend(){
  if(state.privacyMode==='off') return true;
  const fp=privacyFingerprint(); if(state.privacyApprovedHash && state.privacyApprovedHash===fp) return true;
  const scan=runPrivacyScan();
  if(scan.blocking.length || scan.attachmentWarnings.length){ renderPrivacyReport(scan,true); toast('Privacy režim zastavil odeslání. Zkontroluj nálezy a potvrď kontrolu.','warn'); return false; }
  state.privacyApprovedHash=scan.hash; saveState(); renderPrivacyReport(scan,false); return true;
}

function fileExt(name){ return String(name||'').split('.').pop().toLowerCase(); }
function formatSize(n){ if(n<1024) return n+' B'; if(n<1024*1024) return Math.round(n/1024)+' KB'; return (n/1024/1024).toFixed(1)+' MB'; }
async function handleFiles(e){ await handleFileList(e.target.files); e.target.value=''; }
async function handleFileList(list){ const files=Array.from(list||[]); if(!files.length) return; for(const f of files){ await processFile(f); } renderFiles(); updateStats(); updatePromptPreview(); saveState(); }
async function processFile(f){
  const ext=fileExt(f.name);
  try{
    if(['txt','md','markdown','csv','tsv'].includes(ext) || /^text\//.test(f.type)){
      const text=await f.text(); appendStudentText(text, f.name); toast('Textový soubor načten: '+f.name); return;
    }
    if(ext==='docx'){
      const text=await extractDocxText(f); appendStudentText(text, f.name); toast('DOCX převeden na text: '+f.name); return;
    }
    if(/^image\//.test(f.type) || ['jpg','jpeg','png','webp','gif','heic','heif'].includes(ext)){
      const img=await prepareImageAttachment(f);
      attachedFiles.push(img); state.privacyApprovedHash='';
      const msg = img.wasDownscaled ? `${f.name}: fotka zmenšena ${formatSize(img.originalSize)} → ${formatSize(img.size)}` : `${f.name}: fotka přidána bez zmenšení`;
      toast(msg, img.wasDownscaled?'ok':'warn');
      return;
    }
    if(ext==='pdf' || f.type==='application/pdf'){
      const dataUrl=await readAsDataUrl(f); attachedFiles.push({name:f.name,size:f.size,originalSize:f.size,mime:'application/pdf',dataUrl,wasDownscaled:false}); state.privacyApprovedHash=''; toast('PDF přidáno pro Gemini: '+f.name,'warn'); return;
    }
    toast('Nepodporovaný typ souboru: '+f.name,'err');
  }catch(e){ toast((e&&e.message)||String(e),'err'); }
}
function appendStudentText(text,name){ state.privacyApprovedHash=''; const current=$('studentText').value.trim(); const safeLabel='NAHRANÝ_TEXT'; const chunk=(current?'\n\n':'')+'[ZDROJ: '+safeLabel+']\n'+String(text||'').trim(); $('studentText').value=current+chunk; syncStateFromFields(); }
function decodeDocxXmlText(value){
  return String(value||'')
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
    .replace(/&#([0-9]+);/g,(_,n)=>String.fromCodePoint(parseInt(n,10)))
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
}
function docxParagraphText(xml){
  let out='';
  const token=/<(?:[A-Za-z_][\w.-]*:)?t\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z_][\w.-]*:)?t\s*>|<(?:[A-Za-z_][\w.-]*:)?tab\b[^>]*\/?\s*>|<(?:[A-Za-z_][\w.-]*:)?(?:br|cr)\b[^>]*\/?\s*>/gi;
  let match;
  while((match=token.exec(String(xml||'')))){
    if(match[1]!==undefined)out+=decodeDocxXmlText(match[1]);
    else if(/(?:^|:)tab\b/i.test(match[0].replace(/^</,'')))out+='\t';
    else out+='\n';
  }
  return out.replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trimEnd();
}
function docxXmlToText(xml,fileName='DOCX'){
  const source=String(xml||'');
  if(!/<(?:[A-Za-z_][\w.-]*:)?document\b/i.test(source)||!/<(?:[A-Za-z_][\w.-]*:)?body\b/i.test(source))throw new Error(fileName+': dokument.xml nemá platnou strukturu WordprocessingML.');
  const paragraphs=[];
  const pattern=/<(?:[A-Za-z_][\w.-]*:)?p\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z_][\w.-]*:)?p\s*>/gi;
  let match;
  while((match=pattern.exec(source))){const text=docxParagraphText(match[1]);if(text.trim())paragraphs.push(text);}
  const text=paragraphs.join('\n').replace(/\n{3,}/g,'\n\n').trim();
  if(!text)throw new Error(fileName+': DOCX se podařilo otevřít, ale neobsahuje čitelný text.');
  return text;
}
async function extractDocxText(f){
  const JSZip=await ensureJSZip();
  const zip=await JSZip.loadAsync(await f.arrayBuffer());
  const documentPart=zip.file('word/document.xml');
  if(!documentPart)throw new Error(f.name+': soubor nemá platnou strukturu DOCX.');
  return docxXmlToText(await documentPart.async('string'),f.name);
}
function readAsDataUrl(f){ return new Promise((resolve,reject)=>{const r=new FileReader(); r.onload=()=>resolve(String(r.result||'')); r.onerror=()=>reject(r.error||new Error('Soubor se nepodařilo přečíst.')); r.readAsDataURL(f);}); }
function dataUrlToBase64(u){ const i=String(u||'').indexOf(','); return i>=0?String(u).slice(i+1):String(u||''); }
function base64ByteSize(b64){ const s=String(b64||''); const pad=(s.endsWith('==')?2:(s.endsWith('=')?1:0)); return Math.max(0, Math.floor(s.length*3/4)-pad); }
function dataUrlByteSize(u){ return base64ByteSize(dataUrlToBase64(u)); }
function apiMimeForFile(f){ const ext=fileExt(f?.name); if(ext==='pdf') return 'application/pdf'; if(f?.type) return f.type; return ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gif:'image/gif',webp:'image/webp',heic:'image/heic',heif:'image/heif'}[ext]||'application/octet-stream'); }
function canDownscaleImage(f){ const ext=fileExt(f?.name); const t=String(f?.type||'').toLowerCase(); return ['image/jpeg','image/png','image/webp','image/gif'].includes(t) || ['jpg','jpeg','png','webp','gif'].includes(ext); }
async function prepareImageAttachment(f){
  const originalSize=f.size||0; const originalMime=apiMimeForFile(f);
  if(!canDownscaleImage(f)){
    const dataUrl=await readAsDataUrl(f);
    return {name:f.name,size:originalSize,originalSize,mime:originalMime,dataUrl,wasDownscaled:false,resizeNote:'původní formát'};
  }
  const originalDataUrl=await readAsDataUrl(f);
  try{
    const img=await new Promise((resolve,reject)=>{ const im=new Image(); im.onload=()=>resolve(im); im.onerror=()=>reject(new Error('Obrázek se nepodařilo dekódovat.')); im.src=originalDataUrl; });
    const w=img.naturalWidth||img.width, h=img.naturalHeight||img.height;
    if(!w || !h) throw new Error('Obrázek nemá čitelné rozměry.');
    const scale=Math.min(1, IMAGE_MAX_DIM/Math.max(w,h));
    const tw=Math.max(1,Math.round(w*scale)), th=Math.max(1,Math.round(h*scale));
    const canvas=document.createElement('canvas'); canvas.width=tw; canvas.height=th;
    const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('Canvas není dostupný.');
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,tw,th); ctx.drawImage(img,0,0,tw,th);
    const out=canvas.toDataURL('image/jpeg', IMAGE_JPEG_QUALITY);
    const newSize=dataUrlByteSize(out); const originalDataSize=dataUrlByteSize(originalDataUrl) || originalSize;
    if(out && newSize > 0 && newSize < originalDataSize){
      return {name:f.name.replace(/\.[^.]+$/, '') + '_zmenseno.jpg', originalName:f.name, size:newSize, originalSize, mime:'image/jpeg', dataUrl:out, wasDownscaled:true, width:tw, height:th, originalWidth:w, originalHeight:h, resizeNote:`${w}×${h} → ${tw}×${th}`};
    }
    return {name:f.name,size:originalSize,originalSize,mime:originalMime,dataUrl:originalDataUrl,wasDownscaled:false,width:w,height:h,resizeNote:'původní soubor byl menší'};
  }catch(_){
    return {name:f.name,size:originalSize,originalSize,mime:originalMime,dataUrl:originalDataUrl,wasDownscaled:false,resizeNote:'zmenšení se nepodařilo'};
  }
}
function renderFiles(){
  const list=$('fileList'), strip=$('imgStrip'); if(!list||!strip) return;
  list.innerHTML=attachedFiles.map((f,i)=>{
    const isImg=/^image\//.test(f.mime); const sizeLabel=(f.originalSize&&f.originalSize!==f.size)?`${formatSize(f.originalSize)} → ${formatSize(f.size||0)}`:formatSize(f.size||0);
    const status=isImg?(f.wasDownscaled?'zmenšeno JPEG':'obrázek pro Gemini'):'příloha pro Gemini'; const cls=isImg?(f.wasDownscaled?'ok':'warn'):'';
    return `<div class="file-tag"><span class="fn">${escapeHtml(f.originalName||f.name)}</span><span class="fs">${sizeLabel}</span><span class="file-status ${cls}" title="${escapeHtml(f.resizeNote||'')}">${status}</span><button type="button" data-rm-file="${i}">×</button></div>`;
  }).join('');
  strip.innerHTML=attachedFiles.filter(f=>/^image\//.test(f.mime)).map(f=>`<img src="${f.dataUrl}" alt="${escapeHtml(f.originalName||f.name)}">`).join('');
  document.querySelectorAll('[data-rm-file]').forEach(b=>b.onclick=(ev)=>{ev.stopPropagation(); attachedFiles.splice(Number(b.dataset.rmFile),1); state.privacyApprovedHash=''; renderFiles(); updateStats(); updatePromptPreview();});
}

/* 35-transcription.js */
function requiresTranscriptReview(student){const s=ensureBatchStudentShape(student);return Boolean((s.files||[]).length&&!s.transcriptConfirmed);}
function confirmStudentTranscript(index){const s=batchStudents[index];if(!s||!String(s.text||'').trim()){toast('Nejdřív doplň nebo vygeneruj digitální přepis.','warn');return;}s.transcriptConfirmed=true;s.transcriptStatus='confirmed';s.status='čeká';renderBatchList();updateWorkflowDashboard();saveBatchProgress();toast(`${s.code}: přepis potvrzen učitelem.`);}
function invalidateStudentTranscript(index){const s=batchStudents[index];if(!s)return;s.transcriptConfirmed=false;s.transcriptStatus='needs-review';s.approved=false;renderBatchList();updateWorkflowDashboard();saveBatchProgress();}
async function transcribeBatchStudent(index){const s=batchStudents[index];if(!s||(s.files||[]).length===0){toast('Tato práce nemá obrazovou nebo PDF přílohu.','warn');return;}if(!geminiApiKey&&getGeminiInputKey())useGeminiKeyForSession();geminiApiKey=getGeminiInputKey()||geminiApiKey;if(!geminiApiKey){toast('Pro automatický přepis zadej Gemini API klíč.','err');return;}s.transcriptStatus='transcribing';s.status='přepisuji';renderBatchList();try{const out=await callGeminiTranscription(s,geminiApiKey,resolveGeminiModel());s.text=out.text||'';s.legibilityPercent=Math.max(0,Math.min(100,Number(out.legibility_percent)||0));s.uncertainFragments=Array.isArray(out.uncertain_fragments)?out.uncertain_fragments:[];s.transcriptStatus='needs-review';s.transcriptConfirmed=false;s.status='čeká';state.privacyApprovedHash='';toast(`${s.code}: přepis připraven ke kontrole.`);}catch(e){s.transcriptStatus='error';s.status='chyba';toast('Přepis se nepodařil: '+(e.message||e),'err');}finally{renderBatchList();updateWorkflowDashboard();saveBatchProgress();}}
async function callGeminiTranscription(student,key,model){const prompt=`PŘESNÝ PŘEPIS RUČNĚ PSANÉHO MATURITNÍHO SLOHU.\n- Přepiš pouze to, co je skutečně čitelné.\n- Neopravuj gramatiku, spelling, slovosled ani styl.\n- Zachovej odstavce a původní chyby.\n- Nečitelné místo označ [?] nebo [nečitelné: odhad].\n- Osobní údaje jako jméno, třída, podpis, e-mail či adresa nahraď [OSOBNÍ_ÚDAJ].\nVrať pouze validní JSON bez Markdownu: {"text":"...","legibility_percent":0,"uncertain_fragments":["..."]}.`;const raw=await callGemini(key,model,prompt,student.files||[],undefined);const cleaned=String(raw||'').replace(/^```(?:json)?\s*/i,'').replace(/```$/,'').trim();let parsed;try{parsed=JSON.parse(cleaned);}catch(_){parsed={text:raw,legibility_percent:0,uncertain_fragments:['Odpověď nebyla ve strukturovaném formátu; celý přepis zkontroluj ručně.']};}return parsed;}

/* 40-prompt-model.js */

function updatePromptPreview(){
  if(!$('promptPreview')) return;
  const sample = state.inputMode==='batch' ? (batchStudents.find(s=>String(s.text||'').trim() || (s.files||[]).length) || null) : null;
  const p = buildPrompt(sample);
  $('promptPreview').textContent=p.slice(0,14000)+(p.length>14000?'\n\n[ZKRÁCENÝ NÁHLED – skutečný prompt pokračuje]':'');
}

function normalizeModelName(s){ return String(s||'').trim().replace(/^models\//i,''); }
function isValidModelName(s){ return /^[A-Za-z0-9][A-Za-z0-9._-]{1,80}$/.test(normalizeModelName(s)); }
function resolveGeminiModel(){ const fromInput=normalizeModelName($('geminiModelInput')?.value||''); if(fromInput && isValidModelName(fromInput)) return fromInput; return (geminiModel&&isValidModelName(geminiModel))?normalizeModelName(geminiModel):GEMINI_MODEL_DEFAULT; }
function setGeminiModel(m){ const norm=normalizeModelName(m); if(norm && isValidModelName(norm)){ geminiModel=norm; safeLocalSet(GEMINI_MODEL_SK,geminiModel); const inp=$('geminiModelInput'); if(inp && norm!==inp.value.trim()) inp.value=norm; } updateGeminiModelUI(); }
function loadGeminiModel(){ let stored=''; stored=safeLocalGet(GEMINI_MODEL_SK)||''; geminiModel=(stored&&isValidModelName(stored))?normalizeModelName(stored):GEMINI_MODEL_DEFAULT; const inp=$('geminiModelInput'); if(inp) inp.value=geminiModel; updateGeminiModelUI(); }
function resetGeminiModel(){ const inp=$('geminiModelInput'); if(inp) inp.value=GEMINI_MODEL_DEFAULT; setGeminiModel(GEMINI_MODEL_DEFAULT); }
function updateGeminiModelUI(){
  const el=$('geminiModelStatus'); if(!el) return;
  const live=normalizeModelName($('geminiModelInput')?.value||'');
  if(live && !isValidModelName(live)){ el.textContent='neplatný název — používá se '+resolveGeminiModel(); el.style.color='var(--err)'; return; }
  const m=resolveGeminiModel();
  const known=geminiAvailableModels.includes(m);
  const api=geminiAvailableModelsApiVersion?` · ověřeno přes ${geminiAvailableModelsApiVersion}`:'';
  el.textContent=(m===GEMINI_MODEL_DEFAULT)?'výchozí ('+GEMINI_MODEL_DEFAULT+')'+api:(known?'ověřený model: ':'vlastní: ')+m+api;
  el.style.color=known?'var(--ok)':(m===GEMINI_MODEL_DEFAULT?'var(--t4)':'var(--acc)');
  const sel=$('geminiModelSelect'); if(sel && geminiAvailableModels.length){ sel.value=geminiAvailableModels.includes(m)?m:''; }
}
function renderGeminiModelSelect(models,current,apiVersion){
  geminiAvailableModels=Array.isArray(models)?models:[];
  geminiAvailableModelsApiVersion=apiVersion||'';
  const sel=$('geminiModelSelect');
  if(!sel) return;
  if(!geminiAvailableModels.length){ sel.innerHTML='<option value="">Nejdřív ověř modely…</option>'; sel.disabled=true; updateGeminiModelUI(); return; }
  const options=['<option value="">Vyber dostupný model…</option>'].concat(geminiAvailableModels.map(m=>`<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`));
  sel.innerHTML=options.join('');
  sel.disabled=false;
  if(geminiAvailableModels.includes(current)) sel.value=current;
  updateGeminiModelUI();
}
function isEmbeddedBrowserEnv(){ const ua=navigator.userAgent||''; return /FBAN|FBAV|Instagram|Line|wv|Documents|Teams|Outlook|GSA/i.test(ua); }
function applyKeyEnvUI(){ if(!isEmbeddedBrowserEnv()) return; const btn=$('btnSaveKeyPermanent'); if(btn){btn.classList.add('hidden'); btn.disabled=true;} const note=$('geminiNote'); if(note) note.innerHTML='Jsi pravděpodobně ve <strong>vestavěném prohlížeči aplikace</strong>, kde je trvalé uložení nespolehlivé — klíč použij <strong>jen pro relaci</strong>, nebo otevři nástroj v běžném Chrome/Safari.'; }
function getGeminiInputKey(){ return ($('geminiKeyInput')?.value||'').trim(); }
function setGeminiKey(key,scope){ geminiApiKey=String(key||'').trim(); geminiKeyScope=scope || geminiKeyScope || 'session'; const inp=$('geminiKeyInput'); if(inp && geminiApiKey && inp.value!==geminiApiKey) inp.value=geminiApiKey; updateGeminiStatus(); }
function loadGeminiKey(){ let sessionKey='',storedKey=''; sessionKey=safeSessionGet(GEMINI_KEY_SESSION_SK)||''; storedKey=safeLocalGet(GEMINI_KEY_SK)||''; if(sessionKey){ setGeminiKey(sessionKey,'session'); } else if(storedKey){ setGeminiKey(storedKey,'permanent'); } else { setGeminiKey('', 'session'); } }
function persistCurrentKeyForScope(){ const key=getGeminiInputKey(); geminiApiKey=key; if(geminiKeyScope==='session'){ if(key) safeSessionSet(GEMINI_KEY_SESSION_SK,key); else safeSessionRemove(GEMINI_KEY_SESSION_SK); safeLocalRemove(GEMINI_KEY_SK); } if(geminiKeyScope==='permanent'){ if(key) safeLocalSet(GEMINI_KEY_SK,key); else safeLocalRemove(GEMINI_KEY_SK); safeSessionRemove(GEMINI_KEY_SESSION_SK); } updateGeminiStatus(); }
function useGeminiKeyForSession(){ geminiKeyScope='session'; persistCurrentKeyForScope(); toast(getGeminiInputKey()?'Klíč se použije jen pro tuto relaci.':'Zvolen režim relace. Vlož API klíč.','ok'); }
async function saveGeminiKeyPermanent(){
  if(isEmbeddedBrowserEnv()){ toast('V tomto vestavěném prohlížeči je trvalé uložení nespolehlivé. Přepínám na relaci.','warn'); useGeminiKeyForSession(); return; }
  const key=getGeminiInputKey(); if(!key){ geminiKeyScope='permanent'; updateGeminiStatus(); toast('Zvolen režim trvalého uložení. Vlož API klíč a aplikace ho uloží do tohoto prohlížeče.','warn'); return; }
  const ok=await uiConfirm('Klíč se uloží do tohoto prohlížeče a zůstane tam i po zavření. Dělej to jen na osobním zařízení. Na sdíleném nebo školním počítači zvol raději „Použít jen pro relaci“.\n\nUložit klíč trvale?','Trvalé uložení API klíče'); if(!ok){ updateGeminiStatus(); return; }
  geminiKeyScope='permanent'; persistCurrentKeyForScope(); toast('API klíč je uložený trvale v tomto prohlížeči.','ok');
}
function clearGeminiKey(){ safeSessionRemove(GEMINI_KEY_SESSION_SK); safeLocalRemove(GEMINI_KEY_SK); geminiApiKey=''; geminiKeyScope='session'; const inp=$('geminiKeyInput'); if(inp) inp.value=''; updateGeminiStatus(); toast('API klíč smazán. Režim je zpět na relaci.','warn'); }
function updateGeminiStatus(){
  const b=$('geminiStatus'); const inputKey=getGeminiInputKey(); if(inputKey && inputKey!==geminiApiKey) geminiApiKey=inputKey;
  if(b){ if(geminiApiKey){ b.textContent=geminiKeyScope==='permanent'?'✓ Klíč uložen trvale':'✓ Klíč jen v této relaci'; b.style.color=geminiKeyScope==='permanent'?'var(--acc)':'var(--ok)'; } else { b.textContent=geminiKeyScope==='permanent'?'Klíč není nastaven – zvolen režim trvalého uložení':'Klíč není nastaven – zvolen režim relace'; b.style.color='var(--acc)'; } }
  const sessionBtn=$('btnUseKeySession'), permBtn=$('btnSaveKeyPermanent'), clearBtn=$('btnClearKey');
  sessionBtn?.classList.toggle('key-mode-selected',geminiKeyScope==='session'); permBtn?.classList.toggle('key-mode-selected',geminiKeyScope==='permanent'); clearBtn?.classList.toggle('key-clear-active',!geminiApiKey);
  sessionBtn?.setAttribute('aria-pressed',String(geminiKeyScope==='session')); permBtn?.setAttribute('aria-pressed',String(geminiKeyScope==='permanent')); clearBtn?.setAttribute('aria-pressed',String(!geminiApiKey));
}

const WC_MONTHS = new Set(['january','february','march','april','may','june','july','august','september','october','november','december']);
const WC_NAME_CONNECTORS = new Set(['of','and','the','de','del','la','le','van','von','nad','upon']);
const WC_CAP_STOP = new Set(['I','The','A','An','In','On','At','To','From','For','And','But','Or','If','When','While','Because','Although','However','Therefore','Firstly','Secondly','Finally','In','It','This','That','These','Those','There','Nowadays','Dear','Yours','Sir','Madam','Mr','Mrs','Ms','Miss','Kind','Regards']);

/* 45-evaluation-contract.js */
function cleanArray(v){return Array.isArray(v)?v.filter(x=>x!==null&&x!==undefined):[];}
function clampScore(v,min=0,max=3){const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):0;}
function normalizeErrorItem(x={}){return {paragraph:String(x.paragraph||''),quote:String(x.quote||''),correction:String(x.correction||''),reason:String(x.reason||''),cause_key:normalizeMatchText(x.cause_key||x.reason||x.quote),repeat_count:Math.max(1,Number(x.repeat_count)||1),subtype:String(x.subtype||'')};}
function dedupeErrorList(list){const map=new Map();for(const raw of cleanArray(list)){const x=normalizeErrorItem(raw);const key=x.cause_key||normalizeMatchText(x.quote);if(!key)continue;if(!map.has(key))map.set(key,x);else map.get(key).repeat_count+=x.repeat_count;}return [...map.values()];}
function normalizeRequirementAnalysis(list){return cleanArray(list).map((x,i)=>({id:String(x.id||`R${i+1}`),verdict:['splneno','castecne','nesplneno'].includes(x.verdict)?x.verdict:'nesplneno',evidence:cleanArray(x.evidence).map(e=>({paragraph:String(e.paragraph||''),quote:String(e.quote||'')})),reason:String(x.reason||'')}));}
function assignmentScoreFromRequirements(reqs){let raw=3;for(const r of reqs)raw-=r.verdict==='castecne'?0.5:r.verdict==='nesplneno'?1:0;if(raw>=2.5)return 3;if(raw>=1.5)return 2;return 1;}
function uniquePush(arr,value){if(value&&!arr.includes(value))arr.push(value);}
function scoreErrors(localCount,globalCount){const pl=scoreBandPoints(localCount,RUBRIC_SPEC.errorScoring.local);const pg=scoreBandPoints(globalCount,RUBRIC_SPEC.errorScoring.global);return Math.max(0,pl+pg-3);}
function normalizeEvaluationObject(raw={},student,wordAudit){const sections={};for(const id of RUBRIC_SECTION_IDS){const x=raw.sections?.[id]||{};sections[id]={score_suggested:clampScore(x.score_suggested),verdict:String(x.verdict||''),evidence:cleanArray(x.evidence).map(String),reasoning:String(x.reasoning||'')};}const errors={lexical_local:dedupeErrorList(raw.errors?.lexical_local),lexical_global:dedupeErrorList(raw.errors?.lexical_global),grammar_local:dedupeErrorList(raw.errors?.grammar_local),grammar_global:dedupeErrorList(raw.errors?.grammar_global)};return {schema_version:String(raw.schema_version||RUBRIC_SCHEMA_VERSION),rubric_version:String(raw.rubric_version||RUBRIC_VERSION),student_code:String(raw.student_code||student?.code||'STUDENT_001'),transcription:{source_type:String(raw.transcription?.source_type||((student?.files||[]).length?'attachment':'text')),legibility_percent:raw.transcription?.legibility_percent??student?.legibilityPercent??null,uncertain_fragments:cleanArray(raw.transcription?.uncertain_fragments||student?.uncertainFragments).map(String)},input_lock:{first_sentence:String(raw.input_lock?.first_sentence||''),last_sentence:String(raw.input_lock?.last_sentence||''),confirmed_exact_input:Boolean(raw.input_lock?.confirmed_exact_input)},assignment_analysis:{genre_match:raw.assignment_analysis?.genre_match!==false,detected_genre:String(raw.assignment_analysis?.detected_genre||state.genre||'other'),off_topic:Boolean(raw.assignment_analysis?.off_topic),formal_salutation_present:raw.assignment_analysis?.formal_salutation_present??null,formal_closing_present:raw.assignment_analysis?.formal_closing_present??null,formal_pair_correct:raw.assignment_analysis?.formal_pair_correct??null,heading_present:raw.assignment_analysis?.heading_present??null,contractions_count:Math.max(0,Number(raw.assignment_analysis?.contractions_count)||0),requirements:normalizeRequirementAnalysis(raw.assignment_analysis?.requirements),fail_codes_suggested:cleanArray(raw.assignment_analysis?.fail_codes_suggested).map(String)},sections,errors,ptn:{PTN1:cleanArray(raw.ptn?.PTN1).map(String),PTN2:cleanArray(raw.ptn?.PTN2).map(String),PTN3:cleanArray(raw.ptn?.PTN3).map(String)},advanced_language:{b2_grammar:cleanArray(raw.advanced_language?.b2_grammar).map(String),advanced_grammar:cleanArray(raw.advanced_language?.advanced_grammar).map(String),b2_vocabulary:cleanArray(raw.advanced_language?.b2_vocabulary).map(String)},authenticity:{estimate_percent:Math.max(0,Math.min(100,Number(raw.authenticity?.estimate_percent)||0)),certainty:String(raw.authenticity?.certainty||'nizka'),signals:cleanArray(raw.authenticity?.signals)},feedback:{teacher_markdown:String(raw.feedback?.teacher_markdown||''),student_markdown:String(raw.feedback?.student_markdown||''),positive:cleanArray(raw.feedback?.positive).map(String),negative:cleanArray(raw.feedback?.negative).map(String),improvements:cleanArray(raw.feedback?.improvements).map(String),extreme_content_note:raw.feedback?.extreme_content_note?String(raw.feedback.extreme_content_note):null},word_count:wordAudit};}
function removeCrossCategoryDuplicates(evaluation){const seen=new Set();for(const key of ['grammar_local','grammar_global','lexical_local','lexical_global'])evaluation.errors[key]=evaluation.errors[key].filter(x=>{const k=x.cause_key||normalizeMatchText(x.quote);if(!k||seen.has(k))return false;seen.add(k);return true;});}
function finalizeEvaluation(raw,student){const text=String(student?.text||'');const wc=localWordCountReport(text,state.taskText||'',state.taskTitle||currentTask().title||'',state.genre||'');const ev=normalizeEvaluationObject(raw,student,wc);removeCrossCategoryDuplicates(ev);const fail=[];const aa=ev.assignment_analysis;const reqs=aa.requirements;const essayPairMismatch=!aa.genre_match&&RUBRIC_SPEC.assignment.essayPairException.includes(state.genre)&&RUBRIC_SPEC.assignment.essayPairException.includes(aa.detected_genre);if(!aa.genre_match&&!essayPairMismatch)uniquePush(fail,'FAIL-1');if(aa.off_topic)uniquePush(fail,'FAIL-2');if(RUBRIC_SPEC.assignment.formalGenres.includes(state.genre)&&aa.formal_salutation_present===false&&aa.formal_closing_present===false)uniquePush(fail,'FAIL-3');if(reqs.length&&reqs.filter(r=>r.verdict==='nesplneno').length>reqs.length/2)uniquePush(fail,'FAIL-4');/* Návrhy FAIL kódů od AI nejsou autoritativní; finální FAIL určuje výhradně deterministický engine. */let assignment=fail.length?0:assignmentScoreFromRequirements(reqs);if(!fail.length){if(essayPairMismatch)assignment=Math.max(1,assignment-1);if(RUBRIC_SPEC.assignment.formalGenres.includes(state.genre)){if(aa.formal_salutation_present===false||aa.formal_closing_present===false||aa.formal_pair_correct===false)assignment=Math.max(1,assignment-1);}if(RUBRIC_SPEC.assignment.headingRequiredGenres.includes(state.genre)&&aa.heading_present===false)assignment=Math.max(1,assignment-1);if(RUBRIC_SPEC.assignment.contractionsPenalizedGenres.includes(state.genre)&&aa.contractions_count>RUBRIC_SPEC.assignment.contractionsFreeAllowance)assignment=Math.max(1,assignment-1);if(wc.finalCount>=RUBRIC_SPEC.wordCount.longPenaltyFrom)assignment=Math.max(1,assignment-1);}const scores={};scores.zadani_a_rozsah=assignment;scores.lexikalni_a_spellingove_chyby=scoreErrors(ev.errors.lexical_local.length,ev.errors.lexical_global.length);scores.gramaticke_chyby=scoreErrors(ev.errors.grammar_local.length,ev.errors.grammar_global.length);for(const id of ['odstavce_a_koherence','obsah','uroven_slovni_zasoby','uroven_gramatiky'])scores[id]=clampScore(ev.sections[id].score_suggested);scores.ptn_a_koheze=clampScore(ev.sections.ptn_a_koheze.score_suggested);if(RUBRIC_SPEC.ptn.required.some(k=>ev.ptn[k].length===0))scores.ptn_a_koheze=Math.max(0,scores.ptn_a_koheze-RUBRIC_SPEC.ptn.missingPenalty);if(!fail.length&&Object.entries(scores).some(([k,v])=>k!=='zadani_a_rozsah'&&v===0)){for(const id of RUBRIC_SECTION_IDS)if(id!=='zadani_a_rozsah'&&scores[id]===3)scores[id]=2;}const total=RUBRIC_SECTION_IDS.reduce((a,id)=>a+scores[id],0);ev.final={scores,total,grade:(wc.finalCount<RUBRIC_SPEC.wordCount.minimum||fail.length)?5:gradeFromTotal(total),fail_codes:fail,fail_signal:fail.length>0||wc.finalCount<RUBRIC_SPEC.wordCount.minimum,below_minimum:wc.finalCount<RUBRIC_SPEC.wordCount.minimum,long_penalty:wc.finalCount>=RUBRIC_SPEC.wordCount.longPenaltyFrom};ev.validation=validateFinalEvaluation(ev,student);return ev;}
function quoteOccursInStudentText(quote,text){const q=normalizePlainForCount(quote);const t=normalizePlainForCount(text);return Boolean(q&&t&&t.includes(q));}
function validParagraphMarker(value){return /^P\d+(?:[–-]P?\d+)?$/i.test(String(value||'').trim());}
function validateFinalEvaluation(ev,student){
  const issues=[];
  const sourceText=String(student?.text||'');
  const allowedGenres=['opinion','for_against','review','narration','complaint','motivation','other'];
  if(!allowedGenres.includes(ev.assignment_analysis?.detected_genre))issues.push('Chybí platné určení skutečně rozpoznaného útvaru.');
  if(ev.rubric_version!==RUBRIC_VERSION)issues.push('Nesouhlasí verze hodnoticí rubriky.');
  if(!ev.input_lock.confirmed_exact_input)issues.push('Model nepotvrdil zámek přesného vstupu.');
  if(!ev.input_lock.first_sentence||!ev.input_lock.last_sentence)issues.push('Chybí první nebo poslední věta vstupního zámku.');
  if(ev.word_count?.firstSentence&&ev.input_lock.first_sentence.trim()!==String(ev.word_count.firstSentence).trim())issues.push('První věta vstupního zámku nesouhlasí s hodnoceným textem.');
  if(ev.word_count?.lastSentence&&ev.input_lock.last_sentence.trim()!==String(ev.word_count.lastSentence).trim())issues.push('Poslední věta vstupního zámku nesouhlasí s hodnoceným textem.');
  const expectedReqs=String(state.taskReqs||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
  if(expectedReqs.length&&ev.assignment_analysis.requirements.length!==expectedReqs.length)issues.push(`Důkazní mapa nemá přesně všechny body zadání (${ev.assignment_analysis.requirements.length}/${expectedReqs.length}).`);
  ev.assignment_analysis.requirements.forEach((r,index)=>{
    const expectedId=`R${index+1}`;
    if(String(r.id).toUpperCase()!==expectedId)issues.push(`${r.id||expectedId}: nesouhlasí pořadí nebo označení bodu zadání; očekáváno ${expectedId}.`);
    if(r.verdict!=='nesplneno'){
      if(r.evidence.length<1||r.evidence.length>2)issues.push(`${expectedId}: musí obsahovat 1–2 důkazy z textu.`);
      for(const e of r.evidence){
        if(!e.quote||!validParagraphMarker(e.paragraph))issues.push(`${expectedId}: chybí přesná citace nebo označení P#.`);
        else if(sourceText&&!quoteOccursInStudentText(e.quote,sourceText))issues.push(`${expectedId}: citace nebyla nalezena ve studentském textu.`);
      }
    }
    if(!String(r.reason||'').trim())issues.push(`${expectedId}: chybí zdůvodnění verdiktu.`);
  });
  for(const id of RUBRIC_SECTION_IDS){
    const score=ev.final.scores[id];
    const section=ev.sections[id];
    if(!Number.isInteger(score)||score<0||score>3)issues.push(`${id}: chybí platné body 0–3.`);
    if(!String(section?.verdict||'').trim())issues.push(`${id}: chybí verdikt.`);
    if(!String(section?.reasoning||'').trim())issues.push(`${id}: chybí zdůvodnění bodů.`);
    if(!cleanArray(section?.evidence).some(x=>String(x||'').trim()))issues.push(`${id}: chybí konkrétní příklad nebo důkaz z textu.`);
  }
  for(const [group,list] of Object.entries(ev.errors||{}))for(const error of cleanArray(list)){
    if(!error.quote||!error.correction||!error.reason)issues.push(`${group}: chyba nemá citaci, opravu a zdůvodnění.`);
    else if(sourceText&&!quoteOccursInStudentText(error.quote,sourceText))issues.push(`${group}: citace chyby nebyla nalezena ve studentském textu.`);
  }
  const sum=RUBRIC_SECTION_IDS.reduce((a,id)=>a+(ev.final.scores[id]||0),0);
  if(sum!==ev.final.total)issues.push('Součet kategorií nesouhlasí s celkovým skóre.');
  const expectedGrade=(ev.final.fail_signal||ev.final.below_minimum)?5:gradeFromTotal(ev.final.total);
  if(ev.final.grade!==expectedGrade)issues.push(`Výsledná známka neodpovídá pravidlům; očekáváno ${expectedGrade}.`);
  if((student?.files||[]).length&&!student.transcriptConfirmed)issues.push('Obrazový/PDF přepis nebyl potvrzen učitelem.');
  if(!String(ev.feedback.student_markdown||'').trim())issues.push('Chybí samostatná zpětná vazba pro studenta.');
  if(!String(ev.feedback.teacher_markdown||'').trim())issues.push('Chybí samostatný učitelský detail.');
  if(!ev.feedback.positive.length||!ev.feedback.negative.length||!ev.feedback.improvements.length)issues.push('Chybí klady, zápory nebo konkrétní návrhy ke zlepšení.');
  const signals=cleanArray(ev.authenticity?.signals);
  if(signals.length<3||signals.length>6)issues.push('Analýza šablonovitého projevu musí obsahovat 3–6 důkazů.');
  for(const signal of signals){
    const words=String(signal.quote||'').trim().split(/\s+/).filter(Boolean).length;
    if(words<5||words>20)issues.push('Citace u indikátoru šablonovitého projevu musí mít 5–20 slov.');
    if(!validParagraphMarker(signal.paragraph))issues.push('Indikátor šablonovitého projevu nemá označení P#.');
    if(sourceText&&signal.quote&&!quoteOccursInStudentText(signal.quote,sourceText))issues.push('Citace indikátoru šablonovitého projevu nebyla nalezena v textu.');
    if(!String(signal.reason||'').trim()||!String(signal.alternative_explanation||'').trim())issues.push('Indikátor šablonovitého projevu nemá důvod a alternativní vysvětlení.');
  }
  return {ok:issues.length===0,issues:[...new Set(issues)],checkedAt:new Date().toISOString()};
}
function evaluationMachineSummary(ev){return {schema_version:RUBRIC_SCHEMA_VERSION,rubric_version:RUBRIC_VERSION,student_code:ev.student_code,final_word_count:ev.word_count.finalCount,raw_word_count:ev.word_count.rawCount,deducted_word_count:ev.word_count.deductTotal,score_total:ev.final.total,grade:ev.final.grade,fail_signal:ev.final.fail_signal,fail_reason:ev.final.fail_codes.join(', ')||null,sections:ev.final.scores,ai_language_estimate_percent:ev.authenticity.estimate_percent,json_confidence:ev.validation.ok?'vysoká':'nízká'};}
function bulletList(items,empty='—'){const rows=cleanArray(items).map(x=>String(x||'').trim()).filter(Boolean);return rows.length?rows.map(x=>`- ${x}`).join('\n'):`- ${empty}`;}
function sectionDetailMarkdown(ev){return RUBRIC_SECTIONS.map((section,index)=>{const detail=ev.sections[section.id]||{};return `### ${index+1}. ${section.label} — ${ev.final.scores[section.id]}/3\n**Verdikt:** ${detail.verdict||'—'}\n\n**Konkrétní příklady / důkazy:**\n${bulletList(detail.evidence,'bez uvedeného důkazu')}\n\n**Zdůvodnění bodů:** ${detail.reasoning||'—'}`;}).join('\n\n');}
function errorMarkdown(title,items){if(!items.length)return `### ${title}\nBez zjištěných chyb.`;return `### ${title}\n`+items.map(x=>`- **${x.paragraph||'—'}:** „${x.quote}“ → **${x.correction}** — ${x.reason}${x.subtype?` [${x.subtype}]`:''}${x.repeat_count>1?` (opakuje se ${x.repeat_count}×)`:''}`).join('\n');}
function wordAuditMarkdown(ev){const wc=ev.word_count||{};return `## Kontrola rozsahu a zámek vstupu\n**První věta:** ${ev.input_lock.first_sentence||'—'}\n\n**Poslední věta:** ${ev.input_lock.last_sentence||'—'}\n\n1. RAW COUNT = **${wc.rawCount??'—'}**\n2. ODEČTENÉ POLOŽKY = **−${wc.deductTotal??'—'}**${wc.details?` — ${formatDeductionList(wc)}`:''}\n3. FINÁLNÍ POČET SLOV = **${wc.finalCount??'—'}**\n4. KONTROLA PO ODSTAVCÍCH: ${wc.paraCounts?formatParagraphAudit(wc):'—'}\n\n**Rozsah – kontrola:** Z = ${wc.finalCount??'—'}; <195? ${wc.finalCount<195?'ano':'ne'}; ≥300? ${wc.finalCount>=300?'ano':'ne'}; penalizace: ${wc.finalCount>=300?'ano':'ne'}.`;}
function requirementMapMarkdown(ev){return ev.assignment_analysis.requirements.map(r=>`- **${r.id} → ${r.verdict}**\n  - Důkaz: ${r.evidence.map(e=>`${e.paragraph}: „${e.quote}“`).join('; ')||'relevantní obsah nebyl nalezen'}\n  - Zdůvodnění: ${r.reason||'—'}`).join('\n')||'- Bez záznamu.';}
function authenticityMarkdown(ev){const a=ev.authenticity||{};return `## Indikátory neautentického / šablonovitého projevu\n**ODHAD:** ${a.estimate_percent??0} %  \n**JISTOTA:** ${a.certainty||'nízká'}\n\n${cleanArray(a.signals).map((x,i)=>`${i+1}. **${x.paragraph||'—'}:** „${x.quote||'—'}“\n   - Signál: ${x.reason||'—'}\n   - Alternativní vysvětlení: ${x.alternative_explanation||'—'}`).join('\n')||'Bez uvedených signálů.'}\n\n*Tento odhad není bodovou penalizací a slouží pouze jako upozornění učiteli.*`;}
function generatedTeacherDetail(ev){const lexLocal=ev.errors.lexical_local.length,lexGlobal=ev.errors.lexical_global.length,gramLocal=ev.errors.grammar_local.length,gramGlobal=ev.errors.grammar_global.length;const ptnMissing=RUBRIC_SPEC.ptn.required.filter(k=>!ev.ptn[k].length);return `# Učitelský detail – ${ev.student_code}\n\n**Finální počet slov:** ${ev.word_count.finalCount} · **Body:** ${ev.final.total}/24 · **Známka:** ${ev.final.grade}${ev.final.fail_signal?` · **FAIL: ${ev.final.fail_codes.join(', ')||'nedostatečný rozsah'}`:''}\n**Rozpoznaný útvar:** ${ev.assignment_analysis.detected_genre||'—'}${ev.transcription.legibility_percent!=null?` · **Čitelnost rukopisu:** ${ev.transcription.legibility_percent} %`:''}\n\n${wordAuditMarkdown(ev)}\n\n## Důkazní mapa zadání\n${requirementMapMarkdown(ev)}\n\n## Hodnocení všech osmi kategorií\n${sectionDetailMarkdown(ev)}\n\n## Kontrolní výpočet jazykových chyb\n- Lexis/spelling: L=${lexLocal}, G=${lexGlobal} → **${ev.final.scores.lexikalni_a_spellingove_chyby}/3**\n- Gramatika: L=${gramLocal}, G=${gramGlobal} → **${ev.final.scores.gramaticke_chyby}/3**\n- PTN: PTN1=${ev.ptn.PTN1.length}, PTN2=${ev.ptn.PTN2.length}, PTN3=${ev.ptn.PTN3.length}${ptnMissing.length?` · chybí ${ptnMissing.join(', ')} → −1 bod`:''}\n\n${errorMarkdown('Lexikální lokální chyby',ev.errors.lexical_local)}\n\n${errorMarkdown('Lexikální globální chyby',ev.errors.lexical_global)}\n\n${errorMarkdown('Gramatické lokální chyby',ev.errors.grammar_local)}\n\n${errorMarkdown('Gramatické globální chyby',ev.errors.grammar_global)}\n\n## Prostředky textové návaznosti\n- **PTN1:** ${ev.ptn.PTN1.join(', ')||'chybí'}\n- **PTN2:** ${ev.ptn.PTN2.join(', ')||'chybí'}\n- **PTN3:** ${ev.ptn.PTN3.join(', ')||'chybí'}\n\n## Jazyková úroveň\n- **B2 gramatika:** ${ev.advanced_language.b2_grammar.join('; ')||'bez doloženého jevu'}\n- **Pokročilá gramatika:** ${ev.advanced_language.advanced_grammar.join('; ')||'bez doloženého jevu'}\n- **B2 slovní zásoba:** ${ev.advanced_language.b2_vocabulary.join('; ')||'bez doloženého jevu'}\n\n## Doplňující učitelský komentář AI\n${ev.feedback.teacher_markdown||'—'}\n\n## Co hodnotím kladně\n${bulletList(ev.feedback.positive)}\n\n## Co hodnotím záporně\n${bulletList(ev.feedback.negative)}\n\n## Návrhy ke zlepšení\n${bulletList(ev.feedback.improvements)}${ev.feedback.extreme_content_note?`\n\n## Citlivý obsah / extrémní myšlenky\n${ev.feedback.extreme_content_note}`:''}\n\n${authenticityMarkdown(ev)}`;}
function generatedStudentFeedback(ev){
  const rows=RUBRIC_SECTIONS.map(s=>`| ${s.label} | ${ev.final.scores[s.id]}/3 |`).join('\n');
  const actions=cleanArray(ev.feedback.improvements).map(x=>String(x||'').trim()).filter(Boolean).slice(0,3);
  const actionList=actions.length?actions.map((x,i)=>`${i+1}. ${x}`).join('\n'):'1. Projdi si s učitelem nejslabší hodnocenou oblast a napiš krátkou opravenou verzi problematické části.';
  const resultNotice=ev.final.fail_signal
    ? '> **Důležité:** Výsledek obsahuje podmínku vedoucí ke známce 5. Podrobné vysvětlení a další postup s tebou projde učitel.'
    : `> **Výsledek:** ${ev.final.total}/24 bodů · známka ${ev.final.grade} · ${ev.word_count.finalCount} slov`;
  return `# Zpětná vazba ke slohové práci

${resultNotice}

## Přehled hodnocení
| Oblast | Body |
|---|---:|
${rows}

## Celkové zhodnocení
${ev.feedback.student_markdown||'Zpětnou vazbu doplní učitel.'}

## Co se ti povedlo
${bulletList(ev.feedback.positive,'Silné stránky doplní učitel po kontrole práce.')}

## Na čem nejvíce zapracovat
${bulletList(ev.feedback.negative,'Oblasti ke zlepšení doplní učitel po kontrole práce.')}

## Tři kroky pro příští sloh
${actionList}

## Konkrétní jazykové chyby
${errorMarkdown('Slovní zásoba a pravopis',[...ev.errors.lexical_local,...ev.errors.lexical_global])}

${errorMarkdown('Gramatika',[...ev.errors.grammar_local,...ev.errors.grammar_global])}

## Doporučený postup opravy
1. Vyber si tři chyby, kterým rozumíš, a napiš jejich správnou podobu ve vlastní větě.
2. Přepracuj nejslabší odstavec tak, aby lépe plnil zadání a byl logicky propojený.
3. Před další prací si vytvoř krátkou osnovu a závěrečnou kontrolu zaměř na oblasti, ve kterých jsi ztratil/a nejvíce bodů.`;
}
function generatedRecordTable(ev){return `| Student | Slova | Zadání | Odstavce | Lexis | Gramatika | Obsah | PTN | Slovní zásoba | Úroveň gramatiky | Celkem | Známka | FAIL |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|\n| ${ev.student_code} | ${ev.word_count.finalCount} | ${ev.final.scores.zadani_a_rozsah} | ${ev.final.scores.odstavce_a_koherence} | ${ev.final.scores.lexikalni_a_spellingove_chyby} | ${ev.final.scores.gramaticke_chyby} | ${ev.final.scores.obsah} | ${ev.final.scores.ptn_a_koheze} | ${ev.final.scores.uroven_slovni_zasoby} | ${ev.final.scores.uroven_gramatiky} | ${ev.final.total} | ${ev.final.grade} | ${ev.final.fail_signal?'ANO':'NE'} |`;}
function evaluationToLegacyResult(ev){return `${RESULT_JSON_START}\n${JSON.stringify(evaluationMachineSummary(ev),null,2)}\n${RESULT_JSON_END}\n${RESULT_FEEDBACK_START}\n${RESULT_VIEW_MARKERS.teacher}\n${generatedTeacherDetail(ev)}\n\n${RESULT_VIEW_MARKERS.student}\n${generatedStudentFeedback(ev)}\n\n${RESULT_VIEW_MARKERS.record}\n${generatedRecordTable(ev)}`;}
function buildPrompt(studentOverride=null){const g=GENRES.find(x=>x.id===state.genre);const out=studentOverride?getOutboundStudentTextFromValues(studentOverride.text||'',studentOverride.identity||'',studentOverride.code||'STUDENT_001',studentOverride.extraPii||''):getOutboundStudentText();const source=studentOverride?.text??state.studentText??'';const wc=localWordCountReport(source,state.taskText||'',state.taskTitle||currentTask().title||'',state.genre||'');const reqs=String(state.taskReqs||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).map((r,i)=>/^R\d+\s*:/i.test(r)?r:`R${i+1}: ${r}`).join('\n');return `Jsi analytická vrstva školního hodnoticího systému. Nesmíš sám autoritativně rozhodovat o finálním součtu ani známce; aplikace je přepočítá deterministicky.\n\nPOVINNÝ VÝSTUP: vrať jediný validní JSON podle přiloženého response schema. Bez Markdownu, bez komentáře před nebo za JSONem.\n- rubric_version musí být přesně ${RUBRIC_VERSION}.\n- Každou chybu zařaď právě jednou: buď lexikální, nebo gramatickou.\n- Opakovanou chybu stejné příčiny uveď jednou s repeat_count.\n- U každého R bodu uveď verdikt, 1–2 přesné citace s P# a zdůvodnění.\n- U každé z 8 sekcí vyplň verdict, konkrétní evidence a reasoning. Důkazy musí být skutečně ve studentském textu.\n- detected_genre musí pojmenovat skutečně rozpoznaný útvar. Záměna opinion ↔ for_against není sama o sobě FAIL; aplikace za ni uplatní přesně −1 bod.\n- score_suggested u PTN posuzuj před povinnou penalizací za chybějící skupinu PTN1/PTN2/PTN3; tu přidá aplikace.\n- Neaplikuj matematicky FAIL, hranici 195/300, vzorce chyb, pravidlo nuly, finální součet ani známku. Tyto kroky provede aplikace.\n- teacher_markdown a student_markdown nesmí uvádět vlastní finální body ani známku; autoritativní souhrn doplní aplikace.\n- Zachovej původní chyby; nevytvářej kompletně opravený sloh.\n- Zpětnou vazbu piš česky.\n\nÚTVAR: ${g?.label||state.genre}\nZADÁNÍ: ${state.taskTitle||currentTask().title}\nPŘESNÉ ZNĚNÍ:\n${state.taskText}\nPOVINNÉ BODY:\n${reqs}\nKÓD STUDENTA: ${out.code}\nLOKÁLNÍ WORD-COUNT AUDIT (závazný vstup pro rozsah):\n${formatWordCountAuditForPrompt(wc)}\n\nÚPLNÁ ŠKOLNÍ RUBRIKA:\n${RUBRIC_PROMPT}\n\nSTUDENTSKÝ TEXT:\n<<<STUDENT_TEXT_START>>>\n${out.text||'[Text je v přiloženém obrázku/PDF.]'}\n<<<STUDENT_TEXT_END>>>`;}

/* 50-wordcount-offline.js */
function stripOuterPunct(token){
  return String(token||'').replace(/^[\s"'“”‘’«»„‚()\[\]{}<>.,;:!?¿¡]+|[\s"'“”‘’«»„‚()\[\]{}<>.,;:!?¿¡]+$/g,'');
}
function normalizePlainForCount(s){
  return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
function normalizeTokenForCount(t){ return normalizePlainForCount(stripOuterPunct(t)); }
function isNumericCountToken(token){
  const c=stripOuterPunct(token).replace(/^[$€£¥]+/,'').replace(/[%]+$/,'');
  return /^[+-]?\d+(?:[.,:/-]\d+)*(?:st|nd|rd|th)?$/i.test(c);
}
function isCapitalizedCountWord(token){
  const c=stripOuterPunct(token);
  if(!c || WC_MONTHS.has(c.toLowerCase())) return false;
  return /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][A-Za-zÁ-žÀ-ÿ'’-]+$/.test(c);
}
function buildCountTokens(text){
  const raw=String(text||'').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  const lines=raw.split('\n');
  const tokens=[];
  let para=0, seenInPara=false;
  lines.forEach((line,lineIndex)=>{
    if(!line.trim()){
      if(seenInPara){ para++; seenInPara=false; }
      return;
    }
    seenInPara=true;
    line.trim().split(/\s+/).filter(Boolean).forEach((rawToken,indexInLine)=>{
      tokens.push({raw:rawToken, clean:stripOuterPunct(rawToken), norm:normalizeTokenForCount(rawToken), para, line:lineIndex, indexInLine, globalIndex:tokens.length});
    });
  });
  const paragraphs=tokens.length ? (Math.max(...tokens.map(t=>t.para))+1) : 0;
  return {tokens, lines, paragraphs};
}
function sentenceEdgesForCount(text){
  const parts=String(text||'').trim().split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(Boolean);
  if(parts.length) return {first:parts[0], last:parts[parts.length-1]};
  const trimmed=String(text||'').trim();
  return {first:trimmed||'—', last:trimmed||'—'};
}
function detectHeadingForCount(tokens, lines, taskText, taskTitle, genre){
  if(!tokens.length) return null;
  const firstLineNo=tokens[0].line;
  const firstLineTokens=tokens.filter(t=>t.line===firstLineNo);
  const rawLine=String(lines[firstLineNo]||'').trim();
  const len=firstLineTokens.length;
  if(!len || len>12) return null;
  if(/^\s*(Dear\b|To whom\b|Yours\b|Kind regards\b)/i.test(rawLine)) return null;
  if(/[.!?]\s*$/.test(rawLine)) return null;
  const headingNorm=normalizePlainForCount(rawLine);
  if(!headingNorm || headingNorm.length<2) return null;
  const taskNorm=normalizePlainForCount((taskText||'')+' '+(taskTitle||''));
  const copied=taskNorm && taskNorm.includes(headingNorm);
  const hasFollowingLine=firstLineNo+1<lines.length;
  const nextLine=hasFollowingLine?lines[firstLineNo+1]:'';
  const hasBodyAfterHeading=tokens.some(t=>t.line>firstLineNo);
  const followedByBlank=hasFollowingLine && !String(nextLine).trim() && hasBodyAfterHeading;
  const titleCaseCount=firstLineTokens.filter(t=>isCapitalizedCountWord(t.raw)).length;
  const likelyTitle = copied || followedByBlank || ['review','narration'].includes(genre||'') || (titleCaseCount>=2 && len<=8);
  if(!likelyTitle) return null;
  return {type:copied?'převzatý nadpis':'originální nadpis', copied, raw:rawLine, indices:firstLineTokens.map(t=>t.globalIndex)};
}
function addDeductToken(deductMap, idx, reason){
  if(idx==null || idx<0 || deductMap.has(idx)) return false;
  deductMap.set(idx, reason);
  return true;
}
function addDeductionReason(details, type, label, amount){
  if(amount<=0) return;
  let item=details.find(x=>x.type===type && x.label===label);
  if(item) item.amount+=amount; else details.push({type,label,amount});
}
function detectCopiedTaskPhrases(tokens, taskText, used, minLen=6, maxLen=12){
  const taskToks=tokenizeSpaces(taskText||'').map(normalizeTokenForCount).filter(Boolean);
  const sets={};
  for(let n=minLen;n<=maxLen;n++){
    const set=new Set();
    for(let i=0;i<=taskToks.length-n;i++) set.add(taskToks.slice(i,i+n).join(' '));
    sets[n]=set;
  }
  const found=[];
  for(let i=0;i<tokens.length;i++){
    if(used.has(i) || !tokens[i].norm) continue;
    for(let n=Math.min(maxLen,tokens.length-i);n>=minLen;n--){
      let ok=true, seq=[];
      for(let j=0;j<n;j++){ if(used.has(i+j) || !tokens[i+j].norm){ ok=false; break; } seq.push(tokens[i+j].norm); }
      if(!ok) continue;
      const key=seq.join(' ');
      if(sets[n] && sets[n].has(key)){
        found.push({indices:Array.from({length:n},(_,k)=>i+k), text:tokens.slice(i,i+n).map(t=>t.raw).join(' ')});
        for(let j=0;j<n;j++) used.add(i+j);
        break;
      }
    }
  }
  return found;
}
function detectProperNamePhrases(tokens, used){
  const occurrences=[];
  for(let i=0;i<tokens.length;i++){
    if(used.has(i) || !isCapitalizedCountWord(tokens[i].raw)) continue;
    const firstClean=stripOuterPunct(tokens[i].raw);
    if(WC_CAP_STOP.has(firstClean)) continue;
    let j=i, indices=[], capCount=0;
    while(j<tokens.length && !used.has(j)){
      const clean=stripOuterPunct(tokens[j].raw);
      const low=clean.toLowerCase();
      const cap=isCapitalizedCountWord(tokens[j].raw);
      const connector=WC_NAME_CONNECTORS.has(low);
      if(cap){ indices.push(j); capCount++; j++; continue; }
      if(connector && indices.length && j+1<tokens.length && !used.has(j+1) && isCapitalizedCountWord(tokens[j+1].raw)){ indices.push(j); j++; continue; }
      break;
    }
    while(indices.length && WC_NAME_CONNECTORS.has(stripOuterPunct(tokens[indices[indices.length-1]].raw).toLowerCase())) indices.pop();
    const significant=indices.filter(idx=>isCapitalizedCountWord(tokens[idx].raw)).length;
    if(indices.length>=2 && significant>=2){
      const text=tokens.slice(indices[0],indices[indices.length-1]+1).map(t=>t.raw).join(' ');
      const key=normalizePlainForCount(text.replace(/^(the|a|an)\s+/i,''));
      if(key) occurrences.push({key,text,indices});
      i=indices[indices.length-1];
    }
  }
  const byKey=new Map();
  occurrences.forEach(o=>{ if(!byKey.has(o.key)) byKey.set(o.key,[]); byKey.get(o.key).push(o); });
  return Array.from(byKey.values()).flatMap(list=>list);
}
function formatDeductionList(wc){
  if(!wc || !wc.details || !wc.details.length) return 'žádné automaticky detekované odečty';
  return wc.details.map(d=>`${d.type}: −${d.amount}${d.label?` (${d.label})`:''}`).join('; ');
}
function formatParagraphAudit(wc){
  if(!wc || !wc.paraCounts || !wc.paraCounts.length) return 'P1=0';
  return wc.paraCounts.map((n,i)=>{
    const raw=wc.paraRawCounts[i]||0, ded=wc.paraDeductions[i]||0;
    return `P${i+1}=${raw}${ded?`−${ded}`:''}=${n}`;
  }).join(', ');
}
function formatWordCountAuditForPrompt(wc){
  if(!wc || !wc.rawCount){
    return 'WORD_COUNT_AUDIT: Textové pole je prázdné nebo je práce pouze v příloze. Lokální aplikace nemůže deterministicky spočítat slova z obrázku/PDF; nejprve proveď přepis a potom počet slov uveď s upozorněním na čitelnost.';
  }
  return `WORD_COUNT_AUDIT:\nRAW COUNT (tokeny mezi mezerami) = ${wc.rawCount}\nODEČTENÉ POLOŽKY = −${wc.deductTotal} [${formatDeductionList(wc)}]\nFINÁLNÍ POČET SLOV = ${wc.rawCount} − ${wc.deductTotal} = ${wc.finalCount}\nKONTROLA PO ODSTAVCÍCH: ${formatParagraphAudit(wc)}; součet = ${wc.paraCounts.reduce((a,b)=>a+b,0)}\nRozsah – kontrola: Z = ${wc.finalCount}; <195? ${wc.finalCount<195?'ano':'ne'}; ≥300? ${wc.finalCount>=300?'ano':'ne'}; penalizace: ${wc.finalCount>=300?'ano':'ne'}\nPoznámka: Tento audit vytvořila aplikace deterministicky před odesláním. Použij ho jako výchozí závazný výpočet; pokud při kontrole textu najdeš zjevný rozpor, upozorni učitele a vysvětli ho.`;
}
function localWordCountReport(text, taskText='', taskTitle='', genre=''){
  const raw=String(text||'').trim();
  const built=buildCountTokens(raw);
  const tokens=built.tokens;
  const deductMap=new Map();
  const details=[];
  const paraRawCounts=Array.from({length:Math.max(1,built.paragraphs||0)},()=>0);
  tokens.forEach(t=>{ if(paraRawCounts[t.para]==null) paraRawCounts[t.para]=0; paraRawCounts[t.para]++; });

  tokens.forEach(t=>{
    if(isNumericCountToken(t.raw)){
      if(addDeductToken(deductMap,t.globalIndex,'číslovka psaná číslicemi')) addDeductionReason(details,'číslice',t.raw,1);
    }
  });

  const heading=detectHeadingForCount(tokens,built.lines,taskText,taskTitle,genre);
  if(heading){
    let amount=0;
    if(heading.copied){
      heading.indices.forEach(idx=>{ if(addDeductToken(deductMap,idx,'převzatý nadpis')) amount++; });
    }else{
      heading.indices.slice(1).forEach(idx=>{ if(addDeductToken(deductMap,idx,'originální nadpis počítaný jako 1 slovo')) amount++; });
    }
    addDeductionReason(details,heading.type,heading.raw,amount);
  }

  const usedForCopied=new Set(deductMap.keys());
  const copied=detectCopiedTaskPhrases(tokens,taskText,usedForCopied,6,12);
  copied.forEach(c=>{
    let amount=0;
    c.indices.forEach(idx=>{ if(addDeductToken(deductMap,idx,'převzatý text ze zadání')) amount++; });
    addDeductionReason(details,'převzatý text ze zadání',c.text,amount);
  });

  const usedForNames=new Set(deductMap.keys());
  const namesByKey=new Map();
  detectProperNamePhrases(tokens,usedForNames).forEach(o=>{ if(!namesByKey.has(o.key)) namesByKey.set(o.key,[]); namesByKey.get(o.key).push(o); });
  namesByKey.forEach((list,key)=>{
    list.forEach((o,occIdx)=>{
      let deductIndices=occIdx===0 ? o.indices.slice(1) : o.indices.slice();
      let amount=0;
      deductIndices.forEach(idx=>{ if(addDeductToken(deductMap,idx,occIdx===0?'víceslovné vlastní jméno/název počítané jako 1 slovo':'opakované vlastní jméno/název')) amount++; });
      addDeductionReason(details,occIdx===0?'víceslovná vlastní jména/názvy':'opakovaná vlastní jména/názvy',o.text,amount);
    });
  });

  const paraDeductions=Array.from({length:paraRawCounts.length},()=>0);
  deductMap.forEach((reason,idx)=>{ const p=tokens[idx]?.para||0; paraDeductions[p]=(paraDeductions[p]||0)+1; });
  const paraCounts=paraRawCounts.map((rawCount,i)=>Math.max(0,rawCount-(paraDeductions[i]||0)));
  const deductTotal=deductMap.size;
  const finalCount=Math.max(0,tokens.length-deductTotal);
  const edges=sentenceEdgesForCount(raw);
  return {rawCount:tokens.length,deduct:deductTotal,deductTotal,details,digitItems:details.filter(d=>d.type==='číslice').map(d=>d.label),finalCount,paragraphs:built.paragraphs||0,paraRawCounts,paraDeductions,paraCounts,firstSentence:edges.first,lastSentence:edges.last,heading};
}
function buildOfflineReport(studentOverride=null){
  const g=GENRES.find(x=>x.id===state.genre);
  const out=studentOverride ? getOutboundStudentTextFromValues(studentOverride.text||'', studentOverride.identity||'', studentOverride.code||'STUDENT_001', studentOverride.extraPii||'') : getOutboundStudentText();
  const files=studentOverride ? (studentOverride.files||[]) : attachedFiles;
  const sourceTextForCount = studentOverride ? (studentOverride.text||'') : (state.studentText||'');
  const wc=localWordCountReport(sourceTextForCount, state.taskText||'', state.taskTitle||currentTask().title||'', state.genre||'');
  const reqs=String(state.taskReqs||'').split('\n').map(x=>x.trim()).filter(Boolean);
  const first=wc.firstSentence||'—';
  const last=wc.lastSentence||'—';
  const rangeFlags=`<195? ${wc.finalCount<195?'ano':'ne'}; ≥300? ${wc.finalCount>=300?'ano':'ne'}; penalizace za délku: ${wc.finalCount>=300?'ano':'ne'}`;
  const piiScan=studentOverride ? scanSensitiveText(out.text||'', studentOverride.identity||'', studentOverride.extraPii||'', out.code||'STUDENT') : (runPrivacyScan().blocking||[]);
  return `# Offline přípravný protokol\n\n**Kód studenta:** ${out.code}\n**Režim:** Offline příprava – bez odeslání do AI\n**Sada:** ${state.set==='exam'?'Ostrá maturitní verze':'Cvičná sada'}\n**Útvar:** ${g?.label||state.genre}\n**Zadání:** ${state.taskTitle||currentTask().title}\n\n## Co tento protokol umí a neumí\n- Vytvořeno pouze lokálně v prohlížeči.\n- Kontroluje přípravu, anonymizaci, deterministický word count podle lokálně zjistitelných pravidel a odstavce.\n- Nehodnotí gramatiku, slovní zásobu, splnění zadání ani výslednou známku – to vyžaduje AI nebo ruční učitelské hodnocení.\n\n## Kontrola vstupu\n**První věta / začátek:** ${first}\n\n**Poslední věta / konec:** ${last}\n\n## Deterministický word count – lokální audit\n1. RAW COUNT (tokeny mezi mezerami) = ${wc.rawCount}\n2. ODEČTENÉ POLOŽKY = −${wc.deductTotal} [${formatDeductionList(wc)}]\n3. FINÁLNÍ POČET SLOV = ${wc.rawCount} − ${wc.deductTotal} = ${wc.finalCount}\n4. KONTROLA PO ODSTAVCÍCH: ${formatParagraphAudit(wc)}; součet = ${wc.paraCounts.reduce((a,b)=>a+b,0)}\n\n**Rozsah – kontrola:** Z = ${wc.finalCount}; ${rangeFlags}\n\n## Povinné body zadání\n${reqs.length?reqs.map((r,i)=>`- R${i+1}: ${r.replace(/^R\d+\s*:\s*/i,'')}`).join('\n'):'- Povinné body nejsou vyplněné.'}\n\n## Přílohy\n${files.length?files.map((f,i)=>`- PŘÍLOHA_${i+1}: ${f.mime||'soubor'}; lokální velikost ${Math.round((f.size||0)/1024)} KB`).join('\n'):'- Bez příloh.'}\n\n## Kontrola citlivých údajů\n${piiScan.length?piiScan.map(x=>`- ${x.type}: ${x.value} – ${x.reason||'podezřelý údaj'}`).join('\n'):'- V pseudonymizované textové verzi nejsou aktuálně nalezené blokující nálezy.'}\n\n## Doporučený další krok\n${files.length?'U fotek/PDF ještě zkontroluj, že přímo v obrázku není viditelné jméno, podpis, třída nebo škola. ':'Textová část je připravená pro ruční AI režim nebo Gemini API režim. '}Pokud chceš jazykové hodnocení, pokračuj režimem **Ruční AI** nebo **Gemini API**.`;
}
function buildBatchOfflineReport(){
  const ready=batchStudents.filter(s=>String(s.text||'').trim() || (s.files||[]).length);
  if(!ready.length) return '# Offline příprava dávky\n\nV dávce zatím není žádný studentský vstup.';
  return '# Offline příprava dávky\n\n'+ready.map((s,i)=>`---\n\n## ${i+1}. ${s.code}\n\n${buildOfflineReport(s).replace(/^# Offline přípravný protokol\n\n/,'')}`).join('\n\n');
}
async function copyPromptWithPrivacyGate(){
  syncStateFromFields(); commitTaskFieldsToDb(false); updateStats();
  if(!hasTaskBasics()){toast('Doplň přesné zadání a povinné body R1–Rn.','err'); goTo(1); return;}
  if(!hasStudentInput()){toast('Vlož studentský text nebo přidej přílohu.','err'); goTo(2); return;}
  if(!(await privacyGateBeforeSend())) return;
  await copyText(buildPrompt(), 'Prompt pro ruční AI zkopírován.');
}
function importManualResult(){
  const val=$('manualResultInput')?.value||'';
  if(!val.trim()){toast('Nejdřív vlož hotové hodnocení z AI.','warn'); return;}
  state.result=val.trim(); batchResults=[]; renderResult(); saveState(); toast('Vložené hodnocení bylo použito jako výsledek.'); goTo(4);
}
function downloadPromptBundleTxt(){
  syncStateFromFields(); commitTaskFieldsToDb(false); updateStats();
  let content='';
  if(state.inputMode==='batch'){
    const ready=batchStudents.filter(s=>String(s.text||'').trim() || (s.files||[]).length);
    if(!ready.length){toast('V dávce není žádný připravený sloh.','warn'); return;}
    content=ready.map((s,i)=>`==================== PROMPT ${i+1}: ${s.code} ====================\n\n${buildPrompt(s)}`).join('\n\n');
  }else{
    content=buildPrompt();
  }
  const blob=new Blob([content],{type:'text/plain;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${safeFileName(state.taskTitle||currentTask().title||'prompty')}_prompt${state.inputMode==='batch'?'y':''}.txt`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('Prompt(y) staženy jako TXT.');
}

/* 60-evaluation-gemini.js */


function clampIntOrNull(v,min,max){
  if(v===null || v===undefined || v==='') return null;
  const n=Number(v);
  if(!Number.isFinite(n)) return null;
  const i=Math.round(n);
  if(i<min || i>max) return null;
  return i;
}
function normalizeSectionScores(obj){
  const out={};
  const src=obj && typeof obj==='object' ? obj : {};
  RESULT_SECTION_KEYS.forEach(k=>{ out[k]=clampIntOrNull(src[k],0,3); });
  return out;
}
function normalizeResultMetadata(raw, source='json'){
  if(!raw || typeof raw!=='object') return null;
  const sections=normalizeSectionScores(raw.sections);
  const sectionValues=Object.values(sections).filter(v=>v!==null);
  let score=clampIntOrNull(raw.score_total,0,24);
  if(score===null && sectionValues.length===8) score=sectionValues.reduce((a,b)=>a+b,0);
  const meta={
    schema_version:String(raw.schema_version||'1.0'),
    student_code:String(raw.student_code||'').trim(),
    final_word_count:clampIntOrNull(raw.final_word_count,0,2000),
    raw_word_count:clampIntOrNull(raw.raw_word_count,0,3000),
    deducted_word_count:clampIntOrNull(raw.deducted_word_count,0,3000),
    score_total:score,
    grade:clampIntOrNull(raw.grade,1,5),
    fail_signal:Boolean(raw.fail_signal),
    fail_reason:raw.fail_reason==null?null:String(raw.fail_reason).trim(),
    sections,
    ai_language_estimate_percent:clampIntOrNull(raw.ai_language_estimate_percent,0,100),
    json_confidence:String(raw.json_confidence||'').trim(),
    source
  };
  return meta;
}
function fallbackResultMetadata(txt){
  const t=String(txt||'');
  const score=(t.match(/(?:Celkem|CELKEM|Součet|SOUČET|počet bodů|Body)[^0-9]{0,30}(\d{1,2})\s*\/?\s*24/i)||[])[1];
  const grade=(t.match(/(?:Známka|ZNÁMKA|výsledná známka)[^0-9]{0,30}([1-5])/i)||[])[1];
  const words=(t.match(/(?:FINÁLNÍ POČET SLOV|Finální počet slov|final_word_count)[^0-9]{0,30}(\d{1,4})/i)||t.match(/\bZ\s*=\s*(\d{1,4})/)||[])[1];
  const fail=/FAIL|NEUSPĚL|známka 5 bez ohledu/i.test(t);
  if(!score && !grade && !words && !fail) return null;
  return normalizeResultMetadata({score_total:score,grade,final_word_count:words,fail_signal:fail,fail_reason:fail?'regex fallback signál':null,sections:{}},'fallback');
}
function extractResultJsonText(txt){
  const t=String(txt||'');
  const start=t.indexOf(RESULT_JSON_START);
  if(start<0) return '';
  const after=start+RESULT_JSON_START.length;
  const end=t.indexOf(RESULT_JSON_END,after);
  const raw=(end>=0?t.slice(after,end):t.slice(after)).trim();
  return raw.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim();
}
function extractResultMetadata(txt){
  const jsonText=extractResultJsonText(txt);
  if(jsonText){
    try{
      const parsed=JSON.parse(jsonText);
      const norm=normalizeResultMetadata(parsed,'json');
      if(norm) return {ok:true, meta:norm, error:null};
    }catch(e){
      const fb=fallbackResultMetadata(txt);
      return {ok:false, meta:fb, error:'JSON souhrn nejde přečíst: '+(e.message||e)};
    }
  }
  const fb=fallbackResultMetadata(txt);
  return {ok:false, meta:fb, error:jsonText?'JSON souhrn je prázdný nebo neplatný.':'Výstup neobsahuje MACHINE_SUMMARY_JSON.'};
}
function resultSummaryParts(txt){
  const parsed=extractResultMetadata(txt);
  const m=parsed.meta;
  return {
    score:m?.score_total??null,
    grade:m?.grade??null,
    words:m?.final_word_count??null,
    fail:m?.fail_signal?true:false,
    source:m?.source || 'none',
    ok:parsed.ok,
    error:parsed.error||''
  };
}

function makeBatchSummaryText(){
  if(!batchResults.length) return 'Zatím není vygenerované žádné dávkové hodnocení.';
  const rows=batchResults.map(r=>`- ${r.code}: ${r.status}${extractMiniSummary(r.result)}`).join('\n');
  return `# Souhrn dávkového hodnocení\n\nZadání: ${state.taskTitle||currentTask().title}\nPočet prací: ${batchResults.length}\n\n${rows}\n\nJednotlivé zpětné vazby jsou níže v kartách a lze je stáhnout jako ZIP balíček.`;
}
function extractMiniSummary(txt){
  const s=resultSummaryParts(txt);
  const bits=[];
  if(s.score!==null) bits.push(s.score+'/24');
  if(s.grade!==null) bits.push('známka '+s.grade);
  if(s.words!==null) bits.push(s.words+' slov');
  if(s.source==='fallback') bits.push('souhrn z fallbacku');
  if(!s.ok && s.error && s.source==='none') bits.push('JSON chybí');
  return bits.length?' · '+bits.join(' · '):'';
}

function cancelRun(){ if(abortController){ abortController.abort(); toast('Generování zrušeno.','warn'); } }
function geminiGenerateUrl(apiVersion, model){ return `https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(model)}:generateContent`; }
function geminiModelsUrl(apiVersion){ return `https://generativelanguage.googleapis.com/${apiVersion}/models`; }
function makeGeminiApiError(message,status,apiVersion,raw){ const e=new Error(message); e.httpStatus=status||0; e.apiVersion=apiVersion; e.raw=raw; return e; }
function shouldFallbackToV1Beta(e){ return e && e.apiVersion===GEMINI_API_VERSION_PRIMARY && (e.httpStatus===400 || e.httpStatus===404 || /not found|not supported|not available|model/i.test(e.message||'')); }
async function fetchGeminiModelsList(key,apiVersion,signal){
  let res;
  try{ res=await fetch(geminiModelsUrl(apiVersion),{method:'GET',headers:{'x-goog-api-key':key},signal}); }
  catch(e){ if(e.name==='AbortError') throw makeGeminiApiError('Kontrola modelů byla zrušena.',0,apiVersion,e); throw makeGeminiApiError('Spojení s Gemini selhalo: '+e.message,0,apiVersion,e); }
  const data=await res.json().catch(()=>({}));
  if(!res.ok){ const msg=data?.error?.message||`HTTP ${res.status}`; throw makeGeminiApiError('Gemini API model list: '+msg,res.status,apiVersion,data); }
  return Array.isArray(data.models)?data.models:[];
}
async function checkGeminiModels(){
  if(!geminiApiKey && getGeminiInputKey()) useGeminiKeyForSession();
  geminiApiKey=getGeminiInputKey()||geminiApiKey; updateGeminiStatus();
  if(!geminiApiKey){ toast('Zadej Gemini API key, aby bylo možné načíst dostupné modely.','err'); return; }
  const btn=$('checkModelsBtn'); const oldText=btn?btn.textContent:''; if(btn){ btn.disabled=true; btn.textContent='Ověřuji…'; }
  try{
    let apiVersion=GEMINI_API_VERSION_PRIMARY, models=[];
    try{ models=await fetchGeminiModelsList(geminiApiKey,apiVersion); }
    catch(e){ if(shouldFallbackToV1Beta(e)){ apiVersion=GEMINI_API_VERSION_FALLBACK; models=await fetchGeminiModelsList(geminiApiKey,apiVersion); } else throw e; }
    const current=resolveGeminiModel();
    const usable=models.filter(m=>!Array.isArray(m.supportedGenerationMethods) || m.supportedGenerationMethods.includes('generateContent')).map(m=>normalizeModelName(m.name||m.displayName||'')).filter(Boolean);
    const unique=[...new Set(usable)].sort((a,b)=>a.localeCompare(b));
    renderGeminiModelSelect(unique,current,apiVersion);
    const currentOk=unique.includes(current);
    const shown=unique.slice(0,60);
    const listHtml=shown.length?shown.map(m=>`<button type="button" class="btn-mini" data-pick-model="${escapeHtml(m)}" style="margin:3px">${escapeHtml(m)}${m===current?' ✓':''}</button>`).join(''):'<p>Pro tento klíč se nepodařilo najít žádný model s generateContent.</p>';
    const html=`<div class="${currentOk?'ok-box':'warn-box'}"><strong>${currentOk?'Aktuální model je dostupný.':'Aktuální model nebyl v seznamu nalezen.'}</strong><br>Endpoint pro kontrolu: ${escapeHtml(apiVersion)}. Aktuální model: <code>${escapeHtml(current)}</code>.</div><p style="margin:8px 0">Kliknutím můžeš vybrat jiný dostupný model:</p><div style="max-height:260px;overflow:auto;border:1px solid var(--bdr2);border-radius:8px;padding:8px">${listHtml}</div>${unique.length>shown.length?`<p class="small-muted">Zobrazeno prvních ${shown.length} z ${unique.length} modelů.</p>`:''}`;
    showModal('Dostupné Gemini modely',html,[{label:'Zavřít',className:'primary'}]);
    document.querySelectorAll('[data-pick-model]').forEach(b=>b.onclick=()=>{ setGeminiModel(b.getAttribute('data-pick-model')||''); $('uiModal').classList.add('hidden'); toast('Model nastaven.'); });
  }catch(e){ toast(e.message||String(e),'err'); }
  finally{ if(btn){ btn.disabled=false; btn.textContent=oldText||'Ověřit modely'; } }
}

function parseRetryAfterMs(v){
  if(!v) return 0;
  const s=String(v).trim();
  if(/^\d+(\.\d+)?$/.test(s)) return Math.max(0, Math.round(parseFloat(s)*1000));
  const date=Date.parse(s);
  return Number.isFinite(date)?Math.max(0,date-Date.now()):0;
}
function isRetryableGeminiError(e){
  if(!e || /zrušeno/i.test(e.message||'')) return false;
  return e.httpStatus===0 || e.httpStatus===429 || e.httpStatus===500 || e.httpStatus===502 || e.httpStatus===503 || e.httpStatus===504;
}
function geminiRetryDelayMs(attempt,e){
  if(e && e.retryAfterMs) return Math.min(Math.max(e.retryAfterMs,800),60000);
  const expo=GEMINI_RETRY_BASE_MS * Math.pow(2, Math.max(0,attempt-1));
  const jitter=Math.floor(Math.random()*450);
  return Math.min(GEMINI_RETRY_MAX_MS, expo+jitter);
}
function sleepWithAbort(ms,signal){
  return new Promise((resolve,reject)=>{
    const t=setTimeout(()=>{ cleanup(); resolve(); },ms);
    const cleanup=()=>{ if(signal) signal.removeEventListener('abort',onAbort); };
    const onAbort=()=>{ clearTimeout(t); cleanup(); reject(makeGeminiApiError('Generování bylo zrušeno.',0,'',null)); };
    if(signal) signal.addEventListener('abort',onAbort,{once:true});
  });
}
function updateRetryStatus(context,attempt,delay,e){
  const sec=Math.ceil(delay/1000);
  const status=e?.httpStatus?`HTTP ${e.httpStatus}`:'chyba spojení';
  if($('runStatus')) $('runStatus').textContent=`${context}: ${status}. Opakuji pokus ${attempt+1}/${GEMINI_RETRY_MAX_ATTEMPTS} za ${sec} s…`;
}

async function callGemini(key,model,prompt,files,signal){
  const maxOut = state.evalMode==='deep'?32768:state.evalMode==='standard'?12288:4096;
  const parts=[{text:prompt}];
  for(const f of files) parts.push({inline_data:{mime_type:f.mime,data:dataUrlToBase64(f.dataUrl)}});
  const makeBody=(contents)=>({contents,generationConfig:{temperature:0.12,topP:0.85,maxOutputTokens:maxOut}});
  async function postContentsNoRetry(contents,apiVersion){
    const url=geminiGenerateUrl(apiVersion,model);
    let res;
    try{ res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(makeBody(contents)),signal}); }
    catch(e){ if(e.name==='AbortError') throw makeGeminiApiError('Generování bylo zrušeno.',0,apiVersion,e); throw makeGeminiApiError('Spojení s Gemini selhalo: '+e.message,0,apiVersion,e); }
    const data=await res.json().catch(()=>({}));
    if(!res.ok){
      const msg=data?.error?.message||`HTTP ${res.status}`; const status=data?.error?.status?` (${data.error.status})`:''; const modelHint = res.status===404?' Model pravděpodobně není dostupný pro tento klíč nebo API verzi; ověř dostupné modely tlačítkem Ověřit modely.':''; const quotaHint = res.status===429?' Pravděpodobně byl dosažen minutový nebo denní limit projektu. Počkám a zkusím požadavek opakovat.':'', tokenHint = res.status===400 && /max.?output|token/i.test(msg)?' Tento model zřejmě nepodporuje tak vysoký výstupní limit; zkus standardní režim nebo jiný Flash model.':'', retryAfterMs=parseRetryAfterMs(res.headers?.get?.('retry-after'));
      const err=makeGeminiApiError('Gemini API '+apiVersion+': '+msg+status+modelHint+quotaHint+tokenHint,res.status,apiVersion,data);
      err.retryAfterMs=retryAfterMs;
      throw err;
    }
    const finish=data?.candidates?.[0]?.finishReason||'';
    const txt=(data.candidates||[]).flatMap(c=>(c.content?.parts||[]).map(p=>p.text||'')).join('\n').trim();
    return {txt,finish,apiVersion};
  }
  async function postContents(contents,apiVersion,context='Gemini'){
    for(let attempt=1;attempt<=GEMINI_RETRY_MAX_ATTEMPTS;attempt++){
      try{ return await postContentsNoRetry(contents,apiVersion); }
      catch(e){
        if(!isRetryableGeminiError(e) || attempt>=GEMINI_RETRY_MAX_ATTEMPTS) throw e;
        const delay=geminiRetryDelayMs(attempt,e);
        updateRetryStatus(context,attempt,delay,e);
        await sleepWithAbort(delay,signal);
      }
    }
  }
  let contents=[{role:'user',parts}];
  let apiVersion=GEMINI_API_VERSION_PRIMARY;
  let first;
  try{ first=await postContents(contents,apiVersion,'Gemini hodnocení'); }
  catch(e){
    if(shouldFallbackToV1Beta(e)){
      apiVersion=GEMINI_API_VERSION_FALLBACK;
      first=await postContents(contents,apiVersion,'Gemini fallback v1beta');
      if($('runStatus')) $('runStatus').textContent='Model nebyl dostupný přes stabilní v1, použil se fallback v1beta.';
    }else throw e;
  }
  let txt=first.txt;
  if(!txt) throw new Error('Gemini nevrátil textový výstup. Zkus zkrátit vstup nebo změnit model.');
  let finish=first.finish;
  let attempts=0;
  while(finish==='MAX_TOKENS' && attempts<2){
    attempts++;
    const continuePrompt=`Pokračuj v přerušeném hodnocení přesně tam, kde předchozí odpověď skončila. Neopakuj už hotové části. Nepiš úvod. Zachovej stejný Markdown styl, češtinu, kód studenta a hodnoticí rubriku. Pokud ještě nebyl uveden validní MACHINE_SUMMARY_JSON, uveď ho v pokračování; pokud už uveden byl, neopakuj ho.`;
    const followContents=[
      {role:'user',parts},
      {role:'model',parts:[{text:txt}]},
      {role:'user',parts:[{text:continuePrompt}]}
    ];
    try{
      const more=await postContents(followContents,apiVersion,'Pokračování dlouhé odpovědi');
      if(more.txt) txt += `\n\n---\n\n${more.txt}`;
      finish=more.finish;
    }catch(e){
      txt += `\n\n> ⚠️ Poznámka aplikace: Gemini narazilo na výstupní limit a automatické pokračování selhalo (${e.message||e}). Zobrazená zpětná vazba může být neúplná.`;
      finish='STOP';
    }
  }
  if(finish==='MAX_TOKENS'){
    txt += `\n\n> ⚠️ Poznámka aplikace: Odpověď byla velmi dlouhá a ani po automatickém pokračování se nevešla celá. Zpětná vazba výše je částečná. Doporučení: použij Standardní hodnocení, zkrať vstup, nebo hodnot práci samostatně.`;
  }
  return txt;
}

/* 65-evaluation-workflow.js */
function materializeResponseSchema(value){if(Array.isArray(value))return value.map(materializeResponseSchema);if(!value||typeof value!=='object')return value;const out={};for(const [k,v] of Object.entries(value)){if(k==='nullable'){if(v)out.nullable=true;continue;}if(k==='type'&&Array.isArray(v)){out.type=v.find(x=>x!=='null')||'string';if(v.includes('null'))out.nullable=true;continue;}out[k]=materializeResponseSchema(v);}return out;}
function structuredGenerationConfig(){return {temperature:0.05,topP:0.8,maxOutputTokens:32768,responseMimeType:'application/json',responseSchema:materializeResponseSchema(EVALUATION_RESPONSE_SCHEMA)};}
function geminiPartsForStudent(student){const parts=[{text:buildPrompt(student)}];const useFiles=(student?.files||[]).length&&!String(student?.text||'').trim();for(const f of(useFiles?student.files:[]))parts.push({inline_data:{mime_type:f.mime,data:dataUrlToBase64(f.dataUrl)}});return parts;}
let lastQueueRequestAt=0;
async function queueThrottle(){const rpm=Math.max(1,Number(state.queueRpm)||5);const minGap=Math.ceil(60000/rpm);const wait=Math.max(0,lastQueueRequestAt+minGap-Date.now());if(wait)await sleepWithAbort(wait,abortController?.signal);lastQueueRequestAt=Date.now();}
async function postStructuredRequest(student,key,model,signal,repairContext=''){const prompt=repairContext?`${buildPrompt(student)}\n\nOPRAVNÁ VALIDACE: Předchozí JSON měl tyto nedostatky:\n${repairContext}\nVrať znovu celý JSON a oprav pouze tyto nedostatky.`:buildPrompt(student);const body={contents:[{role:'user',parts:[{text:prompt},...geminiPartsForStudent(student).slice(1)]}],generationConfig:structuredGenerationConfig()};let lastError;for(let version of [GEMINI_API_VERSION_PRIMARY,GEMINI_API_VERSION_FALLBACK]){for(let attempt=1;attempt<=GEMINI_RETRY_MAX_ATTEMPTS;attempt++){try{await queueThrottle();const res=await fetch(geminiGenerateUrl(version,model),{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body),signal});const data=await res.json().catch(()=>({}));if(!res.ok){const err=makeGeminiApiError(data?.error?.message||`HTTP ${res.status}`,res.status,version,data);err.retryAfterMs=parseRetryAfterMs(res.headers?.get?.('retry-after'));throw err;}const text=(data.candidates||[]).flatMap(c=>(c.content?.parts||[]).map(p=>p.text||'')).join('').trim();return {raw:JSON.parse(text.replace(/^```(?:json)?\s*/i,'').replace(/```$/,'').trim()),usage:data.usageMetadata||{}};}catch(e){lastError=e;if(shouldFallbackToV1Beta(e))break;if(!isRetryableGeminiError(e)||attempt>=GEMINI_RETRY_MAX_ATTEMPTS)throw e;const delay=geminiRetryDelayMs(attempt,e);updateRetryStatus('Strukturované hodnocení',attempt,delay,e);await sleepWithAbort(delay,signal);}}}throw lastError||new Error('Gemini nevrátilo strukturovaný výsledek.');}
async function evaluateStudentStructured(student,key,model,signal,priceMode='standard'){const first=await postStructuredRequest(student,key,model,signal);let evaluation=finalizeEvaluation(first.raw,student);let usage=registerUsage(first.usage,priceMode);if(!evaluation.validation.ok){const repair=await postStructuredRequest(student,key,model,signal,evaluation.validation.issues.map(x=>'- '+x).join('\n'));evaluation=finalizeEvaluation(repair.raw,student);const extra=registerUsage(repair.usage,priceMode);usage={promptTokens:usage.promptTokens+extra.promptTokens,outputTokens:usage.outputTokens+extra.outputTokens,totalTokens:usage.totalTokens+extra.totalTokens,costUsd:usage.costUsd+extra.costUsd};}return {evaluation,result:evaluationToLegacyResult(evaluation),usage};}
function batchReadyStudents(){return batchStudents.map(ensureBatchStudentShape).filter(s=>String(s.text||'').trim()||(s.files||[]).length);}
function validateBatchPreflight(){const ready=batchReadyStudents();if(!ready.length)return 'Přidej alespoň jeden sloh.';if(ready.length>SERIES_MAX_WORKS)return `Jedna série může obsahovat maximálně ${SERIES_MAX_WORKS} prací.`;const notConfirmed=ready.filter(requiresTranscriptReview);if(notConfirmed.length)return `${notConfirmed.length} obrazových/PDF prací nemá potvrzený digitální přepis.`;return '';}
async function prepareApiRun(){syncStateFromFields();syncSeriesFromFields();commitTaskFieldsToDb(false);ensureWorkflowState();updateStats();if(!hasTaskBasics()){toast('Doplň přesné zadání a povinné body R1–Rn.','err');goTo(1);return null;}if(!(await privacyGateBeforeSend()))return null;if(!geminiApiKey&&getGeminiInputKey())useGeminiKeyForSession();geminiApiKey=getGeminiInputKey()||geminiApiKey;updateGeminiStatus();if(!geminiApiKey){toast('Zadej Gemini API klíč.','err');return null;}const model=resolveGeminiModel();setGeminiModel(model);return model;}
function recordEssayTelemetry(attempted,successful,failed,cancelled=0){
  try{
    window.GHRABTelemetry?.recordOutput({
      outputKind:'essay-evaluation',
      attemptedQuantity:attempted,
      successfulQuantity:successful,
      failedQuantity:failed,
      cancelledQuantity:cancelled,
      outcome:failed&&successful?'partial':failed?'error':successful?'success':'cancelled'
    });
  }catch(error){console.warn('Telemetrie Hodnotitele se nezapsala.',error);}
}
async function runEvaluation(){
  if(state.inputMode==='batch')return runBatchEvaluation();
  syncStateFromFields();
  if(!hasStudentInput()){toast('Vlož studentský text nebo přidej přílohu.','err');goTo(2);return;}
  const mode=state.workMode||'offline';
  if(mode==='offline'){
    state.result=buildOfflineReport();batchResults=[];renderResult();$('next3').disabled=false;saveState();recordEssayTelemetry(1,1,0);goTo(4);return;
  }
  if(mode==='manual'){await copyPromptWithPrivacyGate();return;}
  const model=await prepareApiRun();if(!model)return;
  const student={code:state.studentCode||'STUDENT_001',identity:state.studentIdentity,extraPii:state.extraPii,text:state.studentText,files:attachedFiles,transcriptConfirmed:true};
  if(!(await preflightConfirmBeforeApi(model)))return;
  abortController=new AbortController();$('runBtn').disabled=true;$('runBtn').innerHTML='<span class="loader"></span> Hodnotím a ověřuji…';$('cancelBtn').classList.remove('hidden');
  try{
    const out=await evaluateStudentStructured(student,geminiApiKey,model,abortController.signal,'standard');
    state.result=out.result;state.lastEvaluation=out.evaluation;batchResults=[];renderResult();$('next3').disabled=false;saveState();recordEssayTelemetry(1,1,0);
    toast(out.evaluation.validation.ok?'Hodnocení prošlo validační bránou.':'Výsledek vyžaduje učitelskou kontrolu.',out.evaluation.validation.ok?'ok':'warn');goTo(4);
  }catch(e){
    const cancelled=/zrušeno|cancelled|canceled|abort/i.test(String(e?.message||e));recordEssayTelemetry(1,0,cancelled?0:1,cancelled?1:0);toast(e.message||String(e),'err');$('runStatus').textContent=e.message||String(e);
  }finally{abortController=null;$('runBtn').disabled=false;renderWorkMode();$('cancelBtn').classList.add('hidden');updateWorkflowDashboard();}
}
async function runBatchEvaluation(){
  const error=validateBatchPreflight();if(error){toast(error,'err');goTo(2);return;}
  const mode=state.workMode||'offline';
  if(mode==='offline'){
    const count=batchReadyStudents().length;state.result=buildBatchOfflineReport();batchResults=[];renderResult();$('next3').disabled=false;saveState();if(count)recordEssayTelemetry(count,count,0);goTo(4);return;
  }
  if(mode==='manual'){if(!(await privacyGateBeforeSend()))return;downloadPromptBundleTxt();return;}
  const model=await prepareApiRun();if(!model)return;if(!(await preflightConfirmBeforeApi(model)))return;
  if(state.processingMode==='batch')return submitGeminiBatchJob(model);
  return runImmediateBatchQueue(model);
}
async function runImmediateBatchQueue(model){
  const ready=batchReadyStudents();const pending=ready.filter(s=>!batchResultDone(s.code));
  if(!pending.length){state.result=makeBatchSummaryText();renderResult();goTo(4);return;}
  let successful=0,failed=0,cancelled=0,recorded=false;
  abortController=new AbortController();$('runBtn').disabled=true;$('runBtn').innerHTML='<span class="loader"></span> Hodnotím řízenou frontu…';$('cancelBtn').classList.remove('hidden');$('batchProgress')?.classList.remove('hidden');
  try{
    for(let i=0;i<pending.length;i++){
      const s=pending[i];s.status='hodnotím';renderBatchList();$('runStatus').textContent=`${s.code}: analýza a validační brána (${i+1}/${pending.length})`;if($('batchProgressBar'))$('batchProgressBar').style.width=Math.round(i/pending.length*100)+'%';saveBatchProgress();
      try{
        const out=await evaluateStudentStructured(s,geminiApiKey,model,abortController.signal,'standard');successful++;
        s.status=out.evaluation.validation.ok?'hotovo':'kontrola';s.validation=out.evaluation.validation;s.usage=out.usage;
        upsertBatchResult({code:s.code,identity:s.identity||'',displayName:s.displayName||'',email:s.email||'',rosterId:s.rosterId||'',sourceName:s.sourceName||'',result:out.result,finalEvaluation:out.evaluation,validation:out.evaluation.validation,usage:out.usage,status:s.status,approved:false,deliveryStatus:'not-ready',savedAt:new Date().toISOString()});
      }catch(e){
        if(/zrušeno|cancelled|canceled|abort/i.test(String(e?.message||e)))throw e;
        failed++;s.status='chyba';upsertBatchResult({code:s.code,identity:s.identity||'',displayName:s.displayName||'',email:s.email||'',result:'CHYBA: '+(e.message||e),status:'chyba',approved:false,deliveryStatus:'not-ready',savedAt:new Date().toISOString()});
      }
      renderBatchList();renderBatchReviewDashboard();updateWorkflowDashboard();saveBatchProgress();if($('batchProgressBar'))$('batchProgressBar').style.width=Math.round((i+1)/pending.length*100)+'%';
    }
    state.result=makeBatchSummaryText();renderResult();$('next3').disabled=false;saveState();saveBatchProgress();recordEssayTelemetry(pending.length,successful,failed);recorded=true;goTo(4);
  }catch(e){
    const isCancelled=/zrušeno|cancelled|canceled|abort/i.test(String(e?.message||e));const remaining=Math.max(0,pending.length-successful-failed);if(isCancelled)cancelled=remaining;else failed+=remaining;
    recordEssayTelemetry(pending.length,successful,failed,cancelled);recorded=true;toast(e.message||String(e),'err');
  }finally{
    if(!recorded)recordEssayTelemetry(pending.length,successful,failed,Math.max(0,pending.length-successful-failed));
    abortController=null;$('runBtn').disabled=false;renderWorkMode();$('cancelBtn').classList.add('hidden');$('batchProgress')?.classList.add('hidden');renderBatchList();
  }
}
function batchApiCreateUrl(model){return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(String(model||GEMINI_MODEL_DEFAULT).replace(/^models\//,''))}:batchGenerateContent`;}
function batchApiStatusUrl(name){return `https://generativelanguage.googleapis.com/v1beta/${String(name||'').replace(/^\/+/, '')}`;}
function batchInlineRequest(student){return {request:{contents:[{role:'user',parts:geminiPartsForStudent(student)}],generationConfig:structuredGenerationConfig()},metadata:{key:student.code}};}
function estimateBatchPayloadBytes(body){try{return new Blob([JSON.stringify(body)]).size;}catch(_){return JSON.stringify(body).length*2;}}
async function submitGeminiBatchJob(model){const ready=batchReadyStudents().filter(s=>!batchResultDone(s.code));if(!ready.length){toast('Všechny práce už mají výsledek.','warn');return;}const body={batch:{display_name:`${seriesDisplayName()} ${new Date().toISOString()}`,input_config:{requests:{requests:ready.map(batchInlineRequest)}}}};try{$('runBtn').disabled=true;$('runStatus').textContent='Odesílám úspornou Batch API úlohu…';const payloadBytes=estimateBatchPayloadBytes(body);if(payloadBytes>19*1024*1024)throw new Error('Inline Batch požadavek překračuje bezpečný limit 19 MB. Použij okamžitou frontu nebo budoucí serverový režim.');const res=await fetch(batchApiCreateUrl(model),{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':geminiApiKey},body:JSON.stringify(body)});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data?.error?.message||`Batch API HTTP ${res.status}`);state.batchJob={name:data.name||data.batch?.name,state:data.state||data.metadata?.state||data.batch?.state||'JOB_STATE_PENDING',codes:ready.map(s=>s.code),model,submittedAt:new Date().toISOString(),lastCheckedAt:null};state.series.batchJob=state.batchJob;saveState();renderBatchJobPanel();toast('Batch úloha byla přijata. Výsledky načteš tlačítkem Zkontrolovat Batch úlohu.');}catch(e){toast('Batch API: '+(e.message||e),'err');}finally{$('runBtn').disabled=false;renderWorkMode();}}
async function checkGeminiBatchJob(){
  ensureWorkflowState();const job=state.batchJob||state.series?.batchJob;if(!job?.name){toast('Není uložená žádná Batch úloha.','warn');return;}
  if(!geminiApiKey&&getGeminiInputKey())useGeminiKeyForSession();geminiApiKey=getGeminiInputKey()||geminiApiKey;if(!geminiApiKey){toast('Zadej stejný Gemini API klíč, kterým byla úloha vytvořena.','err');return;}
  try{
    const res=await fetch(batchApiStatusUrl(job.name),{headers:{'x-goog-api-key':geminiApiKey}});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data?.error?.message||`HTTP ${res.status}`);
    job.state=data.state||data.metadata?.state||data.batch?.state||job.state;job.lastCheckedAt=new Date().toISOString();job.raw=data;state.batchJob=job;state.series.batchJob=job;
    if(/SUCCEEDED|COMPLETED/i.test(job.state))await importGeminiBatchResponses(data,job);
    else if(/FAILED|CANCELLED|CANCELED/i.test(job.state)&&!job.telemetryRecordedAt){const count=(job.codes||[]).length;recordEssayTelemetry(count,0,/FAILED/i.test(job.state)?count:0,/FAILED/i.test(job.state)?0:count);job.telemetryRecordedAt=new Date().toISOString();}
    saveState();renderBatchJobPanel();updateWorkflowDashboard();toast(`Stav Batch úlohy: ${job.state}`);
  }catch(e){toast('Kontrola Batch úlohy selhala: '+(e.message||e),'err');}
}
async function importGeminiBatchResponses(data,job){
  const rows=data?.dest?.inlinedResponses||data?.response?.inlinedResponses||data?.dest?.inlined_responses||data?.output?.inlinedResponses||data?.batch?.dest?.inlinedResponses||[];
  let successful=0,failed=0;
  for(let i=0;i<rows.length;i++){
    const row=rows[i];const code=row.metadata?.key||job.codes?.[i];const student=batchStudents.find(s=>s.code===code);if(!student){failed++;continue;}
    const text=(row.response?.candidates||[]).flatMap(c=>(c.content?.parts||[]).map(p=>p.text||'')).join('').trim();
    try{
      const raw=JSON.parse(text.replace(/^```(?:json)?\s*/i,'').replace(/```$/,'').trim());const evaluation=finalizeEvaluation(raw,student);const usage=registerUsage(row.response?.usageMetadata||{},'batch');
      student.status=evaluation.validation.ok?'hotovo':'kontrola';student.validation=evaluation.validation;student.usage=usage;successful++;
      upsertBatchResult({code,identity:student.identity||'',displayName:student.displayName||'',email:student.email||'',rosterId:student.rosterId||'',result:evaluationToLegacyResult(evaluation),finalEvaluation:evaluation,validation:evaluation.validation,usage,status:student.status,approved:false,deliveryStatus:'not-ready',savedAt:new Date().toISOString()});
    }catch(e){failed++;student.status='chyba';upsertBatchResult({code,result:'CHYBA BATCH: '+(e.message||e),status:'chyba'});}
  }
  const attempted=Math.max((job.codes||[]).length,rows.length);failed+=Math.max(0,attempted-successful-failed);
  if(!job.telemetryRecordedAt){recordEssayTelemetry(attempted,successful,failed);job.telemetryRecordedAt=new Date().toISOString();}
  state.result=makeBatchSummaryText();renderBatchList();renderBatchReviewDashboard();renderResult();$('next3').disabled=batchResults.length===0;saveBatchProgress();
}
/* 70-results-exports-init.js */
function stripMachineJson(txt){
  let t=String(txt||'');
  const start=t.indexOf(RESULT_JSON_START);
  if(start>=0){
    const end=t.indexOf(RESULT_JSON_END,start);
    if(end>=0) t=t.slice(0,start)+t.slice(end+RESULT_JSON_END.length);
  }
  const fb=t.indexOf(RESULT_FEEDBACK_START);
  if(fb>=0) t=t.slice(fb+RESULT_FEEDBACK_START.length);
  return t.trim();
}
function extractResultViewSection(txt, view='teacher'){
  const base=stripMachineJson(txt);
  const markers=Object.entries(RESULT_VIEW_MARKERS).map(([key,marker])=>({key,marker,idx:base.indexOf(marker)})).filter(x=>x.idx>=0).sort((a,b)=>a.idx-b.idx);
  if(!markers.length) return null;
  const wanted=RESULT_VIEW_MARKERS[view] || RESULT_VIEW_MARKERS.teacher;
  const current=markers.find(x=>x.marker===wanted) || markers.find(x=>x.marker===RESULT_VIEW_MARKERS.teacher) || markers[0];
  const start=current.idx+current.marker.length;
  const next=markers.find(x=>x.idx>current.idx);
  return base.slice(start,next?next.idx:base.length).trim();
}
function buildRecordTableFromMetadata(txt){
  const parsed=extractResultMetadata(txt);
  const m=parsed.meta;
  if(!m){
    return '# Evidence\n\nStrojový souhrn není dostupný. Přepni na učitelský detail a zkontroluj výsledek ručně.';
  }
  const labels={
    zadani_a_rozsah:'Zadání a rozsah',
    odstavce_a_koherence:'Odstavce a koherence',
    lexikalni_a_spellingove_chyby:'Lexikální a spellingové chyby',
    gramaticke_chyby:'Gramatické chyby',
    obsah:'Obsah',
    ptn_a_koheze:'PTN a koheze',
    uroven_slovni_zasoby:'Úroveň slovní zásoby',
    uroven_gramatiky:'Úroveň gramatiky'
  };
  const rows=RESULT_SECTION_KEYS.map(k=>`| ${labels[k]||k} | ${m.sections?.[k] ?? '—'} | |`).join('\n');
  const fail=m.fail_signal?('ano'+(m.fail_reason?' – '+m.fail_reason:'')):'ne';
  return `# Evidence\n\n| Kategorie | Body | Hlavní důvod |\n|---|---:|---|\n${rows}\n\n| Souhrn | Hodnota |\n|---|---:|\n| Body celkem | ${m.score_total ?? '—'}/24 |\n| Známka | ${m.grade ?? '—'} |\n| Finální počet slov | ${m.final_word_count ?? '—'} |\n| RAW počet slov | ${m.raw_word_count ?? '—'} |\n| Odečteno slov | ${m.deducted_word_count ?? '—'} |\n| Fail signál | ${fail} |\n| Odhad šablonovitosti / AI jazyka | ${m.ai_language_estimate_percent ?? '—'} % |`;
}
function buildStudentFallbackFromMetadata(txt){
  const s=resultSummaryParts(txt);
  return `# Zpětná vazba pro studenta\n\nSamostatná studentská sekce v tomto výsledku není dostupná, protože výstup vznikl ve starší verzi nebo byl vložen ručně bez značek.\n\n- Body: ${s.score!==null?s.score+'/24':'—'}\n- Známka: ${s.grade!==null?s.grade:'—'}\n- Finální počet slov: ${s.words!==null?s.words:'—'}\n\nPro konkrétní chyby a doporučení použij učitelský detail.`;
}
function displayFeedbackText(txt, view=null){
  const selected=view || state.resultView || state.outputStyle || 'teacher';
  const section=extractResultViewSection(txt, selected);
  if(section) return section;
  if(selected==='record') return buildRecordTableFromMetadata(txt);
  if(selected==='student') return buildStudentFallbackFromMetadata(txt);
  return stripMachineJson(txt) || String(txt||'').trim();
}
function preflightInfo(model){
  syncStateFromFields(false);
  const scan=runPrivacyScan();
  const g=GENRES.find(x=>x.id===state.genre);
  const task=state.taskTitle||currentTask().title||'—';
  const evalLabel={count:'Jen počet slov',standard:'Standardní hodnocení',deep:'Hloubková analýza'}[state.evalMode]||state.evalMode;
  const filesCount=state.inputMode==='batch'?batchStudents.reduce((a,s)=>a+(s.files||[]).length,0):attachedFiles.length;
  let code=state.studentCode||'STUDENT_001';
  let words='—';
  let students=1;
  if(state.inputMode==='batch'){
    const ready=batchStudents.filter(s=>String(s.text||'').trim() || (s.files||[]).length);
    students=ready.length;
    code=ready.map(s=>s.code).slice(0,4).join(', ')+(ready.length>4?'…':'');
    const counts=ready.filter(s=>String(s.text||'').trim()).map(s=>localWordCountReport(s.text||'',state.taskText||'',task,state.genre||'').finalCount);
    words=counts.length?`${counts.reduce((a,b)=>a+b,0)} celkem (${Math.min(...counts)}–${Math.max(...counts)} na text)`:'text v přílohách / neuvedeno';
  }else{
    const wc=localWordCountReport(state.studentText||'',state.taskText||'',task,state.genre||'');
    words=String(wc.finalCount);
  }
  return {scan,g,task,evalLabel,filesCount,code,words,students,model:model||resolveGeminiModel(),output:outputStyleLabel(state.outputStyle||state.resultView||'teacher')};
}
function preflightPreviewText(){
  if(state.inputMode==='batch'){
    const ready=batchStudents.filter(s=>String(s.text||'').trim() || (s.files||[]).length);
    return ready.map((s,i)=>`===== ${i+1}. ${s.code} =====\n${getOutboundStudentTextFromValues(s.text||'',s.identity||'',s.code||('STUDENT_'+String(i+1).padStart(3,'0')),s.extraPii||'').text || '[Text je v přiloženém obrázku/PDF.]'}`).join('\n\n').slice(0,18000);
  }
  return (getOutboundStudentText().text || '[Text je v přiloženém obrázku/PDF.]').slice(0,18000);
}
function buildPreflightHtml(model, showPreview=false){
  const i=preflightInfo(model);
  const suspicious=i.scan.blocking.length;
  const attachWarnings=i.scan.attachmentWarnings.length;
  const summary=[
    ['Kód / dávka', state.inputMode==='batch'?`${i.students} studentů: ${i.code||'—'}`:i.code],
    ['Zadání', i.task],
    ['Útvar', i.g?.label||state.genre||'—'],
    ['Text', `${i.words} slov`],
    ['Přílohy', String(i.filesCount)],
    ['Podezřelé údaje', `${suspicious} nálezů${attachWarnings?`, ${attachWarnings} upozornění k přílohám`:''}`],
    ['Režim hodnocení', i.evalLabel],
    ['Výstupní styl', i.output],
    ['Model', i.model]
  ].map(([k,v])=>`<div class="preflight-item"><b>${escapeHtml(k)}</b>${escapeHtml(v)}</div>`).join('');
  const warn=(suspicious||attachWarnings)?`<div class="warn-box"><strong>Pozor:</strong> aktuální kontrola stále eviduje ${suspicious} podezřelých nálezů a ${attachWarnings} upozornění k přílohám. Pokud jsi je už vědomě potvrdil/a v Privacy režimu, můžeš pokračovat; jinak se vrať k anonymizaci.</div>`:'<div class="ok-box">✓ Privacy kontrola nehlásí nevyřešený textový nález. Přesto zkontroluj přílohy a odchozí text.</div>';
  const preview=showPreview?`<div class="field-label" style="margin-top:10px">Odchozí pseudonymizovaný text</div><div class="preflight-preview">${escapeHtml(preflightPreviewText())}</div>`:'';
  return `<div class="small-muted">Toto je poslední kontrola před skutečným voláním Gemini API. Aplikace odešle pouze pseudonymizovaný text, zadání, rubriku a případné přílohy.</div><div class="preflight-summary">${summary}</div>${warn}${preview}`;
}
function preflightConfirmBeforeApi(model){
  return new Promise(resolve=>{
    const render=(showPreview=false)=>showModal('Kontrola před odesláním do Gemini', buildPreflightHtml(model,showPreview), [
      {label:'Vrátit se k anonymizaci',onClick:()=>{goTo(2); resolve(false);}},
      {label:'Zkontrolovat odchozí text',close:false,onClick:()=>render(true)},
      {label:'Odeslat do Gemini',className:'primary',onClick:()=>resolve(true)}
    ]);
    render(false);
  });
}


function defaultTeacherReview(){ return {sections:{}, score_total:null, grade:null, note:'', verified:false, verifiedAt:''}; }
function normalizeTeacherReview(review){
  const r = review && typeof review==='object' ? review : {};
  const sections={}; const src=r.sections&&typeof r.sections==='object'?r.sections:{};
  RESULT_SECTION_KEYS.forEach(k=>{ sections[k]=clampIntOrNull(src[k],0,3); });
  return {sections, score_total:clampIntOrNull(r.score_total,0,24), grade:clampIntOrNull(r.grade,1,5), note:String(r.note||''), verified:Boolean(r.verified), verifiedAt:String(r.verifiedAt||'')};
}
function teacherReviewHasData(review=state.teacherReview){
  const r=normalizeTeacherReview(review);
  return r.verified || !!r.note.trim() || r.score_total!==null || r.grade!==null || RESULT_SECTION_KEYS.some(k=>r.sections[k]!==null);
}
function currentResultMeta(txt=state.result){ return extractResultMetadata(txt||'').meta || null; }
function resultContextForText(txt=state.result){
  const needle=String(txt||'');
  return batchResults.find(r=>String(r?.result||'')===needle) || null;
}
function getEffectiveReview(txt=state.result,options={}){
  const meta=currentResultMeta(txt)||{};
  const batchContext=options.context||resultContextForText(txt);
  const useTeacherReview=options.useTeacherReview!==undefined
    ? Boolean(options.useTeacherReview)
    : (!batchContext && txt===state.result && state.inputMode!=='batch');
  const review=useTeacherReview?normalizeTeacherReview(state.teacherReview):normalizeTeacherReview(defaultTeacherReview());
  const sections={};
  RESULT_SECTION_KEYS.forEach(k=>{ sections[k]=review.sections[k]!==null ? review.sections[k] : (meta.sections?.[k] ?? null); });
  const vals=Object.values(sections).filter(v=>v!==null);
  const sum=vals.length===8?vals.reduce((a,b)=>a+b,0):null;
  const score=review.score_total!==null ? review.score_total : (sum!==null ? sum : (meta.score_total ?? null));
  const grade=review.grade!==null ? review.grade : (meta.grade ?? null);
  return {
    sections,
    score_total:score,
    grade,
    final_word_count:meta.final_word_count??null,
    raw_word_count:meta.raw_word_count??null,
    deducted_word_count:meta.deducted_word_count??null,
    fail_signal:meta.fail_signal?true:false,
    fail_reason:meta.fail_reason||'',
    ai_language_estimate_percent:meta.ai_language_estimate_percent??null,
    student_code:meta.student_code||batchContext?.code||state.studentCode||'',
    source:meta.source||'none',
    note:review.note,
    verified:review.verified,
    verifiedAt:review.verifiedAt,
    hasTeacherReview:useTeacherReview&&teacherReviewHasData(review)
  };
}
function renderTeacherReviewPanel(forceDefaults=false){
  const panel=$('teacherReviewPanel'); if(!panel) return;
  const isBatch=batchResults.length>0 || state.inputMode==='batch';
  const hasResult=!!(state.result&&state.result.trim()) && !isBatch;
  panel.classList.toggle('hidden',!hasResult);
  if(!hasResult) return;
  const meta=currentResultMeta(state.result)||{};
  const review=forceDefaults?defaultTeacherReview():normalizeTeacherReview(state.teacherReview);
  const grid=$('teacherReviewGrid');
  if(grid){
    grid.innerHTML=RESULT_SECTION_KEYS.map(k=>{
      const val=review.sections[k]!==null?review.sections[k]:(meta.sections?.[k]??'');
      return `<div class="review-item"><label for="review_${k}">${escapeHtml(RESULT_SECTION_LABELS[k]||k)}</label><input type="number" min="0" max="3" step="1" id="review_${k}" data-review-section="${k}" value="${val==null?'':escapeHtml(String(val))}"></div>`;
    }).join('');
  }
  const scoreVal=review.score_total!==null?review.score_total:(meta.score_total??'');
  if($('teacherReviewScore')) $('teacherReviewScore').value=scoreVal==null?'':scoreVal;
  const gradeVal=review.grade!==null?review.grade:(meta.grade??'');
  if($('teacherReviewGrade')) $('teacherReviewGrade').value=gradeVal==null?'':gradeVal;
  if($('teacherReviewNote')) $('teacherReviewNote').value=review.note||'';
  if($('teacherReviewVerified')) $('teacherReviewVerified').checked=!!review.verified;
  if($('teacherReviewVerifiedAt')) $('teacherReviewVerifiedAt').textContent=review.verifiedAt?('Potvrzeno: '+review.verifiedAt):'Zatím nepotvrzeno jako finální lidská kontrola.';
}
function syncTeacherReviewFromFields(markVerifiedDate=false){
  if(!$('teacherReviewPanel')) return;
  const sections={};
  RESULT_SECTION_KEYS.forEach(k=>{ const el=document.querySelector(`[data-review-section="${k}"]`); sections[k]=clampIntOrNull(el?.value,0,3); });
  let verified=!!$('teacherReviewVerified')?.checked;
  let old=normalizeTeacherReview(state.teacherReview);
  let verifiedAt=old.verifiedAt;
  if(markVerifiedDate && verified && !verifiedAt) verifiedAt=new Date().toLocaleString('cs-CZ');
  if(!verified) verifiedAt='';
  state.teacherReview={sections, score_total:clampIntOrNull($('teacherReviewScore')?.value,0,24), grade:clampIntOrNull($('teacherReviewGrade')?.value,1,5), note:String($('teacherReviewNote')?.value||''), verified, verifiedAt};
}
function recalculateTeacherReviewTotal(){
  const vals=RESULT_SECTION_KEYS.map(k=>clampIntOrNull(document.querySelector(`[data-review-section="${k}"]`)?.value,0,3));
  if(vals.every(v=>v!==null) && $('teacherReviewScore')) $('teacherReviewScore').value=String(vals.reduce((a,b)=>a+b,0));
}
function handleTeacherReviewInput(){ syncTeacherReviewFromFields(false); renderResultSummary(state.result); saveState(); }
function teacherReviewMarkdown(txt=state.result){
  const e=getEffectiveReview(txt);
  const rows=RESULT_SECTION_KEYS.map(k=>`| ${RESULT_SECTION_LABELS[k]||k} | ${e.sections[k] ?? '—'} |`).join('\n');
  const verified=e.verified?`ano${e.verifiedAt?' – '+e.verifiedAt:''}`:'ne';
  const note=e.note&&e.note.trim()?e.note.trim():'—';
  return `## Finální kontrola učitele\n\n| Kategorie | Finální body |\n|---|---:|\n${rows}\n\n| Souhrn | Hodnota |\n|---|---:|\n| Finální body celkem | ${e.score_total ?? '—'}/24 |\n| Finální známka | ${e.grade ?? '—'} |\n| Finální počet slov | ${e.final_word_count ?? '—'} |\n| Ověřeno učitelem | ${verified} |\n| Poznámka učitele | ${String(note).replace(/\n/g,' ')} |`;
}
function exportHeaderMarkdown(view=null,txt=state.result,context=null){
  ensureWorkflowState();
  context=context||resultContextForText(txt);
  const e=getEffectiveReview(txt,{useTeacherReview:!context,context});
  const g=GENRES.find(x=>x.id===state.genre);
  const viewName=outputStyleLabel(view||state.resultView||state.outputStyle||'teacher');
  const studentName=context?.identity||state.studentIdentity||'—';
  const studentCode=context?.code||e.student_code||state.studentCode||'—';
  return `# Gymnázium, Ostrava-Hrabůvka, příspěvková organizace\n\n## Hodnocení maturitního slohu\n\n| Položka | Hodnota |\n|---|---|\n| Série | ${seriesDisplayName()} |\n| Třída | ${state.series.className||'—'} |\n| Student | ${studentName} |\n| Kód studenta | ${studentCode} |\n| Zadání | ${state.taskTitle||currentTask().title||'—'} |\n| Útvar | ${g?.label||state.genre||'—'} |\n| Datum práce | ${state.series.assessmentDate||'—'} |\n| Hodnotitel | ${state.series.teacherName||'—'} |\n| Zobrazený výstup | ${viewName} |\n| Body / známka | ${(e.score_total??'—')}/24 · známka ${e.grade??'—'} |\n| Finální počet slov | ${e.final_word_count??'—'} |\n| Ověřeno učitelem | ${e.verified?'ano':'ne'} |\n| Verze rubriky | ${RUBRIC_VERSION} |\n| Vytvořeno v aplikaci | Hodnotitel maturitních slohů ${APP_VERSION} |\n| Datum exportu | ${new Date().toLocaleString('cs-CZ')} |\n\n`;
}
function composeExportMarkdown(view=null,txt=state.result,context=null){
  const selected=view||state.resultView||state.outputStyle||'teacher';
  context=context||resultContextForText(txt);
  const teacherSection=context?'':teacherReviewMarkdown(txt)+'\n\n---\n\n';
  const enhancements=typeof reportEnhancementMarkdown==='function'?reportEnhancementMarkdown(txt,selected,context):'';
  return exportHeaderMarkdown(selected,txt,context)+teacherSection+displayFeedbackText(txt,selected)+enhancements;
}
function markdownToPlainText(md){ return String(md||'').replace(/```[\s\S]*?```/g,'').replace(/^#+\s*/gm,'').replace(/\*\*(.*?)\*\*/g,'$1').replace(/`([^`]+)`/g,'$1').replace(/\|/g,'\t').replace(/\n{3,}/g,'\n\n').trim(); }
function xmlEscape(s){ return String(s??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c])); }
async function downloadDocx(){
  try{
    syncTeacherReviewFromFields(true); saveState(); const title=safeFileName(state.taskTitle||currentTask().title||'hodnoceni');
    if(batchResults.length){ await downloadBatchDocxZip(); return; }
    const blob=await createDocxBlob('Hodnocení maturitního slohu', composeExportMarkdown()); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${title}_hodnoceni.docx`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('DOCX stažen.');
  }catch(e){ toast(e.message||String(e),'err'); }
}
async function downloadBatchDocxZip(){
  const JSZip=await ensureJSZip(); const zip=new JSZip(); const base=safeFileName(state.taskTitle||currentTask().title||'hodnoceni');
  for(let i=0;i<batchResults.length;i++){ const r=batchResults[i]; const blob=await createDocxBlob(`${r.code} – zpětná vazba`, composeExportMarkdown(state.resultView,r.result,r)); zip.file(`${String(i+1).padStart(2,'0')}_${safeFileName(r.code)}_zpetna_vazba.docx`,blob); }
  const out=await zip.generateAsync({type:'blob'}); const a=document.createElement('a'); a.href=URL.createObjectURL(out); a.download=`${base}_docx_zpetne_vazby.zip`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('DOCX ZIP stažen.');
}
function summaryRows(){
  const rows=[]; const baseTask=state.taskTitle||currentTask().title||'';
  if(batchResults.length){ batchResults.forEach((r,i)=>{ const s=resultSummaryParts(r.result); const m=extractResultMetadata(r.result).meta||{}; rows.push({poradi:i+1,kod:r.code,stav:r.status,body:s.score??'',znamka:s.grade??'',slova:s.words??'',fail:s.fail?'ano':'ne',souhrn:s.source||'',zadani:baseTask,overeno:'',poznamka:'',lokalni:r.identity||r.sourceName||''}); }); }
  else { const e=getEffectiveReview(state.result); rows.push({poradi:1,kod:e.student_code||state.studentCode||'',stav:'hotovo',body:e.score_total??'',znamka:e.grade??'',slova:e.final_word_count??'',fail:e.fail_signal?'ano':'ne',souhrn:e.source||'',zadani:baseTask,overeno:e.verified?'ano':'ne',poznamka:e.note||'',lokalni:state.studentIdentity||''}); }
  return rows;
}
function rowsToCsv(rows){ const headers=['poradi','kod','stav','body','znamka','slova','fail','souhrn','zadani','overeno','poznamka','lokalni']; return [headers.join(';')].concat(rows.map(r=>headers.map(h=>'"'+String(r[h]??'').replace(/"/g,'""')+'"').join(';'))).join('\n'); }
function downloadCsvSummary(){ syncTeacherReviewFromFields(true); saveState(); const csv=rowsToCsv(summaryRows()); const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${safeFileName(state.taskTitle||currentTask().title||'hodnoceni')}_souhrn.csv`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('CSV souhrn stažen.'); }
function columnName(n){ let s=''; while(n>0){ const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=Math.floor((n-1)/26); } return s; }
async function createXlsxBlob(rows){
  const JSZip=await ensureJSZip(); const zip=new JSZip(); const headers=['pořadí','kód','stav','body','známka','slova','fail','souhrn','zadání','ověřeno učitelem','poznámka učitele','lokální identifikace']; const keys=['poradi','kod','stav','body','znamka','slova','fail','souhrn','zadani','overeno','poznamka','lokalni'];
  const all=[headers,...rows.map(r=>keys.map(k=>r[k]??''))];
  const sheetRows=all.map((row,ri)=>`<row r="${ri+1}">`+row.map((v,ci)=>`<c r="${columnName(ci+1)}${ri+1}" t="inlineStr"><is><t>${xmlEscape(v)}</t></is></c>`).join('')+`</row>`).join('');
  zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
  zip.folder('_rels').file('.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.folder('xl').file('workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Souhrn" sheetId="1" r:id="rId1"/></sheets></workbook>');
  zip.folder('xl').folder('_rels').file('workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
  zip.folder('xl').folder('worksheets').file('sheet1.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`);
  return zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
async function downloadXlsxSummary(){ try{ syncTeacherReviewFromFields(true); saveState(); const blob=await createXlsxBlob(summaryRows()); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${safeFileName(state.taskTitle||currentTask().title||'hodnoceni')}_souhrn.xlsx`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('XLSX souhrn stažen.'); }catch(e){ toast(e.message||String(e),'err'); } }
function buildEmailText(txt=state.result, code=state.studentCode){ const context=resultContextForText(txt); const feedback=displayFeedbackText(txt,'student')+(typeof reportEnhancementMarkdown==='function'?reportEnhancementMarkdown(txt,'student',context):''); const e=getEffectiveReview(txt,{useTeacherReview:!context,context}); const note=e.note&&e.note.trim()?`\n\nPoznámka učitele: ${e.note.trim()}`:''; return `Dobrý den,\n\nposílám zpětnou vazbu ke slohové práci (${code||'student'}).\n\n${feedback}${note}\n\nS pozdravem`; }
async function downloadEmailTemplate(){
  try{
    if(batchResults.length){ const JSZip=await ensureJSZip(); const zip=new JSZip(); batchResults.forEach((r,i)=>zip.file(`${String(i+1).padStart(2,'0')}_${safeFileName(r.code)}_email.txt`,buildEmailText(r.result,r.code))); const blob=await zip.generateAsync({type:'blob'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${safeFileName(state.taskTitle||currentTask().title||'hodnoceni')}_emailove_sablony.zip`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('E-mailové šablony staženy jako ZIP.'); return; }
    syncTeacherReviewFromFields(true); saveState(); const blob=new Blob([buildEmailText()],{type:'text/plain;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${safeFileName(state.taskTitle||currentTask().title||'hodnoceni')}_email.txt`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('E-mailová šablona stažena.');
  }catch(e){ toast(e.message||String(e),'err'); }
}
function renderBatchAggregateSummary(){
  const el=$('resultSummary'); if(!el) return;
  const finished=batchResults.filter(r=>r?.result);
  const scores=finished.map(r=>getEffectiveReview(r.result,{useTeacherReview:false}).score_total).filter(Number.isFinite);
  const valid=finished.filter(r=>r.validation?.ok).length;
  const review=finished.filter(r=>!r.validation?.ok).length;
  const approved=finished.filter(r=>r.approved).length;
  const average=scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1):'—';
  el.innerHTML=`<div class="sum-card"><b>Reporty</b><span>${finished.length}</span></div><div class="sum-card"><b>Průměr</b><span>${average}${average==='—'?'':'/24'}</span></div><div class="sum-card"><b>Validní</b><span>${valid}</span></div><div class="sum-card"><b>Ke kontrole</b><span>${review}</span></div><div class="sum-card"><b>Schváleno</b><span>${approved}</span></div>`;
}
function renderResult(){
  if(!$('resultBox')) return;
  const isBatch=batchResults.length>0;
  const text=state.result||'Zatím není vygenerované žádné hodnocení.';
  if(isBatch) renderBatchAggregateSummary(); else renderResultSummary(text);
  renderResultViewControls();
  renderTeacherReviewPanel();
  const resultBox=$('resultBox');
  resultBox.classList.toggle('has-report',Boolean(state.result&&state.result.trim()));
  resultBox.innerHTML=state.result&&state.result.trim()
    ? (isBatch?`<div class="batch-overview"><h2>Dávkové hodnocení je připravené</h2><p>Níže najdeš samostatný školní report pro každého studenta. Před schválením zkontroluj výsledky označené jako „ke kontrole“ a ověř správné spárování e-mailů.</p></div>`:renderReportDocument(text,state.resultView,null))
    : markdownToHtml(text);
  if($('batchResultsBox')){
    $('batchResultsBox').classList.toggle('hidden',!isBatch);
    $('batchResultsBox').innerHTML=isBatch?batchResults.map((r,i)=>{
      const status=r.validation?.ok?'Validní výstup':'Vyžaduje kontrolu';
      return `<section class="batch-result-card"><div class="batch-result-toolbar"><div><h3>${escapeHtml(r.identity||r.code)}</h3><span>${escapeHtml(r.code)} · ${escapeHtml(status)}</span></div><div class="batch-result-actions"><button class="btn-mini" data-copy-batch="${i}">Zkopírovat report</button><button class="btn-mini" data-download-batch="${i}">Stáhnout TXT</button></div></div>${renderReportDocument(r.result||'',state.resultView,r)}</section>`;
    }).join(''):'';
    document.querySelectorAll('[data-copy-batch]').forEach(b=>b.onclick=()=>{
      const r=batchResults[Number(b.dataset.copyBatch)];
      copyText(composeExportMarkdown(state.resultView,r.result,r),'Report zkopírován.');
    });
    document.querySelectorAll('[data-download-batch]').forEach(b=>b.onclick=()=>downloadSingleBatchTxt(Number(b.dataset.downloadBatch)));
  }
  $('downloadZipBtn')?.classList.toggle('hidden',!isBatch);
  if($('rawResult')) $('rawResult').textContent=text;
  if($('rawResultWrap')) $('rawResultWrap').classList.toggle('hidden',!showRaw);
  if(typeof renderReportEnhancementControls==='function') renderReportEnhancementControls();
}
function renderResultSummary(text){
  const el=$('resultSummary'); if(!el) return;
  const hasReal=state.result&&state.result.trim(); if(!hasReal){ el.innerHTML=''; return; }
  const s=resultSummaryParts(text);
  const eff=getEffectiveReview(text);
  const score=eff.score_total!==null?eff.score_total:(s.score!==null?s.score:'—');
  const grade=eff.grade!==null?eff.grade:(s.grade!==null?s.grade:'—');
  const words=eff.final_word_count!==null?eff.final_word_count:(s.words!==null?s.words:'—');
  const fail=eff.fail_signal?'zkontrolovat':'ne';
  const srcLabel=eff.hasTeacherReview?'učitel':(s.source==='json'?'JSON':s.source==='fallback'?'fallback':'chybí');
  const warn=(!s.ok && s.error)?`<div class="warn-box" style="grid-column:1/-1;margin:0"><strong>Strojový souhrn:</strong> ${escapeHtml(s.error)} Souhrn se pokusil použít nouzový fallback.</div>`:'';
  el.innerHTML=`<div class="sum-card"><b>Body</b><span>${score}${score==='—'?'':'/24'}</span></div><div class="sum-card"><b>Známka</b><span>${grade}</span></div><div class="sum-card"><b>Slova</b><span>${words}</span></div><div class="sum-card"><b>Fail signál</b><span>${fail}</span></div><div class="sum-card"><b>Souhrn</b><span>${srcLabel}</span></div>${warn}`;
}
function markdownToHtml(md){
  return markdownFragmentToHtml(displayFeedbackText(md));
}
function markdownFragmentToHtml(md){
  let s=String(md||'').replace(/```[a-zA-Z]*\n?/g,'').replace(/```/g,'');
  const lines=s.split(/\n/);
  let html='',listType='',inTable=false;
  const closeList=()=>{ if(listType){html+=`</${listType}>`; listType='';} };
  const closeTable=()=>{ if(inTable){html+='</tbody></table></div>'; inTable=false;} };
  const closeAll=()=>{ closeList(); closeTable(); };
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    if(!line){closeAll();continue;}
    if(/^\|.+\|$/.test(line) && i+1<lines.length && /^\|\s*[-:]+/.test(lines[i+1].trim())){
      closeAll();
      const heads=line.split('|').slice(1,-1).map(x=>inlineMd(x.trim()));
      html+='<div class="report-table-wrap"><table><thead><tr>'+heads.map(h=>`<th>${h}</th>`).join('')+'</tr></thead><tbody>';
      inTable=true; i++; continue;
    }
    if(inTable && /^\|.+\|$/.test(line)){
      const cells=line.split('|').slice(1,-1).map(x=>inlineMd(x.trim()));
      html+='<tr>'+cells.map(c=>`<td>${c}</td>`).join('')+'</tr>'; continue;
    }
    closeTable();
    if(/^###\s+/.test(line)){closeList();html+='<h3>'+inlineMd(line.replace(/^###\s+/,''))+'</h3>';continue;}
    if(/^##\s+/.test(line)){closeList();html+='<h2>'+inlineMd(line.replace(/^##\s+/,''))+'</h2>';continue;}
    if(/^#\s+/.test(line)){closeList();html+='<h1>'+inlineMd(line.replace(/^#\s+/,''))+'</h1>';continue;}
    if(/^>\s?/.test(line)){closeList();html+='<blockquote>'+inlineMd(line.replace(/^>\s?/,''))+'</blockquote>';continue;}
    if(/^[-•]\s+/.test(line)){
      if(listType!=='ul'){closeList();html+='<ul>';listType='ul';}
      html+='<li>'+inlineMd(line.replace(/^[-•]\s+/,''))+'</li>';continue;
    }
    if(/^\d+[.)]\s+/.test(line)){
      if(listType!=='ol'){closeList();html+='<ol>';listType='ol';}
      html+='<li>'+inlineMd(line.replace(/^\d+[.)]\s+/,''))+'</li>';continue;
    }
    closeList(); html+='<p>'+inlineMd(line)+'</p>';
  }
  closeAll(); return html;
}
function inlineMd(s){ return escapeHtml(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>'); }
function safeFileName(s){ return String(s||'soubor').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||'soubor'; }
function downloadSingleBatchTxt(i){
  const r=batchResults[i]; if(!r) return;
  const blob=new Blob([composeExportMarkdown(state.resultView,r.result||'',r)],{type:'text/plain;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${String(i+1).padStart(2,'0')}_${safeFileName(r.code)}_zpetna_vazba.txt`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove();
}
function ensureJSZip(){
  return new Promise((resolve,reject)=>{
    if(window.JSZip)return resolve(window.JSZip);
    const existing=document.querySelector('script[data-local-jszip="1"]');
    if(existing){existing.addEventListener('load',()=>window.JSZip?resolve(window.JSZip):reject(new Error('Lokální knihovna JSZip se načetla chybně.')), {once:true});existing.addEventListener('error',()=>reject(new Error('Lokální knihovnu JSZip se nepodařilo načíst. Obnov stránku nebo aplikaci znovu nahraj.')), {once:true});return;}
    const script=document.createElement('script');script.src='./vendor/jszip.min.js';script.dataset.localJszip='1';script.onload=()=>window.JSZip?resolve(window.JSZip):reject(new Error('Lokální knihovna JSZip se načetla chybně.'));script.onerror=()=>reject(new Error('Lokální knihovnu JSZip se nepodařilo načíst. Obnov stránku nebo aplikaci znovu nahraj.'));document.head.appendChild(script);
  });
}
async function downloadBatchZip(){
  if(!batchResults.length){toast('Nejdřív vygeneruj dávkové hodnocení.','warn'); return;}
  try{
    const JSZip=await ensureJSZip(); const zip=new JSZip(); const base=safeFileName(state.taskTitle||currentTask().title||'hodnoceni');
    const csvRows=summaryRows();
    batchResults.forEach((r,i)=>{ const fnBase=`${String(i+1).padStart(2,'0')}_${safeFileName(r.code)}`; const readable=composeExportMarkdown(state.resultView,r.result||'',r); zip.folder('txt').file(`${fnBase}_zpetna_vazba.txt`,readable||r.result||''); zip.folder('emailove_sablony').file(`${fnBase}_email.txt`,buildEmailText(r.result,r.code)); });
    for(let i=0;i<batchResults.length;i++){ const r=batchResults[i]; const fnBase=`${String(i+1).padStart(2,'0')}_${safeFileName(r.code)}`; const blob=await createDocxBlob(`${r.code} – zpětná vazba`, composeExportMarkdown(state.resultView,r.result,r)); zip.folder('docx').file(`${fnBase}_zpetna_vazba.docx`,blob); }
    zip.file('souhrn.csv',rowsToCsv(csvRows)); zip.file('souhrn.xlsx',await createXlsxBlob(csvRows)); zip.file('README.txt','Balíček obsahuje TXT a DOCX zpětné vazby, souhrn CSV/XLSX a e-mailové šablony pro ruční rozeslání. Před rozesláním zkontroluj správné spárování se studenty a případné osobní údaje.');
    const blob=await zip.generateAsync({type:'blob'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${base}_balicek_zpetnych_vazeb.zip`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('ZIP balíček stažen.');
  }catch(e){ toast(e.message||String(e),'err'); }
}
function downloadTxt(){
  syncTeacherReviewFromFields(true); saveState(); const text=composeExportMarkdown(); const title=(state.taskTitle||currentTask().title||'hodnoceni').replace(/[^a-z0-9á-žÁ-Ž_-]+/gi,'_').slice(0,80); const blob=new Blob([text],{type:'text/plain;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${title}_hodnoceni.txt`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove();
}
async function copyText(text,msg){ try{ await navigator.clipboard.writeText(text); toast(msg); }catch(e){ toast('Kopírování selhalo. Označ text ručně.','err'); } }
function escapeHtml(s){ return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
window.addEventListener('beforeunload',saveState);
function registerAppServiceWorker(){ if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){ navigator.serviceWorker.register(`./sw.js?v=${encodeURIComponent(APP_VERSION)}`,{updateViaCache:'none'}).then(reg=>reg.update()).catch(()=>{}); } }
function renderBuildLabel(){ const el=$('buildLabel'); if(el && RELEASE.build && RELEASE.build!=='__BUILD__') el.textContent='· build '+RELEASE.build; }


/* 72-report-enhancements.js */
const REPORT_HISTORY_SK='maturitniHodnotitelPseudonymousHistoryV130';
const REPORT_COMMENT_PRESETS=Object.freeze([
  'Hodnocení jsem po kontrole ponechal/a beze změny; bodové rozložení odpovídá důkazům v textu.',
  'Upravil/a jsem bodové hodnocení, protože model nezohlednil správně splnění jednoho z bodů zadání.',
  'Upravil/a jsem hodnocení PTN po ruční kontrole konkrétních prostředků textové návaznosti.',
  'Výsledek je hraniční; doporučuji krátkou ústní konzultaci se studentem před uzavřením známky.',
  'Před sdílením se studentem jsem ověřil/a počet slov, zadání, jazykové chyby a výslednou známku.',
  'Komentář AI byl zkrácen a zpřesněn tak, aby odpovídal skutečně doloženým chybám v textu.'
]);
function defaultReportSettings(){return {visualTheme:'formal',previewMode:'screen',signature:'',showCategoryChart:true,showPriorityCards:true,includeRevisionTask:true,customComments:[]};}
function ensureReportEnhancementState(){
  if(!state.reportSettings||typeof state.reportSettings!=='object')state.reportSettings=defaultReportSettings();
  state.reportSettings=Object.assign(defaultReportSettings(),state.reportSettings);
  state.reportSettings.customComments=Array.isArray(state.reportSettings.customComments)?state.reportSettings.customComments.map(String).filter(Boolean).slice(0,40):[];
}
function currentEvaluationForReport(txt=state.result,context=null){
  const batchContext=context||resultContextForText(txt);
  if(batchContext?.finalEvaluation)return batchContext.finalEvaluation;
  if(!batchContext&&txt===state.result&&state.lastEvaluation)return state.lastEvaluation;
  return null;
}
function reportEffectiveData(txt=state.result,context=null){
  const batchContext=context||resultContextForText(txt);
  const effective=getEffectiveReview(txt,{useTeacherReview:!batchContext,context:batchContext});
  return {context:batchContext,effective,evaluation:currentEvaluationForReport(txt,batchContext)};
}
function reportSectionScores(txt=state.result,context=null){
  const {effective}=reportEffectiveData(txt,context);
  return RESULT_SECTION_KEYS.map(key=>({key,label:RESULT_SECTION_LABELS[key]||key,score:Number.isFinite(Number(effective.sections?.[key]))?Number(effective.sections[key]):null}));
}
function reportCategoryMapHtml(txt=state.result,context=null){
  ensureReportEnhancementState();
  if(!state.reportSettings.showCategoryChart)return '';
  const rows=reportSectionScores(txt,context).filter(x=>x.score!==null);
  if(!rows.length)return '';
  return `<section class="report-category-map" aria-label="Bodová mapa osmi kategorií"><div class="report-section-kicker">Bodová mapa hodnocení</div><div class="report-bars">${rows.map(x=>`<div class="report-bar-row"><span class="report-bar-label">${escapeHtml(x.label)}</span><span class="report-bar-track"><span class="report-bar-fill" style="width:${Math.max(0,Math.min(100,x.score/3*100))}%"></span></span><span class="report-bar-score">${x.score}/3</span></div>`).join('')}</div></section>`;
}
function firstStructuredError(ev){
  if(!ev?.errors)return null;
  return [...(ev.errors.grammar_global||[]),...(ev.errors.lexical_global||[]),...(ev.errors.grammar_local||[]),...(ev.errors.lexical_local||[])][0]||null;
}
function reportPriorityCardsHtml(txt=state.result,context=null){
  ensureReportEnhancementState();
  if(!state.reportSettings.showPriorityCards)return '';
  const data=reportEffectiveData(txt,context);
  const scored=reportSectionScores(txt,context).filter(x=>x.score!==null).sort((a,b)=>b.score-a.score);
  if(!scored.length)return '';
  const keep=scored[0]; const improve=[...scored].sort((a,b)=>a.score-b.score)[0];
  const err=firstStructuredError(data.evaluation);
  const checkText=err?`Zkontrolovat typ chyby „${err.subtype||err.reason||'jazyková chyba'}“ a před odevzdáním vyhledat podobná místa.`:`Při závěrečné kontrole se soustředit na oblast ${improve.label.toLowerCase()}.`;
  return `<section class="report-priority-grid" aria-label="Tři hlavní priority"><div class="report-priority-card keep"><strong>Udržet</strong><span>${escapeHtml(keep.label)} (${keep.score}/3) – zachovat postupy, které zde fungovaly.</span></div><div class="report-priority-card improve"><strong>Zlepšit</strong><span>${escapeHtml(improve.label)} (${improve.score}/3) – tato oblast má největší prostor pro bodový posun.</span></div><div class="report-priority-card check"><strong>Příště zkontrolovat</strong><span>${escapeHtml(checkText)}</span></div></section>`;
}
function classifyEvaluationErrors(ev){
  const groups={critical:[],repeating:[],single:[]};
  if(!ev?.errors)return groups;
  const add=(items,type)=>{for(const raw of items||[]){const x={...raw,type};if(type.includes('global'))groups.critical.push(x);else if(Number(x.repeat_count)>1)groups.repeating.push(x);else groups.single.push(x);}};
  add(ev.errors.grammar_global,'gramatická globální'); add(ev.errors.lexical_global,'lexikální globální'); add(ev.errors.grammar_local,'gramatická lokální'); add(ev.errors.lexical_local,'lexikální lokální');
  return groups;
}
function reportErrorPrioritiesHtml(txt=state.result,context=null,view='teacher'){
  const ev=currentEvaluationForReport(txt,context); const groups=classifyEvaluationErrors(ev);
  if(!Object.values(groups).some(x=>x.length))return '';
  const format=(items,limit=4)=>items.slice(0,limit).map(x=>`<li>${escapeHtml(x.paragraph||'Text')}: „${escapeHtml(x.quote||'—')}“${view==='teacher'&&x.correction?` → <strong>${escapeHtml(x.correction)}</strong>`:''}${Number(x.repeat_count)>1?` (${Number(x.repeat_count)}×)`:''}</li>`).join('')||'<li>Bez nálezu.</li>';
  return `<section class="report-error-priorities"><h2>Priority nalezených chyb</h2><div class="priority-error-groups"><div class="priority-error-group critical"><b>Kritické pro porozumění</b><ul>${format(groups.critical)}</ul></div><div class="priority-error-group repeating"><b>Opakující se vzorce</b><ul>${format(groups.repeating)}</ul></div><div class="priority-error-group single"><b>Jednorázové chyby</b><ul>${format(groups.single)}</ul></div></div></section>`;
}
function reportRevisionTaskHtml(txt=state.result,context=null,view='teacher'){
  ensureReportEnhancementState();
  if(!state.reportSettings.includeRevisionTask||view==='record')return '';
  const ev=currentEvaluationForReport(txt,context); const groups=classifyEvaluationErrors(ev); const errors=[...groups.critical,...groups.repeating,...groups.single].slice(0,3);
  const weakest=reportSectionScores(txt,context).filter(x=>x.score!==null).sort((a,b)=>a.score-b.score)[0];
  const tasks=[];
  errors.forEach((x,i)=>tasks.push(`Přepiš větu ${i+1} správně bez nápovědy: „${x.quote||'vybraná věta z práce'}“.`));
  if(weakest)tasks.push(`Napiš 2–3 nové věty, kterými cíleně posílíš oblast „${weakest.label}“.`);
  tasks.push('Po opravě vysvětli jednou větou, jaké pravidlo nebo postup jsi použil/a.');
  const answer=view==='teacher'&&errors.some(x=>x.correction)?`<details><summary>Klíč pro učitele</summary><ol>${errors.map(x=>`<li>${escapeHtml(x.correction||'Doplní učitel')} – ${escapeHtml(x.reason||'bez uvedeného vysvětlení')}</li>`).join('')}</ol></details>`:'';
  return `<section class="report-revision-task"><h2>Revizní miniúkol</h2><p>Krátké procvičení vychází přímo z této práce a má vést k aktivní opravě, nikoli jen k přečtení komentáře.</p><ol>${tasks.slice(0,4).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol>${answer}</section>`;
}
function scoreCommentConsistencyIssues(txt=state.result,context=null){
  const {effective,evaluation}=reportEffectiveData(txt,context); const issues=[];
  const negative=/\b(chyb|chybn|nedostat|slab|omezen|nespln|nejas|nevhod|problem|neodpov|postrad|málo)\w*/i;
  const positive=/\b(výborn|siln|správn|přesn|jasn|pestr|splněn|vhodn|dobř|funkčn)\w*/i;
  if(evaluation?.sections){
    for(const key of RESULT_SECTION_KEYS){const score=Number(effective.sections?.[key]);const detail=evaluation.sections[key]||{};const comment=[detail.verdict,detail.reasoning,...(detail.evidence||[])].join(' ');if(score<=1&&positive.test(comment)&&!negative.test(comment))issues.push(`${RESULT_SECTION_LABELS[key]}: nízké body, ale komentář působí převážně pozitivně.`);if(score===3&&negative.test(comment)&&!positive.test(comment))issues.push(`${RESULT_SECTION_LABELS[key]}: plný počet bodů, ale komentář popisuje převážně nedostatky.`);}
  }
  const values=RESULT_SECTION_KEYS.map(k=>Number(effective.sections?.[k])).filter(Number.isFinite);
  if(values.length===8){const sum=values.reduce((a,b)=>a+b,0);if(Number(effective.score_total)!==sum)issues.push(`Součet kategorií je ${sum}, ale finální součet uvádí ${effective.score_total}.`);}
  if(Number.isFinite(Number(effective.score_total))&&Number.isFinite(Number(effective.grade))&&!effective.fail_signal){const expected=gradeFromTotal(Number(effective.score_total));if(expected!==Number(effective.grade))issues.push(`Známka ${effective.grade} neodpovídá bodovému pásmu pro ${effective.score_total} bodů (očekává se ${expected}).`);}
  return [...new Set(issues)];
}
function reportConsistencyHtml(txt=state.result,context=null,view='teacher'){
  if(view!=='teacher')return '';
  const issues=scoreCommentConsistencyIssues(txt,context);
  return issues.length?`<section class="report-consistency-report"><h2>Kontrola souladu komentáře s body</h2><ul>${issues.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><p><strong>Před uzavřením výsledku ověř ručně.</strong></p></section>`:'';
}
function reportEnhancementHtml(txt=state.result,view='teacher',context=null){
  if(view==='record')return '';
  return `<div class="report-enhancements">${reportCategoryMapHtml(txt,context)}${reportPriorityCardsHtml(txt,context)}${reportErrorPrioritiesHtml(txt,context,view)}${reportRevisionTaskHtml(txt,context,view)}${reportConsistencyHtml(txt,context,view)}</div>`;
}
function reportEnhancementMarkdown(txt=state.result,view='teacher',context=null){
  if(view==='record')return '';
  const scored=reportSectionScores(txt,context).filter(x=>x.score!==null);
  const ordered=[...scored].sort((a,b)=>a.score-b.score); const ev=currentEvaluationForReport(txt,context); const groups=classifyEvaluationErrors(ev); const lines=[];
  if(state.reportSettings?.showCategoryChart&&scored.length)lines.push('## Bodová mapa osmi kategorií\n\n'+scored.map(x=>`- ${x.label}: ${x.score}/3`).join('\n'));
  if(state.reportSettings?.showPriorityCards&&scored.length)lines.push(`## Tři priority\n\n- **Udržet:** ${[...scored].sort((a,b)=>b.score-a.score)[0].label}\n- **Zlepšit:** ${ordered[0].label}\n- **Příště zkontrolovat:** ${firstStructuredError(ev)?.reason||ordered[0].label}`);
  if(Object.values(groups).some(x=>x.length))lines.push('## Priority nalezených chyb\n\n- Kritické: '+(groups.critical.map(x=>x.quote).join('; ')||'bez nálezu')+'\n- Opakující se: '+(groups.repeating.map(x=>x.quote).join('; ')||'bez nálezu')+'\n- Jednorázové: '+(groups.single.map(x=>x.quote).join('; ')||'bez nálezu'));
  if(state.reportSettings?.includeRevisionTask&&view!=='record'){const items=[...groups.critical,...groups.repeating,...groups.single].slice(0,3);lines.push('## Revizní miniúkol\n\n'+(items.length?items.map((x,i)=>`${i+1}. Přepiš správně: „${x.quote}“.`).join('\n'):`1. Napiš 2–3 nové věty zaměřené na oblast ${ordered[0]?.label||'s nejnižším bodovým ziskem'}.`)+'\n'+`${items.length+1}. Vysvětli jednou větou použité pravidlo nebo postup.`);}
  const consistency=scoreCommentConsistencyIssues(txt,context);if(view==='teacher'&&consistency.length)lines.push('## Kontrola souladu komentáře s body\n\n'+consistency.map(x=>`- ${x}`).join('\n'));
  return lines.length?'\n\n---\n\n'+lines.join('\n\n'):'';
}
function reportSignatureHtml(){ensureReportEnhancementState();const signature=String(state.reportSettings.signature||'').trim();if(!signature)return '';return `<div class="report-signature"><div class="report-signature-inner"><span>${escapeHtml(signature)}</span><small>podpis / iniciály hodnotícího učitele</small></div></div>`;}
function reportHeaderHtml(txt=state.result,context=null){
  ensureWorkflowState();ensureReportEnhancementState();
  const batchContext=context||resultContextForText(txt);const e=getEffectiveReview(txt,{useTeacherReview:!batchContext,context:batchContext});const g=GENRES.find(x=>x.id===state.genre);const studentName=batchContext?.identity||state.studentIdentity||'Student';const studentCode=batchContext?.code||e.student_code||state.studentCode||'—';const statusOk=batchContext?Boolean(batchContext.validation?.ok):Boolean(e.verified);const statusText=batchContext?(batchContext.validation?.ok?'Výstup prošel automatickou kontrolou struktury.':'Výstup vyžaduje ruční kontrolu učitele.'):(e.verified?'Výsledek byl potvrzen učitelem.':'Výsledek čeká na finální kontrolu učitele.');const logoUrl=new URL('assets/ghrab-logo.png',location.href).href;
  const title=state.reportSettings.visualTheme==='friendly'?'Tvoje zpětná vazba ke slohu':'Hodnocení maturitního slohu';
  return `<header class="report-letterhead"><img class="report-logo" src="${escapeHtml(logoUrl)}" alt="Logo Gymnázia Ostrava-Hrabůvka"><div><div class="report-school">Gymnázium, Ostrava-Hrabůvka</div><div class="report-title">${escapeHtml(title)}</div><div class="report-subtitle">${escapeHtml(seriesDisplayName())}</div></div><div class="report-score"><strong>${e.score_total??'—'}<small>/24</small></strong><span>známka ${e.grade??'—'}</span></div></header><div class="report-meta"><div class="report-meta-item"><b>Student</b><span>${escapeHtml(studentName)}</span></div><div class="report-meta-item"><b>Kód</b><span>${escapeHtml(studentCode)}</span></div><div class="report-meta-item"><b>Útvar</b><span>${escapeHtml(g?.label||state.genre||'—')}</span></div><div class="report-meta-item"><b>Počet slov</b><span>${e.final_word_count??'—'}</span></div><div class="report-meta-item"><b>Třída</b><span>${escapeHtml(state.series.className||'—')}</span></div><div class="report-meta-item"><b>Datum</b><span>${escapeHtml(state.series.assessmentDate||'—')}</span></div><div class="report-meta-item"><b>Hodnotitel</b><span>${escapeHtml(state.series.teacherName||'—')}</span></div><div class="report-meta-item"><b>Rubrika</b><span>${escapeHtml(RUBRIC_VERSION)}</span></div></div><div class="report-status ${statusOk?'ok':'warn'}">${statusOk?'✓':'!'} ${escapeHtml(statusText)}</div>`;
}
function renderReportDocument(txt=state.result,view=null,context=null){
  ensureReportEnhancementState();const selected=view||state.resultView||state.outputStyle||'teacher';const body=markdownFragmentToHtml(displayFeedbackText(txt,selected));const theme=state.reportSettings.visualTheme==='friendly'?'report-theme-friendly':'report-theme-formal';return `<article class="report-document ${theme}">${reportHeaderHtml(txt,context)}${reportEnhancementHtml(txt,selected,context)}<div class="report-body">${body}</div>${reportSignatureHtml()}<footer class="report-footer"><span>Hodnotitel maturitních slohů ${escapeHtml(APP_VERSION)}</span><span>AI výstup je podkladem; finální odpovědnost nese hodnotící učitel.</span></footer></article>`;
}
function renderReportEnhancementControls(){
  ensureReportEnhancementState();const settings=state.reportSettings;
  document.querySelectorAll('[data-report-theme]').forEach(b=>{b.classList.toggle('active',b.dataset.reportTheme===settings.visualTheme);b.setAttribute('aria-pressed',String(b.dataset.reportTheme===settings.visualTheme));});
  document.querySelectorAll('[data-report-preview]').forEach(b=>{b.classList.toggle('active',b.dataset.reportPreview===settings.previewMode);b.setAttribute('aria-pressed',String(b.dataset.reportPreview===settings.previewMode));});
  if($('reportSignature'))$('reportSignature').value=settings.signature||'';if($('reportShowChart'))$('reportShowChart').checked=!!settings.showCategoryChart;if($('reportShowPriorities'))$('reportShowPriorities').checked=!!settings.showPriorityCards;if($('reportIncludeRevision'))$('reportIncludeRevision').checked=!!settings.includeRevisionTask;
  $('resultBox')?.classList.toggle('report-preview-a4',settings.previewMode==='a4');$('batchResultsBox')?.classList.toggle('report-preview-a4',settings.previewMode==='a4');
  renderCommentBank();renderConsistencyPanel();
  if($('classAnalyticsBtn'))$('classAnalyticsBtn').disabled=!batchResults.some(r=>r?.approved&&r?.validation?.ok!==false);
}
function renderConsistencyPanel(){const box=$('reportConsistency');if(!box)return;const issues=batchResults.length?batchResults.flatMap(r=>scoreCommentConsistencyIssues(r.result,r)).slice(0,10):scoreCommentConsistencyIssues(state.result,null);box.innerHTML=issues.length?`<div class="consistency-box warn"><strong>Kontrola souladu našla ${issues.length} upozornění</strong>${issues.map(x=>`• ${escapeHtml(x)}`).join('<br>')}</div>`:'<div class="consistency-box"><strong>Kontrola souladu</strong>Body, známka a dostupné komentáře nevykazují zjevný rozpor.</div>';}
function renderCommentBank(){const select=$('commentBankSelect');if(!select)return;ensureReportEnhancementState();const custom=state.reportSettings.customComments||[];select.innerHTML='<optgroup label="Doporučené">'+REPORT_COMMENT_PRESETS.map((x,i)=>`<option value="preset:${i}">${escapeHtml(x)}</option>`).join('')+'</optgroup>'+(custom.length?'<optgroup label="Vlastní">'+custom.map((x,i)=>`<option value="custom:${i}">${escapeHtml(x)}</option>`).join('')+'</optgroup>':'');}
function selectedCommentBankText(){const value=$('commentBankSelect')?.value||'';const [kind,indexRaw]=value.split(':');const index=Number(indexRaw);return kind==='custom'?state.reportSettings.customComments[index]||'':REPORT_COMMENT_PRESETS[index]||'';}
function insertSelectedComment(){const text=selectedCommentBankText();const field=$('teacherReviewNote');if(!text||!field)return;field.value=[field.value.trim(),text].filter(Boolean).join('\n');field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();toast('Komentář vložen do poznámky učitele.');}
function addCustomComment(){const input=$('customCommentInput');const text=String(input?.value||'').trim();if(text.length<5){toast('Napiš vlastní komentář alespoň o 5 znacích.','warn');return;}ensureReportEnhancementState();if(!state.reportSettings.customComments.includes(text))state.reportSettings.customComments.push(text);input.value='';renderCommentBank();saveState();toast('Vlastní komentář přidán do banky.');}
function deleteCustomComment(){const value=$('commentBankSelect')?.value||'';if(!value.startsWith('custom:')){toast('Vyber vlastní komentář, který chceš smazat.','warn');return;}const index=Number(value.split(':')[1]);state.reportSettings.customComments.splice(index,1);renderCommentBank();saveState();toast('Vlastní komentář smazán.','warn');}
function classAnalyticsData(){
  const rows=batchResults.filter(r=>r?.approved&&r?.validation?.ok!==false).map(r=>({r,e:getEffectiveReview(r.result,{useTeacherReview:false,context:r})})).filter(x=>Number.isFinite(Number(x.e.score_total)));
  const categoryAverages={};for(const key of RESULT_SECTION_KEYS){const vals=rows.map(x=>Number(x.e.sections?.[key])).filter(Number.isFinite);categoryAverages[key]=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;}
  const grades={1:0,2:0,3:0,4:0,5:0};rows.forEach(x=>{const g=Number(x.e.grade);if(grades[g]!==undefined)grades[g]++;});const scores=rows.map(x=>Number(x.e.score_total));return {count:rows.length,average:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null,min:scores.length?Math.min(...scores):null,max:scores.length?Math.max(...scores):null,categoryAverages,grades};
}
function classAnalyticsHtml(){const a=classAnalyticsData();if(!a.count)return '<div class="warn-box">Nejsou dostupné žádné dokončené dávkové výsledky.</div>';const weakest=Object.entries(a.categoryAverages).filter(([,v])=>v!==null).sort((x,y)=>x[1]-y[1]).slice(0,3);return `<div class="small-muted">Souhrn je záměrně anonymní: neobsahuje jména, kódy, e-maily ani texty studentů.</div><div class="analytics-grid"><div class="analytics-stat"><strong>${a.count}</strong><span>hodnocených prací</span></div><div class="analytics-stat"><strong>${a.average.toFixed(1)}/24</strong><span>průměrný výsledek</span></div><div class="analytics-stat"><strong>${a.min}–${a.max}</strong><span>rozpětí bodů</span></div><div class="analytics-stat"><strong>${weakest.map(([k])=>RESULT_SECTION_LABELS[k]).join(', ')}</strong><span>3 nejslabší oblasti</span></div></div><div class="modal-section-title">Průměr podle kategorií</div><div class="analytics-bars">${Object.entries(a.categoryAverages).map(([k,v])=>`<div class="analytics-row"><span>${escapeHtml(RESULT_SECTION_LABELS[k])}</span><span class="analytics-track"><span class="analytics-fill" style="width:${v===null?0:v/3*100}%"></span></span><strong>${v===null?'—':v.toFixed(2)}/3</strong></div>`).join('')}</div><div class="modal-section-title">Rozložení známek</div><div class="analytics-grid">${Object.entries(a.grades).map(([g,n])=>`<div class="analytics-stat"><strong>${n}</strong><span>známka ${g}</span></div>`).join('')}</div><div class="modal-actions-inline"><button class="btn-mini" id="downloadAnalyticsCsvBtn" type="button">Stáhnout anonymní CSV</button></div>`;}
function showClassAnalytics(){showModal('Anonymní třídní analytika',classAnalyticsHtml(),[{label:'Zavřít'}]);setTimeout(()=>{$('downloadAnalyticsCsvBtn')?.addEventListener('click',downloadClassAnalyticsCsv);},0);}
function downloadClassAnalyticsCsv(){const a=classAnalyticsData();const rows=[['metrika','hodnota'],['pocet_praci',a.count],['prumer_bodu',a.average?.toFixed(2)||''],['minimum',a.min??''],['maximum',a.max??''],...RESULT_SECTION_KEYS.map(k=>['prumer_'+k,a.categoryAverages[k]?.toFixed(3)||'']),...Object.entries(a.grades).map(([g,n])=>['znamka_'+g,n])];const csv=rows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(';')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`${safeFileName(seriesDisplayName())}_anonymni_analytika.csv`;link.click();URL.revokeObjectURL(link.href);}
function loadPseudonymousHistory(){if(!sensitiveSaveEnabled())return [];try{const rows=JSON.parse(safeLocalGet(REPORT_HISTORY_SK)||'[]');return Array.isArray(rows)?rows:[];}catch(_){return [];}}
function savePseudonymousHistoryRows(rows){if(!sensitiveSaveEnabled())return false;return safeLocalSet(REPORT_HISTORY_SK,JSON.stringify(rows.slice(-500)));}
function historyRecordFromResult(txt=state.result,context=null){const data=reportEffectiveData(txt,context);const e=data.effective;const code=data.context?.code||e.student_code||state.studentCode||'';if(!code||!Number.isFinite(Number(e.score_total)))return null;return {id:[state.series?.id||'',code,state.series?.assessmentDate||localIsoDate(),state.taskTitle||currentTask().title||''].join('|'),studentCode:code,date:state.series?.assessmentDate||localIsoDate(),seriesId:state.series?.id||'',seriesName:seriesDisplayName(),genre:state.genre||'',taskTitle:state.taskTitle||currentTask().title||'',rubricVersion:RUBRIC_VERSION,total:Number(e.score_total),grade:Number(e.grade),words:Number(e.final_word_count)||null,sections:Object.fromEntries(RESULT_SECTION_KEYS.map(k=>[k,Number.isFinite(Number(e.sections?.[k]))?Number(e.sections[k]):null])),savedAt:new Date().toISOString()};}
function saveCurrentProgressHistory(){
  if(!sensitiveSaveEnabled()){toast('Nejdřív zapni obnovu citlivé relace v Privacy režimu. Historie je z bezpečnostních důvodů výchozí vypnutá.','warn');return;}
  const singleEffective=batchResults.length?null:getEffectiveReview(state.result);const candidates=batchResults.length?batchResults.filter(r=>r.approved&&r.validation?.ok!==false).map(r=>historyRecordFromResult(r.result,r)).filter(Boolean):(singleEffective?.verified?[historyRecordFromResult(state.result,null)].filter(Boolean):[]);if(!candidates.length){toast(batchResults.length?'Nejdřív schval alespoň jeden validní výsledek.':'Nejdřív označ hodnocení jako finálně zkontrolované učitelem.','warn');return;}
  const history=loadPseudonymousHistory();for(const row of candidates){const idx=history.findIndex(x=>x.id===row.id);if(idx>=0)history[idx]=row;else history.push(row);}savePseudonymousHistoryRows(history);toast(`Uloženo ${candidates.length} pseudonymních záznamů pokroku.`);
}
function historyHtml(){const rows=loadPseudonymousHistory().sort((a,b)=>String(b.date).localeCompare(String(a.date)));if(!sensitiveSaveEnabled())return '<div class="warn-box"><strong>Historie je vypnutá.</strong> Zapni obnovu citlivé relace pouze na vlastním zařízení. Ukládají se jen pseudonymní bodové záznamy, nikoli text práce, jméno ani e-mail.</div>';if(!rows.length)return '<div class="empty-workflow">Zatím není uložen žádný pseudonymní záznam pokroku.</div>';const grouped=new Map();rows.forEach(r=>{if(!grouped.has(r.studentCode))grouped.set(r.studentCode,[]);grouped.get(r.studentCode).push(r);});return `<div class="small-muted">Záznamy jsou vedeny pouze podle pseudonymního kódu. Pro smysluplný trend musí být stejnému studentovi dlouhodobě přidělován stejný školní kód.</div><div class="history-list">${[...grouped.entries()].flatMap(([code,items])=>items.map((r,i)=>{const previous=items[i+1];const delta=previous?Number(r.total)-Number(previous.total):null;return `<div class="history-row"><div><strong>${escapeHtml(code)}</strong><span>${escapeHtml(r.date||'—')} · ${escapeHtml(r.genre||'—')}</span></div><div><strong>${escapeHtml(r.taskTitle||r.seriesName||'Hodnocení')}</strong><span>${previous?`Změna oproti předchozímu záznamu: ${delta>0?'+':''}${delta} bodů`:'První uložený záznam'}</span></div><span class="history-score">${r.total}/24 · ${r.grade}</span></div>`;})).join('')}</div><div class="modal-actions-inline"><button class="btn-mini" id="exportHistoryBtn" type="button">Exportovat pseudonymní historii</button><button class="btn-mini danger" id="clearHistoryBtn" type="button">Vymazat historii</button></div>`;}
function showProgressHistory(){showModal('Pseudonymní historie pokroku',historyHtml(),[{label:'Zavřít'}]);setTimeout(()=>{$('exportHistoryBtn')?.addEventListener('click',exportProgressHistory);$('clearHistoryBtn')?.addEventListener('click',clearProgressHistory);},0);}
function exportProgressHistory(){const rows=loadPseudonymousHistory();const blob=new Blob([JSON.stringify({schema:'ghrab-pseudonymous-progress-v1',exportedAt:new Date().toISOString(),records:rows},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pseudonymni_historie_pokroku.json';a.click();URL.revokeObjectURL(a.href);}
async function clearProgressHistory(){if(!(await uiConfirm('Vymazat všechny pseudonymní záznamy pokroku z tohoto prohlížeče?','Vymazat historii')))return;safeLocalRemove(REPORT_HISTORY_SK);hideModal();toast('Pseudonymní historie byla vymazána.','warn');}
function applyReportSettingChange(){ensureReportEnhancementState();state.reportSettings.signature=$('reportSignature')?.value.trim()||'';state.reportSettings.showCategoryChart=!!$('reportShowChart')?.checked;state.reportSettings.showPriorityCards=!!$('reportShowPriorities')?.checked;state.reportSettings.includeRevisionTask=!!$('reportIncludeRevision')?.checked;saveState();renderResult();}
function initReportEnhancements(){
  ensureReportEnhancementState();
  document.querySelectorAll('[data-report-theme]').forEach(b=>b.addEventListener('click',()=>{state.reportSettings.visualTheme=b.dataset.reportTheme==='friendly'?'friendly':'formal';saveState();renderResult();}));
  document.querySelectorAll('[data-report-preview]').forEach(b=>b.addEventListener('click',()=>{state.reportSettings.previewMode=b.dataset.reportPreview==='a4'?'a4':'screen';saveState();renderReportEnhancementControls();}));
  for(const id of ['reportSignature','reportShowChart','reportShowPriorities','reportIncludeRevision'])$(id)?.addEventListener('input',applyReportSettingChange);
  $('classAnalyticsBtn')?.addEventListener('click',showClassAnalytics);$('saveHistoryBtn')?.addEventListener('click',saveCurrentProgressHistory);$('openHistoryBtn')?.addEventListener('click',showProgressHistory);$('insertCommentBtn')?.addEventListener('click',insertSelectedComment);$('addCommentBtn')?.addEventListener('click',addCustomComment);$('deleteCommentBtn')?.addEventListener('click',deleteCustomComment);
  renderResult();renderReportEnhancementControls();
}
function docxRun(text,bold=false,italic=false,size=22,color='26364A'){const props=[bold?'<w:b/>':'',italic?'<w:i/>':'',size?`<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`:'',color?`<w:color w:val="${color}"/>`:''].join('');return `<w:r><w:rPr>${props}</w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`;}
function docxInlineRuns(text,size=22,color='26364A'){const parts=String(text||'').split(/(\*\*.*?\*\*|`.*?`)/g).filter(Boolean);return parts.map(part=>part.startsWith('**')&&part.endsWith('**')?docxRun(part.slice(2,-2),true,false,size,color):part.startsWith('`')&&part.endsWith('`')?docxRun(part.slice(1,-1),false,false,size,'365C7D'):docxRun(part,false,false,size,color)).join('');}
function docxParagraph(text,style='',options={}){const pPr=[style?`<w:pStyle w:val="${style}"/>`:'',options.spaceAfter!==undefined?`<w:spacing w:after="${options.spaceAfter}"/>`:'',options.keep?'<w:keepNext/>':'',options.align?`<w:jc w:val="${options.align}"/>`:''].join('');return `<w:p><w:pPr>${pPr}</w:pPr>${docxInlineRuns(text,options.size||22,options.color||'26364A')}</w:p>`;}
function docxTable(rows){if(!rows.length)return '';const widths=rows[0].map((_,i)=>i===0?3600:5400);return `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="B8C5D3"/><w:left w:val="single" w:sz="4" w:color="B8C5D3"/><w:bottom w:val="single" w:sz="4" w:color="B8C5D3"/><w:right w:val="single" w:sz="4" w:color="B8C5D3"/><w:insideH w:val="single" w:sz="4" w:color="D8E0E8"/><w:insideV w:val="single" w:sz="4" w:color="D8E0E8"/></w:tblBorders></w:tblPr>${rows.map((row,ri)=>`<w:tr>${row.map((cell,ci)=>`<w:tc><w:tcPr><w:tcW w:w="${widths[ci]||3600}" w:type="dxa"/>${ri===0?'<w:shd w:fill="EAF0F6"/>':''}</w:tcPr><w:p><w:r><w:rPr>${ri===0?'<w:b/>':''}<w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">${xmlEscape(cell)}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>`;}
function markdownToDocxBody(markdown){const lines=String(markdown||'').replace(/```[a-zA-Z]*\n?/g,'').replace(/```/g,'').split(/\n/);let xml='';for(let i=0;i<lines.length;i++){const raw=lines[i];const line=raw.trim();if(!line){xml+=docxParagraph('', '', {spaceAfter:40});continue;}if(/^\|.+\|$/.test(line)&&i+1<lines.length&&/^\|\s*[-:]+/.test(lines[i+1].trim())){const rows=[line.split('|').slice(1,-1).map(x=>x.trim())];i+=2;while(i<lines.length&&/^\|.+\|$/.test(lines[i].trim())){rows.push(lines[i].trim().split('|').slice(1,-1).map(x=>x.trim()));i++;}i--;xml+=docxTable(rows);continue;}if(/^###\s+/.test(line)){xml+=docxParagraph(line.replace(/^###\s+/,''),'Heading3',{keep:true});continue;}if(/^##\s+/.test(line)){xml+=docxParagraph(line.replace(/^##\s+/,''),'Heading2',{keep:true});continue;}if(/^#\s+/.test(line)){xml+=docxParagraph(line.replace(/^#\s+/,''),'Heading1',{keep:true});continue;}if(/^[-•]\s+/.test(line)){xml+=docxParagraph('• '+line.replace(/^[-•]\s+/,''),'ListParagraph',{spaceAfter:60});continue;}if(/^\d+[.)]\s+/.test(line)){xml+=docxParagraph(line,'ListParagraph',{spaceAfter:60});continue;}if(/^>\s?/.test(line)){xml+=docxParagraph(line.replace(/^>\s?/,''),'Quote',{spaceAfter:120});continue;}if(/^---+$/.test(line))continue;xml+=docxParagraph(line,'Normal',{spaceAfter:110});}return xml;}
async function reportLogoBytes(){try{const response=await fetch(new URL('assets/ghrab-logo.png',location.href));if(!response.ok)throw new Error('logo');return new Uint8Array(await response.arrayBuffer());}catch(_){return null;}}
async function createDocxBlob(title,markdown){
  const JSZip=await ensureJSZip();const zip=new JSZip();const logo=await reportLogoBytes();const signature=String(state.reportSettings?.signature||'').trim();
  const logoXml=logo?`<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="914400" cy="914400"/><wp:docPr id="1" name="Logo školy"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="ghrab-logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="914400" cy="914400"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`:'';
  const header=`${logoXml}${docxParagraph('GYMNÁZIUM, OSTRAVA-HRABŮVKA','SchoolName',{align:'center',keep:true})}${docxParagraph(title||'Hodnocení maturitního slohu','Title',{align:'center',keep:true})}${docxParagraph(seriesDisplayName(),'Subtitle',{align:'center'})}`;
  const signatureXml=signature?`${docxParagraph('','Normal',{spaceAfter:280})}${docxParagraph(signature,'Signature',{align:'right'})}${docxParagraph('podpis / iniciály hodnotícího učitele','SignatureLabel',{align:'right'})}`:'';
  const documentXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${header}${markdownToDocxBody(markdown)}${signatureXml}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="568" w:footer="568"/><w:cols w:space="708"/></w:sectPr></w:body></w:document>`;
  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="22"/><w:color w:val="26364A"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="110" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="19324F"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:rPr><w:sz w:val="22"/><w:color w:val="66778B"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="SchoolName"><w:name w:val="School Name"/><w:rPr><w:b/><w:sz w:val="20"/><w:color w:val="A87820"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="260" w:after="120"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="19324F"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="220" w:after="100"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="27"/><w:color w:val="24577E"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="180" w:after="80"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="385A78"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="420" w:hanging="220"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="360" w:right="240"/><w:shd w:fill="FFF4D9"/></w:pPr><w:rPr><w:i/><w:color w:val="684A14"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Signature"><w:name w:val="Signature"/><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="35485F"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="SignatureLabel"><w:name w:val="Signature Label"/><w:rPr><w:sz w:val="16"/><w:color w:val="778698"/></w:rPr></w:style></w:styles>`;
  zip.file('[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${logo?'<Default Extension="png" ContentType="image/png"/>':''}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`);
  zip.folder('_rels').file('.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>');
  zip.folder('word').file('document.xml',documentXml);zip.folder('word').file('styles.xml',styles);zip.folder('word').folder('_rels').file('document.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${logo?'<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/ghrab-logo.png"/>':''}</Relationships>`);if(logo)zip.folder('word').folder('media').file('ghrab-logo.png',logo);
  zip.folder('docProps').file('core.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEscape(title||'Hodnocení maturitního slohu')}</dc:title><dc:creator>${xmlEscape(state.series?.teacherName||'Gymnázium Ostrava-Hrabůvka')}</dc:creator><cp:lastModifiedBy>Hodnotitel maturitních slohů ${xmlEscape(APP_VERSION)}</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created></cp:coreProperties>`);zip.folder('docProps').file('app.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>AI Studio GHRAB – Hodnotitel maturitních slohů</Application></Properties>');
  return zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
function reportPrintCss(){return `*{box-sizing:border-box}body{margin:0;background:#e9eef4;color:#172033;font-family:Arial,sans-serif;line-height:1.55}.print-toolbar{position:sticky;top:0;z-index:10;display:flex;justify-content:center;gap:8px;padding:12px;background:#172033}.print-toolbar button{padding:10px 16px;border:0;border-radius:8px;font-weight:700;cursor:pointer}.print-shell{max-width:900px;margin:24px auto;padding:0 16px}.report-document{background:#fff;border:1px solid #d9e0e9;border-radius:14px;overflow:hidden;box-shadow:0 10px 35px rgba(23,32,51,.12)}.report-letterhead{display:grid;grid-template-columns:72px 1fr auto;gap:18px;align-items:center;padding:22px 26px;background:linear-gradient(135deg,#162238,#24385b);color:#fff}.report-theme-friendly .report-letterhead{background:linear-gradient(135deg,#1d5d7f,#2f7896)}.report-logo{width:68px;height:68px;object-fit:contain;background:#fff;border-radius:12px;padding:6px}.report-school{font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.78}.report-title{font-size:24px;font-weight:800;margin-top:3px}.report-subtitle{font-size:13px;opacity:.82;margin-top:2px}.report-score{text-align:right}.report-score strong{display:block;font-size:28px}.report-score span{font-size:12px;opacity:.8}.report-meta{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #d9e0e9;background:#f8fafc}.report-meta-item{padding:12px 16px;border-right:1px solid #e6ebf1;border-bottom:1px solid #e6ebf1}.report-meta-item b{display:block;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#667085;margin-bottom:3px}.report-meta-item span{font-size:13px;font-weight:700;color:#172033}.report-status{padding:10px 26px;font-size:12px;border-bottom:1px solid #d9e0e9}.report-status.ok{background:#edf9f2;color:#17653a}.report-status.warn{background:#fff7e8;color:#8a4b08}.report-enhancements{padding:0 28px 4px}.report-category-map,.report-error-priorities,.report-revision-task,.report-consistency-report{margin:18px 0;padding:14px;border:1px solid #dce4ec;border-radius:12px}.report-section-kicker{margin-bottom:10px;font-size:10px;font-weight:900;text-transform:uppercase;color:#53667e}.report-bars{display:grid;gap:7px}.report-bar-row{display:grid;grid-template-columns:180px 1fr 36px;gap:10px;align-items:center}.report-bar-label,.report-bar-score{font-size:11px;font-weight:700}.report-bar-track{height:9px;border-radius:99px;background:#e2e8ef;overflow:hidden}.report-bar-fill{display:block;height:100%;background:#c8912e}.report-priority-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}.report-priority-card{padding:12px;border:1px solid #dce4ec;border-radius:10px}.report-priority-card strong,.report-priority-card span{display:block}.report-priority-card strong{font-size:10px;text-transform:uppercase;margin-bottom:5px}.report-priority-card span{font-size:12px}.priority-error-groups{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.priority-error-group{padding:9px;background:#f7f9fb}.priority-error-group b{font-size:10px}.priority-error-group ul{margin:5px 0 0 18px}.report-revision-task{background:#fffaf0}.report-consistency-report{background:#fff7e8}.report-body{padding:24px 28px}.report-body h1{font-size:22px;margin:0 0 16px}.report-body h2,.report-enhancements h2{font-size:17px;margin:24px 0 9px;color:#1e4775}.report-body h3{font-size:15px;margin:18px 0 7px}.report-body p{margin:8px 0}.report-body ul,.report-body ol{margin:8px 0 8px 24px}.report-body li{margin:4px 0}.report-body blockquote{margin:14px 0;padding:12px 16px;border-left:4px solid #c79627;background:#fff8e8}.report-body table{border-collapse:collapse;width:100%;font-size:12px}.report-body th,.report-body td{border:1px solid #d7dee8;padding:8px;text-align:left;vertical-align:top}.report-body th{background:#eef3f8}.report-table-wrap{overflow-x:auto;margin:12px 0}.report-signature{display:flex;justify-content:flex-end;padding:4px 28px 20px}.report-signature-inner{min-width:210px;padding-top:18px;border-bottom:1px solid #8491a2;text-align:center;font-size:11px}.report-signature-inner span,.report-signature-inner small{display:block}.report-footer{display:flex;justify-content:space-between;gap:16px;padding:12px 26px;background:#f8fafc;border-top:1px solid #d9e0e9;color:#667085;font-size:10px}.report-page-break{height:24px}@media(max-width:720px){.report-letterhead{grid-template-columns:58px 1fr}.report-score{grid-column:1/-1;text-align:left}.report-meta{grid-template-columns:repeat(2,1fr)}.report-priority-grid,.priority-error-groups{grid-template-columns:1fr}.report-bar-row{grid-template-columns:1fr}.report-bar-score{display:none}}@media print{@page{size:A4;margin:10mm}body{background:#fff}.print-toolbar{display:none}.print-shell{max-width:none;margin:0;padding:0}.report-document{box-shadow:none;border:0;border-radius:0}.report-page-break{break-after:page;height:0}.report-letterhead,.report-status,.report-meta,.report-category-map,.report-priority-card,.report-revision-task{-webkit-print-color-adjust:exact;print-color-adjust:exact}.report-category-map,.report-priority-grid,.report-error-priorities,.report-revision-task,.report-consistency-report,.report-signature{break-inside:avoid}}`;}
function printPdfExport(){if(!batchResults.length)syncTeacherReviewFromFields(true);saveState();const reports=batchResults.length?batchResults.map(r=>renderReportDocument(r.result||'',state.resultView,r)).join('<div class="report-page-break"></div>'):renderReportDocument(state.result||'',state.resultView,null);const win=window.open('','_blank');if(!win){toast('Prohlížeč zablokoval nové okno. Povol vyskakovací okna nebo použij DOCX/TXT export.','err');return;}win.document.write(`<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hodnocení maturitního slohu</title><style>${reportPrintCss()}</style></head><body><div class="print-toolbar"><button onclick="window.print()">Tisk / Uložit jako PDF</button><button onclick="window.close()">Zavřít náhled</button></div><main class="print-shell">${reports}</main></body></html>`);win.document.close();}

/* 75-distribution.js */
function resultByCode(code){return batchResults.find(r=>r.code===code)||null;}
function studentByCode(code){return batchStudents.find(s=>s.code===code)||null;}
function isValidEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value||'').trim());}
function setResultApproval(code,approved){const r=resultByCode(code);if(!r)return;if(approved&&(!r.validation?.ok||!isValidEmail(r.email))){toast('Schválit lze jen validní výsledek s platným e-mailem.','warn');return;}r.approved=Boolean(approved);const s=studentByCode(code);if(s)s.approved=r.approved;renderBatchReviewDashboard();updateWorkflowDashboard();saveBatchProgress();}
function approveAllValidResults(){let count=0;for(const r of batchResults){if(r.validation?.ok&&isValidEmail(r.email)){r.approved=true;const s=studentByCode(r.code);if(s)s.approved=true;count++;}}renderBatchReviewDashboard();updateWorkflowDashboard();saveBatchProgress();toast(`Schváleno ${count} validních výsledků.`);}
function distributionReadyResults(){return batchResults.map(ensureBatchResultShape).filter(r=>r.approved&&r.validation?.ok&&isValidEmail(r.email));}
function validateDistribution(){const ready=distributionReadyResults();if(!ready.length)return {ok:false,issues:['Není schválen žádný validní výsledek s e-mailem.'],items:[]};const issues=[];const seen=new Set();for(const r of ready){const email=String(r.email||'').trim().toLowerCase();if(!isValidEmail(email))issues.push(`${r.code}: neplatný e-mail.`);if(seen.has(email))issues.push(`${r.code}: duplicitní e-mail ${email}.`);seen.add(email);}return {ok:issues.length===0,issues,items:ready};}
function syncDistributionFromFields(){ensureWorkflowState();state.distribution.appsScriptUrl=$('appsScriptUrl')?.value.trim()||'';state.distribution.sharedSecret=$('appsScriptSecret')?.value||'';state.distribution.subjectTemplate=$('emailSubjectTemplate')?.value||state.distribution.subjectTemplate;state.distribution.senderName=$('emailSenderName')?.value||state.distribution.senderName;state.distribution.mode=document.querySelector('[name="deliveryMode"]:checked')?.value||'drafts';state.distribution.includeScore=Boolean($('emailIncludeScore')?.checked);state.distribution.includeOriginal=Boolean($('emailIncludeOriginal')?.checked);saveState();}
function syncDistributionToFields(){ensureWorkflowState();if($('appsScriptUrl'))$('appsScriptUrl').value=state.distribution.appsScriptUrl||'';if($('appsScriptSecret'))$('appsScriptSecret').value=state.distribution.sharedSecret||'';if($('emailSubjectTemplate'))$('emailSubjectTemplate').value=state.distribution.subjectTemplate||'';if($('emailSenderName'))$('emailSenderName').value=state.distribution.senderName||'';document.querySelectorAll('[name="deliveryMode"]').forEach(x=>x.checked=x.value===state.distribution.mode);if($('emailIncludeScore'))$('emailIncludeScore').checked=state.distribution.includeScore!==false;if($('emailIncludeOriginal'))$('emailIncludeOriginal').checked=Boolean(state.distribution.includeOriginal);}
function fillEmailTemplate(template,item){return String(template||'').replaceAll('{series}',seriesDisplayName()).replaceAll('{student}',item.name||item.code).replaceAll('{code}',item.code).replaceAll('{score}',String(item.score??'—')).replaceAll('{grade}',String(item.grade??'—'));}
function buildDistributionItem(r){
  const ev=r.finalEvaluation;
  const meta=ev?evaluationMachineSummary(ev):extractResultMetadata(r.result).meta||{};
  const studentText=ev?generatedStudentFeedback(ev):extractResultViewSection(r.result,'student');
  const source=studentByCode(r.code);
  const scoreLead=state.distribution.includeScore!==false?`<p><strong>Výsledek:</strong> ${meta.score_total??'—'}/24 bodů · známka ${meta.grade??'—'}</p>`:'';
  const scoreLeadPlain=state.distribution.includeScore!==false?`Výsledek: ${meta.score_total??'—'}/24 bodů · známka ${meta.grade??'—'}\n\n`:'';
  const originalText=state.distribution.includeOriginal?String(source?.text||'').trim():'';
  const originalHtml=originalText?`<hr><h3>Původní text práce</h3><div style="font-family:Georgia,serif;white-space:pre-wrap">${escapeHtml(originalText).replace(/\n/g,'<br>')}</div>`:'';
  const originalPlain=originalText?`\n\n---\nPŮVODNÍ TEXT PRÁCE\n\n${originalText}`:'';
  const name=r.displayName||r.identity||r.code;
  return {
    code:r.code,
    name,
    email:r.email,
    subject:fillEmailTemplate(state.distribution.subjectTemplate,{code:r.code,name,score:meta.score_total,grade:meta.grade}),
    htmlBody:`<p>Dobrý den,</p><p>posílám zpětnou vazbu k práci <strong>${escapeHtml(seriesDisplayName())}</strong>.</p>${scoreLead}<div style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(markdownToPlainText(studentText)).replace(/\n/g,'<br>')}</div>${originalHtml}<p>S pozdravem<br>${escapeHtml(state.distribution.senderName||state.series.teacherName||'')}</p>`,
    plainBody:`Dobrý den,\n\nposílám zpětnou vazbu k práci ${seriesDisplayName()}.\n\n${scoreLeadPlain}${markdownToPlainText(studentText)}${originalPlain}\n\nS pozdravem\n${state.distribution.senderName||state.series.teacherName||''}`,
    score:meta.score_total??null,
    grade:meta.grade??null,
    approved:true
  };
}
function buildDistributionPayload(action='createDrafts'){syncDistributionFromFields();const check=validateDistribution();if(!check.ok)throw new Error(check.issues.join('\n'));return {schema:'ghrab-essay-feedback-v1',action,secret:state.distribution.sharedSecret,senderName:state.distribution.senderName||state.series.teacherName||'',series:{id:state.series.id,name:seriesDisplayName(),className:state.series.className,rubricVersion:RUBRIC_VERSION},items:check.items.map(buildDistributionItem)};}
function validAppsScriptUrl(){const url=String(state.distribution.appsScriptUrl||'').trim();return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:[?#].*)?$/i.test(url)?url:'';}
async function confirmDistributionAction(action,count,titleSuffix=''){if(action!=='send')return true;return uiConfirm(`Opravdu přímo odeslat ${count} schválených e-mailů${titleSuffix}? Doporučený první krok jsou Gmail koncepty.`,'Přímé odeslání');}
async function sendDistributionToAppsScript(action='createDrafts'){let payload;try{payload=buildDistributionPayload(action);}catch(e){toast(e.message||String(e),'err');return;}const url=validAppsScriptUrl();if(!url){toast('Vlož platnou adresu /exec nasazené Apps Script webové aplikace.','err');return;}if(!(await confirmDistributionAction(action,payload.items.length)))return;try{const res=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),redirect:'follow'});const data=await res.json().catch(()=>({}));if(!res.ok||data.ok===false)throw new Error(data.message||`HTTP ${res.status}`);for(const item of payload.items){const r=resultByCode(item.code);if(r)r.deliveryStatus=action==='send'?'sent':'draft-created';}renderBatchReviewDashboard();updateWorkflowDashboard();saveBatchProgress();toast(action==='send'?`Odesláno ${payload.items.length} e-mailů.`:`Vytvořeno ${payload.items.length} Gmail konceptů.`);}catch(e){toast('Přímé propojení nepotvrdilo výsledek. Nejdřív zkontroluj Gmail; požadavek už mohl proběhnout. Teprve potom případně použij kompatibilní režim v nové kartě.','err');console.error('Apps Script distribution failed',e);}}
async function submitDistributionViaForm(){syncDistributionFromFields();const action=state.distribution.mode==='send'?'send':'createDrafts';let payload;try{payload=buildDistributionPayload(action);}catch(e){toast(e.message||String(e),'err');return;}const url=validAppsScriptUrl();if(!url){toast('Vlož platnou adresu /exec nasazené Apps Script webové aplikace.','err');return;}if(!(await confirmDistributionAction(action,payload.items.length,' v kompatibilním režimu')))return;if(!(await uiConfirm('Po odeslání se otevře nová karta s odpovědí Apps Scriptu. Tento režim používej až po kontrole, že předchozí pokus nevytvořil koncepty nebo e-maily.','Kompatibilní distribuce')))return;const form=document.createElement('form');form.method='POST';form.action=url;form.target='_blank';form.enctype='application/x-www-form-urlencoded';form.style.display='none';const input=document.createElement('input');input.type='hidden';input.name='payload';input.value=JSON.stringify(payload);form.appendChild(input);document.body.appendChild(form);form.submit();form.remove();for(const item of payload.items){const r=resultByCode(item.code);if(r)r.deliveryStatus='submitted-unconfirmed';}renderBatchReviewDashboard();updateWorkflowDashboard();saveBatchProgress();toast(`Požadavek pro ${payload.items.length} zpráv byl otevřen v nové kartě. Výsledek ověř v nové kartě a v Gmailu.`,'warn');}
function downloadDistributionJson(){try{const payload=buildDistributionPayload(state.distribution.mode==='send'?'send':'createDrafts');downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),`${safeFileName(seriesDisplayName())}_distribuce.json`);}catch(e){toast(e.message||String(e),'err');}}
function downloadDistributionCsv(){const check=validateDistribution();if(!check.ok){toast(check.issues.join(' '),'err');return;}const rows=[['kod','jmeno','email','predmet','text_emailu','html_emailu','body','znamka','stav'],...check.items.map(r=>{const item=buildDistributionItem(r);return [item.code,item.name,item.email,item.subject,item.plainBody,item.htmlBody,item.score,item.grade,r.deliveryStatus||'not-ready'];})];const csv=rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\n');downloadBlob(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),`${safeFileName(seriesDisplayName())}_distribuce.csv`);}
function renderBatchReviewDashboard(){const box=$('batchReviewDashboard');if(!box)return;if(!batchResults.length){box.innerHTML='<div class="empty-workflow">Po vyhodnocení série se zde zobrazí validační stav, body, schválení a distribuce každé práce.</div>';return;}box.innerHTML=batchResults.map(r=>{ensureBatchResultShape(r);const ev=r.finalEvaluation;const meta=ev?evaluationMachineSummary(ev):extractResultMetadata(r.result).meta||{};const issues=r.validation?.issues||[];return `<article class="review-work-row ${r.approved?'approved':''}"><div><strong>${escapeHtml(r.displayName||r.identity||r.code)}</strong><span>${escapeHtml(r.email||'bez e-mailu')} · ${meta.score_total??'—'}/24 · známka ${meta.grade??'—'}</span></div><div class="review-statuses"><span class="status-chip ${r.validation?.ok?'ok':'warn'}">${r.validation?.ok?'validace OK':'kontrola'}</span><span class="status-chip ${r.deliveryStatus==='sent'||r.deliveryStatus==='draft-created'?'ok':r.deliveryStatus==='submitted-unconfirmed'?'warn':''}">${r.deliveryStatus==='sent'?'odesláno':r.deliveryStatus==='draft-created'?'koncept':r.deliveryStatus==='submitted-unconfirmed'?'předáno – ověř':'neodesláno'}</span></div><label class="review-approval"><input type="checkbox" data-approve-result="${escapeHtml(r.code)}" ${r.approved?'checked':''} ${(!r.validation?.ok||!isValidEmail(r.email))?'disabled':''}> Schváleno učitelem</label>${issues.length?`<div class="validation-list">${issues.map(x=>`<div>• ${escapeHtml(x)}</div>`).join('')}</div>`:''}</article>`;}).join('');document.querySelectorAll('[data-approve-result]').forEach(x=>x.onchange=()=>setResultApproval(x.dataset.approveResult,x.checked));}

/* 85-backend-adapter.js */
const BACKEND_CONTRACT_VERSION='1.0';
function backendHeaders(){const h={'Content-Type':'application/json','X-Client':`essay-evaluator/${APP_VERSION}`,'X-Contract-Version':BACKEND_CONTRACT_VERSION};const token=String(state.backend?.accessToken||'').trim();if(token)h.Authorization=`Bearer ${token}`;return h;}
function backendBase(){return String(state.backend?.baseUrl||'').trim().replace(/\/+$/,'');}
function syncBackendFromFields(){ensureWorkflowState();state.backend.mode=$('backendMode')?.value||'browser';state.backend.baseUrl=$('backendBaseUrl')?.value.trim()||'';state.backend.accessToken=$('backendAccessToken')?.value||'';}
function syncBackendToFields(){ensureWorkflowState();if($('backendMode'))$('backendMode').value=state.backend.mode||'browser';if($('backendBaseUrl'))$('backendBaseUrl').value=state.backend.baseUrl||'';if($('backendAccessToken'))$('backendAccessToken').value=state.backend.accessToken||'';renderBackendStatus();}
function renderBackendStatus(){const el=$('backendStatus');if(!el)return;const h=state.backend?.lastHealth;if(state.backend?.mode!=='server'){el.textContent='Aktivní je lokální provoz v prohlížeči.';el.className='status-note';return;}if(!h){el.textContent='Serverový režim je připraven, spojení zatím nebylo ověřeno.';el.className='status-note warn';return;}el.textContent=h.ok?`Server dostupný · kontrakt ${h.contractVersion||'—'} · ${new Date(h.checkedAt).toLocaleTimeString('cs-CZ')}`:`Server nedostupný · ${h.message||'chyba'}`;el.className='status-note '+(h.ok?'ok':'err');}
async function backendRequest(path,options={}){syncBackendFromFields();const base=backendBase();if(!/^https:\/\//i.test(base))throw new Error('Backend musí používat adresu HTTPS.');const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),options.timeout||20000);try{const res=await fetch(base+path,{method:options.method||'GET',headers:backendHeaders(),body:options.body?JSON.stringify(options.body):undefined,signal:options.signal||controller.signal});const text=await res.text();let data={};try{data=text?JSON.parse(text):{};}catch(_){data={message:text};}if(!res.ok)throw new Error(data.message||`Server HTTP ${res.status}`);return data;}finally{clearTimeout(timer);}}
async function checkBackendHealth(){syncBackendFromFields();if(state.backend.mode!=='server'){toast('Nejdřív přepni provozní režim na školní server.','warn');return;}const btn=$('backendHealthBtn');if(btn){btn.disabled=true;btn.textContent='Ověřuji…';}try{const data=await backendRequest('/health',{timeout:12000});state.backend.lastHealth={ok:true,contractVersion:data.contractVersion||data.contract_version||'',checkedAt:new Date().toISOString(),message:data.message||''};toast('Spojení se školním backendem je v pořádku.');}catch(e){state.backend.lastHealth={ok:false,checkedAt:new Date().toISOString(),message:e.message||String(e)};toast('Backend se nepodařilo ověřit: '+(e.message||e),'err');}finally{if(btn){btn.disabled=false;btn.textContent='Ověřit spojení';}renderBackendStatus();saveState();}}
function buildBackendSeriesPayload(){ensureWorkflowState();return {contractVersion:BACKEND_CONTRACT_VERSION,series:{...state.series,rubricVersion:RUBRIC_VERSION,task:{set:state.set,genre:state.genre,title:state.taskTitle,text:state.taskText,requirements:String(state.taskReqs||'').split(/\n+/).filter(Boolean)}},processing:{mode:state.processingMode,model:resolveGeminiModel(),evaluationMode:state.evalMode},works:batchReadyStudents().map(s=>({code:s.code,text:s.text,sourceType:(s.files||[]).length?'attachment':'text',legibilityPercent:s.legibilityPercent??null,transcriptConfirmed:Boolean(s.transcriptConfirmed)}))};}
async function submitSeriesToBackend(){const payload=buildBackendSeriesPayload();if(payload.works.length>SERIES_MAX_WORKS)throw new Error(`Maximum série je ${SERIES_MAX_WORKS} prací.`);const data=await backendRequest('/v1/evaluation-series',{method:'POST',body:payload,timeout:30000});state.backend.job={id:data.jobId||data.id,status:data.status||'queued',submittedAt:new Date().toISOString()};saveState();return data;}
async function getBackendSeriesStatus(jobId=state.backend?.job?.id){if(!jobId)throw new Error('Chybí identifikátor serverové úlohy.');const data=await backendRequest(`/v1/evaluation-series/${encodeURIComponent(jobId)}`,{timeout:20000});state.backend.job={...state.backend.job,...data,id:jobId,checkedAt:new Date().toISOString()};saveState();return data;}

/* 95-workflow-ui.js */
function buildStateForStorage(){const data={...state,result:state.result||''};if(!sensitiveSaveEnabled()){for(const k of SENSITIVE_STATE_FIELDS)data[k]=k==='roster'?[]:'';if(data.distribution)data.distribution={...data.distribution,sharedSecret:''};if(data.backend)data.backend={...data.backend,accessToken:''};if(data.reportSettings)data.reportSettings={...data.reportSettings,signature:'',customComments:[]};}return data;}
function saveState(){syncStateFromFields(false);ensureWorkflowState();safeLocalSet(STORAGE_KEY,JSON.stringify(buildStateForStorage()));}
function loadState(){try{let raw=safeLocalGet(STORAGE_KEY);if(!raw)raw=safeLocalGet('maturitniHodnotitelStateV100');if(!raw)return false;const data=JSON.parse(raw);if(!sensitiveSaveEnabled()){for(const k of SENSITIVE_STATE_FIELDS)data[k]=k==='roster'?[]:'';if(data.distribution)data.distribution.sharedSecret='';if(data.backend)data.backend.accessToken='';if(data.reportSettings)data.reportSettings={...data.reportSettings,signature:'',customComments:[]};}Object.assign(state,data);ensureWorkflowState();return true;}catch(_){return false;}}
function batchFileMetadata(file){return {name:file?.name||'',originalName:file?.originalName||'',mime:file?.mime||file?.type||'',size:Number(file?.size)||0,originalSize:Number(file?.originalSize)||0,wasDownscaled:Boolean(file?.wasDownscaled)};}
function buildBatchProgressSnapshot(){return {version:APP_VERSION,savedAt:new Date().toISOString(),state:{set:state.set,genre:state.genre,taskIndex:state.taskIndex,taskTitle:state.taskTitle,taskText:state.taskText,taskReqs:state.taskReqs,inputMode:state.inputMode,evalMode:state.evalMode,outputStyle:state.outputStyle,resultView:state.resultView,workMode:state.workMode,series:state.series,roster:state.roster,processingMode:state.processingMode,queueRpm:state.queueRpm,batchJob:state.batchJob,usage:state.usage,distribution:sensitiveSaveEnabled()?state.distribution:{...state.distribution,sharedSecret:''},backend:sensitiveSaveEnabled()?state.backend:{...state.backend,accessToken:''}},batchStudents:batchStudents.map(s=>{const files=(s.files||[]).map(batchFileMetadata);return {...s,files:[],sourceFiles:Array.from(new Set([...(s.sourceFiles||[]),...files.map(f=>f.originalName||f.name).filter(Boolean)])),attachmentRestoreRequired:files.length>0};}),batchResults:batchResults.map(r=>({...r}))};}
function tryRestoreBatchProgress(){try{const raw=safeSessionGet(BATCH_PROGRESS_SESSION_SK)||(sensitiveSaveEnabled()?safeLocalGet(BATCH_PROGRESS_LOCAL_SK):null);if(!raw)return false;const data=JSON.parse(raw);if(data.state&&typeof data.state==='object')Object.assign(state,data.state,{inputMode:'batch'});batchStudents=Array.isArray(data.batchStudents)?data.batchStudents.map(ensureBatchStudentShape):[];batchResults=Array.isArray(data.batchResults)?data.batchResults.map(ensureBatchResultShape):[];ensureWorkflowState();if(batchStudents.some(s=>s.attachmentRestoreRequired))setTimeout(()=>toast('Obnoven byl textový průběh dávky. Obrazové a PDF přílohy se z bezpečnostních a kapacitních důvodů neukládají; před pokračováním je znovu přilož.','warn'),200);return batchStudents.length>0||batchResults.length>0;}catch(_){return false;}}
function renderProgress(){const labels=['Série a zadání','Přesné zadání','Skupina a práce','Hodnocení','Kontrola a rozeslání'];$('progressBar').innerHTML=labels.map((_,i)=>`<button type="button" class="progress-seg ${i<state.step?'done':i===state.step?'active':''}" data-go-step="${i}" aria-label="Krok ${i+1}: ${escapeHtml(labels[i])}" ${i>state.step?'disabled':''}></button>`).join('');$('progLabels').innerHTML=labels.map((x,i)=>`<button type="button" class="prog-label ${i<state.step?'done':i===state.step?'active':''}" data-go-step="${i}" ${i>state.step?'disabled':''}>${escapeHtml(x)}</button>`).join('');document.querySelectorAll('[data-go-step]').forEach(el=>el.onclick=()=>{const n=Number(el.dataset.goStep);if(n<=state.step)goTo(n);});}
function renderWorkMode(){renderWorkModeLegacy();const isBatch=state.inputMode==='batch';if($('runBtn')&&state.workMode==='api')$('runBtn').textContent=isBatch?(state.processingMode==='batch'?'☁ Odeslat úspornou Batch API úlohu':'⚡ Spustit hodnocení celé skupiny'):'⚡ Vyhodnotit sloh a ověřit výsledek';updateWorkflowDashboard();}
function renderProcessingMode(){document.querySelectorAll('[data-processing-mode]').forEach(el=>el.classList.toggle('active',el.dataset.processingMode===state.processingMode));const note=$('processingModeNote');if(note)note.textContent=state.processingMode==='batch'?'Asynchronní úloha: prohlížeč můžeš zavřít, později načteš stav. Výsledky nejsou okamžité.':'Řízená fronta: výsledky přibývají postupně; okno nech během hodnocení otevřené.';renderWorkMode();}
function processingStatusLabel(s){return ({'čeká':'čeká','hodnotím':'hodnotím','hotovo':'hotovo','kontrola':'vyžaduje kontrolu','chyba':'chyba','přepisuji':'přepisuji'})[s]||s||'čeká';}
function renderBatchList(){const box=$('batchList');if(!box)return;ensureWorkflowState();if(!batchStudents.length){box.innerHTML='<div class="empty-workflow">Zatím není přidaná žádná práce. Nahraj ZIP, více souborů nebo přidej prázdného studenta.</div>';updateWorkflowDashboard();return;}box.innerHTML=batchStudents.map((raw,i)=>{const s=ensureBatchStudentShape(raw,i);const result=batchResultByCode(s.code);const hasInput=String(s.text||'').trim()||(s.files||[]).length;const needs=requiresTranscriptReview(s);const wc=s.text?localWordCountReport(s.text,state.taskText||'',state.taskTitle||currentTask().title||'',state.genre||''):null;const statusClass=s.status==='hotovo'?'ok':s.status==='chyba'?'err':s.status==='hodnotím'?'run':s.status==='kontrola'?'warn':'';const rosterOptions=['<option value="">— nepřiřazeno —</option>',...(state.roster||[]).map(p=>`<option value="${escapeHtml(p.id)}" ${p.id===s.rosterId?'selected':''}>${escapeHtml(p.name||p.email||p.code)}</option>`)].join('');const files=(s.sourceFiles?.length?s.sourceFiles:(s.files||[]).map(f=>f.originalName||f.name)).filter(Boolean);const issues=result?.validation?.issues||s.validation?.issues||[];return `<article class="work-card ${s.approved?'approved':''}" data-batch-index="${i}"><header class="work-card-head"><div class="work-code"><span>${escapeHtml(s.code)}</span><strong>${escapeHtml(s.displayName||s.identity||'Nepřiřazená práce')}</strong><small>${escapeHtml(files.join(' · ')||s.sourceName||'ruční vstup')}</small></div><div class="work-status-stack"><span class="status-chip ${statusClass}">${escapeHtml(processingStatusLabel(s.status))}</span><span class="status-chip ${s.pairingStatus==='paired'?'ok':'warn'}">${s.pairingStatus==='paired'?'spárováno':'bez párování'}</span><span class="status-chip ${needs?'warn':'ok'}">${needs?'přepis čeká':'vstup potvrzen'}</span></div></header><div class="work-card-grid"><label><span>Student ze skupiny</span><select data-roster-pair="${i}">${rosterOptions}</select></label><label><span>Jméno pro e-mail</span><input type="text" data-student-name="${i}" value="${escapeHtml(s.displayName||s.identity||'')}"></label><label><span>Školní e-mail</span><input type="email" data-student-email="${i}" value="${escapeHtml(s.email||'')}" placeholder="student@ghrabuvka.cz"></label><div class="work-metric"><strong>${wc?wc.finalCount:'—'}</strong><span>finálních slov</span></div></div><details class="transcript-work" ${needs?'open':''}><summary>Digitální text a kontrola přepisu <span>${s.files.length} příloh · ${s.legibilityPercent!=null?s.legibilityPercent+' % čitelnost':'čitelnost —'}</span></summary><textarea data-batch-text="${i}" rows="10" placeholder="Digitální přepis práce">${escapeHtml(s.text||'')}</textarea>${s.uncertainFragments?.length?`<div class="uncertain-box"><strong>Nejistá místa:</strong> ${s.uncertainFragments.map(escapeHtml).join(' · ')}</div>`:''}<div class="split-actions">${s.files.length?`<button class="btn-mini" type="button" data-transcribe="${i}">Přepsat přes Gemini</button>`:''}<button class="btn-mini ${s.transcriptConfirmed?'active':''}" type="button" data-confirm-transcript="${i}">${s.transcriptConfirmed?'Přepis potvrzen ✓':'Potvrdit přepis učitelem'}</button><button class="btn-mini" type="button" data-invalidate-transcript="${i}">Znovu otevřít kontrolu</button></div></details>${issues.length?`<div class="validation-list"><strong>Validační brána:</strong>${issues.map(x=>`<div>• ${escapeHtml(x)}</div>`).join('')}</div>`:''}<footer class="work-card-actions"><div><span>${hasInput?'Vstup připraven':'Chybí text nebo příloha'}</span>${result?.usage?.totalTokens?`<small>${result.usage.totalTokens.toLocaleString('cs-CZ')} tokenů · ${formatUsd(result.usage.costUsd)}</small>`:''}</div><div class="split-actions"><button class="btn-mini" data-batch-edit="${i}" type="button">Otevřít text</button><button class="btn-mini danger" data-batch-remove="${i}" type="button">Odebrat</button></div></footer></article>`;}).join('');document.querySelectorAll('[data-roster-pair]').forEach(el=>el.onchange=()=>setStudentRosterPair(Number(el.dataset.rosterPair),el.value));document.querySelectorAll('[data-student-name]').forEach(el=>el.oninput=()=>{const student=batchStudents[Number(el.dataset.studentName)];student.displayName=el.value;student.identity=el.value;syncStudentContactToResult(student);updateWorkflowDashboard();scheduleBatchProgressSave();});document.querySelectorAll('[data-student-email]').forEach(el=>el.oninput=()=>{const student=batchStudents[Number(el.dataset.studentEmail)];student.email=el.value.trim();student.pairingStatus=student.email?'paired':'unpaired';syncStudentContactToResult(student);updateWorkflowDashboard();scheduleBatchProgressSave();});document.querySelectorAll('[data-batch-text]').forEach(el=>el.oninput=()=>{const s=batchStudents[Number(el.dataset.batchText)];s.text=el.value;s.transcriptConfirmed=(s.files||[]).length?false:Boolean(s.text.trim());s.transcriptStatus=(s.files||[]).length?'needs-review':'ready';s.approved=false;state.privacyApprovedHash='';updateWorkflowDashboard();scheduleBatchProgressSave();});document.querySelectorAll('[data-transcribe]').forEach(el=>el.onclick=()=>transcribeBatchStudent(Number(el.dataset.transcribe)));document.querySelectorAll('[data-confirm-transcript]').forEach(el=>el.onclick=()=>confirmStudentTranscript(Number(el.dataset.confirmTranscript)));document.querySelectorAll('[data-invalidate-transcript]').forEach(el=>el.onclick=()=>invalidateStudentTranscript(Number(el.dataset.invalidateTranscript)));document.querySelectorAll('[data-batch-edit]').forEach(el=>el.onclick=()=>document.querySelector(`[data-batch-text="${el.dataset.batchEdit}"]`)?.focus());document.querySelectorAll('[data-batch-remove]').forEach(el=>el.onclick=async()=>{const i=Number(el.dataset.batchRemove);const s=batchStudents[i];if(!(await uiConfirm(`Odebrat ${s?.displayName||s?.code||'práci'} ze série?`,'Odebrat práci')))return;batchResults=batchResults.filter(r=>r.code!==s.code);batchStudents.splice(i,1);renderBatchList();renderBatchReviewDashboard();updateWorkflowDashboard();saveBatchProgress();});updateWorkflowDashboard();}
function updateWorkflowDashboard(){ensureWorkflowState();const ready=batchReadyStudents();const paired=ready.filter(s=>s.pairingStatus==='paired'&&s.email).length;const transcriptReady=ready.filter(s=>!requiresTranscriptReview(s)).length;const completed=batchResults.filter(r=>r.status==='hotovo'||r.status==='kontrola').length;const valid=batchResults.filter(r=>r.validation?.ok).length;const approved=batchResults.filter(r=>r.approved).length;const delivered=batchResults.filter(r=>['draft-created','sent'].includes(r.deliveryStatus)).length;const box=$('workflowDashboard');if(box)box.innerHTML=[['Práce v sérii',`${ready.length}/${SERIES_MAX_WORKS}`,''],['Spárováno',`${paired}/${ready.length||0}`,paired===ready.length&&ready.length?'ok':'warn'],['Přepisy potvrzeny',`${transcriptReady}/${ready.length||0}`,transcriptReady===ready.length&&ready.length?'ok':'warn'],['Vyhodnoceno',`${completed}/${ready.length||0}`,completed===ready.length&&ready.length?'ok':''],['Validace OK',`${valid}/${completed||0}`,valid===completed&&completed?'ok':'warn'],['Schváleno',`${approved}/${valid||0}`,approved===valid&&valid?'ok':''],['Gmail',`${delivered}/${approved||0}`,delivered===approved&&approved?'ok':'']].map(x=>`<div class="dashboard-stat ${x[2]}"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join('');const budget=estimateSeriesBudget();if($('seriesBudget'))$('seriesBudget').innerHTML=`<strong>${formatUsd(budget.costUsd)}</strong><span>${budget.count} prací · odhad ${state.processingMode==='batch'?'Batch':'standard'}</span>`;const day=getTodayUsage();if($('todayUsage'))$('todayUsage').innerHTML=`<strong>${formatUsd(day.costUsd)}</strong><span>${day.requests} požadavků · dnes</span>`;renderBatchJobPanel();}
function renderBatchJobPanel(){const p=$('batchJobPanel');if(!p)return;const job=state.batchJob||state.series?.batchJob;p.classList.toggle('hidden',!job);if(job&&$('batchJobState'))$('batchJobState').textContent=`${job.state||'JOB_STATE_PENDING'} · ${job.codes?.length||0} prací · ${job.lastCheckedAt?new Date(job.lastCheckedAt).toLocaleString('cs-CZ'):'čeká na první kontrolu'}`;}
function initSeriesWorkflow(){ensureWorkflowState();syncSeriesToFields();syncDistributionToFields();syncBackendToFields();renderRosterTable();renderProcessingMode();renderBatchList();renderBatchReviewDashboard();updateWorkflowDashboard();for(const id of ['seriesName','seriesClass','seriesDate','seriesTeacher','queueRpm'])$(id)?.addEventListener('input',()=>{syncSeriesFromFields();updateWorkflowDashboard();saveState();});document.querySelectorAll('[data-processing-mode]').forEach(el=>el.onclick=()=>{state.processingMode=el.dataset.processingMode;state.series.processingMode=state.processingMode;renderProcessingMode();saveState();});$('rosterInput')?.addEventListener('input',renderRosterInputPreview);renderRosterInputPreview();$('importRosterBtn')?.addEventListener('click',importRosterFromText);$('clearRosterBtn')?.addEventListener('click',clearRoster);$('pickZipBtn')?.addEventListener('click',()=>$('zipInput')?.click());$('zipInput')?.addEventListener('change',handleZipImport);$('exportPairingBtn')?.addEventListener('click',exportPairingCsv);$('checkBatchJobBtn')?.addEventListener('click',checkGeminiBatchJob);$('approveAllValidBtn')?.addEventListener('click',approveAllValidResults);$('createDraftsBtn')?.addEventListener('click',()=>sendDistributionToAppsScript('createDrafts'));$('sendApprovedBtn')?.addEventListener('click',()=>sendDistributionToAppsScript('send'));$('openAppsScriptBridgeBtn')?.addEventListener('click',submitDistributionViaForm);$('downloadDistributionJsonBtn')?.addEventListener('click',downloadDistributionJson);$('downloadDistributionCsvBtn')?.addEventListener('click',downloadDistributionCsv);for(const id of ['appsScriptUrl','appsScriptSecret','emailSubjectTemplate','emailSenderName','emailIncludeScore','emailIncludeOriginal'])$(id)?.addEventListener('input',syncDistributionFromFields);document.querySelectorAll('[name="deliveryMode"]').forEach(el=>el.addEventListener('change',syncDistributionFromFields));$('backendHealthBtn')?.addEventListener('click',checkBackendHealth);for(const id of ['backendMode','backendBaseUrl','backendAccessToken'])$(id)?.addEventListener('input',()=>{syncBackendFromFields();renderBackendStatus();saveState();});}

/* 99-bootstrap.js */
init();
initSeriesWorkflow();
initReportEnhancements();
renderBuildLabel();
registerAppServiceWorker();
document.documentElement.dataset.appReady='1';
window.__HODNOTITEL_READY__=true;
