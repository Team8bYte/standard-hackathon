import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const NEBIUS_API_URL = "https://api.studio.nebius.com/v1"
const API_TIMEOUT = 10000; // 10 seconds timeout

// Fallback response for when API is unavailable
const FALLBACK_RESPONSE = 
  "I understand that taking out a loan can be a significant emotional decision. " +
  "It's completely normal to have mixed feelings about it. While I'm currently unable to process your specific concerns " +
  "due to technical limitations, please know that your feelings are valid. " +
  "Consider talking to a financial advisor or trusted friend about your concerns. " +
  "They can provide personalized guidance based on your unique situation. " +
  "Remember, making informed financial decisions includes acknowledging your emotions throughout the process.";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Check if API key is available
    if (!process.env.NEBIUS_API_KEY) {
      console.warn("Nebius API key not available, using fallback response")
      return NextResponse.json({
        success: true,
        response: FALLBACK_RESPONSE
      });
    }

    const client = new OpenAI({
      baseURL: NEBIUS_API_URL,
      apiKey: process.env.NEBIUS_API_KEY,
    });

    const systemPrompt = 
      `You are an empathetic financial support assistant who helps users navigate the emotional aspects of taking loans.
      
      Guidelines:
      1. Be warm, supportive, and understanding of the emotional challenges of financial decisions
      2. Acknowledge and validate the user's feelings
      3. Provide emotional support first, then gentle practical guidance
      4. Use a conversational, friendly tone (but remain professional)
      5. When appropriate, offer perspective on how loans can be positive tools for achieving goals
      6. Never dismiss emotions as irrational - all feelings about money are valid
      7. Be encouraging without being unrealistic
      8. Focus on emotional well-being alongside financial well-being
      
      Remember that users are sharing vulnerable feelings about money and loans. Your role is to provide comfort and perspective.`;

    try {
      // Create a promise that rejects after the timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API call timed out')), API_TIMEOUT);
      });
      
      // Create the API call promise
      const apiCallPromise = client.chat.completions.create({
        model: "meta-llama/Llama-3.3-70B-Instruct",
        temperature: 0.7, // Slightly higher temperature for more empathetic responses
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
      });
      
      // Race the API call against the timeout
      const completion = await Promise.race([
        apiCallPromise,
        timeoutPromise
      ]) as any;

      return NextResponse.json({
        success: true,
        response: completion.choices[0].message.content,
      });
    } catch (apiError) {
      console.error("Error calling Nebius API:", apiError);
      
      // Return a graceful fallback response instead of an error
      return NextResponse.json({
        success: true,
        response: FALLBACK_RESPONSE
      });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    
    // Even for general errors, provide a fallback response
    return NextResponse.json({
      success: true,
      response: FALLBACK_RESPONSE
    });
  }
} 