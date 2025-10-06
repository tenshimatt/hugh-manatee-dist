/**
 * Aurora API Backend - Secure Claude API Proxy
 * Prevents API key exposure in mobile app
 */

// CORS headers for iOS app requests
const corsHeaders = {
	'Access-Control-Allow-Origin': '*', // Will restrict to app scheme in production
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
	async fetch(request, env, ctx) {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// Only allow POST requests
		if (request.method !== 'POST') {
			return new Response('Method not allowed', {
				status: 405,
				headers: corsHeaders
			});
		}

		const url = new URL(request.url);

		// Route: POST /ai/enhance
		if (url.pathname === '/ai/enhance') {
			return handleEnhanceStory(request, env);
		}

		// Route: POST /ai/questions
		if (url.pathname === '/ai/questions') {
			return handleGenerateQuestions(request, env);
		}

		// Route: POST /ai/extract
		if (url.pathname === '/ai/extract') {
			return handleExtractEntities(request, env);
		}

		// Route: POST /ai/prompts
		if (url.pathname === '/ai/prompts') {
			return handleGeneratePrompts(request, env);
		}

		// Route: POST /ai/detect-topic
		if (url.pathname === '/ai/detect-topic') {
			return handleDetectTopic(request, env);
		}

		// Route: POST /ai/speak (Hugh the Manatee TTS)
		if (url.pathname === '/ai/speak') {
			return handleTextToSpeech(request, env);
		}

		// Route: POST /ai/respond (Hugh's Conversational Responses)
		if (url.pathname === '/ai/respond') {
			return handleConversationResponse(request, env);
		}

		// Route: POST /ai/contextualize (Temporal Context Enhancement)
		if (url.pathname === '/ai/contextualize') {
			return handleTemporalContext(request, env);
		}

		return new Response('Not found', {
			status: 404,
			headers: corsHeaders
		});
	},
};

// AI Story Enhancement Endpoint
async function handleEnhanceStory(request, env) {
	try {
		const { transcription } = await request.json();

		if (!transcription || transcription.trim().length === 0) {
			return jsonResponse({ error: 'Transcription required' }, 400);
		}

		const prompt = buildEnhancePrompt(transcription);
		const response = await callClaude(prompt, env.CLAUDE_API_KEY);

		return jsonResponse({ enhanced: response });

	} catch (error) {
		console.error('[Enhance] Error:', error);
		return jsonResponse({ error: error.message }, 500);
	}
}

// AI Follow-up Questions Endpoint
async function handleGenerateQuestions(request, env) {
	try {
		const { transcription } = await request.json();

		if (!transcription || transcription.trim().length === 0) {
			return jsonResponse({ error: 'Transcription required' }, 400);
		}

		const prompt = buildQuestionsPrompt(transcription);
		const response = await callClaude(prompt, env.CLAUDE_API_KEY);

		// Parse numbered questions
		const questions = parseQuestions(response);
		return jsonResponse({ questions });

	} catch (error) {
		console.error('[Questions] Error:', error);
		return jsonResponse({ error: error.message }, 500);
	}
}

// AI Entity Extraction Endpoint
async function handleExtractEntities(request, env) {
	try {
		const { transcription } = await request.json();

		if (!transcription || transcription.trim().length === 0) {
			return jsonResponse({ error: 'Transcription required' }, 400);
		}

		const prompt = buildExtractPrompt(transcription);
		const response = await callClaude(prompt, env.CLAUDE_API_KEY);

		// Parse JSON response
		const entities = JSON.parse(response);
		return jsonResponse({ entities });

	} catch (error) {
		console.error('[Extract] Error:', error);
		return jsonResponse({ error: error.message }, 500);
	}
}

// AI Prompt Generation Endpoint
async function handleGeneratePrompts(request, env) {
	try {
		const { category } = await request.json();

		// Use provided category or pick random
		const categories = [
			'childhood', 'family', 'career', 'travel', 'relationships',
			'hobbies', 'achievements', 'challenges', 'celebrations', 'first times'
		];
		const selectedCategory = category || categories[Math.floor(Math.random() * categories.length)];

		const prompt = buildPromptsPrompt(selectedCategory);
		const response = await callClaude(prompt, env.CLAUDE_API_KEY);

		// Parse numbered prompts
		const prompts = parseQuestions(response); // Reuse question parser (same format)
		return jsonResponse({ prompts, category: selectedCategory });

	} catch (error) {
		console.error('[Prompts] Error:', error);
		return jsonResponse({ error: error.message }, 500);
	}
}

