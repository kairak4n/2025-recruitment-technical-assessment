from dataclasses import dataclass
from typing import List, Dict, Union
from flask import Flask, request, jsonify
import re

# ==== Type Definitions, feel free to add or modify ===========================
@dataclass
class CookbookEntry:
	name: str

@dataclass
class RequiredItem():
	name: str
	quantity: int

@dataclass
class Recipe(CookbookEntry):
	required_items: List[RequiredItem]

@dataclass
class Ingredient(CookbookEntry):
	cook_time: int


# =============================================================================
# ==== HTTP Endpoint Stubs ====================================================
# =============================================================================
app = Flask(__name__)

# Store your recipes here!
cookbook = []

# Task 1 helper (don't touch)
@app.route("/parse", methods=['POST'])
def parse():
	data = request.get_json()
	recipe_name = data.get('input', '')
	parsed_name = parse_handwriting(recipe_name)
	if parsed_name is None:
		return 'Invalid recipe name', 400
	return jsonify({'msg': parsed_name}), 200

# [TASK 1] ====================================================================
# Takes in a recipeName and returns it in a form that 
def parse_handwriting(recipeName: str) -> Union[str | None]:
	recipeName = re.sub(r'[-_]', ' ', recipeName)
	recipeName = re.sub(r'[^a-zA-Z ]', "", recipeName)
	recipeName = recipeName.lower()
	recipeName = recipeName.strip()
	words = re.split('\s+', recipeName)
	words = list(map(lambda w: w.title(), words))
	recipeName = " ".join(words)
	return recipeName if recipeName else None

# [TASK 2] ====================================================================
# Endpoint that adds a CookbookEntry to your magical cookbook
@app.route('/entry', methods=['POST'])
def create_entry():
	entry = request.get_json()
	# check if name already exists
	isNameExist = any(e['name'] == entry['name'] for e in cookbook)
	if isNameExist:
		return 'Entry already logged into the cookbook', 400
	
	if entry['type'] == 'recipe':
		# check if requiredItems names are unique
		itemNames = set()
		for item in entry['requiredItems']:
			if item['name'] in itemNames:
				return 'Recipe requiredItems can only have one element per name', 400
			itemNames.add(item['name'])
		cookbook.append(entry)
	elif entry['type'] == 'ingredient':
		if entry['cookTime'] < 0:
			return 'cookTime is invalid', 400
		cookbook.append(entry)
	else:
		return 'Your entry type is cooked', 400
	return jsonify({}), 200


# [TASK 3] ====================================================================
# Endpoint that returns a summary of a recipe that corresponds to a query name
@app.route('/summary', methods=['GET'])
def summary():
	recipeName = parse_handwriting(request.args.get('name'))
	recipe = None
	for r in cookbook:
		if r['name'] == recipeName:
			recipe = r
	if not recipe or recipe['type'] != 'recipe':
		return 'Given recipe name is not a valid recipe', 400
	try:
		summary = findAllIngredients(recipe['name'])
		return summary, 200
	except ValueError:
		return 'invalid item', 400

def findAllIngredients(name: str):
	recipe = None
	for r in cookbook:
		if r['name'] == name:
			recipe = r
	recipes = [(recipe, 1)]
	ingredients = []
	cookTime = 0
	while len(recipes) > 0:
		removed = recipes.pop()
		for ri in removed[0]['requiredItems']:
			item = next((e for e in cookbook if e["name"] == ri["name"]), None)
			if not item:
				raise ValueError('invalid item')
			if item['type'] == 'ingredient':
				cookTime += item['cookTime'] * ri['quantity'] * removed[1]
				ingredients.append({
					'name': ri['name'],
					'quantity': ri['quantity'] * removed[1],
				})
			elif item['type'] == 'recipe':
				recipes.append([item, ri['quantity']])

	return {
		'name': name,
		'cookTime': cookTime,
		'requiredItems': ingredients,
	}

# =============================================================================
# ==== DO NOT TOUCH ===========================================================
# =============================================================================

if __name__ == '__main__':
	app.run(debug=True, port=8080)
