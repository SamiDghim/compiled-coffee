fs = require 'fs'
util = require 'util'
recast = require "recast"
squery = require "grasp-squery"
code = fs.readFileSync 'class.js', encoding: 'utf8'
dump = (obj) ->
	console.log util.inspect obj, showHidden: false, depth: null

types = recast.types
visit = types.visit
n = types.namedTypes
b = types.builders

ast = recast.parse code.toString()

# match a generated Coffee class
# search for `var Foo; Foo = (function() { ... return Foo })()'`
classes = squery.query "
	VariableDeclaration + ExpressionStatement! > assign[ left=Identifier ][
	right=( CallExpression[ callee=( FunctionExpression > BlockStatement >
	FunctionDeclaration ~ ReturnStatement > Identifier)])]", ast.program
#console.log ast.program

getPath = (ast, node) ->
	found = null
	obj = {}
	obj['visit' + node.type] = (path) ->
		if path.value is node
			found = path
			return false
		else
			@traverse path
	recast.visit ast, obj
	console.log obj
	found

query = (ast, selector) ->
	if Array.isArray ast
		ast_fixed = type: 'Program', body: ast
	else
		ast_fixed = ast
	ret = squery.query selector, ast_fixed
	ret.map (item) -> getPath ast, item

recast.visit ast, visitExpressionStatement: (path) ->
	@traverse path
	return if path.value not in classes
	node = path.value
	expression = node.expression
	class_name = expression.left.name

	# check if there's a declaration for this class
	var_declaration = query path.parentPath.value, "
		> VariableDeclaration > Declaration! > ##{class_name}",
	# check if theres a return for this class
	return_statement = query path.value, "
		> assign > CallExpression > FunctionExpression > BlockStatement
		> FunctionDeclaration ~ ReturnStatement > ##{class_name}"
	console.log var_declaration
	console.log return_statement

	return if not var_declaration.length or not return_statement.length
	console.log 'OK'
#	console.log var_declaration
#	console.log return_statement
#
#	# Catch an expression which encapsulates class's closure
#	return if expression.left?.type isnt 'Identifier' or
#		expression.type isnt 'AssignmentExpression' or
#		expression.right?.type isnt 'CallExpression'
#
#	class_name = expression.left.name
#
#	# check if in the same scope there is a variable declaration
#	return if not path.scope.path.value.body.some (node) ->
#		return no if node.type isnt 'VariableDeclaration'
#		return no if not node.declarations.some (node) ->
#			node.id.name is class_name
#		yes
#
#	console.log expression.right
#	console.log esquery(expression.right, 'CallExpression > FunctionExpression > BlockStatement[body')





#	console.log select(expression.right, """
#     :root > .type:val("CallExpression") ~ .callee > .type:val("FunctionExpression") ~ .body
#	""").nodes()
#	console.log select(node, '[type="FunctionExpression"] > [type="BlockStatement"]
# > [type="FunctionDeclaration"] ~ [type="ReturnStatement"]:has([argument="Identifier"])').nodes()

	# check for the return value
#	dump node

#	console.log util.inspect node, showHidden: false, depth: null
  # Calling this.traverse(path) first makes for a post-order traversal.
#  @traverse path
#  node = path.value
#  if node.async
#    node.async = false
#  else
#    return
#  awaitVisitor.visit path.get("body")
#  # Anonymous.
#  # No parameters.
#  # Body without await.
#  # Generator.
#  resultExpr = b.callExpression(b.memberExpression(@getRuntime(), b.identifier("async"), false), [b.callExpression(b.functionExpression(null, [], node.body, true, node.expression), [])]) # Immediately invoked.
#  if node.expression
#    node.body = resultExpr
#  else
#    node.body = b.blockStatement([b.returnStatement(resultExpr)])

#console.log recast.print(ast).code

#search = """
#var-decs
#assign
#func-exp
#func-dec
#"""
#search = """
#VariableDeclaration + ExpressionStatement! > assign[ left=Identifier ][ right=( CallExpression[ callee=( FunctionExpression > BlockStatement > FunctionDeclaration ~ ReturnStatement[ argument = Identifier ])])]
#"""
#
#replace = "class Identifier {
#	constructor()
#		{{ FunctionDeclaration BlockStatement }}
#}"
#
##out = grasp.search 'squery', search, code
#out = grasp.replace 'squery', search, replace, code

#console.log util.inspect out, showHidden: false, depth: null
#console.log out.toString()