// AI Topic Detection Endpoint
async function handleDetectTopic(request, env) {
	try {
		const { transcription } = await request.json();

		if (!transcription || transcription.trim().length < 50) {
			return jsonResponse({
				topic: 'life',
				confidence: 0.5,
				keywords: []
			});
		}

		const prompt = buildTopicDetectionPrompt(transcription);
		const response = await callClaude(prompt, env.CLAUDE_API_KEY);

		// Parse JSON response
		const result = JSON.parse(response);
		return jsonResponse(result);

	} catch (error) {
		console.error('[DetectTopic] Error:', error);
		// Return default topic on error
		return jsonResponse({
			topic: 'life',
			confidence: 0.5,
			keywords: []
		});
	}
}

// Call Claude API (server-side only, key never exposed)
async function callClaude(prompt, apiKey) {
	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
		},
		body: JSON.stringify({
			model: 'claude-3-5-sonnet-20241022',
			max_tokens: 2048,
			messages: [
				{
					role: 'user',
					content: prompt,
				},
			],
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Claude API error: ${error}`);
	}

	const data = await response.json();
	return data.content[0].text.trim();
}

// Build enhancement prompt (light-touch editing)
function buildEnhancePrompt(transcription) {
	return `You are a professional memoir editor. Your task: Transform this raw, spoken transcription into polished prose while preserving every detail and the speaker's authentic voice.

RAW TRANSCRIPTION:
"${transcription}"

EDITING GUIDELINES:
1. **KEEP EVERYTHING**: Never remove content, names, dates, or details
2. **LIGHT TOUCH**: Minimal edits - only fix obvious speech patterns
3. **AUTHENTIC VOICE**: Preserve the speaker's unique way of telling stories
4. Fix: repeated words, filler words ("um", "uh", "like"), obvious false starts
5. Smooth transitions between thoughts
6. Add paragraph breaks for readability (2-3 sentences max per paragraph)
7. Maintain conversational, warm tone
8. Keep all emotional moments, sensory details, exact quotes

OUTPUT: Return ONLY the edited story text, no explanations or meta-commentary.`;
}

// Build questions prompt
function buildQuestionsPrompt(transcription) {
	return `You are a warm, curious grandchild interviewing your beloved grandparent about their life memories.
They just shared this memory with you:

"${transcription}"

Your task: Generate 3-5 gentle, conversational follow-up questions to help them remember MORE vivid details.

QUESTION GUIDELINES:
1. Reference their story directly: "You mentioned the dance hall..." or "When you saw her..."
2. Ask for ONE specific sensory or emotional detail per question
3. Use warm, conversational language like you're having tea together
4. Focus on: sights, sounds, smells, emotions, exact words spoken, facial expressions, colors, textures
5. Help them visualize the moment more clearly
6. Keep questions short and easy to understand (elderly-friendly)
7. Never ask yes/no questions - always open-ended

AREAS TO EXPLORE:
- 🎨 Sensory: "What colors do you remember?" "What did it smell like?"
- 💭 Emotions: "How did that make you feel?" "What were you thinking right then?"
- 👥 People: "What did they look like?" "What exactly did they say?"
- 📍 Setting: "Can you describe the room?" "What sounds do you remember?"
- ❤️ Significance: "Why do you think you remember this so clearly?" "What made that moment special?"

OUTPUT FORMAT:
Return ONLY the questions, one per line, numbered 1-5.
Each question should feel like a loving grandchild asking to hear more.

EXAMPLE OUTPUT:
1. What was she wearing? Can you describe her dress?
2. What song was playing when you first saw her?
3. How did you feel when your eyes met?
4. What did her voice sound like?
5. Do you remember what the dance hall looked like that night?

Now generate 3-5 questions for their memory:`;
}

// Build extraction prompt
function buildExtractPrompt(transcription) {
	return `Extract genealogy information and metadata from this transcription.

TRANSCRIPTION:
"${transcription}"

Return ONLY valid JSON in this exact format (no extra text):

{
  "fullName": "John Smith" or null,
  "dateOfBirth": "1950-01-15" or null,
  "placeOfBirth": "Boston, MA" or null,
  "motherFullName": "Mary Smith" or null,
  "motherMaidenName": "Johnson" or null,
  "motherBirthplace": "NYC" or null,
  "fatherFullName": "Robert Smith" or null,
  "fatherBirthplace": "Boston" or null,
  "spouseName": "Jane Doe" or null,
  "whereMetSpouse": "College" or null,
  "childrenNames": ["Alice", "Bob"] or [],
  "suggestedCategory": "Childhood" or "Family" or "Career" etc,
  "themes": ["love", "family", "hardship"] or [],
  "hasGenealogyInfo": true or false
}`;
}

// Build prompts generation prompt
function buildPromptsPrompt(category) {
	return `Generate 5 warm, inviting memoir recording prompts for elderly users about "${category}".

Each prompt should:
- Be 8-15 words long
- Start with action words: "Tell me", "Share", "Describe", "What was", "How did", "When did"
- Be emotionally evocative but gentle
- End with "..." to invite storytelling
- Be suitable for voice recording (conversational tone)
- Encourage vivid, detailed storytelling
- Be accessible to elderly users (clear, simple language)

EXAMPLES:
1. Tell me about your favorite childhood game...
2. What was your first day of school like?
3. Describe someone who changed your life...
4. Share a memory about your grandparents...
5. How did you meet your best friend?

OUTPUT FORMAT:
Return ONLY the 5 prompts, one per line, numbered 1-5.
No extra explanation, no meta-commentary, just the prompts.

Now generate 5 prompts about "${category}":`;
}

// Build topic detection prompt
function buildTopicDetectionPrompt(transcription) {
	return `Analyze this transcription and detect the main topic being discussed.

TRANSCRIPTION:
"${transcription}"

AVAILABLE TOPICS:
- childhood: Early years, growing up, school days, youth
- family: Parents, siblings, relatives, family stories
- career: Work, jobs, professional life, retirement
- travel: Places visited, journeys, vacations, adventures
- relationships: Romance, marriage, friendships, love
- hobbies: Interests, pastimes, activities, skills
- achievements: Accomplishments, proud moments, successes
- challenges: Hardships, difficult times, obstacles overcome
- celebrations: Holidays, parties, special occasions, milestones
- first times: New experiences, memorable firsts, life transitions
- life: General life reflections (use only if no specific category fits)

TASK:
1. Identify the PRIMARY topic (one of the above)
2. Estimate confidence (0.0 to 1.0)
3. Extract 2-5 key words/themes from the transcription

Return ONLY valid JSON in this exact format:
{
  "topic": "childhood",
  "confidence": 0.85,
  "keywords": ["school", "friends", "playground"]
}

IMPORTANT: Return ONLY the JSON, no extra text.`;
}

// Hugh's Cached Phrases (pre-generated, conversational)
const CACHED_PHRASES = {
	'welcome': "Hi! I'm Hugh, your memory companion. What's on your mind today?",
	'memory_saved': "Wonderful! Your memory has been saved. I'm polishing it up to make it shine.",
	'enhancement_complete': "All done! Your story looks beautiful.",
	'ready_to_record': "Take your time... I'm here to listen.",
	'encouragement': "That's a lovely memory. Thank you for sharing."
};

// In-memory cache for audio (Cloudflare Workers have 128MB memory)
// Cache will reset on deploy - this ensures voice changes are picked up
const audioCache = new Map();

// Hugh the Manatee TTS Endpoint (with dynamic voice/speed support)
async function handleTextToSpeech(request, env) {
	try {
		const { text, phraseKey, voice = 'echo', speed = 0.9 } = await request.json();

		if (!text || text.trim().length === 0) {
			return jsonResponse({ error: 'Text required' }, 400);
		}

		// Check if this is a cached phrase (cache by phraseKey + voice + speed)
		const cacheKey = phraseKey ? `${phraseKey}_${voice}_${speed}` : null;

		if (cacheKey && CACHED_PHRASES[phraseKey]) {
			// Check in-memory cache first
			if (audioCache.has(cacheKey)) {
				console.log(`[TTS] Serving cached phrase: ${cacheKey}`);
				return new Response(audioCache.get(cacheKey), {
					status: 200,
					headers: {
						'Content-Type': 'audio/mpeg',
						'X-Cache': 'HIT',
						...corsHeaders,
					},
				});
			}

			// Generate and cache with specific voice/speed
			const audioData = await generateOpenAITTS(CACHED_PHRASES[phraseKey], env.OPENAI_API_KEY, voice, speed);
			audioCache.set(cacheKey, audioData);
			console.log(`[TTS] Generated and cached phrase: ${cacheKey}`);

			return new Response(audioData, {
				status: 200,
				headers: {
					'Content-Type': 'audio/mpeg',
					'X-Cache': 'MISS',
					...corsHeaders,
				},
			});
		}

		// Generate TTS for dynamic text with user's preferred voice/speed
		const audioData = await generateOpenAITTS(text, env.OPENAI_API_KEY, voice, speed);

		return new Response(audioData, {
			status: 200,
			headers: {
				'Content-Type': 'audio/mpeg',
				...corsHeaders,
			},
		});

	} catch (error) {
		console.error('[TTS] Error:', error);
		return jsonResponse({ error: error.message }, 500);
	}
}

// Generate speech using OpenAI TTS with dynamic voice/speed
async function generateOpenAITTS(text, apiKey, voice = 'echo', speed = 0.9) {
	const response = await fetch('https://api.openai.com/v1/audio/speech', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model: 'tts-1', // Fast model (tts-1-hd for higher quality)
			input: text,
			voice: voice, // User's preferred voice (echo, alloy, nova, shimmer, onyx, fable)
			speed: speed  // User's preferred speed (0.7 - 1.0)
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		console.error('[OpenAI TTS] Error:', error);
		throw new Error(`OpenAI TTS error: ${response.status}`);
	}

	return await response.arrayBuffer();
}

// Hugh's Conversational Response Endpoint
async function handleConversationResponse(request, env) {
	try {
		const { transcription, conversationHistory = [], pauseType, pauseDuration } = await request.json();

		if (!transcription || transcription.trim().length === 0) {
			return jsonResponse({ error: 'Transcription required' }, 400);
		}

		// Short pause (1-2s): No response, keep listening
		if (pauseType === 'short') {
			return jsonResponse({
				response: null,
				responseType: 'none',
				shouldSave: false
			});
		}

		// Build conversation context and generate response
		const prompt = buildConversationResponsePrompt(
			transcription,
			conversationHistory,
			pauseType,
			pauseDuration
		);

		const response = await callClaude(prompt, env.CLAUDE_API_KEY);

		// Parse JSON response from Claude
		let parsedResponse;
		try {
			parsedResponse = JSON.parse(response);
		} catch (parseError) {
			console.error('[Respond] Failed to parse Claude response:', response);
			// Fallback to safe default
			parsedResponse = {
				response: "That's wonderful. Tell me more...",
				responseType: "encouragement",
				shouldSave: pauseType === 'long'
			};
		}

		return jsonResponse(parsedResponse);

	} catch (error) {
		console.error('[Respond] Error:', error);
		return jsonResponse({ error: error.message }, 500);
	}
}

// AI Temporal Context Enhancement Endpoint
async function handleTemporalContext(request, env) {
	try {
		const { transcription, year, location, keywords } = await request.json();

		if (!transcription || transcription.trim().length === 0) {
			return jsonResponse({ error: 'Transcription required' }, 400);
		}

		// If no year provided, return original transcription unchanged
		if (!year) {
			return jsonResponse({
				enhancedNarrative: transcription,
				decade: null,
				culturalMarkers: [],
				visualPalette: null
			});
		}

		// Build temporal context prompt using decade DNA from spec
		const prompt = buildTemporalContextPrompt(transcription, year, location);

		// Call Claude API with enhanced prompt (60s timeout handled by Cloudflare Workers)
		const response = await callClaude(prompt, env.CLAUDE_API_KEY);

		// Parse JSON response { enhancedStory, markers, visualDescription }
		let result;
		try {
			result = JSON.parse(response);
		} catch (parseError) {
			console.error('[TemporalContext] Failed to parse Claude response:', response);
			// Fallback to original transcription if parsing fails
			return jsonResponse({
				enhancedNarrative: transcription,
				decade: determineDecade(year),
				culturalMarkers: [],
				visualPalette: null
			});
		}

		// Return formatted response
		return jsonResponse({
			enhancedNarrative: result.enhancedStory,
			decade: determineDecade(year),
			culturalMarkers: result.markers || [],
			visualPalette: result.visualDescription || null
		});

	} catch (error) {
		console.error('[TemporalContext] Error:', error);
		return jsonResponse({ error: error.message }, 500);
	}
}

// Build temporal context prompt using decade DNA
function buildTemporalContextPrompt(transcription, year, location) {
	const decade = determineDecade(year);

	return `You are a narrative historian reconstructing memories with rich temporal context.

USER'S MEMORY:
"${transcription}"

TEMPORAL ANCHORS:
- Year: ${year}
- Decade: ${decade}s
- Location: ${location || "Not specified"}

YOUR TASK:
Rewrite this memory as a multi-layered narrative in 4 sections:

1. MACRO CONTEXT (2-3 sentences):
Set the historical stage - what was happening in the ${decade}s?
- Major events: presidencies, wars, cultural shifts
- Music/entertainment: what was on the radio, in theaters
- Collective mood: optimism vs. tension, cultural zeitgeist

2. MICRO ENVIRONMENT (3-4 sentences):
Describe the specific setting with period-accurate details:
- Visual palette: colors, patterns, materials popular in ${decade}s
  (e.g., 1970s: earth tones, wood paneling, shag carpets)
- Technology snapshot: phones, cars, appliances of the era
- Ambient details: brands, sounds, textures people remember
  (e.g., 1960s: chrome diners, Formica counters, transistor radios)

3. PERSONAL NARRATIVE (4-6 sentences):
Preserve the user's story but weave in sensory period details:
- Keep the original meaning and emotions
- Add specific visual details (what colors, what fabrics)
- Include sounds (what music, what car engines)
- Reference period-specific items (brands, products, cultural touchstones)

4. SENSORY TOUCHPOINTS (5-7 specific details):
List concrete, evocative details:
- What music was on the radio? (specific songs/artists from ${year})
- What did kitchens/cars/clothes look like? (specific styles)
- What brands/products were everywhere? (Coca-Cola ads, specific cars)
- What colors dominated the era?
- What textures/materials were common? (vinyl, Formica, wood paneling)

STYLE GUIDE:
- Warm, nostalgic but not cloying
- Specific > vague: "wood-paneled station wagon" not "old car"
- Mix high/low culture: Beatles AND grocery store muzak
- Keep user's voice central - enhance, don't replace
- Use present tense for immediacy: "The radio plays..." not "played"

OUTPUT FORMAT (JSON):
{
  "enhancedStory": "Full rewritten narrative incorporating all 4 sections seamlessly",
  "markers": ["cultural touchstone 1", "cultural touchstone 2", ...],
  "visualDescription": "Brief color/aesthetic summary for ${decade}s"
}

EXAMPLE (1965):
enhancedStory: "It's 1965, and America is caught between Leave It to Beaver optimism and Vietnam War anxiety. The Beatles have just played Ed Sullivan, and everything feels possible yet precarious.

The high school gymnasium is a time capsule of mid-60s Americana: mint green walls, polished hardwood floors reflecting fluorescent lights, fold-out bleachers pushed against walls plastered with Go Tigers! banners. A record player in the corner spins 45s—The Supremes, The Beach Boys, maybe some Motown if the chaperones aren't looking.

You're wearing your best dress—the one with the Peter Pan collar and A-line skirt that swishes when you walk—and he's in a narrow tie and Brylcreemed hair. The DJ announces 'My Girl' by The Temptations, and when he asks you to dance, the gymnasium lights suddenly feel softer, more forgiving. His hand on your waist is tentative, respectful in that way boys were taught back then.

Around you: girls in bouffant hairdos and kitten heels, boys in letter jackets smelling of Old Spice, the smell of gym floor wax mixed with Aqua Net hairspray. Someone's transistor radio plays The Rolling Stones during the punch break."

IMPORTANT: Return ONLY valid JSON. No extra text.`;
}

// Determine decade from year
function determineDecade(year) {
	return Math.floor(year / 10) * 10;
}

// Build conversation response prompt for Hugh
function buildConversationResponsePrompt(transcription, history, pauseType, pauseDuration) {
	const formattedHistory = formatConversationHistory(history);
	const pauseDescription = pauseType === 'medium'
		? `natural pause (~${pauseDuration}s - they're thinking or catching their breath)`
		: `long pause (${pauseDuration}s+ - possibly finished this thought)`;

	return `You are Hugh the Manatee, a professional memory companion with a warm, engaging personality. You help users preserve their life stories through natural, flowing conversation.

HUGH'S PERSONALITY:
- Natural professional warmth - like a trusted friend over coffee
- Genuinely curious about details, but never pushy
- Conversational and relaxed - NOT overly formal or patronizing
- Asks clear, specific questions (one at a time)
- Excellent listener who notices small details
- Patient, never rushes or interrupts

CONVERSATION STYLE:
✓ DO: "What was she wearing?" "How did that smell?" "What did he say exactly?"
✓ DO: Reference specific details they mentioned
✓ DO: Keep responses natural and conversational (20-30 words max)
✓ DON'T: Ask yes/no questions
✓ DON'T: Use clinical language ("Can you describe your emotions?")
✓ DON'T: Be overly cheerful or patronizing

CONVERSATION HISTORY:
${formattedHistory}

USER JUST SAID:
"${transcription}"

PAUSE CONTEXT: ${pauseDescription}

YOUR RESPONSE STRATEGY:
${pauseType === 'medium'
		? 'Brief encouragement OR one specific follow-up question. Keep the story flowing naturally.'
		: 'Acknowledge their story warmly. Ask if there\'s more OR confirm you\'re ready to save this memory.'}

QUESTION EXAMPLES (Pick ONE specific detail):
- Sensory: "What did the room smell like?" "What could you hear?"
- Emotional: "How did that make you feel?" "What were you thinking?"
- Visual: "What was she wearing?" "What did the place look like?"
- Dialogue: "What did she say?" "How did he respond?"
- Action: "What happened next?" "What did you do?"

RESPONSE TYPES:
- "encouragement": Brief positive feedback (e.g., "That's wonderful.")
- "question": One specific follow-up question about a detail
- "topicShift": Suggest new topic (e.g., "What else has been on your mind?")
- "confirmation": Ready to save (e.g., "I've got that saved for you.")

OUTPUT (JSON ONLY):
{
  "response": "Your natural, conversational response (20-30 words max)",
  "responseType": "question",
  "shouldSave": ${pauseType === 'long'}
}

CRITICAL: Return ONLY valid JSON. No explanations, no extra text.`;
}

// Format conversation history for context
function formatConversationHistory(history) {
	if (!history || history.length === 0) {
		return '(This is the start of the conversation)';
	}

	return history
		.slice(-5) // Only include last 5 exchanges for context
		.map(msg => `${msg.speaker === 'user' ? 'USER' : 'HUGH'}: "${msg.text}"`)
		.join('\n');
}

// Parse numbered questions from response
function parseQuestions(response) {
	const lines = response.split('\n');
	const questions = [];

	for (const line of lines) {
		const trimmed = line.trim();
		// Match numbered questions: "1. Question?" or "1) Question?"
		const match = trimmed.match(/^\d+[\.\)]\s*(.+)$/);
		if (match && match[1]) {
			questions.push(match[1].trim());
		}
	}

	return questions.slice(0, 5); // Limit to 5
}

// JSON response helper
function jsonResponse(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...corsHeaders,
		},
	});
}
