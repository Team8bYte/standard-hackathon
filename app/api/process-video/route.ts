import { NextRequest, NextResponse } from "next/server"
import { writeFile, unlink, readFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import axios from 'axios'
import FormData from 'form-data'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'

const execAsync = promisify(exec);

// Define the questions that need to be answered
const FINANCIAL_QUESTIONS = [
  "What is your annual income?",
  "What is your current employment status?",
  "Do you have any existing debts or loans?",
  "What is the purpose of this loan?",
  "How much money are you requesting to borrow?",
  "What is your preferred loan repayment period?",
  "Do you have any assets to offer as collateral?",
  "What are your monthly expenses?"
];

// Initialize Nebius API configuration
const NEBIUS_API_URL = 'https://api.studio.nebius.com/v1/chat/completions';

// Enhanced logging function
function logError(context: string, error: any) {
  console.error(`[${context}] Error:`, {
    message: error.message,
    stack: error.stack,
    code: error.code,
    ...(axios.isAxiosError(error) && {
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    })
  });
}

// Check if Python and required tools are available
async function checkDependencies(): Promise<string[]> {
  const errors: string[] = [];
  
  try {
    console.log('Checking Python...');
    const { stdout: pythonVersion } = await execAsync('python3 --version');
    console.log('Python version:', pythonVersion.trim());
    
    console.log('Checking Whisper...');
    await execAsync('python3 -c "import whisper; print(f\'Whisper version: {whisper.__version__}\')"');
    
    console.log('Checking FFmpeg...');
    const { stdout: ffmpegVersion } = await execAsync('ffmpeg -version');
    console.log('FFmpeg version:', ffmpegVersion.split('\n')[0]);
  } catch (error: any) {
    logError('checkDependencies', error);
    errors.push(`Dependency check failed: ${error.message}`);
  }
  
  return errors;
}

// Convert WebM to MP4 using ffmpeg
async function convertWebmToMp4(inputPath: string): Promise<string> {
  try {
    const outputPath = inputPath.replace('.webm', '.mp4');
    console.log('Converting video:', {
      input: {
        path: inputPath,
        exists: existsSync(inputPath),
        size: existsSync(inputPath) ? (await readFile(inputPath)).length : 'N/A'
      }
    });
    
    const { stdout, stderr } = await execAsync(`ffmpeg -i "${inputPath}" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -y "${outputPath}"`);
    
    if (stderr) {
      console.log('FFmpeg stderr:', stderr);
    }
    
    if (!existsSync(outputPath)) {
      throw new Error('Conversion completed but output file not found');
    }
    
    const stats = {
      input: {
        size: (await readFile(inputPath)).length,
        exists: existsSync(inputPath)
      },
      output: {
        size: (await readFile(outputPath)).length,
        exists: existsSync(outputPath)
      }
    };
    
    console.log('Conversion stats:', stats);
    return outputPath;
  } catch (error: any) {
    logError('convertWebmToMp4', error);
    throw new Error(`Video conversion failed: ${error.message}`);
  }
}

// Transcribe video using local Whisper
async function transcribeVideo(videoPath: string): Promise<string> {
  try {
    console.log('Starting transcription process for:', videoPath);
    
    const mp4Path = videoPath.endsWith('.webm') ? await convertWebmToMp4(videoPath) : videoPath;
    console.log('Video prepared for transcription:', {
      originalPath: videoPath,
      mp4Path,
      exists: existsSync(mp4Path),
      size: existsSync(mp4Path) ? (await readFile(mp4Path)).length : 'N/A'
    });
    
    const scriptPath = join(process.cwd(), 'lib', 'whisper_transcribe.py');
    if (!existsSync(scriptPath)) {
      throw new Error(`Whisper script not found: ${scriptPath}`);
    }
    
    console.log('Running Whisper script...');
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" "${mp4Path}"`);
    
    if (stderr) {
      console.log('Whisper stderr:', stderr);
    }
    
    console.log('Raw Whisper output:', stdout);
    
    let result;
    try {
      result = JSON.parse(stdout.trim());
    } catch (error: any) {
      console.error('[transcribeVideo JSON parse] Error:', error);
      throw new Error(`Failed to parse Whisper output: ${error.message}\nRaw output: ${stdout}`);
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Transcription failed without error message');
    }
    
    console.log('Transcription metadata:', result.metadata);
    return result.text;
  } catch (error: any) {
    console.error('[transcribeVideo] Error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  } finally {
    // Cleanup converted file if it exists
    if (videoPath.endsWith('.webm')) {
      const mp4Path = videoPath.replace('.webm', '.mp4');
      if (existsSync(mp4Path)) {
        try {
          await unlink(mp4Path);
          console.log('Cleaned up converted video:', mp4Path);
        } catch (error: any) {
          console.error('[transcribeVideo cleanup] Error:', error);
        }
      }
    }
  }
}

// Process transcription with Llama LLM
async function processTranscriptionWithAI(transcription: string): Promise<any> {
  try {
    console.log('Processing transcription:', {
      length: transcription.length,
      wordCount: transcription.split(/\s+/).length
    });
    
    if (!process.env.NEBIUS_API_KEY) {
      throw new Error('NEBIUS_API_KEY environment variable is not set');
    }
    
    const systemPrompt = `You are a helpful AI assistant that analyzes financial interview transcriptions. 
    You will receive a transcription and extract answers to specific questions.
    Always respond in valid JSON format with the structure specified in the user's prompt.`;
    
    const userPrompt = `
      Analyze the following transcription of a video where someone answers financial questions.
      Questions asked:
      ${FINANCIAL_QUESTIONS.join('\n')}
      
      Transcription:
      ${transcription}
      
      Extract the relevant answer for each question if present. Format your response as a JSON object with this exact structure:
      {
        "answers": [
          {
            "question": "question text",
            "answer": "extracted answer",
            "confidence": number,
            "needsRerecording": boolean
          }
        ]
      }
      
      For each answer:
      1. Set "answer" to the extracted text or "Not provided" if missing
      2. Set "confidence" to a number 0-100 based on clarity and completeness
      3. Set "needsRerecording" to true if confidence < 70
      
      Ensure your response is valid JSON.`;

    console.log('Sending request to Nebius API...');
    const response = await axios.post(
      NEBIUS_API_URL,
      {
        model: "meta-llama/Llama-3.3-70B-Instruct",
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEBIUS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Nebius API response:', {
      status: response.status,
      hasData: !!response.data,
      hasChoices: !!response.data?.choices
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from Nebius API');
    }

    // Try to extract JSON from the response content
    const content = response.data.choices[0].message.content.trim();
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }

    const result = JSON.parse(jsonMatch[0]);
    
    if (!result.answers || !Array.isArray(result.answers)) {
      throw new Error('Invalid response format from AI');
    }
    
    return result;
  } catch (error: any) {
    logError('processTranscriptionWithAI', error);
    throw new Error(`AI processing failed: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  let videoPath: string | null = null;
  
  try {
    console.log('Starting video processing request');
    
    const dependencyErrors = await checkDependencies();
    if (dependencyErrors.length > 0) {
      return NextResponse.json(
        { error: `Missing dependencies: ${dependencyErrors.join(', ')}` },
        { status: 500 }
      );
    }
    
    const formData = await request.formData();
    const video = formData.get("video") as File;

    if (!video) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      );
    }

    console.log('Received video:', {
      name: video.name,
      type: video.type,
      size: video.size
    });

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (video.size > maxSize) {
      return NextResponse.json(
        { error: "Video file too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    const sessionId = uuidv4();
    const tmpDir = join(process.cwd(), "tmp");
    videoPath = join(tmpDir, `${sessionId}.webm`);

    if (!existsSync(tmpDir)) {
      console.log('Creating tmp directory:', tmpDir);
      await mkdir(tmpDir, { recursive: true });
    }

    console.log('Saving video to:', videoPath);
    const videoBuffer = Buffer.from(await video.arrayBuffer());
    await writeFile(videoPath, videoBuffer);

    console.log('Video saved successfully:', {
      path: videoPath,
      exists: existsSync(videoPath),
      size: (await readFile(videoPath)).length
    });

    try {
      const transcription = await transcribeVideo(videoPath);
      console.log('Transcription completed:', {
        length: transcription.length,
        words: transcription.split(/\s+/).length
      });

      const processedAnswers = await processTranscriptionWithAI(transcription);
      console.log('AI processing completed');

      return NextResponse.json({
        success: true,
        transcription,
        answers: processedAnswers.answers
      });
    } finally {
      if (videoPath && existsSync(videoPath)) {
        try {
          await unlink(videoPath);
          console.log('Cleaned up video file:', videoPath);
        } catch (error: any) {
          logError('cleanup', error);
        }
      }
    }
  } catch (error: any) {
    logError('POST handler', error);
    
    // Cleanup on error
    if (videoPath && existsSync(videoPath)) {
      try {
        await unlink(videoPath);
        console.log('Cleaned up video file on error:', videoPath);
      } catch (cleanupError: any) {
        logError('error cleanup', cleanupError);
      }
    }
    
    return NextResponse.json(
      { 
        error: error.message || "Internal server error",
        details: error.stack
      },
      { status: 500 }
    );
  }
} 