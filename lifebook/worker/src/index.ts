/**
 * Hugh Manatee Worker
 *
 * Three narrow endpoints:
 *   POST /agent/config     — ElevenLabs CAI agent_id + conversation token + first turn + runtime context
 *   POST /collage/images   — Unsplash-backed collage images + gradient (24h KV cache)
 *   POST /session/anchor   — Claude-extracted anchor phrase + title + entities from recent turns
 *
 * Also: GET / (health check), OPTIONS * (CORS preflight).
 */

import questionLibrary from "./data/question-library.json";
import { ANCHOR_SYSTEM, ANCHOR_FORMAT_HINT } from "./prompts/anchor";

export interface Env {
	ELEVENLABS_API_KEY: string;
	ELEVENLABS_AGENTS: string; // JSON string: {"<voice_id>": "<agent_id>"}
	UNSPLASH_ACCESS_KEY: string;
	ANTHROPIC_API_KEY: string;
	COLLAGE_CACHE: KVNamespace;
}

const CORS: Record<string, string> = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json", ...CORS },
	});

const err = (message: string, status = 400) => json({ error: message }, status);

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

		const url = new URL(request.url);

		if (request.method === "GET" && url.pathname === "/") {
			return json({ ok: true, service: "hugh-manatee-worker" });
		}

		if (request.method !== "POST") return err("Method not allowed", 405);

		try {
			if (url.pathname === "/agent/config") return await handleAgentConfig(request, env);
			if (url.pathname === "/collage/images") return await handleCollageImages(request, env);
			if (url.pathname === "/session/anchor") return await handleSessionAnchor(request, env);
			return err("Not found", 404);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			return err(`Internal error: ${msg}`, 500);
		}
	},
};

/* -------------------------------------------------------------------------- */
/* /agent/config                                                               */
/* -------------------------------------------------------------------------- */

interface AgentConfigBody {
	first_name: string;
	birth_year?: number;
	hometown?: string;
	voice_id: string;
	last_anchor?: string;
	preference?: "old" | "recent";
}

async function handleAgentConfig(request: Request, env: Env): Promise<Response> {
	const body = (await request.json()) as AgentConfigBody;
	if (!body?.first_name || !body?.voice_id) {
		return err("first_name and voice_id are required");
	}

	// Resolve agent_id from env JSON map.
	let agents: Record<string, string> = {};
	try {
		agents = JSON.parse(env.ELEVENLABS_AGENTS || "{}");
	} catch {
		return err("ELEVENLABS_AGENTS is not valid JSON", 500);
	}
	const agent_id = agents[body.voice_id];
	if (!agent_id) return err(`No agent configured for voice_id=${body.voice_id}`, 404);

	// Fetch short-lived conversation token from ElevenLabs.
	// The @elevenlabs/react-native SDK accepts { agentId, conversationToken }
	// and uses LiveKit WebRTC under the hood.
	const tokenRes = await fetch(
		`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agent_id)}`,
		{ headers: { "xi-api-key": env.ELEVENLABS_API_KEY } },
	);
	if (!tokenRes.ok) {
		const detail = await tokenRes.text();
		return err(`ElevenLabs token fetch failed: ${tokenRes.status} ${detail}`, 502);
	}
	const { token } = (await tokenRes.json()) as { token: string };

	const first_turn = renderFirstTurn(body.first_name, body.last_anchor);
	const runtime_context = buildRuntimeContext(body.birth_year, body.preference);

	return json({
		agent_id,
		conversation_token: token,
		first_turn,
		runtime_context,
	});
}

function renderFirstTurn(name: string, lastAnchor?: string): string {
	if (lastAnchor && lastAnchor.trim()) {
		return `Hi ${name}. Last time we were ${lastAnchor.trim()}. Somewhere new today, or back there?`;
	}
	return `Hi ${name}. Good to hear you again. Where would you like to start today?`;
}

/* -------- runtime_context: pick seed prompts + era hooks ------------------ */

type LifeStage =
	| "early_childhood"
	| "school_years"
	| "teens"
	| "young_adult"
	| "middle_life"
	| "later_life"
	| "recent"
	| "any";

const STAGE_ORDER: LifeStage[] = [
	"early_childhood",
	"school_years",
	"teens",
	"young_adult",
	"middle_life",
	"later_life",
];

function pickLifeStage(birthYear: number | undefined, preference?: "old" | "recent"): LifeStage {
	if (preference === "recent") return "recent";
	if (!birthYear) return "school_years";
	const now = new Date().getUTCFullYear();
	const age = now - birthYear;
	if (age <= 6) return "early_childhood";
	if (age <= 12) return "school_years";
	if (age <= 18) return "teens";
	if (age <= 29) return "young_adult";
	if (age <= 55) return "middle_life";
	return "later_life";
}

function pickEraDecade(birthYear?: number): keyof typeof eraHooks | null {
	if (!birthYear) return null;
	// childhood age ~10
	const decade = Math.floor((birthYear + 10) / 10) * 10;
	const key = `${decade}s` as keyof typeof eraHooks;
	return eraHooks[key] ? key : null;
}

const themes = (questionLibrary as any).themes as Record<string, Partial<Record<LifeStage, string[]>>>;
const eraHooks = (questionLibrary as any).era_hooks as Record<
	string,
	{ sounds?: string[]; objects?: string[]; foods?: string[] }
