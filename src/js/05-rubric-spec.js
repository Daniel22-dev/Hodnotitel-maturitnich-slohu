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
