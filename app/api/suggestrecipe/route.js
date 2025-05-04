import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('✅ API route called');

  const body = await request.json();
  const {
    ingredients,
    options = {},
    prompt = "Make a recipe",
  } = body;

  console.log('🔸 Received pantry ingredients:', ingredients);
  console.log('🔸 User prompt:', prompt);
  console.log('🔸 Options:', options);

  if (!ingredients || ingredients.length === 0) {
    return NextResponse.json({ message: 'Invalid pantry ingredients' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: 'OpenAI API key is not set' }, { status: 500 });
  }

  try {
    const pantryText = ingredients.join(', ');
    const mustHaves = options.mustHaveIngredients || 'none';
    const dietary = Array.isArray(options.dietary) ? options.dietary.join(', ') : 'none';

    const systemMessage = `You are a strict recipe-generating assistant.

Pantry:
${pantryText}

User Request: ${prompt}

Constraints:
- Must Include: ${mustHaves}
- Dietary: ${dietary}
- Serving Size: ${options.servingSize || 'any'}
- Calories per Serving: ${options.calories || 'no preference'}
- Cuisine Preference: ${options.cuisine || 'any'}
- Uniqueness: ${options.uniqueness || '3'}/5
- Sweetness/Spice Level: ${options.spice || '3'}/5

✅ Your task:
- Suggest ONE recipe.
- You MUST ONLY use ingredients from the pantry.
- You MUST NOT add anything not listed, unless it's water, salt, or pepper.
- Respect all constraints. If something cannot be done, say so.

❗ Return format (STRICT JSON only):

{
  "name": "Recipe name",
  "ingredients": ["1 cup rice", "2 carrots", "..."],
  "steps": ["Do this", "Do that", "..."],
  "ingredientsWithQuantities": [
    { "name": "Rice", "quantity": 1 },
    { "name": "Carrots", "quantity": 2 }
  ]
}

⚠️ The ingredientsWithQuantities array MUST match ingredient names from the pantry list exactly, and quantities MUST be numbers only.`;

    console.log('=== OpenAI API CALL ===');
    console.log('Prompt:\n', systemMessage);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [{ role: "system", content: systemMessage }],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', errorText);
      throw new Error(`OpenAI API responded with status ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices[0].message.content;

    let recipe;
    try {
      recipe = JSON.parse(raw);
    } catch (e) {
      console.error('❌ Failed to parse strict JSON:', raw);
      return NextResponse.json({
        message: 'OpenAI response was not valid JSON.',
        error: e.message,
      }, { status: 500 });
    }

    // Final validation (optional but smart)
    if (
      !recipe.name || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps) ||
      !Array.isArray(recipe.ingredientsWithQuantities)
    ) {
      return NextResponse.json({
        message: 'Invalid recipe format returned from OpenAI.',
      }, { status: 500 });
    }

    console.log('✅ Final recipe object:', recipe);
    return NextResponse.json({ recipe });

  } catch (error) {
    console.error('❌ Error in API route:', error);
    return NextResponse.json({
      message: 'Error generating recipe suggestion',
      error: error.message,
    }, { status: 500 });
  }
}
