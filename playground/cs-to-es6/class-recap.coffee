fs = require 'fs'
grasp = require 'grasp'
util = require 'util'
code = fs.readFileSync 'class.js', encoding: 'utf8'

search = """
var-decs
assign
func-exp
func-dec
"""
search = """
VariableDeclaration + ExpressionStatement! > assign[ left=Identifier ][ right=( CallExpression[ callee=( FunctionExpression > BlockStatement > FunctionDeclaration ~ ReturnStatement[ argument = Identifier ])])]
"""

replace = "class Identifier {
	constructor()
		{{ FunctionDeclaration BlockStatement }}
}"

#out = grasp.search 'squery', search, code
out = grasp.replace 'squery', search, replace, code

#console.log(util.inspect(out, {showHidden: false, depth: null}));
console.log out.toString()