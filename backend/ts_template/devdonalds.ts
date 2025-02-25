import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: any = [];

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null => {
  recipeName = recipeName.replace(/[-_]/g," ");
  // remove any character other than a letter and a whitespace
  recipeName = recipeName.replace(/[^a-zA-Z ]/g, "");
  recipeName = recipeName.toLowerCase();
  let words = recipeName.trim().split(/\s+/g);
  // capitalise the first letters of each word
  words = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1,))
  recipeName = words.join(" ")
  // return recipeName if recipeName is not an empty string, else return null
  return recipeName === "" ? recipeName : null;
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  const entry : any = req.body;
  // check if name already exists
  const isNameExist = cookbook.some(e => e.name === entry.name);
  if (isNameExist) {
    return res.status(400).json('Entry already logged into the cookbook');
  }

  if (entry.type == 'recipe') {
    // check if requiredItems names are unique
    const itemNames = new Set();
    for (const item of entry.requiredItems) {
      if (itemNames.has(item.name)) {
        return res.status(400).json('Recipe requiredItems can only have one element per name.')
      }
      itemNames.add(item.name)
    } 
    cookbook.push(entry);
  } else if (entry.type == 'ingredient') {
    if (entry.cookTime < 0) {
      return res.status(400).json('cookTime is invalid');
    }
    cookbook.push(entry);
  } else {
    return res.status(400).json('Your entry type is cooked.')
  } 
  res.send({})
});

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  const recipeName = parse_handwriting(req.query.name);
  const recipe = cookbook.find(e => e.name === recipeName);
  if (!recipe || recipe.type !== 'recipe') {
    return res.status(400).json('Given recipe name is not a valid recipe.');
  } 
  try {
    const summary = findAllIngredients(recipe.name);
    res.status(200).send(summary)
  } catch (e) {
    res.status(400).send(e)
  }
});

const findAllIngredients = (name: string) => {
  const recipe = cookbook.find(e => e.name === name);
  // last-in first-out array to process each recipe
  const recipes = [[recipe, 1]];
  const ingredients = [];
  let cookTime = 0;  
  while (recipes.length > 0) {
    const processed = recipes.pop();
    // loop through each requiredItem in current recipe that is being processed
    for (const ri of processed[0].requiredItems) {
      const item = cookbook.find(e => e.name === ri.name);
      if (!item) {
        throw new Error('invalid item')
      }
      if (item.type === 'ingredient') {
        cookTime += item.cookTime * ri.quantity * processed[1];
        ingredients.push({
          name: ri.name,
          quantity: ri.quantity * processed[1],
        })
      } else if (item.type === 'recipe') {
        // push item to recipes array to process
        recipes.push([item, ri.quantity])
      }
    }
  }
  return {
    name,
    cookTime,
    requiredItems: ingredients
  }
}

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
