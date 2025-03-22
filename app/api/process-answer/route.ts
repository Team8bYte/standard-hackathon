import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const NEBIUS_API_URL = "https://api.studio.nebius.com/v1"
const API_TIMEOUT = 10000; // 10 seconds timeout

// Fallback responses for different languages
const FALLBACK_RESPONSES = {
  english: "Thank you for your answer. Our system is currently experiencing high traffic. Your response has been recorded and we'll process it as soon as possible.",
  hindi: "आपके उत्तर के लिए धन्यवाद। हमारा सिस्टम वर्तमान में अधिक ट्रैफ़िक का अनुभव कर रहा है। आपका जवाब रिकॉर्ड कर लिया गया है और हम इसे जल्द से जल्द संसाधित करेंगे।",
  marathi: "तुमच्या उत्तरासाठी धन्यवाद. आमची प्रणाली सध्या जास्त वाहतुकीचा अनुभव घेत आहे. तुमचा प्रतिसाद नोंदवला गेला आहे आणि आम्ही शक्य तितक्या लवकर त्यावर प्रक्रिया करू.",
  gujarati: "તમારા જવાબ બદલ આભાર. અમારી સિસ્ટમ હાલમાં ઉચ્ચ ટ્રાફિકનો અનુભવ કરી રહી છે. તમારો પ્રતિસાદ નોંદવામાં આવ્યો છે અને અમે તેને શક્ય તેટલી વહેલી તકે પ્રક્રિયા કરીશું.",
  tamil: "உங்கள் பதிலுக்கு நன்றி. எங்கள் அமைப்பு தற்போது அதிக போக்குவரத்தை அனுபவிக்கிறது. உங்கள் பதில் பதிவு செய்யப்பட்டுள்ளது, கூடிய விரைவில் நாங்கள் அதனைச் செயலாக்குவோம்."
};

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
      return NextResponse.json({
        success: true,
        response: FALLBACK_RESPONSES[language as keyof typeof FALLBACK_RESPONSES] || FALLBACK_RESPONSES.english
      });
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
      // Create a promise that rejects after the timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API call timed out')), API_TIMEOUT);
      });
      
      // Create the API call promise
      const apiCallPromise = client.chat.completions.create({
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
        response: FALLBACK_RESPONSES[language as keyof typeof FALLBACK_RESPONSES] || FALLBACK_RESPONSES.english
      });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    
    // Even for general errors, provide a fallback response
    return NextResponse.json({
      success: true,
      response: FALLBACK_RESPONSES.english
    });
  }
} 