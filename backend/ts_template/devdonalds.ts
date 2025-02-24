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
  recipeName = recipeName.replace(/[^a-zA-Z ]/g, "");
  recipeName = recipeName.toLowerCase();
  let words = recipeName.trim().split(/\s+/g);
  words = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1,))
  recipeName = words.join(" ")
  return recipeName ? recipeName : null;
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
  res.send('')
});

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  // TODO: implement me
  res.status(500).send("not yet implemented!")

});

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
