import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('✅ API route called');

  const body = await request.json();
  const { ingredients, options, prompt } = body;

  console.log('🔸 Received pantry ingredients:', ingredients);
  console.log('🔸 User prompt:', prompt);
  console.log('🔸 Options:', options);

  if (!ingredients || (Array.isArray(ingredients) && ingredients.length === 0)) {
    return NextResponse.json({ message: 'Invalid pantry ingredients' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: 'OpenAI API key is not set' }, { status: 500 });
  }

  try {
    const pantryList = Array.isArray(ingredients) ? ingredients.join(', ') : ingredients;
    const mustHaves = options?.mustHaves?.join(', ') || 'none';
    const dietary = options?.dietary?.join(', ') || 'none';
const pantryText = Array.isArray(ingredients) ? ingredients.join(', ') : "none";

const systemMessage = `You are a helpful assistant that suggests recipes.

Pantry:
${pantryText}

User Request: ${prompt || "Make a recipe"}

Constraints:
- Must Include: ${options?.mustHaves?.join(', ') || 'none'}
- Dietary: ${options?.dietary?.join(', ') || 'none'}
- Serving Size: ${options?.servingSize || 'any'}
- Calories per Serving: ${options?.calories || 'no preference'}
- Cuisine Preference: ${options?.cuisine || 'any'}
- Uniqueness: ${options?.uniqueness || '3'}/5
- Sweetness/Spice Level: ${options?.spice || '3'}/5

✅ Your task:
- Suggest ONE recipe.
- You MUST ONLY use ingredients from the pantry.
- You MUST NOT add anything not listed, unless it's water, salt, or pepper.
- Respect all constraints. If something cannot be done, mention it.

Return format:
Recipe: [name]
Ingredients:
[list]
Instructions:
[step-by-step numbered list]
`;

    console.log('=== OpenAI API CALL ===');
    console.log('Model: gpt-4-turbo');
    console.log('=======================');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: systemMessage }
        ],
        max_tokens: 800
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', errorText);
      throw new Error(`OpenAI API responded with status ${response.status}`);
    }

    const data = await response.json();
    const recipeText = data.choices[0].message.content;

    console.log('✅ OpenAI API response:', recipeText);

    const recipeParts = recipeText.split('\n\n');
    const recipe = {
      name: recipeParts[0].replace('Recipe:', '').trim(),
      ingredients: recipeParts[1]
        .replace('Ingredients:\n', '')
        .split('\n')
        .map(line => line.trim()),
      steps: recipeParts[2]
        .replace('Instructions:\n', '')
        .split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim()),
    };

    console.log('✅ Sending recipe:', recipe);
    return NextResponse.json({ recipe });

  } catch (error) {
    console.error('❌ Error in API route:', error);
    return NextResponse.json({
      message: 'Error generating recipe suggestion',
      error: error.message,
    }, { status: 500 });
  }
}