>;

function buildRuntimeContext(birthYear?: number, preference?: "old" | "recent") {
	const stage = pickLifeStage(birthYear, preference);

	// Collect seeds from the chosen stage across themes, with "any"-tagged themes
	// (food, milestones, senses_and_weather, recent_life) as a backstop.
	const seeds: string[] = [];
	const stagesToTry: LifeStage[] =
		stage === "recent" ? ["recent", "any"] : [stage, "any"];
	// If stage is very old/young and nothing found, drift toward school_years.
	if (!stagesToTry.includes("school_years")) stagesToTry.push("school_years");

	outer: for (const s of stagesToTry) {
		for (const theme of Object.keys(themes)) {
			const list = themes[theme]?.[s];
			if (list) {
				for (const q of list) {
					if (!seeds.includes(q)) seeds.push(q);
					if (seeds.length >= 5) break outer;
				}
			}
		}
	}

	const seed_prompts = seeds.slice(0, 5);

	const decadeKey = pickEraDecade(birthYear);
	const era: string[] = [];
	if (decadeKey) {
		const hooks = eraHooks[decadeKey];
		for (const bucket of [hooks.sounds, hooks.objects, hooks.foods]) {
			if (!bucket) continue;
			for (const item of bucket) {
				if (era.length >= 5) break;
				era.push(item);
			}
		}
	}

	return { seed_prompts, era_hooks: era, life_stage: stage, decade: decadeKey };
}

/* -------------------------------------------------------------------------- */
/* /collage/images                                                             */
/* -------------------------------------------------------------------------- */

interface CollageBody {
	birth_year?: number;
	hometown?: string;
	theme?: string;
}

async function handleCollageImages(request: Request, env: Env): Promise<Response> {
	const body = (await request.json()) as CollageBody;

	const query = buildCollageQuery(body);
	const cacheKey = `collage:${query}`;

	const cached = await env.COLLAGE_CACHE.get(cacheKey, "json");
	if (cached) return json(cached);

	const res = await fetch(
		`https://api.unsplash.com/search/photos?per_page=5&orientation=portrait&query=${encodeURIComponent(query)}`,
		{ headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` } },
	);
	if (!res.ok) {
		const detail = await res.text();
		return err(`Unsplash fetch failed: ${res.status} ${detail}`, 502);
	}
	const data = (await res.json()) as {
		results: Array<{ urls: { regular: string }; alt_description?: string | null; color?: string }>;
	};

	const images = (data.results || []).slice(0, 5).map((r) => ({
		url: r.urls.regular,
		alt: r.alt_description || "",
	}));

	const colors = data.results.map((r) => r.color).filter((c): c is string => !!c);
	// Fallback gradient matches the app's warm theme (colors.bgTop / bgBottom).
	const gradient = {
		from: colors[0] || "#F4ECE1",
		to: colors[colors.length - 1] || "#E8D9C4",
	};

	const payload = { images, gradient };
	// KV TTL min is 60s; 24h = 86400.
	await env.COLLAGE_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 86400 });

	return json(payload);
}

function buildCollageQuery({ birth_year, hometown, theme }: CollageBody): string {
	const parts: string[] = [];
	if (theme) parts.push(theme);
	if (hometown) parts.push(hometown);
	if (birth_year) {
		const decade = Math.floor((birth_year + 10) / 10) * 10;
		parts.push(`${decade}s`);
	}
	if (parts.length === 0) parts.push("vintage memories");
	return parts.join(" ");
}

/* -------------------------------------------------------------------------- */
/* /session/anchor                                                             */
/* -------------------------------------------------------------------------- */

interface AnchorBody {
	turns: Array<{ speaker: string; text: string }>;
}

async function handleSessionAnchor(request: Request, env: Env): Promise<Response> {
	const body = (await request.json()) as AnchorBody;
	if (!Array.isArray(body?.turns) || body.turns.length === 0) {
		return err("turns[] is required");
	}

	const tail = body.turns.slice(-10);
	const transcript = tail
		.map((t) => `${(t.speaker || "user").toUpperCase()}: ${t.text}`)
		.join("\n");

	const res = await fetch("https://api.anthropic.com/v1/messages", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-api-key": env.ANTHROPIC_API_KEY,
			"anthropic-version": "2023-06-01",
		},
		body: JSON.stringify({
			model: "claude-sonnet-4-5",
			max_tokens: 400,
			system: [
				{ type: "text", text: ANCHOR_SYSTEM, cache_control: { type: "ephemeral" } },
				{ type: "text", text: ANCHOR_FORMAT_HINT, cache_control: { type: "ephemeral" } },
			],
			messages: [{ role: "user", content: `Transcript (last ${tail.length} turns):\n${transcript}` }],
		}),
	});

	if (!res.ok) {
		const detail = await res.text();
		return err(`Anthropic call failed: ${res.status} ${detail}`, 502);
	}

	const data = (await res.json()) as { content: Array<{ type: string; text?: string }> };
	const text = (data.content || []).map((c) => c.text || "").join("").trim();

	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		// Strip possible ```json fences just in case.
		const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
		try {
			parsed = JSON.parse(stripped);
		} catch {
			return err(`Could not parse anchor JSON: ${text.slice(0, 200)}`, 502);
		}
	}

	return json(parsed);
}
