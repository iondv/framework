
# Filter
# ==========

filter -> 
  expression {% id %}
  | expression __ expressionType __ expression {% d => { return {[d[2]]: [d[0], d[4]]} } %}
  | filter __ expressionType __ filter {% d => { return {[d[2]]: [d[0], d[4]]} } %}


# Expression
# ==========

expression -> 
  expressionBody {% id %}
  | "(" _ expressionBody _ ")" {% d => { return d[2] } %}

expressionBody -> expressionNode _ expressionType _ expressionNode {% d => { return {[d[2]]: [d[0], d[4]]} } %}

expressionNode -> 
  attribute {% id %}
  | String {% id %}
  | Number {% id %}

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

operationType -> 
  "AND" {% d => { return 'AND' } %}
  | "OR" {% d => { return 'OR' } %}
  | "NOT" {% d => { return 'NOT' } %}

mathType -> 
  "+" {% d => { return 'ADD' } %}
  | "-" {% d => { return 'SUB' } %}
  | "*" {% d => { return 'MUL' } %}
  | "/" {% d => { return 'DIV' } %}

attribute -> [$_a-zA-Z] [$_a-zA-Z0-9-]:* {% d => { return d[0] + d[1].join('')} %}

# Primitives
# ==========
 
# Numbers
 
Number -> _number {% function(d) {return parseFloat(d[0])} %}
 
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
 
String -> "\"" _string "\"" {% function(d) {return d[1]; } %}
 
_string ->
  null {% function() {return ""; } %}
  | _string _stringchar {% function(d) {return d[0] + d[1];} %}
 
_stringchar ->
  [^\\"] {% id %}
  | "\\" [^] {% function(d) {return JSON.parse("\"" + d[0] + d[1] + "\""); } %}
 
# Whitespace
_ -> null | _ [\s] {% function() {} %}
__ -> [\s] | __ [\s] {% function() {} %}