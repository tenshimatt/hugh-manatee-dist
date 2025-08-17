#!/usr/bin/env node

const fs = require('fs');
require('dotenv').config();

const WORKER_URL = process.env.WORKER_URL || 'https://claude-voice-agent.your-account.workers.dev';

async function sendVoiceCommand(audioFile) {
    if (!fs.existsSync(audioFile)) {
        console.error('❌ Audio file not found:', audioFile);
        return;
    }

    const audioData = fs.readFileSync(audioFile);
    
    console.log('🎤 Sending voice command...');
    
    try {
        const response = await fetch(`${WORKER_URL}/voice`, {
            method: 'POST',
            body: audioData
        });
        
        if (response.ok) {
            const audioBuffer = await response.arrayBuffer();
            const outputFile = `response_${Date.now()}.mp3`;
            fs.writeFileSync(outputFile, Buffer.from(audioBuffer));
            console.log(`✅ Voice response saved to: ${outputFile}`);
            
            // Try to play (requires system audio player)
            const { exec } = require('child_process');
            exec(`afplay ${outputFile} 2>/dev/null || aplay ${outputFile} 2>/dev/null`, () => {});
            
        } else {
            console.error('❌ Error:', await response.text());
        }
    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

async function testHealth() {
    try {
        const response = await fetch(`${WORKER_URL}/health`);
        const result = await response.json();
        console.log('🏥 Health check:', result);
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
    }
}

// CLI handling
const args = process.argv.slice(2);

if (args[0] === 'health') {
    testHealth();
} else if (args[0] === 'voice' && args[1]) {
    sendVoiceCommand(args[1]);
} else {
    console.log(`
🎤 Claude Voice Client

Usage:
  node voice-client.js health              # Test if agent is working
  node voice-client.js voice audio.wav    # Send voice command

Example voice commands:
  "Deploy a hello world worker"
  "Create a KV store for sessions" 
  "List all my workers"
  "Show me analytics"
`);
}
