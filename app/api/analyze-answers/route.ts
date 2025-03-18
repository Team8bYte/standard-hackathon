import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { answers, segmentTitle, loanEligibility } = await req.json();

    const NEBIUS_API_KEY = process.env.NEBIUS_API_KEY;
    const NEBIUS_FOLDER_ID = process.env.NEBIUS_FOLDER_ID;

    // Format answers for better readability
    const formattedAnswers = Object.entries(answers)
      .map(([key, value]) => `Answer: ${value}`)
      .join("\n");

    // Provide contextual guidance based on segment and eligibility
    let contextualGuidance = "";
    switch (segmentTitle) {
      case "Employment Status":
        contextualGuidance = loanEligibility.employmentType === 'salaried' 
          ? "For salaried employees, please keep your salary slips and employment letter ready."
          : "For self-employed individuals, please prepare your business financial statements and GST returns.";
        break;
      
      case "Loan Details":
        const maxTenure = loanEligibility.employmentType === 'salaried' ? 30 : 20;
        contextualGuidance = `Based on your employment type, the maximum loan tenure is ${maxTenure} years.`;
        break;
      
      case "Collateral Information":
        contextualGuidance = loanEligibility.hasCollateral
          ? "Having collateral may help you secure a better interest rate."
          : "Without collateral, we'll need to evaluate other factors more strictly.";
        break;
      
      case "Documentation":
        contextualGuidance = "Complete documentation helps expedite the loan approval process.";
        break;
      
      case "Income Assessment":
        contextualGuidance = loanEligibility.exceedsIncomeCap
          ? "Loan amounts exceeding 50% of income require additional review."
          : "Your requested loan amount is within standard income-based limits.";
        break;
      
      case "Monthly Income":
        contextualGuidance = "We'll evaluate your income against our minimum eligibility criteria.";
        break;
      
      default:
        contextualGuidance = "Please provide accurate information for loan evaluation.";
    }

    // Check if API credentials are available
    if (!NEBIUS_API_KEY) {
      console.warn("Nebius API credentials missing, using fallback response");
      return NextResponse.json({
        feedback: `Thank you for your responses regarding ${segmentTitle}.\n\n${contextualGuidance}\n\nOur loan manager will review your application and provide detailed feedback soon.`
      });
    }

    // Initialize OpenAI client with Nebius configuration
    const client = new OpenAI({
      baseURL: 'https://api.studio.nebius.com/v1/',
      apiKey: NEBIUS_API_KEY,
    });

    // Prepare the prompt for the API
    const prompt = `You are a knowledgeable loan manager reviewing a loan application. The applicant has provided the following responses for the "${segmentTitle}" section:\n\n${formattedAnswers}\n\n${contextualGuidance}\n\nPlease provide professional and helpful feedback that:\n1. Acknowledges their responses\n2. Explains any implications\n3. Suggests additional requirements if needed\n4. Provides clear next steps\n\nKeep the response concise but informative.`;

    try {
      const completion = await client.chat.completions.create({
        model: "meta-llama/Llama-3.3-70B-Instruct",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: "You are a professional loan manager providing feedback on loan applications."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      return NextResponse.json({ 
        feedback: completion.choices[0].message.content 
      });
    } catch (apiError) {
      console.error("Nebius API error:", apiError);
      return NextResponse.json({
        feedback: `Thank you for your responses regarding ${segmentTitle}.\n\n${contextualGuidance}\n\nWe are currently experiencing technical difficulties. Our loan manager will review your application and provide detailed feedback soon.`
      });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({
      feedback: "We apologize, but there was an error processing your request. Please try again later."
    }, { status: 500 });
  }
}
