@{%

const F=require('./../../../FunctionCodes');
const {Attr}=require('./../classes');
const moment = require('moment');

%}


# Filter
# ==========

filter ->
  filter __ expressionType __ expression {% d => { return {[F[d[2]]]: [d[0], d[4]]} } %}
  | notx __ filter {% d => { return {[F[d[0]]]: [d[2]]} } %}
  | sizeNode {% id %}
  | notNode {% id %}
  | expression {% id %}

# Expression
# ==========

expression ->
  expressionBody {% id %}
  | "(" _ filter _ ")" {% d => { return d[2] } %}

expressionBody ->
  expressionNode _ expressionType _ expressionNode {% d => { return {[F[d[2]]]: [d[0], d[4]]} } %}

expressionNode ->
  attribute {% d => { return new Attr(d[0]) } %}
  | string {% id %}
  | number {% id %}
  | date {% id %}
  | sizeNode {% id %}
  | notNode {% id %}

sizeNode ->
  sizex __ expressionNode {% d => { return {[F[d[0]]]: [d[2]]} } %}
  | "(" _ sizex __ expressionNode _ ")" {% d => { return {[F[d[2]]]: [d[4]]} } %}

notNode ->
  notx __ expressionNode {% d => { return {[F[d[0]]]: [d[2]]} } %}
  | "(" _ notx __ expressionNode _ ")" {% d => { return {[F[d[2]]]: [d[4]]} } %}

expressionType ->
  conditionType
  | operationType
  | mathType

# Expression parts
# ==========

conditionType ->
  "=" {% d => { return 'EQUAL' } %}
  | "!=" {% d => { return 'NOT_EQUAL' } %}
  | "<" {% d => { return 'LESS' } %}
  | ">" {% d => { return 'GREATER' } %}
  | "<=" {% d => { return 'LESS_OR_EQUAL' } %}
  | ">=" {% d => { return 'GREATER_OR_EQUAL' } %}
  | "<>" {% d => { return 'EMPTY' } %}
  | LIKE {% d => { return 'LIKE' } %}

operationType ->
  AND {% d => { return 'AND' } %}
  | OR {% d => { return 'OR' } %}

notx -> NOT {% d => { return 'NOT' } %}
sizex -> SIZE {% d => { return 'SIZE' } %}

mathType ->
  "+" {% d => { return 'ADD' } %}
  | "-" {% d => { return 'SUB' } %}
  | "*" {% d => { return 'MUL' } %}
  | "/" {% d => { return 'DIV' } %}


_subattribute -> "." _attribute {% d => { return d[1] } %}

_attribute ->
  [$_a-zA-Z] [$_a-zA-Z0-9-]:* {% d => { return d[0] + d[1].join('')} %}
  | "[" _string "]" {% d => { return d[1] } %}

attribute ->
  _attribute {% id %}
  | _attribute _subattribute:+ {% d => { return d[0] + '.' + d[1].join('.') } %}

# Keywords
# ==========

AND -> [Aa] [Nn] [Dd]
OR -> [Oo] [Rr]
NOT -> [Nn] [Oo] [Tt]
LIKE -> [Ll] [Ii] [Kk] [Ee]
SIZE -> [Ss] [Ii] [Zz] [Ee]

# Primitives
# ==========

# Numbers

number -> _number {% function(d) {return parseFloat(d[0])} %}

_posint ->
  [0-9] {% id %}
  | _posint [0-9] {% function(d) {return d[0] + d[1]} %}

_int ->
  "-" _posint {% function(d) {return d[0] + d[1]; }%}
  | _posint {% id %}

_float ->
  _int {% id %}
  | _int "." _posint {% function(d) {return d[0] + d[1] + d[2]; }%}

_number ->
  _float {% id %}
  | _float "e" _int {% function(d){return d[0] + d[1] + d[2]; } %}


#Strings

string -> "\"" _string "\"" {% function(d) {return d[1]; } %}

_string ->
  null {% function() {return ""; } %}
  | _string _stringchar {% function(d) {return d[0] + d[1];} %}

_stringchar ->
  [^\\"`] {% id %}
  | "\\" [^] {% function(d) {return JSON.parse("\"" + d[0] + d[1] + "\""); } %}

#Dates

date -> "`" isodate "`" {% function(d) {return moment(d[1]).toDate();} %}
isodate ->
  year "-" month "-" day {% function (d) {return d[0] + '-' + d[2] + '-' + d[4];} %}
  | year month day {% function (d) {return d[0] + '-' + d[1] + '-' + d[2];} %}
  | year "-" month "-" day "T" hour ":" minute ":" minute "Z" {% function (d) {return d[0] + '-' + d[2] + '-' + d[4] + 'T' + d[6] + ':' + d[8] + ':' + d[10] + 'Z';} %}
  | year month day "T" hour minute minute "Z" {% function (d) {return d[0] + '-' + d[1] + '-' + d[2] + 'T' + d[4] + ':' + d[5] + ':' + d[6] + 'Z';} %}
  | year "-" month "-" day "T" hour ":" minute ":" minute sign hour ":" minute {% function (d) {return d[0] + '-' + d[2] + '-' + d[4] + 'T' + d[6] + ':' + d[8] + ':' + d[10] + d[11] + d[12] + d[14];} %}
  | year month day "T" hour minute minute sign hour minute {% function (d) {return d[0] + '-' + d[1] + '-' + d[2] + 'T' + d[4] + ':' + d[5] + ':' + d[6] + d[7] + d[8] + d[9];} %}

year ->
  [0-9] [0-9] [0-9] [0-9] {% function (d) {return d[0] + d[1] + d[2] + d[3];} %}

month ->
  [1] [0-2] {% function (d) {return d[0] + d[1];} %}
  | [0] [1-9] {% function (d) {return d[0] + d[1];} %}

day ->
  [3] [01] {% function (d) {return d[0] + d[1];} %}
  | [0] [1-9] {% function (d) {return d[0] + d[1];} %}
  | [12] [0-9] {% function (d) {return d[0] + d[1];} %}

hour ->
  [2] [0-3] {% function (d) {return d[0] + d[1];} %}
  | [01] [0-9] {% function (d) {return d[0] + d[1];} %}

minute ->
  [0-5] [0-9] {% function (d) {return d[0] + d[1];} %}

sign -> [+-] {% id %}

# Whitespace
_ -> null | _ [\s] {% function() {} %}
__ -> [\s] | __ [\s] {% function() {} %}