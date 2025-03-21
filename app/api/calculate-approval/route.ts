import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const NEBIUS_API_URL = "https://api.studio.nebius.com/v1";

// Ensure response has the required structure
function ensureValidResponse(response: any): any {
  const defaultResponse = {
    approvalChance: 50,
    factors: {
      positive: ["Application received and under review"],
      negative: ["Incomplete financial information"],
      recommendations: ["Provide complete financial details"],
      riskLevel: "medium"
    }
  };
  
  if (!response) return defaultResponse;
  
  // Make sure approvalChance is a valid number
  if (typeof response.approvalChance !== 'number' || isNaN(response.approvalChance)) {
    response.approvalChance = defaultResponse.approvalChance;
  }
  
  // Make sure factors exist
  if (!response.factors) {
    response.factors = defaultResponse.factors;
  } else {
    // Ensure all factor arrays exist
    if (!Array.isArray(response.factors.positive)) {
      response.factors.positive = defaultResponse.factors.positive;
    }
    if (!Array.isArray(response.factors.negative)) {
      response.factors.negative = defaultResponse.factors.negative;
    }
    if (!Array.isArray(response.factors.recommendations)) {
      response.factors.recommendations = defaultResponse.factors.recommendations;
    }
    
    // Ensure risk level is valid
    if (!['low', 'medium', 'high'].includes(response.factors.riskLevel)) {
      response.factors.riskLevel = defaultResponse.factors.riskLevel;
    }
  }
  
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const { personalInfo, financialInfo } = await request.json();

    if (!personalInfo || !financialInfo) {
      return NextResponse.json(
        { error: "Personal and financial information are required" },
        { status: 400 }
      );
    }

    if (!process.env.NEBIUS_API_KEY) {
      // If API key is missing, provide a mock response for development
      const mockApprovalChance = calculateMockApprovalChance(financialInfo);
      const mockResponse = {
        approvalChance: mockApprovalChance,
        factors: getMockFactors(mockApprovalChance, financialInfo),
      };
      return NextResponse.json(ensureValidResponse(mockResponse));
    }

    // Initialize OpenAI client with Nebius configuration
    const client = new OpenAI({
      baseURL: NEBIUS_API_URL,
      apiKey: process.env.NEBIUS_API_KEY,
    });

    // Format the financial information for the prompt
    const formattedFinancialInfo = financialInfo
      .map((item: any) => `${item.question}: ${item.answer || "-"}`)
      .join("\n");

    // Create a structured prompt for the AI
    const prompt = `
      You are an AI loan approval system for a bank. You need to analyze the following loan application and determine:
      1. The probability of loan approval (as a percentage)
      2. The key positive and negative factors affecting this decision
      3. Specific recommendations for the applicant
      
      Personal Information:
      Name: ${personalInfo.fullName}
      Aadhaar: ${personalInfo.aadhaarNumber}
      PAN: ${personalInfo.panNumber}
      DOB: ${personalInfo.dateOfBirth}
      Gender: ${personalInfo.gender}
      
      Financial Information:
      ${formattedFinancialInfo}
      
      Provide your analysis in JSON format with the following structure:
      {
        "approvalChance": number (0-100),
        "factors": {
          "positive": [string, string, ...],
          "negative": [string, string, ...]
        },
        "recommendations": [string, string, ...],
        "riskLevel": "low" | "medium" | "high"
      }
      
      Include at least 2 factors in each category and 2-3 specific, actionable recommendations.
      The response must be valid JSON only, with no additional text.
    `;

    // Call the API
    try {
      const completion = await client.chat.completions.create({
        model: "meta-llama/Llama-3.3-70B-Instruct",
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content: "You are a loan approval analysis system that outputs only valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0].message.content;
      let parsedResponse;
      
      try {
        parsedResponse = JSON.parse(content || "{}");
        return NextResponse.json(ensureValidResponse(parsedResponse));
      } catch (e) {
        console.error("Error parsing AI response as JSON:", e);
        // Fall back to mock response if parsing fails
        const mockApprovalChance = calculateMockApprovalChance(financialInfo);
        const mockResponse = {
          approvalChance: mockApprovalChance,
          factors: getMockFactors(mockApprovalChance, financialInfo),
        };
        return NextResponse.json(ensureValidResponse(mockResponse));
      }
      
    } catch (apiError) {
      console.error("Error calling Nebius API:", apiError);
      // Fall back to the mock calculation
      const mockApprovalChance = calculateMockApprovalChance(financialInfo);
      const mockResponse = {
        approvalChance: mockApprovalChance,
        factors: getMockFactors(mockApprovalChance, financialInfo),
      };
      return NextResponse.json(ensureValidResponse(mockResponse));
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      ensureValidResponse({
        approvalChance: 30,
        factors: {
          positive: ["Application received"],
          negative: ["Error processing application details"],
          recommendations: ["Please try again or contact support"],
          riskLevel: "high"
        }
      }),
      { status: 200 } // Return 200 even on error but with controlled content
    );
  }
}

// Fallback function for calculating a mock approval chance
function calculateMockApprovalChance(financialInfo: any[]): number {
  // Handle null or undefined input
  if (!financialInfo || !Array.isArray(financialInfo)) {
    return 50; // Default to neutral approval chance
  }
  
  // Extract annual income
  const incomeQuestion = financialInfo.find(item => 
    item?.question?.toLowerCase().includes("annual income"));
  let income = 0;
  
  if (incomeQuestion && incomeQuestion.answer) {
    // Extract numbers from the income string
    const incomeMatch = incomeQuestion.answer.match(/\d+/g);
    if (incomeMatch) {
      income = parseInt(incomeMatch.join(''), 10);
    }
  }
  
  // Extract employment status
  const employmentQuestion = financialInfo.find(item => 
    item?.question?.toLowerCase().includes("employment status"));
  const isEmployed = employmentQuestion && 
    employmentQuestion.answer && 
    employmentQuestion.answer.toLowerCase().includes("employ");
  
  // Extract existing loans
  const loansQuestion = financialInfo.find(item => 
    item?.question?.toLowerCase().includes("existing loans"));
  const hasExistingLoans = loansQuestion && 
    loansQuestion.answer && 
    !loansQuestion.answer.includes("-") &&
    !loansQuestion.answer.toLowerCase().includes("no");
  
  // Base score calculation
  let approvalChance = 50; // Start with a neutral score
  
  // Income factor (higher income increases chances)
  if (income > 0) {
    if (income >= 1000000) approvalChance += 25;
    else if (income >= 500000) approvalChance += 20;
    else if (income >= 300000) approvalChance += 15;
    else if (income >= 100000) approvalChance += 10;
    else approvalChance += 5;
  } else {
    approvalChance -= 10; // No income information is negative
  }
  
  // Employment status factor
  if (isEmployed) {
    approvalChance += 15;
  } else {
    approvalChance -= 10;
  }
  
  // Existing loans factor
  if (hasExistingLoans) {
    approvalChance -= 15;
  } else {
    approvalChance += 10;
  }
  
  // Ensure the result is between 0 and 100
  return Math.max(0, Math.min(100, approvalChance));
}

// Generate mock factors based on the approval chance
function getMockFactors(approvalChance: number, financialInfo: any[]): any {
  const factors = {
    positive: [] as string[],
    negative: [] as string[],
    recommendations: [] as string[],
    riskLevel: approvalChance > 70 ? "low" : approvalChance > 40 ? "medium" : "high"
  };
  
  // Extract income information
  const incomeQuestion = financialInfo.find(item => 
    item.question?.toLowerCase().includes("annual income"));
  const incomeAnswer = incomeQuestion?.answer || "";
  const hasIncomeInfo = incomeAnswer && incomeAnswer !== "-";
  
  // Extract employment information
  const employmentQuestion = financialInfo.find(item => 
    item.question?.toLowerCase().includes("employment status"));
  const employmentAnswer = employmentQuestion?.answer || "";
  const isEmployed = employmentAnswer.toLowerCase().includes("employ");
  
  // Extract loan purpose
  const purposeQuestion = financialInfo.find(item => 
    item.question?.toLowerCase().includes("purpose of this loan"));
  const hasPurpose = purposeQuestion?.answer && purposeQuestion.answer !== "-";
  
  // Extract existing loans information
  const loansQuestion = financialInfo.find(item => 
    item.question?.toLowerCase().includes("existing loans"));
  const hasExistingLoans = loansQuestion?.answer && 
    !loansQuestion.answer.includes("-") &&
    !loansQuestion.answer.toLowerCase().includes("no");
  
  // Add positive factors
  if (isEmployed) {
    factors.positive.push("Applicant is currently employed");
  }
  
  if (hasIncomeInfo) {
    factors.positive.push("Income information provided");
  } else {
    factors.negative.push("Income information incomplete");
  }
  
  if (hasPurpose) {
    factors.positive.push("Clear loan purpose specified");
  } else {
    factors.negative.push("Loan purpose not specified");
  }
  
  if (!hasExistingLoans) {
    factors.positive.push("No existing loan obligations");
  } else {
    factors.negative.push("Has existing loan obligations");
  }
  
  // Add additional negative factors if needed
  if (factors.negative.length < 2) {
    if (!factors.negative.includes("Income information incomplete")) {
      factors.negative.push("Income may be insufficient for desired loan amount");
    }
    if (!factors.negative.includes("Loan purpose not specified")) {
      factors.negative.push("Additional financial documentation required");
    }
  }
  
  // Add additional positive factors if needed
  if (factors.positive.length < 2) {
    if (!factors.positive.includes("Applicant is currently employed")) {
      factors.positive.push("Eligible for starter loan program");
    }
    if (!factors.positive.includes("Income information provided")) {
      factors.positive.push("Basic qualification criteria met");
    }
  }
  
  // Add recommendations (ensure at least 2)
  factors.recommendations.push("Complete all required financial information fields");
  factors.recommendations.push("Provide proof of income documentation");
  
  if (!isEmployed) {
    factors.recommendations.push("Consider applying with a co-applicant who is employed");
  }
  
  if (hasExistingLoans) {
    factors.recommendations.push("Consider reducing existing debt before applying");
  }
  
  // Final check to ensure every array has at least one item
  if (factors.positive.length === 0) {
    factors.positive.push("Application received and under review");
  }
  if (factors.negative.length === 0) {
    factors.negative.push("Incomplete application information");
  }
  if (factors.recommendations.length === 0) {
    factors.recommendations.push("Complete all required sections of the application");
  }
  
  return factors;
} 