// Generated automatically by nearley
// http://github.com/Hardmath123/nearley
(function () {
function id(x) {return x[0]; }


const F=require('./../../../FunctionCodes');
const {Attr}=require('./../classes');

var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "filter", "symbols": ["filter", "__", "expressionType", "__", "expression"], "postprocess": d => { return {[F[d[2]]]: [d[0], d[4]]} }},
    {"name": "filter", "symbols": ["notx", "__", "filter"], "postprocess": d => { return {[F[d[0]]]: [d[2]]} }},
    {"name": "filter", "symbols": ["expression"], "postprocess": id},
    {"name": "expression", "symbols": ["expressionBody"], "postprocess": id},
    {"name": "expression", "symbols": [{"literal":"("}, "_", "filter", "_", {"literal":")"}], "postprocess": d => { return d[2] }},
    {"name": "expressionBody", "symbols": ["expressionNode", "_", "expressionType", "_", "expressionNode"], "postprocess": d => { return {[F[d[2]]]: [d[0], d[4]]} }},
    {"name": "expressionNode", "symbols": ["attribute"], "postprocess": d => { return new Attr(d[0]) }},
    {"name": "expressionNode", "symbols": ["string"], "postprocess": id},
    {"name": "expressionNode", "symbols": ["number"], "postprocess": id},
    {"name": "expressionType", "symbols": ["conditionType"]},
    {"name": "expressionType", "symbols": ["operationType"]},
    {"name": "expressionType", "symbols": ["mathType"]},
    {"name": "conditionType", "symbols": [{"literal":"="}], "postprocess": d => { return 'EQUAL' }},
    {"name": "conditionType$string$1", "symbols": [{"literal":"!"}, {"literal":"="}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "conditionType", "symbols": ["conditionType$string$1"], "postprocess": d => { return 'NOT_EQUAL' }},
    {"name": "conditionType", "symbols": [{"literal":"<"}], "postprocess": d => { return 'LESS' }},
    {"name": "conditionType", "symbols": [{"literal":">"}], "postprocess": d => { return 'GREATER' }},
    {"name": "conditionType$string$2", "symbols": [{"literal":"<"}, {"literal":"="}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "conditionType", "symbols": ["conditionType$string$2"], "postprocess": d => { return 'LESS_OR_EQUAL' }},
    {"name": "conditionType$string$3", "symbols": [{"literal":">"}, {"literal":"="}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "conditionType", "symbols": ["conditionType$string$3"], "postprocess": d => { return 'GREATER_OR_EQUAL' }},
    {"name": "conditionType$string$4", "symbols": [{"literal":"<"}, {"literal":">"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "conditionType", "symbols": ["conditionType$string$4"], "postprocess": d => { return 'EMPTY' }},
    {"name": "operationType", "symbols": ["AND"], "postprocess": d => { return 'AND' }},
    {"name": "operationType", "symbols": ["OR"], "postprocess": d => { return 'OR' }},
    {"name": "notx", "symbols": ["NOT"], "postprocess": d => { return 'NOT' }},
    {"name": "mathType", "symbols": [{"literal":"+"}], "postprocess": d => { return 'ADD' }},
    {"name": "mathType", "symbols": [{"literal":"-"}], "postprocess": d => { return 'SUB' }},
    {"name": "mathType", "symbols": [{"literal":"*"}], "postprocess": d => { return 'MUL' }},
    {"name": "mathType", "symbols": [{"literal":"/"}], "postprocess": d => { return 'DIV' }},
    {"name": "attribute$ebnf$1", "symbols": []},
    {"name": "attribute$ebnf$1", "symbols": ["attribute$ebnf$1", /[$_a-zA-Z0-9-]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "attribute", "symbols": [/[$_a-zA-Z]/, "attribute$ebnf$1"], "postprocess": d => { return d[0] + d[1].join('')}},
    {"name": "attribute$ebnf$2", "symbols": []},
    {"name": "attribute$ebnf$2", "symbols": ["attribute$ebnf$2", {"literal":"`"}], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "attribute", "symbols": [{"literal":"`"}, "_string", "attribute$ebnf$2"], "postprocess": d => { return d[1] }},
    {"name": "AND", "symbols": [/[Aa]/, /[Nn]/, /[Dd]/]},
    {"name": "OR", "symbols": [/[Oo]/, /[Rr]/]},
    {"name": "NOT", "symbols": [/[Nn]/, /[Oo]/, /[Tt]/]},
    {"name": "number", "symbols": ["_number"], "postprocess": function(d) {return parseFloat(d[0])}},
    {"name": "_posint", "symbols": [/[0-9]/], "postprocess": id},
    {"name": "_posint", "symbols": ["_posint", /[0-9]/], "postprocess": function(d) {return d[0] + d[1]}},
    {"name": "_int", "symbols": [{"literal":"-"}, "_posint"], "postprocess": function(d) {return d[0] + d[1]; }},
    {"name": "_int", "symbols": ["_posint"], "postprocess": id},
    {"name": "_float", "symbols": ["_int"], "postprocess": id},
    {"name": "_float", "symbols": ["_int", {"literal":"."}, "_posint"], "postprocess": function(d) {return d[0] + d[1] + d[2]; }},
    {"name": "_number", "symbols": ["_float"], "postprocess": id},
    {"name": "_number", "symbols": ["_float", {"literal":"e"}, "_int"], "postprocess": function(d){return d[0] + d[1] + d[2]; }},
    {"name": "string", "symbols": [{"literal":"\""}, "_string", {"literal":"\""}], "postprocess": function(d) {return d[1]; }},
    {"name": "_string", "symbols": [], "postprocess": function() {return ""; }},
    {"name": "_string", "symbols": ["_string", "_stringchar"], "postprocess": function(d) {return d[0] + d[1];}},
    {"name": "_stringchar", "symbols": [/[^\\"`]/], "postprocess": id},
    {"name": "_stringchar", "symbols": [{"literal":"\\"}, /[^]/], "postprocess": function(d) {return JSON.parse("\"" + d[0] + d[1] + "\""); }},
    {"name": "_", "symbols": []},
    {"name": "_", "symbols": ["_", /[\s]/], "postprocess": function() {}},
    {"name": "__", "symbols": [/[\s]/]},
    {"name": "__", "symbols": ["__", /[\s]/], "postprocess": function() {}}
]
  , ParserStart: "filter"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
