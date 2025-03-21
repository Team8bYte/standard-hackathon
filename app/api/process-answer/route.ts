import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const NEBIUS_API_URL = "https://api.studio.nebius.com/v1"

export async function POST(request: NextRequest) {
  try {
    const { question, answer, context, language = "english" } = await request.json()

    // For chat interface, answer is optional
    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      )
    }

    if (!process.env.NEBIUS_API_KEY) {
      return NextResponse.json(
        { error: "Nebius API key not configured" },
        { status: 500 }
      )
    }

    const client = new OpenAI({
      baseURL: NEBIUS_API_URL,
      apiKey: process.env.NEBIUS_API_KEY,
    });

    // Different system prompts based on whether this is feedback or chat
    const systemPrompt = answer 
      ? `You are an expert loan manager trainer evaluating responses from trainee loan managers.
         You should provide detailed, constructive feedback on their answers, highlighting both strengths and areas for improvement.
         Focus on accuracy, completeness, and alignment with best practices in loan management.
         Your feedback should be professional, encouraging, and specific to the loan management context.
         
         IMPORTANT: You MUST provide your feedback in the ${language} language.`
      : `You are an AI Loan Manager Assistant providing professional guidance about loans and banking processes.
         Your responses should be:
         1. Concise and structured in bullet points
         2. Strictly professional in tone
         3. Focused on accurate financial information
         4. Free of casual language or emojis
         5. Direct and clear
         
         IMPORTANT: You MUST provide your response in the ${language} language.`;

    const userPrompt = answer
      ? `Context: ${context}
         Question: ${question}
         Trainee's Answer: ${answer}

         Please provide feedback on this answer, considering:
         1. Accuracy and completeness
         2. Understanding of loan management principles
         3. Practical application
         4. Areas for improvement
         
         Format your response in a clear, constructive manner.
         REMEMBER: Your entire response MUST be in the ${language} language.`
      : `Context: ${context}
         Question: ${question}
         
         Provide a professional response that:
         1. Starts with a brief, direct answer
         2. Lists key points in bullet format
         3. Includes relevant requirements or conditions
         4. Concludes with next steps if applicable
         
         Keep the response concise and structured.
         REMEMBER: Your entire response MUST be in the ${language} language.`;

    try {
      const completion = await client.chat.completions.create({
        model: "meta-llama/Llama-3.3-70B-Instruct",
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      return NextResponse.json({
        success: true,
        response: completion.choices[0].message.content,
      });
    } catch (apiError) {
      console.error("Error calling Nebius API:", apiError);
      return NextResponse.json(
        {
          error: "Failed to get AI response",
          details: apiError instanceof Error ? apiError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 