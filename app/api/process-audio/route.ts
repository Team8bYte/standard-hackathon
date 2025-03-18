import { NextRequest, NextResponse } from "next/server"
import { spawn, type ChildProcess } from "child_process"
import { writeFile } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"

// Get the current working directory
const CWD = process.cwd()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as Blob

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      )
    }

    // Create a temporary file path
    const fileName = `${randomUUID()}.webm`
    const filePath = join(CWD, 'tmp', fileName)

    // Ensure tmp directory exists
    await new Promise<void>((resolve, reject) => {
      const mkdirProcess = spawn('mkdir', ['-p', join(CWD, 'tmp')])
      mkdirProcess.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`mkdir failed with code ${code}`))
      })
    })

    // Write the audio blob to a file
    const buffer = Buffer.from(await audioFile.arrayBuffer())
    await writeFile(filePath, buffer)

    // Call Python script for transcription
    const transcriptionProcess: ChildProcess = spawn('python3', [
      join(CWD, 'lib/whisper_transcribe.py'),
      filePath
    ])

    let outputData = ""
    let errorData = ""

    transcriptionProcess.stdout?.on('data', (data: Buffer) => {
      outputData += data.toString()
    })

    transcriptionProcess.stderr?.on('data', (data: Buffer) => {
      errorData += data.toString()
    })

    const exitCode = await new Promise<number>((resolve) => {
      transcriptionProcess.on('close', resolve)
    })

    // Clean up temporary file
    await new Promise<void>((resolve, reject) => {
      const rmProcess = spawn('rm', [filePath])
      rmProcess.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`rm failed with code ${code}`))
      })
    })

    if (exitCode !== 0) {
      console.error("Transcription error:", errorData)
      return NextResponse.json(
        { error: "Failed to transcribe audio" },
        { status: 500 }
      )
    }

    try {
      const result = JSON.parse(outputData)
      return NextResponse.json(result)
    } catch (error) {
      console.error("Error parsing transcription result:", error)
      return NextResponse.json(
        { error: "Failed to parse transcription result" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error processing audio:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 