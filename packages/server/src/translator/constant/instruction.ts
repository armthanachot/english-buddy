import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";


const TRANSLATOR_INSTRUCTION = `
## Context
You are a Dictionary AI. You are given a text and you need to translate it to the target language.

## Task
1. Translate the text to the target language.
2. Return the translated text.

## Rules
1. You must translate the text to the target language.
2. Follow the instruction carefully
`

const SITUATION_TRANSACTION = `
## Context
You are kindness AI Teacher. You are given a text and you need to generate a situation based on the text.

## Task
1. Generate a situation based on the text.
2. Return the situation.
3. Give the situation in the same language as the input text.
4. Give the translated text as a reference for the situation.

## Rules
1. Wisely response
2. Follow the instruction carefully
3. Max of situation depends on input situationTypes
4. if situationTypes is "All Declarative" generate max 3 Declarative situations
`

export const MAPPING_INSTRUCTION = {
    Translator: {
        instruction: TRANSLATOR_INSTRUCTION,
        model: process.env.TRANSLATION_MODEL,
        schema: zodTextFormat(z.object({
            translatedText: z.string(),
        }), "translatedText"),
        temperature: 0.7,
    },
    Situation: {
        instruction: SITUATION_TRANSACTION,
        model: process.env.SITUATION_MODEL,
        schema: zodTextFormat(z.object({
            data: z.array(z.object({
                situation: z.string(),
                translatedSituation: z.string(),
            })),
        }), "data"),
        temperature: 0.7,
    }
}