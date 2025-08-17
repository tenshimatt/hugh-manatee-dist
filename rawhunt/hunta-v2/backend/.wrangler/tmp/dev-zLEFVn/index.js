var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-6dpypm/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/handlers/auth.js
async function authHandler(request, path, env) {
  const method = request.method;
  try {
    if (path === "/api/auth/register" && method === "POST") {
      return await register(request, env);
    } else if (path === "/api/auth/login" && method === "POST") {
      return await login(request, env);
    } else if (path === "/api/auth/me" && method === "GET") {
      return await getProfile(request, env);
    } else {
      return errorResponse("Auth endpoint not found", 404);
    }
  } catch (error) {
    console.error("Auth handler error:", error);
    return errorResponse("Authentication failed", 500);
  }
}
__name(authHandler, "authHandler");
async function register(request, env) {
  try {
    const body = await request.json();
    const { email, username, password, firstName, lastName } = body;
    if (!email || !username || !password) {
      return errorResponse("Email, username, and password are required", 400);
    }
    if (password.length < 6) {
      return errorResponse("Password must be at least 6 characters", 400);
    }
    if (!env.DB) {
      return demoResponse("register", { email, username, firstName, lastName });
    }
    const existingUser = await env.DB.prepare(`
            SELECT id FROM users WHERE email = ? OR username = ?
        `).bind(email, username).first();
    if (existingUser) {
      return errorResponse("User already exists", 409);
    }
    const passwordHash = await hashPassword(password);
    const userId = generateId();
    await env.DB.prepare(`
            INSERT INTO users (id, email, username, password_hash, first_name, last_name)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(userId, email, username, passwordHash, firstName || "", lastName || "").run();
    const token = await generateJWT({ userId, email, username }, env.JWT_SECRET);
    return successResponse({
      user: {
        id: userId,
        email,
        username,
        firstName: firstName || "",
        lastName: lastName || "",
        role: "hunter"
      },
      token
    });
  } catch (error) {
    console.error("Registration error:", error);
    return errorResponse("Registration failed", 500);
  }
}
__name(register, "register");
async function login(request, env) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return errorResponse("Email and password are required", 400);
    }
    if (!env.DB) {
      return demoResponse("login", { email });
    }
    const user = await env.DB.prepare(`
            SELECT id, email, username, password_hash, first_name, last_name, role, is_active
            FROM users WHERE email = ?
        `).bind(email).first();
    if (!user || !user.is_active) {
      return errorResponse("Invalid credentials", 401);
    }
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return errorResponse("Invalid credentials", 401);
    }
    const token = await generateJWT({
      userId: user.id,
      email: user.email,
      username: user.username
    }, env.JWT_SECRET);
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Login failed", 500);
  }
}
__name(login, "login");
async function getProfile(request, env) {
  try {
    const token = extractToken(request);
    if (!token) {
      return errorResponse("Authentication required", 401);
    }
    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (!payload) {
      return errorResponse("Invalid token", 401);
    }
    if (!env.DB) {
      return demoResponse("profile", payload);
    }
    const user = await env.DB.prepare(`
            SELECT id, email, username, first_name, last_name, role, created_at
            FROM users WHERE id = ? AND is_active = 1
        `).bind(payload.userId).first();
    if (!user) {
      return errorResponse("User not found", 404);
    }
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        memberSince: user.created_at
      }
    });
  } catch (error) {
    console.error("Profile error:", error);
    return errorResponse("Failed to get profile", 500);
  }
}
__name(getProfile, "getProfile");
function extractToken(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
__name(extractToken, "extractToken");
async function generateJWT(payload, secret) {
  const header = btoa(JSON.stringify({ typ: "JWT", alg: "HS256" }));
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 864e5 }));
  return `${header}.${body}.${btoa(secret + header + body)}`;
}
__name(generateJWT, "generateJWT");
async function verifyJWT(token, secret) {
  try {
    const [header, body, signature] = token.split(".");
    const expectedSignature = btoa(secret + header + body);
    if (signature !== expectedSignature) {
      return null;
    }
    const payload = JSON.parse(atob(body));
    if (payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
__name(verifyJWT, "verifyJWT");
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "hunta-salt-2025");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, hash) {
  const computed = await hashPassword(password);
  return computed === hash;
}
__name(verifyPassword, "verifyPassword");
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
__name(generateId, "generateId");
function successResponse(data) {
  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(successResponse, "successResponse");
function errorResponse(message, status = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(errorResponse, "errorResponse");
function demoResponse(action, data) {
  const mockUser = {
    id: generateId(),
    email: data.email || "demo@hunta.com",
    username: data.username || "demo_hunter",
    firstName: data.firstName || "Demo",
    lastName: data.lastName || "Hunter",
    role: "hunter"
  };
  const token = btoa(JSON.stringify(mockUser));
  return successResponse({
    user: mockUser,
    token,
    message: `Demo ${action} successful - database not connected`
  });
}
__name(demoResponse, "demoResponse");

// src/handlers/users.js
async function usersHandler(request, path, env) {
  return new Response(JSON.stringify({
    success: true,
    message: "Users endpoint - coming soon"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(usersHandler, "usersHandler");

// src/handlers/dogs.js
async function dogsHandler(request, path, env) {
  const method = request.method;
  try {
    if (path === "/api/dogs/list" && method === "GET") {
      return await listDogs(request, env);
    } else if (path === "/api/dogs/add" && method === "POST") {
      return await addDog(request, env);
    } else if (path.match(/^\/api\/dogs\/[^\/]+$/) && method === "GET") {
      const dogId = path.split("/").pop();
      return await getDog(request, dogId, env);
    } else if (path.match(/^\/api\/dogs\/[^\/]+$/) && method === "PUT") {
      const dogId = path.split("/").pop();
      return await updateDog(request, dogId, env);
    } else {
      return errorResponse2("Dogs endpoint not found", 404);
    }
  } catch (error) {
    console.error("Dogs handler error:", error);
    return errorResponse2("Dogs operation failed", 500);
  }
}
__name(dogsHandler, "dogsHandler");
async function listDogs(request, env) {
  try {
    if (!env.DB) {
      return successResponse2([
        {
          id: "1",
          name: "Rex",
          breed: "German Shorthaired Pointer",
          age: calculateAge("2020-03-15"),
          training_level: "advanced",
          hunting_style: "pointer",
          description: "Excellent upland bird dog with strong pointing instincts and steady temperament.",
          photo_url: null
        },
        {
          id: "2",
          name: "Bella",
          breed: "English Setter",
          age: calculateAge("2022-08-20"),
          training_level: "intermediate",
          hunting_style: "setter",
          description: "Young setter showing great promise in field trials. Still learning but very eager.",
          photo_url: null
        },
        {
          id: "3",
          name: "Duke",
          breed: "Labrador Retriever",
          age: calculateAge("2019-11-10"),
          training_level: "expert",
          hunting_style: "retriever",
          description: "Veteran waterfowl retriever with excellent marking ability and soft mouth.",
          photo_url: null
        }
      ]);
    }
    try {
      const dogs = await env.DB.prepare(`
                SELECT 
                    id, name, breed, birth_date, sex, training_level, 
                    hunting_style, description, photo_url, created_at
                FROM dogs 
                WHERE is_active = 1 
                ORDER BY created_at DESC
                LIMIT 10
            `).all();
      const dogsWithAge = dogs.results.map((dog) => ({
        ...dog,
        age: dog.birth_date ? calculateAge(dog.birth_date) : null
      }));
      return successResponse2(dogsWithAge);
    } catch (dbError) {
      console.log("Database error, returning demo data:", dbError);
      return successResponse2([
        {
          id: "1",
          name: "Rex",
          breed: "German Shorthaired Pointer",
          age: calculateAge("2020-03-15"),
          training_level: "advanced",
          hunting_style: "pointer",
          description: "Excellent upland bird dog with strong pointing instincts and steady temperament.",
          photo_url: null
        },
        {
          id: "2",
          name: "Bella",
          breed: "English Setter",
          age: calculateAge("2022-08-20"),
          training_level: "intermediate",
          hunting_style: "pointer",
          description: "Young, eager setter with natural hunting instincts. Still learning steadiness but shows great promise.",
          photo_url: null
        },
        {
          id: "3",
          name: "Duke",
          breed: "Labrador Retriever",
          age: calculateAge("2019-11-10"),
          training_level: "advanced",
          hunting_style: "retriever",
          description: "Seasoned waterfowl dog with exceptional marking ability. Reliable in all weather conditions.",
          photo_url: null
        }
      ]);
    }
  } catch (error) {
    console.error("List dogs error:", error);
    return errorResponse2("Failed to fetch dogs", 500);
  }
}
__name(listDogs, "listDogs");
async function addDog(request, env) {
  try {
    const user = await authenticateUser(request, env);
    if (!user.success) {
      return user.response;
    }
    const body = await request.json();
    const { name, breed, birthDate, sex, trainingLevel, huntingStyle, description } = body;
    if (!name || !breed) {
      return errorResponse2("Dog name and breed are required", 400);
    }
    if (!env.DB) {
      return successResponse2({
        id: generateId2(),
        name,
        breed,
        birth_date: birthDate,
        sex,
        training_level: trainingLevel || "beginner",
        hunting_style: huntingStyle,
        description: description || "",
        age: birthDate ? calculateAge(birthDate) : null,
        message: "Demo dog added - database not connected"
      });
    }
    const dogId = generateId2();
    await env.DB.prepare(`
            INSERT INTO dogs (
                id, user_id, name, breed, birth_date, sex, 
                training_level, hunting_style, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
      dogId,
      user.data.userId,
      name,
      breed,
      birthDate,
      sex,
      trainingLevel || "beginner",
      huntingStyle,
      description || ""
    ).run();
    return successResponse2({
      id: dogId,
      name,
      breed,
      birth_date: birthDate,
      sex,
      training_level: trainingLevel || "beginner",
      hunting_style: huntingStyle,
      description: description || "",
      age: birthDate ? calculateAge(birthDate) : null
    });
  } catch (error) {
    console.error("Add dog error:", error);
    return errorResponse2("Failed to add dog", 500);
  }
}
__name(addDog, "addDog");
async function getDog(request, dogId, env) {
  try {
    const user = await authenticateUser(request, env);
    if (!user.success) {
      return user.response;
    }
    if (!env.DB) {
      return successResponse2({
        id: dogId,
        name: "Demo Dog",
        breed: "Mixed Breed",
        age: 3,
        training_level: "intermediate",
        description: "Demo dog profile - database not connected"
      });
    }
    const dog = await env.DB.prepare(`
            SELECT 
                id, name, breed, birth_date, sex, training_level,
                hunting_style, description, photo_url, created_at
            FROM dogs 
            WHERE id = ? AND user_id = ? AND is_active = 1
        `).bind(dogId, user.data.userId).first();
    if (!dog) {
      return errorResponse2("Dog not found", 404);
    }
    return successResponse2({
      ...dog,
      age: dog.birth_date ? calculateAge(dog.birth_date) : null
    });
  } catch (error) {
    console.error("Get dog error:", error);
    return errorResponse2("Failed to fetch dog", 500);
  }
}
__name(getDog, "getDog");
async function updateDog(request, dogId, env) {
  try {
    const user = await authenticateUser(request, env);
    if (!user.success) {
      return user.response;
    }
    const body = await request.json();
    const { name, breed, birthDate, sex, trainingLevel, huntingStyle, description } = body;
    if (!env.DB) {
      return successResponse2({
        id: dogId,
        message: "Demo dog updated - database not connected"
      });
    }
    await env.DB.prepare(`
            UPDATE dogs SET 
                name = ?, breed = ?, birth_date = ?, sex = ?,
                training_level = ?, hunting_style = ?, description = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        `).bind(
      name,
      breed,
      birthDate,
      sex,
      trainingLevel,
      huntingStyle,
      description,
      dogId,
      user.data.userId
    ).run();
    return successResponse2({
      id: dogId,
      name,
      breed,
      birth_date: birthDate,
      sex,
      training_level: trainingLevel,
      hunting_style: huntingStyle,
      description,
      age: birthDate ? calculateAge(birthDate) : null
    });
  } catch (error) {
    console.error("Update dog error:", error);
    return errorResponse2("Failed to update dog", 500);
  }
}
__name(updateDog, "updateDog");
function calculateAge(birthDate) {
  const today = /* @__PURE__ */ new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || monthDiff === 0 && today.getDate() < birth.getDate()) {
    age--;
  }
  return age;
}
__name(calculateAge, "calculateAge");
async function authenticateUser(request, env) {
  const token = extractToken2(request);
  if (!token) {
    return {
      success: false,
      response: errorResponse2("Authentication required", 401)
    };
  }
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || token));
    return {
      success: true,
      data: payload
    };
  } catch {
    return {
      success: false,
      response: errorResponse2("Invalid token", 401)
    };
  }
}
__name(authenticateUser, "authenticateUser");
function extractToken2(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
__name(extractToken2, "extractToken");
function generateId2() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
__name(generateId2, "generateId");
function successResponse2(data) {
  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(successResponse2, "successResponse");
function errorResponse2(message, status = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(errorResponse2, "errorResponse");

// src/handlers/routes.js
async function routesHandler(request, path, env) {
  return new Response(JSON.stringify({
    success: true,
    data: [],
    message: "Hunt routes endpoint - coming soon"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(routesHandler, "routesHandler");

// src/handlers/events.js
async function eventsHandler(request, path, env) {
  const method = request.method;
  try {
    if (path === "/api/events/list" && method === "GET") {
      return await listEvents(request, env);
    } else if (path === "/api/events/add" && method === "POST") {
      return await addEvent(request, env);
    } else {
      return errorResponse3("Events endpoint not found", 404);
    }
  } catch (error) {
    console.error("Events handler error:", error);
    return errorResponse3("Events operation failed", 500);
  }
}
__name(eventsHandler, "eventsHandler");
async function listEvents(request, env) {
  try {
    if (!env.DB) {
      return successResponse3([
        {
          id: "1",
          title: "Spring Field Trial",
          description: "Annual spring field trial for pointing breeds. Open to all levels.",
          event_type: "trial",
          event_date: "2025-04-15",
          location: "Pine Ridge Hunting Preserve, Georgia",
          organizer: "Georgia Field Trial Association",
          entry_fee: 45,
          max_participants: 50
        },
        {
          id: "2",
          title: "Retriever Training Workshop",
          description: "Professional training workshop focusing on steadiness and marking.",
          event_type: "training",
          event_date: "2025-03-22",
          location: "Marsh Creek Training Grounds, Maryland",
          organizer: "Pro Trainer Mike Johnson",
          entry_fee: 75,
          max_participants: 20
        },
        {
          id: "3",
          title: "Hunter Safety & Ethics Seminar",
          description: "Important discussion on hunting ethics and safety practices.",
          event_type: "educational",
          event_date: "2025-03-10",
          location: "Online Webinar",
          organizer: "National Hunting Safety Foundation",
          entry_fee: 0,
          max_participants: 100
        }
      ]);
    }
    try {
      const events = await env.DB.prepare(`
                SELECT 
                    e.id, e.title, e.description, e.event_type, e.event_date,
                    e.location, e.entry_fee, e.max_participants,
                    COALESCE(u.username, 'Event Organizer') as organizer_name
                FROM events e
                LEFT JOIN users u ON e.organizer_id = u.id
                WHERE e.event_date >= date('now') AND e.is_active = 1
                ORDER BY e.event_date ASC
                LIMIT 50
            `).all();
      return successResponse3(events.results || []);
    } catch (dbError) {
      console.log("Database error, returning demo events:", dbError);
      return successResponse3([
        {
          id: "1",
          title: "Spring Field Trial",
          description: "Annual spring field trial for pointing breeds. Open to all levels.",
          event_type: "trial",
          event_date: "2025-04-15",
          location: "Pine Ridge Hunting Preserve, Georgia",
          organizer_name: "Georgia Field Trial Association",
          entry_fee: 45,
          max_participants: 50
        },
        {
          id: "2",
          title: "Retriever Training Workshop",
          description: "Professional training workshop focusing on steadiness and marking.",
          event_type: "training",
          event_date: "2025-03-22",
          location: "Oak Creek Training Grounds, Wisconsin",
          organizer_name: "Pro Retriever Training",
          entry_fee: 75,
          max_participants: 25
        },
        {
          id: "3",
          title: "Hunter Safety & Ethics Seminar",
          description: "Important discussion on hunting ethics and safety practices.",
          event_type: "educational",
          event_date: "2025-03-10",
          location: "Online Webinar",
          organizer_name: "National Hunting Safety Foundation",
          entry_fee: 0,
          max_participants: 100
        }
      ]);
    }
  } catch (error) {
    console.error("List events error:", error);
    return errorResponse3("Failed to fetch events", 500);
  }
}
__name(listEvents, "listEvents");
async function addEvent(request, env) {
  try {
    const user = await authenticateUser2(request, env);
    if (!user.success) {
      return user.response;
    }
    const body = await request.json();
    const { title, description, eventType, eventDate, location, entryFee, maxParticipants } = body;
    if (!title || !eventDate || !location) {
      return errorResponse3("Title, date, and location are required", 400);
    }
    if (!env.DB) {
      return successResponse3({
        id: generateId3(),
        title,
        description,
        event_type: eventType || "trial",
        event_date: eventDate,
        location,
        entry_fee: entryFee || 0,
        max_participants: maxParticipants,
        message: "Demo event created - database not connected"
      });
    }
    const eventId = generateId3();
    await env.DB.prepare(`
            INSERT INTO events (
                id, organizer_id, title, description, event_type,
                event_date, location, entry_fee, max_participants
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
      eventId,
      user.data.userId,
      title,
      description || "",
      eventType || "trial",
      eventDate,
      location,
      entryFee || 0,
      maxParticipants
    ).run();
    return successResponse3({
      id: eventId,
      title,
      description,
      event_type: eventType || "trial",
      event_date: eventDate,
      location,
      entry_fee: entryFee || 0,
      max_participants: maxParticipants
    });
  } catch (error) {
    console.error("Add event error:", error);
    return errorResponse3("Failed to create event", 500);
  }
}
__name(addEvent, "addEvent");
async function authenticateUser2(request, env) {
  const token = extractToken3(request);
  if (!token) {
    return {
      success: false,
      response: errorResponse3("Authentication required", 401)
    };
  }
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || token));
    return {
      success: true,
      data: payload
    };
  } catch {
    return {
      success: false,
      response: errorResponse3("Invalid token", 401)
    };
  }
}
__name(authenticateUser2, "authenticateUser");
function extractToken3(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
__name(extractToken3, "extractToken");
function generateId3() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
__name(generateId3, "generateId");
function successResponse3(data) {
  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(successResponse3, "successResponse");
function errorResponse3(message, status = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(errorResponse3, "errorResponse");

// src/handlers/gear.js
async function gearHandler(request, path, env) {
  return new Response(JSON.stringify({
    success: true,
    data: [],
    message: "Gear reviews endpoint - coming soon"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(gearHandler, "gearHandler");

// src/handlers/ethics.js
async function ethicsHandler(request, path, env) {
  return new Response(JSON.stringify({
    success: true,
    data: [],
    message: "Ethics knowledge base - coming soon"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(ethicsHandler, "ethicsHandler");

// src/handlers/posts.js
async function postsHandler(request, path, env) {
  return new Response(JSON.stringify({
    success: true,
    data: [],
    message: "Brag board posts - coming soon"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(postsHandler, "postsHandler");

// src/handlers/analytics.js
async function analyticsHandler(request, path, env) {
  const method = request.method;
  try {
    if (path === "/api/analytics/overview" && method === "GET") {
      return await getOverview(request, env);
    } else if (path === "/api/analytics/endpoints" && method === "GET") {
      return await getEndpointMetrics(request, env);
    } else if (path === "/api/analytics/timeline" && method === "GET") {
      return await getTimelineData(request, env);
    } else if (path === "/api/analytics/errors" && method === "GET") {
      return await getErrorLogs(request, env);
    } else if (path === "/api/analytics/users" && method === "GET") {
      return await getUserMetrics(request, env);
    } else {
      return errorResponse4("Analytics endpoint not found", 404);
    }
  } catch (error) {
    console.error("Analytics handler error:", error);
    return errorResponse4("Analytics operation failed", 500);
  }
}
__name(analyticsHandler, "analyticsHandler");
async function getOverview(request, env) {
  if (!env.DB) {
    return errorResponse4("Database not available", 500);
  }
  try {
    const totalRequestsResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM api_requests"
    ).first();
    const todayRequestsResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM api_requests WHERE DATE(timestamp) = DATE('now')"
    ).first();
    const avgResponseResult = await env.DB.prepare(
      "SELECT AVG(response_time) as avg FROM api_requests WHERE timestamp >= datetime('now', '-24 hours')"
    ).first();
    const errorRateResult = await env.DB.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors
            FROM api_requests 
            WHERE timestamp >= datetime('now', '-24 hours')
        `).first();
    const uniqueUsersResult = await env.DB.prepare(
      "SELECT COUNT(DISTINCT user_id) as count FROM api_requests WHERE user_id IS NOT NULL"
    ).first();
    const todayUsersResult = await env.DB.prepare(
      "SELECT COUNT(DISTINCT user_id) as count FROM api_requests WHERE DATE(timestamp) = DATE('now') AND user_id IS NOT NULL"
    ).first();
    const topEndpointsResult = await env.DB.prepare(`
            SELECT 
                endpoint,
                COUNT(*) as calls,
                AVG(response_time) as avgTime
            FROM api_requests 
            WHERE timestamp >= datetime('now', '-24 hours')
            GROUP BY endpoint 
            ORDER BY calls DESC 
            LIMIT 5
        `).all();
    const recentActivityResult = await env.DB.prepare(`
            SELECT 
                strftime('%H:%M', timestamp) as time,
                endpoint,
                status_code as status,
                response_time as responseTime
            FROM api_requests 
            ORDER BY timestamp DESC 
            LIMIT 5
        `).all();
    const data = {
      summary: {
        total_requests: totalRequestsResult?.count || 0,
        unique_users: uniqueUsersResult?.count || 0,
        avg_response_time: Math.round(avgResponseResult?.avg || 0),
        error_rate: errorRateResult?.total > 0 ? errorRateResult.errors / errorRateResult.total : 0,
        uptime_percentage: 99.95
        // Fixed value for now
      },
      last_24h: {
        requests: todayRequestsResult?.count || 0,
        errors: errorRateResult?.errors || 0,
        new_users: todayUsersResult?.count || 0,
        avg_response_time: Math.round(avgResponseResult?.avg || 0)
      },
      popular_endpoints: topEndpointsResult.results?.map((row) => ({
        endpoint: row.endpoint,
        calls: row.calls,
        avg_time: Math.round(row.avgTime)
      })) || [],
      status_codes: {
        "200": Math.floor(Math.random() * 1e3) + 500,
        "201": Math.floor(Math.random() * 100) + 50,
        "400": Math.floor(Math.random() * 50) + 10,
        "401": Math.floor(Math.random() * 30) + 5,
        "404": Math.floor(Math.random() * 40) + 10,
        "500": Math.floor(Math.random() * 20) + 2
      }
    };
    return successResponse4(data);
  } catch (error) {
    console.error("Error fetching overview data:", error);
    return errorResponse4("Failed to fetch analytics data", 500);
  }
}
__name(getOverview, "getOverview");
async function getEndpointMetrics(request, env) {
  if (!env.DB) {
    return errorResponse4("Database not available", 500);
  }
  try {
    const endpointsResult = await env.DB.prepare(`
            SELECT 
                e.endpoint,
                e.method,
                e.total_calls as totalCalls,
                (e.success_calls * 100.0 / e.total_calls) as successRate,
                (e.total_response_time / e.total_calls) as averageResponseTime,
                e.min_response_time as minResponseTime,
                e.max_response_time as maxResponseTime,
                e.error_calls as errorCount,
                e.last_called as lastCalled
            FROM api_endpoints e
            ORDER BY e.total_calls DESC
        `).all();
    const endpoints = endpointsResult.results?.map((row) => ({
      endpoint: row.endpoint,
      method: row.method,
      total_calls: row.totalCalls,
      success_rate: row.successRate / 100,
      // Convert to decimal
      avg_response_time: Math.round(row.averageResponseTime),
      p95_response_time: Math.round(row.averageResponseTime * 1.5),
      // Estimate
      p99_response_time: Math.round(row.averageResponseTime * 2),
      // Estimate
      errors: {
        "400": Math.floor(row.errorCount * 0.4),
        "500": Math.floor(row.errorCount * 0.6)
      },
      hourly_distribution: generateHourlyData()
    })) || [];
    return successResponse4(endpoints);
  } catch (error) {
    console.error("Error fetching endpoint metrics:", error);
    return errorResponse4("Failed to fetch endpoint metrics", 500);
  }
}
__name(getEndpointMetrics, "getEndpointMetrics");
async function getTimelineData(request, env) {
  if (!env.DB) {
    return errorResponse4("Database not available", 500);
  }
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days")) || 7;
  try {
    const timelineResult = await env.DB.prepare(`
            SELECT 
                date,
                total_requests as requests,
                total_errors as errors,
                CASE 
                    WHEN total_requests > 0 THEN total_response_time / total_requests 
                    ELSE 0 
                END as avgResponseTime
            FROM api_daily_stats 
            WHERE date >= date('now', ? || ' days')
            ORDER BY date DESC
        `).bind(-days).all();
    const data = {
      timeline: timelineResult.results?.map((row) => ({
        date: row.date,
        requests: row.requests,
        errors: row.errors,
        avgResponseTime: Math.round(row.avgResponseTime)
      })) || []
    };
    return successResponse4(data);
  } catch (error) {
    console.error("Error fetching timeline data:", error);
    return errorResponse4("Failed to fetch timeline data", 500);
  }
}
__name(getTimelineData, "getTimelineData");
async function getErrorLogs(request, env) {
  if (!env.DB) {
    return errorResponse4("Database not available", 500);
  }
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit")) || 50;
  try {
    const errorsResult = await env.DB.prepare(`
            SELECT 
                timestamp,
                endpoint,
                method,
                status_code as statusCode,
                error_message as errorMessage,
                user_agent as userAgent,
                ip_address as ipAddress
            FROM error_log 
            ORDER BY timestamp DESC 
            LIMIT ?
        `).bind(limit).all();
    const data = {
      errors: errorsResult.results?.map((row) => ({
        timestamp: row.timestamp,
        endpoint: row.endpoint,
        method: row.method,
        statusCode: row.statusCode,
        errorMessage: row.errorMessage,
        userAgent: row.userAgent,
        ipAddress: row.ipAddress
      })) || []
    };
    return successResponse4(data);
  } catch (error) {
    console.error("Error fetching error logs:", error);
    return errorResponse4("Failed to fetch error logs", 500);
  }
}
__name(getErrorLogs, "getErrorLogs");
async function getUserMetrics(request, env) {
  if (!env.DB) {
    return errorResponse4("Database not available", 500);
  }
  const url = new URL(request.url);
  const timeframe = url.searchParams.get("timeframe") || "24h";
  try {
    let timeCondition = "timestamp >= datetime('now', '-24 hours')";
    if (timeframe === "7d") {
      timeCondition = "timestamp >= datetime('now', '-7 days')";
    } else if (timeframe === "30d") {
      timeCondition = "timestamp >= datetime('now', '-30 days')";
    }
    const totalUsersResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM user_activity"
    ).first();
    const activeUsersResult = await env.DB.prepare(`
            SELECT COUNT(DISTINCT user_id) as count 
            FROM api_requests 
            WHERE ${timeCondition} AND user_id IS NOT NULL
        `).first();
    const newUsersResult = await env.DB.prepare(`
            SELECT COUNT(*) as count 
            FROM user_activity 
            WHERE first_seen >= datetime('now', '-${timeframe === "24h" ? "24 hours" : timeframe === "7d" ? "7 days" : "30 days"}')
        `).first();
    const userActivityResult = await env.DB.prepare(`
            SELECT 
                user_id as userId,
                total_requests as requests,
                last_seen as lastSeen,
                ip_address as ipAddress
            FROM user_activity 
            ORDER BY total_requests DESC 
            LIMIT 10
        `).all();
    const data = {
      totalUsers: totalUsersResult?.count || 0,
      activeUsers: activeUsersResult?.count || 0,
      newUsers: newUsersResult?.count || 0,
      userActivity: userActivityResult.results?.map((row) => ({
        userId: row.userId,
        requests: row.requests,
        lastSeen: row.lastSeen,
        ipAddress: row.ipAddress
      })) || [],
      topCountries: []
      // Country detection would require additional IP geolocation service
    };
    return successResponse4(data);
  } catch (error) {
    console.error("Error fetching user metrics:", error);
    return errorResponse4("Failed to fetch user metrics", 500);
  }
}
__name(getUserMetrics, "getUserMetrics");
function generateHourlyData() {
  const data = [];
  for (let i = 0; i < 24; i++) {
    data.push({
      hour: i,
      requests: Math.floor(Math.random() * 100) + 20
    });
  }
  return data;
}
__name(generateHourlyData, "generateHourlyData");
function successResponse4(data, message) {
  return new Response(JSON.stringify({
    success: true,
    data,
    message: message || void 0
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
__name(successResponse4, "successResponse");
function errorResponse4(message, status = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(errorResponse4, "errorResponse");

// src/handlers/styler.js
async function stylerHandler(request, path, env) {
  const method = request.method;
  try {
    if (path === "/api/styler/config" && method === "GET") {
      return await getStyleConfig(request, env);
    } else if (path === "/api/styler/config" && method === "PUT") {
      return await updateStyleConfig(request, env);
    } else if (path === "/api/styler/themes" && method === "GET") {
      return await getThemes(request, env);
    } else if (path === "/api/styler/theme" && method === "POST") {
      return await createTheme(request, env);
    } else if (path === "/api/styler/preview" && method === "POST") {
      return await previewStyles(request, env);
    } else if (path === "/api/styler/export" && method === "GET") {
      return await exportStyles(request, env);
    } else {
      return errorResponse5("Styler endpoint not found", 404);
    }
  } catch (error) {
    console.error("Styler handler error:", error);
    return errorResponse5("Styler operation failed", 500);
  }
}
__name(stylerHandler, "stylerHandler");
async function getStyleConfig(request, env) {
  try {
    if (env.CACHE) {
      const config = await env.CACHE.get("style_config", "json");
      if (config) {
        return successResponse5(config);
      }
    }
    return successResponse5({
      theme: "default",
      colors: {
        primary: {
          name: "Hunta Green",
          value: "#2D5530",
          rgb: "45, 85, 48",
          usage: "Primary brand color, buttons, headers"
        },
        primaryLight: {
          name: "Hunta Green Light",
          value: "#3A6B3E",
          rgb: "58, 107, 62",
          usage: "Hover states, secondary buttons"
        },
        secondary: {
          name: "Hunta Orange",
          value: "#D97706",
          rgb: "217, 119, 6",
          usage: "Accent color, alerts, CTAs"
        },
        background: {
          name: "Background",
          value: "#F9FAFB",
          rgb: "249, 250, 251",
          usage: "Main background color"
        },
        surface: {
          name: "Surface",
          value: "#FFFFFF",
          rgb: "255, 255, 255",
          usage: "Cards, modals, elevated surfaces"
        },
        text: {
          name: "Text Primary",
          value: "#1F2937",
          rgb: "31, 41, 55",
          usage: "Main text color"
        },
        textSecondary: {
          name: "Text Secondary",
          value: "#6B7280",
          rgb: "107, 114, 128",
          usage: "Secondary text, hints"
        },
        border: {
          name: "Border",
          value: "#E5E7EB",
          rgb: "229, 231, 235",
          usage: "Borders, dividers"
        },
        success: {
          name: "Success",
          value: "#10B981",
          rgb: "16, 185, 129",
          usage: "Success messages, positive states"
        },
        warning: {
          name: "Warning",
          value: "#F59E0B",
          rgb: "245, 158, 11",
          usage: "Warning messages, caution states"
        },
        error: {
          name: "Error",
          value: "#EF4444",
          rgb: "239, 68, 68",
          usage: "Error messages, destructive actions"
        }
      },
      typography: {
        fontFamily: {
          primary: "'Inter', system-ui, -apple-system, sans-serif",
          secondary: "'Inter', sans-serif",
          mono: "'Fira Code', 'Consolas', monospace"
        },
        fontSize: {
          xs: "0.75rem",
          // 12px
          sm: "0.875rem",
          // 14px
          base: "1rem",
          // 16px
          lg: "1.125rem",
          // 18px
          xl: "1.25rem",
          // 20px
          "2xl": "1.5rem",
          // 24px
          "3xl": "1.875rem",
          // 30px
          "4xl": "2.25rem",
          // 36px
          "5xl": "3rem"
          // 48px
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        },
        lineHeight: {
          none: 1,
          tight: 1.25,
          snug: 1.375,
          normal: 1.5,
          relaxed: 1.625,
          loose: 2
        }
      },
      spacing: {
        xs: "0.25rem",
        // 4px
        sm: "0.5rem",
        // 8px
        md: "1rem",
        // 16px
        lg: "1.5rem",
        // 24px
        xl: "2rem",
        // 32px
        "2xl": "3rem",
        // 48px
        "3xl": "4rem"
        // 64px
      },
      borderRadius: {
        none: "0",
        sm: "0.125rem",
        // 2px
        base: "0.25rem",
        // 4px
        md: "0.375rem",
        // 6px
        lg: "0.5rem",
        // 8px
        xl: "0.75rem",
        // 12px
        "2xl": "1rem",
        // 16px
        "3xl": "1.5rem",
        // 24px
        full: "9999px"
      },
      shadows: {
        none: "none",
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      },
      animations: {
        transition: {
          fast: "150ms",
          base: "300ms",
          slow: "500ms"
        },
        easing: {
          linear: "linear",
          in: "cubic-bezier(0.4, 0, 1, 1)",
          out: "cubic-bezier(0, 0, 0.2, 1)",
          inOut: "cubic-bezier(0.4, 0, 0.2, 1)"
        }
      },
      components: {
        button: {
          padding: "0.5rem 1rem",
          borderRadius: "0.375rem",
          fontWeight: 500,
          transition: "all 150ms ease-in-out"
        },
        card: {
          padding: "1.5rem",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          background: "#FFFFFF"
        },
        input: {
          padding: "0.5rem 0.75rem",
          borderRadius: "0.375rem",
          borderWidth: "1px",
          fontSize: "1rem"
        },
        navbar: {
          height: "4rem",
          background: "#2D5530",
          color: "#FFFFFF"
        }
      }
    });
  } catch (error) {
    console.error("Get style config error:", error);
    return errorResponse5("Failed to fetch style configuration", 500);
  }
}
__name(getStyleConfig, "getStyleConfig");
async function updateStyleConfig(request, env) {
  try {
    const body = await request.json();
    if (!body.colors || !body.typography || !body.spacing) {
      return errorResponse5("Invalid configuration structure", 400);
    }
    if (env.CACHE) {
      await env.CACHE.put("style_config", JSON.stringify(body), {
        expirationTtl: 86400 * 30
        // 30 days
      });
    }
    const css = generateCSS(body);
    return successResponse5({
      message: "Style configuration updated successfully",
      config: body,
      generated_css: css
    });
  } catch (error) {
    console.error("Update style config error:", error);
    return errorResponse5("Failed to update style configuration", 500);
  }
}
__name(updateStyleConfig, "updateStyleConfig");
async function getThemes(request, env) {
  try {
    return successResponse5([
      {
        id: "default",
        name: "Hunta Classic",
        description: "The original Hunta theme with forest green and earthy tones",
        preview: {
          primary: "#2D5530",
          secondary: "#D97706",
          background: "#F9FAFB"
        }
      },
      {
        id: "midnight",
        name: "Midnight Hunter",
        description: "Dark theme for night hunting preparation",
        preview: {
          primary: "#1e3a8a",
          secondary: "#f59e0b",
          background: "#0f172a"
        }
      },
      {
        id: "autumn",
        name: "Autumn Woods",
        description: "Warm autumn colors inspired by fall hunting season",
        preview: {
          primary: "#92400e",
          secondary: "#ea580c",
          background: "#fef3c7"
        }
      },
      {
        id: "winter",
        name: "Winter Field",
        description: "Cool blues and whites for winter hunting",
        preview: {
          primary: "#1e40af",
          secondary: "#7c3aed",
          background: "#f0f9ff"
        }
      }
    ]);
  } catch (error) {
    console.error("Get themes error:", error);
    return errorResponse5("Failed to fetch themes", 500);
  }
}
__name(getThemes, "getThemes");
async function createTheme(request, env) {
  try {
    const body = await request.json();
    const { name, description, config } = body;
    if (!name || !config) {
      return errorResponse5("Name and configuration required", 400);
    }
    const themeId = name.toLowerCase().replace(/\s+/g, "-");
    if (env.CACHE) {
      const themes = await env.CACHE.get("custom_themes", "json") || [];
      themes.push({
        id: themeId,
        name,
        description,
        config,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      await env.CACHE.put("custom_themes", JSON.stringify(themes));
    }
    return successResponse5({
      message: "Theme created successfully",
      theme: {
        id: themeId,
        name,
        description,
        config
      }
    });
  } catch (error) {
    console.error("Create theme error:", error);
    return errorResponse5("Failed to create theme", 500);
  }
}
__name(createTheme, "createTheme");
async function previewStyles(request, env) {
  try {
    const body = await request.json();
    const { config } = body;
    if (!config) {
      return errorResponse5("Configuration required for preview", 400);
    }
    const css = generateCSS(config);
    const html = generatePreviewHTML(config);
    return successResponse5({
      css,
      html,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Preview styles error:", error);
    return errorResponse5("Failed to generate preview", 500);
  }
}
__name(previewStyles, "previewStyles");
async function exportStyles(request, env) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "css";
    let config;
    if (env.CACHE) {
      config = await env.CACHE.get("style_config", "json");
    } else {
      const defaultResponse = await getStyleConfig(request, env);
      const defaultData = await defaultResponse.json();
      config = defaultData.data;
    }
    let output;
    let contentType;
    switch (format) {
      case "css":
        output = generateCSS(config);
        contentType = "text/css";
        break;
      case "json":
        output = JSON.stringify(config, null, 2);
        contentType = "application/json";
        break;
      case "scss":
        output = generateSCSS(config);
        contentType = "text/x-scss";
        break;
      case "tailwind":
        output = generateTailwindConfig(config);
        contentType = "application/javascript";
        break;
      default:
        return errorResponse5("Invalid export format", 400);
    }
    return new Response(output, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="hunta-styles.${format}"`
      }
    });
  } catch (error) {
    console.error("Export styles error:", error);
    return errorResponse5("Failed to export styles", 500);
  }
}
__name(exportStyles, "exportStyles");
function generateCSS(config) {
  const { colors, typography, spacing, borderRadius, shadows } = config;
  let css = ":root {\n";
  Object.entries(colors).forEach(([key, color]) => {
    css += `  --color-${camelToKebab(key)}: ${color.value};
`;
    css += `  --color-${camelToKebab(key)}-rgb: ${color.rgb};
`;
  });
  css += "\n  /* Typography */\n";
  Object.entries(typography.fontSize).forEach(([key, value]) => {
    css += `  --font-size-${key}: ${value};
`;
  });
  css += "\n  /* Spacing */\n";
  Object.entries(spacing).forEach(([key, value]) => {
    css += `  --spacing-${key}: ${value};
`;
  });
  css += "\n  /* Border Radius */\n";
  Object.entries(borderRadius).forEach(([key, value]) => {
    css += `  --radius-${key}: ${value};
`;
  });
  css += "}\n\n";
  css += generateComponentStyles(config);
  return css;
}
__name(generateCSS, "generateCSS");
function generateComponentStyles(config) {
  const { colors, components } = config;
  return `
/* Button Styles */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  padding: ${components.button.padding};
  border-radius: ${components.button.borderRadius};
  font-weight: ${components.button.fontWeight};
  transition: ${components.button.transition};
}

.btn-primary:hover {
  background-color: var(--color-primary-light);
}

/* Card Styles */
.card {
  background: ${components.card.background};
  padding: ${components.card.padding};
  border-radius: ${components.card.borderRadius};
  box-shadow: ${components.card.boxShadow};
}

/* Input Styles */
.input {
  padding: ${components.input.padding};
  border-radius: ${components.input.borderRadius};
  border: ${components.input.borderWidth} solid var(--color-border);
  font-size: ${components.input.fontSize};
}

/* Navbar Styles */
.navbar {
  height: ${components.navbar.height};
  background: ${components.navbar.background};
  color: ${components.navbar.color};
}
`;
}
__name(generateComponentStyles, "generateComponentStyles");
function generateSCSS(config) {
  const { colors, typography, spacing } = config;
  let scss = "// Hunta SCSS Variables\n\n";
  scss += "// Colors\n";
  Object.entries(colors).forEach(([key, color]) => {
    scss += `$${camelToKebab(key)}: ${color.value};
`;
  });
  scss += "\n// Typography\n";
  Object.entries(typography.fontSize).forEach(([key, value]) => {
    scss += `$font-size-${key}: ${value};
`;
  });
  return scss;
}
__name(generateSCSS, "generateSCSS");
function generateTailwindConfig(config) {
  const { colors, typography, spacing } = config;
  return `module.exports = {
  theme: {
    extend: {
      colors: {
        hunta: {
          green: '${colors.primary.value}',
          'green-light': '${colors.primaryLight.value}',
          orange: '${colors.secondary.value}',
        }
      },
      fontFamily: {
        sans: ${typography.fontFamily.primary},
      }
    }
  }
}`;
}
__name(generateTailwindConfig, "generateTailwindConfig");
function generatePreviewHTML(config) {
  return `
<div class="preview-container" style="padding: 2rem;">
  <h2>Style Preview</h2>
  
  <div class="colors" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 2rem 0;">
    ${Object.entries(config.colors).map(([key, color]) => `
      <div style="text-align: center;">
        <div style="width: 100px; height: 100px; background: ${color.value}; border-radius: 8px; margin: 0 auto;"></div>
        <p style="margin-top: 0.5rem; font-weight: 500;">${color.name}</p>
        <p style="font-size: 0.875rem; color: #666;">${color.value}</p>
      </div>
    `).join("")}
  </div>
  
  <div class="components" style="margin: 2rem 0;">
    <h3>Components</h3>
    <button class="btn-primary">Primary Button</button>
    <div class="card" style="margin: 1rem 0;">
      <h4>Card Component</h4>
      <p>This is a card with the current styling applied.</p>
    </div>
    <input class="input" placeholder="Input field" style="display: block; margin: 1rem 0;">
  </div>
</div>
`;
}
__name(generatePreviewHTML, "generatePreviewHTML");
function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
__name(camelToKebab, "camelToKebab");
function successResponse5(data, message) {
  return new Response(JSON.stringify({
    success: true,
    data,
    message: message || void 0
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
__name(successResponse5, "successResponse");
function errorResponse5(message, status = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(errorResponse5, "errorResponse");

// src/middleware/analytics.js
var AnalyticsMiddleware = class {
  static {
    __name(this, "AnalyticsMiddleware");
  }
  constructor(env) {
    this.env = env;
  }
  async trackRequest(request, response, startTime, error = null) {
    if (!this.env.DB) {
      console.log("Database not available for analytics tracking");
      return;
    }
    try {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;
      const userAgent = request.headers.get("user-agent") || "";
      const userIP = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
      let userId = null;
      const authHeader = request.headers.get("authorization");
      if (authHeader) {
        try {
          const token = authHeader.replace("Bearer ", "");
          const payload = JSON.parse(atob(token.split(".")[1] || "{}"));
          userId = payload.userId || payload.sub;
        } catch (e) {
        }
      }
      const statusCode = response?.status || (error ? 500 : 200);
      const responseSize = response?.headers?.get("content-length") || 0;
      const requestId = this.generateRequestId();
      await this.logRequest({
        requestId,
        method,
        endpoint: this.normalizeEndpoint(path),
        fullPath: path,
        statusCode,
        responseTime,
        userId,
        userAgent,
        ipAddress: userIP,
        requestSize: await this.getRequestSize(request),
        responseSize: parseInt(responseSize) || 0,
        errorMessage: error?.message || null,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      await this.updateEndpointStats(method, this.normalizeEndpoint(path), statusCode, responseTime);
      await this.updateDailyStats(statusCode, responseTime, userId);
      if (userId) {
        await this.trackUserActivity(userId, userIP, userAgent);
      }
      if (error || statusCode >= 400) {
        await this.logError({
          endpoint: this.normalizeEndpoint(path),
          method,
          statusCode,
          errorMessage: error?.message || `HTTP ${statusCode}`,
          stackTrace: error?.stack || null,
          userId,
          requestId,
          userAgent,
          ipAddress: userIP,
          requestBody: await this.getRequestBody(request)
        });
      }
    } catch (trackingError) {
      console.error("Analytics tracking error:", trackingError);
    }
  }
  async logRequest(data) {
    try {
      await this.env.DB.prepare(`
                INSERT INTO api_requests (
                    id, method, endpoint, full_path, status_code, response_time,
                    user_id, user_agent, ip_address, request_size, response_size, 
                    error_message, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
        data.requestId,
        data.method,
        data.endpoint,
        data.fullPath,
        data.statusCode,
        data.responseTime,
        data.userId,
        data.userAgent,
        data.ipAddress,
        data.requestSize,
        data.responseSize,
        data.errorMessage,
        data.timestamp
      ).run();
    } catch (error) {
      console.error("Failed to log request:", error);
    }
  }
  async updateEndpointStats(method, endpoint, statusCode, responseTime) {
    try {
      const isSuccess = statusCode >= 200 && statusCode < 400;
      const isError = statusCode >= 400;
      const result = await this.env.DB.prepare(`
                UPDATE api_endpoints 
                SET 
                    total_calls = total_calls + 1,
                    success_calls = success_calls + ?,
                    error_calls = error_calls + ?,
                    total_response_time = total_response_time + ?,
                    min_response_time = CASE 
                        WHEN min_response_time = 0 OR ? < min_response_time THEN ? 
                        ELSE min_response_time 
                    END,
                    max_response_time = CASE 
                        WHEN ? > max_response_time THEN ? 
                        ELSE max_response_time 
                    END,
                    last_called = datetime('now'),
                    updated_at = datetime('now')
                WHERE endpoint = ? AND method = ?
            `).bind(
        isSuccess ? 1 : 0,
        isError ? 1 : 0,
        responseTime,
        responseTime,
        responseTime,
        responseTime,
        responseTime,
        endpoint,
        method
      ).run();
      if (result.changes === 0) {
        await this.env.DB.prepare(`
                    INSERT INTO api_endpoints (
                        endpoint, method, total_calls, success_calls, error_calls,
                        total_response_time, min_response_time, max_response_time, last_called
                    ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, datetime('now'))
                `).bind(
          endpoint,
          method,
          isSuccess ? 1 : 0,
          isError ? 1 : 0,
          responseTime,
          responseTime,
          responseTime
        ).run();
      }
    } catch (error) {
      console.error("Failed to update endpoint stats:", error);
    }
  }
  async updateDailyStats(statusCode, responseTime, userId) {
    try {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const statusField = this.getStatusField(statusCode);
      const result = await this.env.DB.prepare(`
                UPDATE api_daily_stats 
                SET 
                    total_requests = total_requests + 1,
                    total_errors = total_errors + ?,
                    total_response_time = total_response_time + ?,
                    ${statusField} = ${statusField} + 1
                WHERE date = ?
            `).bind(
        statusCode >= 400 ? 1 : 0,
        responseTime,
        today
      ).run();
      if (result.changes === 0) {
        await this.env.DB.prepare(`
                    INSERT INTO api_daily_stats (
                        date, total_requests, total_errors, total_response_time, ${statusField}
                    ) VALUES (?, 1, ?, ?, 1)
                `).bind(
          today,
          statusCode >= 400 ? 1 : 0,
          responseTime
        ).run();
      }
      if (userId) {
        await this.updateUniqueUsersCount(today, userId);
      }
    } catch (error) {
      console.error("Failed to update daily stats:", error);
    }
  }
  async trackUserActivity(userId, ipAddress, userAgent) {
    try {
      const result = await this.env.DB.prepare(`
                UPDATE user_activity 
                SET 
                    last_seen = datetime('now'),
                    total_requests = total_requests + 1
                WHERE user_id = ?
            `).bind(userId).run();
      if (result.changes === 0) {
        await this.env.DB.prepare(`
                    INSERT INTO user_activity (
                        user_id, ip_address, user_agent, total_requests
                    ) VALUES (?, ?, ?, 1)
                `).bind(userId, ipAddress, userAgent).run();
      }
    } catch (error) {
      console.error("Failed to track user activity:", error);
    }
  }
  async logError(data) {
    try {
      await this.env.DB.prepare(`
                INSERT INTO error_log (
                    endpoint, method, status_code, error_message, stack_trace,
                    user_id, request_id, user_agent, ip_address, request_body
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
        data.endpoint,
        data.method,
        data.statusCode,
        data.errorMessage,
        data.stackTrace,
        data.userId,
        data.requestId,
        data.userAgent,
        data.ipAddress,
        data.requestBody
      ).run();
    } catch (error) {
      console.error("Failed to log error:", error);
    }
  }
  // Helper methods
  normalizeEndpoint(path) {
    return path.replace(/\/[0-9a-f-]{36}/g, "/{id}").replace(/\/\d+/g, "/{id}").replace(/\/[a-zA-Z0-9_-]+@[a-zA-Z0-9.-]+/g, "/{email}").toLowerCase();
  }
  generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
  async getRequestSize(request) {
    try {
      const contentLength = request.headers.get("content-length");
      return contentLength ? parseInt(contentLength) : 0;
    } catch (error) {
      return 0;
    }
  }
  async getRequestBody(request) {
    try {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const clone = request.clone();
        const body = await clone.text();
        return body.length > 1e3 ? body.substring(0, 1e3) + "..." : body;
      }
    } catch (error) {
    }
    return null;
  }
  getStatusField(statusCode) {
    const code = Math.floor(statusCode);
    const validCodes = [200, 201, 400, 401, 404, 500];
    return validCodes.includes(code) ? `status_${code}` : "status_500";
  }
  async updateUniqueUsersCount(date, userId) {
    try {
      const existing = await this.env.DB.prepare(`
                SELECT COUNT(*) as count FROM api_requests 
                WHERE DATE(timestamp) = ? AND user_id = ?
            `).bind(date, userId).first();
      if (existing?.count === 1) {
        await this.env.DB.prepare(`
                    UPDATE api_daily_stats 
                    SET unique_users = unique_users + 1 
                    WHERE date = ?
                `).bind(date).run();
      }
    } catch (error) {
      console.error("Failed to update unique users count:", error);
    }
  }
};

// src/index.js
var HuntaAPI = class {
  static {
    __name(this, "HuntaAPI");
  }
  constructor(env) {
    this.env = env;
    this.db = env.DB;
    this.cache = env.CACHE;
    this.media = env.MEDIA;
    this.analytics = new AnalyticsMiddleware(env);
  }
  async handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const startTime = Date.now();
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }
    let response;
    let error = null;
    try {
      if (path === "/health") {
        response = await this.healthCheck();
      } else if (path.startsWith("/api/auth/")) {
        response = await authHandler(request, path, this.env);
      } else if (path.startsWith("/api/users/")) {
        response = await usersHandler(request, path, this.env);
      } else if (path.startsWith("/api/dogs/")) {
        response = await dogsHandler(request, path, this.env);
      } else if (path.startsWith("/api/routes/")) {
        response = await routesHandler(request, path, this.env);
      } else if (path.startsWith("/api/events/")) {
        response = await eventsHandler(request, path, this.env);
      } else if (path.startsWith("/api/gear/")) {
        response = await gearHandler(request, path, this.env);
      } else if (path.startsWith("/api/ethics/")) {
        response = await ethicsHandler(request, path, this.env);
      } else if (path.startsWith("/api/posts/")) {
        response = await postsHandler(request, path, this.env);
      } else if (path.startsWith("/api/analytics/")) {
        response = await analyticsHandler(request, path, this.env);
      } else if (path.startsWith("/api/styler/")) {
        response = await stylerHandler(request, path, this.env);
      } else if (path.startsWith("/api/")) {
        response = this.apiNotFound();
      } else {
        response = this.serveInfo();
      }
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
      if (path.startsWith("/api/")) {
        this.analytics.trackRequest(request, response, startTime, error).catch(console.error);
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (err) {
      error = err;
      console.error("Request error:", error);
      response = this.errorResponse("Internal server error", 500, corsHeaders);
      if (path.startsWith("/api/")) {
        this.analytics.trackRequest(request, response, startTime, error).catch(console.error);
      }
      return response;
    }
  }
  async healthCheck() {
    const status = {
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "2.0.0",
      environment: this.env.ENVIRONMENT || "development",
      database: this.db ? "connected" : "not configured",
      cache: this.cache ? "connected" : "not configured",
      media: this.media ? "connected" : "not configured"
    };
    return new Response(JSON.stringify(status), {
      headers: { "Content-Type": "application/json" }
    });
  }
  apiNotFound() {
    return this.errorResponse("API endpoint not found", 404);
  }
  serveInfo() {
    const info = {
      name: "Hunta API",
      version: "2.0.0",
      description: "Elite dog hunting platform backend",
      endpoints: [
        "GET /health - System health check",
        "POST /api/auth/register - User registration",
        "POST /api/auth/login - User login",
        "GET /api/dogs/list - List user dogs",
        "GET /api/events/list - List upcoming events",
        "GET /api/gear/reviews - Gear reviews",
        "GET /api/posts/feed - Community posts"
      ]
    };
    return new Response(JSON.stringify(info, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }
  errorResponse(message, status = 500, additionalHeaders = {}) {
    return new Response(JSON.stringify({
      success: false,
      error: message,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...additionalHeaders
      }
    });
  }
};
var src_default = {
  async fetch(request, env, ctx) {
    const api = new HuntaAPI(env);
    return await api.handleRequest(request);
  }
};

// ../../../findrawdogfood/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../findrawdogfood/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-6dpypm/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../findrawdogfood/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-6dpypm/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
