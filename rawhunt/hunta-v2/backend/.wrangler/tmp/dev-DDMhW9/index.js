var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-5cqmL9/checked-fetch.js
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
    try {
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
    } catch (dbError) {
      console.error("Database error, using demo mode:", dbError);
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
        message: "Demo dog added - database error occurred"
      });
    }
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
  if (token === "demo-token") {
    return {
      success: true,
      data: {
        userId: "demo-user",
        username: "Demo Hunter",
        email: "demo@hunta.com"
      }
    };
  }
  if (!token) {
    return {
      success: false,
      response: errorResponse2('Authentication required - use "demo-token" for demo access', 401)
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
      response: errorResponse2('Invalid token - use "demo-token" for demo access', 401)
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
  const method = request.method;
  const db = env.DB;
  try {
    if (db) {
      await db.exec(`
                CREATE TABLE IF NOT EXISTS routes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    location TEXT NOT NULL,
                    difficulty TEXT DEFAULT 'moderate',
                    terrain_type TEXT DEFAULT 'mixed',
                    game_type TEXT DEFAULT 'upland',  
                    description TEXT,
                    notes TEXT,
                    distance REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
      if (path === "/api/routes/list" && method === "GET") {
        return await listRoutes(db);
      } else if (path === "/api/routes/create" && method === "POST") {
        return await createRoute(request, db);
      } else if (path.startsWith("/api/routes/update/") && method === "PUT") {
        const id = path.split("/").pop();
        return await updateRoute(request, db, id);
      } else if (path.startsWith("/api/routes/delete/") && method === "DELETE") {
        const id = path.split("/").pop();
        return await deleteRoute(db, id);
      }
    } else {
      if (path === "/api/routes/list" && method === "GET") {
        return await listRoutesDemo();
      } else if (path === "/api/routes/create" && method === "POST") {
        return await createRouteDemo(request);
      } else if (path.startsWith("/api/routes/update/") && method === "PUT") {
        const id = path.split("/").pop();
        return await updateRouteDemo(request, id);
      } else if (path.startsWith("/api/routes/delete/") && method === "DELETE") {
        const id = path.split("/").pop();
        return await deleteRouteDemo(id);
      }
    }
    return new Response(JSON.stringify({
      success: false,
      error: "Routes endpoint not found"
    }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Routes handler error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Internal server error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(routesHandler, "routesHandler");
async function listRoutes(db) {
  const result = await db.prepare("SELECT * FROM routes ORDER BY created_at DESC").all();
  return new Response(JSON.stringify({
    success: true,
    data: result.results || []
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(listRoutes, "listRoutes");
async function createRoute(request, db) {
  const route = await request.json();
  if (!route.name || !route.location) {
    return new Response(JSON.stringify({
      success: false,
      error: "Name and location are required"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const stmt = await db.prepare(`
        INSERT INTO routes (name, location, difficulty, terrain_type, game_type, description, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
  const result = await stmt.bind(
    route.name,
    route.location,
    route.difficulty || "moderate",
    route.terrain_type || "mixed",
    route.game_type || "upland",
    route.description || "",
    route.notes || ""
  ).run();
  if (!result.success) {
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to create route"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({
    success: true,
    data: { id: result.meta.last_row_id, ...route }
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(createRoute, "createRoute");
async function updateRoute(request, db, id) {
  const route = await request.json();
  if (!id || isNaN(id)) {
    return new Response(JSON.stringify({
      success: false,
      error: "Invalid route ID"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const stmt = await db.prepare(`
        UPDATE routes 
        SET name = ?, location = ?, difficulty = ?, terrain_type = ?, game_type = ?, 
            description = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
  const result = await stmt.bind(
    route.name,
    route.location,
    route.difficulty || "moderate",
    route.terrain_type || "mixed",
    route.game_type || "upland",
    route.description || "",
    route.notes || "",
    id
  ).run();
  if (!result.success) {
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to update route"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({
    success: true,
    data: { id: parseInt(id), ...route }
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(updateRoute, "updateRoute");
async function deleteRoute(db, id) {
  if (!id || isNaN(id)) {
    return new Response(JSON.stringify({
      success: false,
      error: "Invalid route ID"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const stmt = await db.prepare("DELETE FROM routes WHERE id = ?");
  const result = await stmt.bind(id).run();
  if (!result.success) {
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to delete route"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({
    success: true,
    message: "Route deleted successfully"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(deleteRoute, "deleteRoute");
var demoRoutes = [
  {
    id: 1,
    name: "North Ridge Trail",
    location: "Pine Valley State Park, Colorado",
    difficulty: "moderate",
    terrain_type: "hills",
    game_type: "upland",
    description: "A scenic trail through pine forests with excellent upland bird hunting opportunities. Multiple water sources and varied elevation.",
    notes: "Best accessed from the north parking area. Permission needed for private land section.",
    distance: 3.2,
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T10:30:00Z"
  },
  {
    id: 2,
    name: "Wetland Loop",
    location: "Marsh Creek Wildlife Area, Montana",
    difficulty: "easy",
    terrain_type: "marsh",
    game_type: "waterfowl",
    description: "Easy walking route around managed wetlands. Great for duck and geese hunting during migration seasons.",
    notes: "Check water levels before heading out. Requires state hunting license and waterfowl stamp.",
    distance: 2.1,
    created_at: "2025-01-20T14:15:00Z",
    updated_at: "2025-01-20T14:15:00Z"
  },
  {
    id: 3,
    name: "Canyon Creek Route",
    location: "Red Rock Canyon, Utah",
    difficulty: "difficult",
    terrain_type: "mixed",
    game_type: "big_game",
    description: "Challenging backcountry route through rugged canyon terrain. Excellent for mule deer and elk during rifle season.",
    notes: "Requires 4WD vehicle to reach trailhead. Overnight camping permitted with permit.",
    distance: 8.7,
    created_at: "2025-01-25T08:45:00Z",
    updated_at: "2025-01-25T08:45:00Z"
  }
];
async function listRoutesDemo() {
  return new Response(JSON.stringify({
    success: true,
    data: demoRoutes
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(listRoutesDemo, "listRoutesDemo");
async function createRouteDemo(request) {
  const route = await request.json();
  if (!route.name || !route.location) {
    return new Response(JSON.stringify({
      success: false,
      error: "Name and location are required"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const newRoute = {
    id: Math.max(...demoRoutes.map((r) => r.id)) + 1,
    name: route.name,
    location: route.location,
    difficulty: route.difficulty || "moderate",
    terrain_type: route.terrain_type || "mixed",
    game_type: route.game_type || "upland",
    description: route.description || "",
    notes: route.notes || "",
    distance: route.distance || null,
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  demoRoutes.unshift(newRoute);
  return new Response(JSON.stringify({
    success: true,
    data: newRoute
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(createRouteDemo, "createRouteDemo");
async function updateRouteDemo(request, id) {
  const route = await request.json();
  const routeIndex = demoRoutes.findIndex((r) => r.id === parseInt(id));
  if (routeIndex === -1) {
    return new Response(JSON.stringify({
      success: false,
      error: "Route not found"
    }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  demoRoutes[routeIndex] = {
    ...demoRoutes[routeIndex],
    name: route.name,
    location: route.location,
    difficulty: route.difficulty || "moderate",
    terrain_type: route.terrain_type || "mixed",
    game_type: route.game_type || "upland",
    description: route.description || "",
    notes: route.notes || "",
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  return new Response(JSON.stringify({
    success: true,
    data: demoRoutes[routeIndex]
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(updateRouteDemo, "updateRouteDemo");
async function deleteRouteDemo(id) {
  const routeIndex = demoRoutes.findIndex((r) => r.id === parseInt(id));
  if (routeIndex === -1) {
    return new Response(JSON.stringify({
      success: false,
      error: "Route not found"
    }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  demoRoutes.splice(routeIndex, 1);
  return new Response(JSON.stringify({
    success: true,
    message: "Route deleted successfully"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(deleteRouteDemo, "deleteRouteDemo");

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
  const url = new URL(request.url);
  const method = request.method;
  try {
    if (method === "GET" && path === "/api/gear/reviews") {
      const { results } = await env.ANALYTICS_DB.prepare(`
                SELECT 
                    id,
                    gear_name as item_name,
                    gear_category as category,
                    brand,
                    model,
                    rating,
                    review_text,
                    pros,
                    cons,
                    recommended,
                    price_range,
                    photo_url,
                    created_at,
                    'Anonymous Hunter' as reviewer_name
                FROM gear_reviews 
                ORDER BY created_at DESC
            `).all();
      return new Response(JSON.stringify({
        success: true,
        data: results || [],
        count: results?.length || 0
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (method === "POST" && path === "/api/gear/reviews") {
      const body = await request.json();
      const { item_name, brand, category, rating, pros, cons, review_text, recommended } = body;
      if (!item_name || !category || !rating) {
        return new Response(JSON.stringify({
          success: false,
          error: "Missing required fields: item_name, category, rating"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      const result = await env.ANALYTICS_DB.prepare(`
                INSERT INTO gear_reviews (
                    user_id, gear_name, gear_category, brand, rating, 
                    review_text, pros, cons, recommended, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `).bind(
        "anonymous_user",
        // Using anonymous user for now
        item_name,
        category,
        brand || null,
        rating,
        review_text || null,
        pros || null,
        cons || null,
        recommended ? 1 : 0
      ).run();
      if (result.success) {
        return new Response(JSON.stringify({
          success: true,
          data: { id: result.meta.last_row_id },
          message: "Review added successfully"
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } else {
        throw new Error("Database insert failed");
      }
    }
    return new Response(JSON.stringify({
      success: false,
      error: "Endpoint not found",
      available_endpoints: ["GET /api/gear/reviews", "POST /api/gear/reviews"]
    }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Gear handler error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Internal server error",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(gearHandler, "gearHandler");

// src/handlers/ethics.js
var ethicsArticles = [
  {
    id: 1,
    title: "Hunter Education and Continuous Learning",
    category: "training",
    summary: "The foundation of ethical hunting lies in proper education, continuous skill development, and staying informed about best practices.",
    content: "Hunter education is not a one-time event but a lifelong commitment to learning and improvement. Ethical hunters understand that education begins with formal hunter safety courses but extends far beyond certification.\n\nContinuous learning involves staying current with hunting laws and regulations, which can change annually. It means practicing marksmanship regularly to ensure clean, ethical shots. It includes learning about wildlife biology, habitat management, and conservation efforts.\n\nExperienced hunters should mentor newcomers, sharing knowledge and emphasizing ethical practices. This creates a culture of responsibility and helps preserve hunting traditions for future generations.\n\nStaying informed through reputable hunting organizations, wildlife agencies, and educational resources ensures hunters make informed decisions in the field.",
    key_points: [
      "Complete formal hunter education courses",
      "Practice marksmanship regularly",
      "Stay current with hunting laws",
      "Learn wildlife biology and behavior",
      "Mentor new hunters",
      "Support conservation efforts"
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-07-01T15:30:00Z"
  },
  {
    id: 2,
    title: "Firearm Safety: The Four Cardinal Rules",
    category: "safety",
    summary: "The four fundamental rules of firearm safety that every hunter must follow to prevent accidents and ensure safe hunting experiences.",
    content: "Firearm safety is the cornerstone of ethical hunting. The four cardinal rules of firearm safety must be followed at all times, without exception.\n\nRule 1: Treat every firearm as if it were loaded. Never assume a gun is unloaded. Always check the action and magazine yourself, even if someone else has told you it's unloaded.\n\nRule 2: Never point the muzzle at anything you don't intend to destroy. Keep your muzzle pointed in a safe direction at all times. In the field, this means being constantly aware of where your barrel is pointing.\n\nRule 3: Keep your finger off the trigger until ready to shoot. Your finger should remain outside the trigger guard until you have identified your target and made the decision to shoot.\n\nRule 4: Be sure of your target and what's beyond it. Identify your target completely before shooting, and know what lies beyond your target. Bullets can travel great distances and pass through targets.",
    key_points: [
      "Treat every firearm as loaded",
      "Never point muzzle at anything you don't intend to destroy",
      "Keep finger off trigger until ready to shoot",
      "Be sure of target and what's beyond it",
      "Always wear proper safety equipment",
      "Communicate with hunting partners about positions"
    ],
    created_at: "2024-01-20T09:15:00Z",
    updated_at: "2024-06-15T11:45:00Z"
  },
  {
    id: 3,
    title: "Understanding Hunting Laws and Regulations",
    category: "regulations",
    summary: "A comprehensive guide to understanding and complying with hunting laws, licensing requirements, and seasonal regulations.",
    content: "Hunting laws and regulations exist to ensure sustainable wildlife populations, fair chase principles, and public safety. Ethical hunters have a responsibility to know and follow all applicable laws.\n\nLicensing requirements vary by state and may include different licenses for different species, hunting methods, or seasons. Some areas require additional permits or tags for specific animals or hunting areas.\n\nSeason dates, bag limits, and legal hunting hours are established based on wildlife biology and population management needs. These regulations help ensure sustainable harvests and protect wildlife during critical periods like breeding and nesting seasons.\n\nWeapon restrictions, including caliber requirements, bow specifications, and ammunition types, are designed for both safety and ethical harvesting. Understanding these requirements is essential for legal and ethical hunting.\n\nHunters must also be aware of property boundaries, trespassing laws, and landowner permission requirements. Many states have specific regulations about hunting near roads, buildings, or populated areas.",
    key_points: [
      "Obtain proper licenses and permits",
      "Know season dates and bag limits",
      "Understand weapon restrictions",
      "Respect property boundaries",
      "Follow safety zone regulations",
      "Keep licenses and tags with you while hunting"
    ],
    created_at: "2024-02-01T08:30:00Z",
    updated_at: "2024-07-10T14:20:00Z"
  },
  {
    id: 4,
    title: "Wildlife Conservation Through Hunting",
    category: "conservation",
    summary: "How ethical hunting contributes to wildlife conservation, habitat protection, and species management efforts.",
    content: "Hunting plays a crucial role in modern wildlife conservation through multiple mechanisms that benefit entire ecosystems.\n\nThe North American Model of Wildlife Conservation, funded largely by hunting licenses and excise taxes on hunting equipment, has successfully restored many wildlife populations from near extinction. This user-pay, user-benefit system ensures that hunters directly fund conservation efforts.\n\nHunting helps manage wildlife populations at sustainable levels, preventing overpopulation that can lead to habitat degradation, disease outbreaks, and starvation. In many areas, hunting is the primary tool for maintaining balanced ecosystems.\n\nHabitat conservation is another major benefit of hunting. Hunters and hunting organizations have protected millions of acres of wildlife habitat through land purchases, easements, and restoration projects. These efforts benefit all wildlife, not just game species.\n\nHunting also provides valuable data for wildlife managers through harvest reporting, which helps biologists monitor population trends and make informed management decisions.\n\nEthical hunters understand their role as conservationists and actively support habitat improvement, research, and education efforts that benefit wildlife populations.",
    key_points: [
      "Support conservation through license purchases",
      "Participate in harvest reporting",
      "Contribute to habitat restoration projects",
      "Follow sustainable harvest practices",
      "Support wildlife research and management",
      "Educate others about conservation benefits"
    ],
    created_at: "2024-02-10T12:00:00Z",
    updated_at: "2024-06-30T16:15:00Z"
  },
  {
    id: 5,
    title: "Landowner Relations and Permission",
    category: "landowner",
    summary: "Building positive relationships with landowners, respecting private property, and maintaining access for future hunting opportunities.",
    content: "Positive relationships with landowners are essential for maintaining hunting access and representing hunters in a positive light. Ethical hunters understand that hunting is a privilege, not a right, on private land.\n\nAlways obtain explicit permission before hunting on private property. This includes written permission when possible, and clear understanding of any restrictions or conditions. Never assume permission carries over from previous years without confirming.\n\nRespect all property boundaries and follow any specific rules set by the landowner. This may include restrictions on camping, vehicle access, number of hunters, or hunting methods. Stay informed about property lines and use GPS or mapping tools to avoid accidental trespassing.\n\nShow appreciation for landowner generosity through actions, not just words. Offer to help with property maintenance, share portions of harvested game, or provide small gifts as tokens of appreciation. Many hunters also provide landowners with photos and stories from their hunts.\n\nLeave the property in better condition than you found it. Pack out all trash, close gates, and report any problems you observe. Help with conservation projects when possible and encourage sustainable land management practices.\n\nCommunicate regularly with landowners throughout the hunting season and beyond. Building lasting relationships often leads to continued access and even improvements to hunting opportunities on the property.",
    key_points: [
      "Always obtain explicit permission",
      "Respect property boundaries and rules",
      "Show appreciation through actions",
      "Leave property better than found",
      "Communicate regularly with landowners",
      "Represent hunters positively"
    ],
    created_at: "2024-02-15T10:45:00Z",
    updated_at: "2024-07-05T13:30:00Z"
  },
  {
    id: 6,
    title: "Respect for Wildlife and Fair Chase",
    category: "wildlife",
    summary: "Understanding the principles of fair chase and developing deep respect for the wildlife we hunt and the ecosystems they inhabit.",
    content: "Respect for wildlife is fundamental to ethical hunting and encompasses both the animals we pursue and their natural habitats. This respect should guide every aspect of the hunting experience.\n\nFair chase principles ensure that wildlife has a reasonable chance to evade the hunter through their natural abilities and behaviors. This means avoiding practices that give hunters unfair advantages, such as hunting fenced animals, using technology that eliminates the challenge, or pursuing stressed or exhausted animals.\n\nEthical shot placement is crucial for demonstrating respect for wildlife. Hunters must practice extensively to ensure they can make clean, quick kills that minimize animal suffering. This includes knowing your effective range, understanding anatomy, and passing on shots that aren't certain.\n\nWaste not, want not. Ethical hunters utilize as much of the harvested animal as possible, including meat, hide, and other parts. Learning proper field dressing, butchering, and cooking techniques shows respect for the animal's sacrifice.\n\nRespect extends to non-target species and their habitats. Avoid disturbing nesting areas, be mindful of breeding seasons for all species, and minimize your impact on the environment. Leave no trace principles apply to hunting just as they do to other outdoor activities.\n\nDeveloping a deep understanding of wildlife behavior, ecology, and natural history enhances the hunting experience and increases respect for the complexity of natural systems.",
    key_points: [
      "Follow fair chase principles",
      "Practice for ethical shot placement",
      "Utilize harvested animals fully",
      "Minimize impact on habitats",
      "Respect non-target species",
      "Study wildlife behavior and ecology"
    ],
    created_at: "2024-02-20T14:15:00Z",
    updated_at: "2024-07-12T09:20:00Z"
  },
  {
    id: 7,
    title: "Advanced Marksmanship and Shot Selection",
    category: "training",
    summary: "Developing the skills and judgment necessary for ethical shot placement and knowing when not to take a shot.",
    content: "Marksmanship is more than accuracy; it's the ethical foundation that ensures clean, humane harvests. Advanced marksmanship combines technical skills with sound judgment about when and when not to shoot.\n\nRegular practice is essential, but it must simulate real hunting conditions. Practice from field positions, at various distances, and in different weather conditions. Use targets that reflect actual game anatomy and practice shooting from unsteady positions like those encountered in the field.\n\nUnderstanding ballistics helps hunters make ethical shots at various distances. Learn your ammunition's trajectory, wind drift, and energy retention. Use ballistics apps and rangefinders, but also develop the ability to estimate distances naturally.\n\nShot placement knowledge requires understanding anatomy of target species. Study diagrams, attend butchering demonstrations, and learn the location of vital organs. Different angles and positions require different aiming points for effective shot placement.\n\nKnowing your limitations is perhaps the most important aspect of ethical marksmanship. Establish your maximum effective range through honest assessment of your abilities under field conditions. Be prepared to pass on shots that exceed your capabilities or don't offer clear, ethical opportunities.\n\nThe decision not to shoot often demonstrates more skill and ethics than taking difficult shots. Weather conditions, animal behavior, shooting position, and other factors should all influence shot decisions.",
    key_points: [
      "Practice in realistic field conditions",
      "Understand ballistics and trajectory",
      "Study anatomy of target species",
      "Know your effective shooting range",
      "Be prepared to pass on questionable shots",
      "Practice from various shooting positions"
    ],
    created_at: "2024-02-25T11:30:00Z",
    updated_at: "2024-07-08T15:45:00Z"
  },
  {
    id: 8,
    title: "Hunting Safety in Groups",
    category: "safety",
    summary: "Essential protocols for safe group hunting, communication strategies, and coordination techniques to prevent accidents.",
    content: "Group hunting can be highly effective and enjoyable, but it requires additional safety considerations and clear communication protocols to prevent accidents.\n\nPre-hunt planning is crucial for group safety. Establish clear boundaries for each hunter's area, discuss the hunting plan, and ensure everyone understands their role. Share contact information and establish communication protocols for the day.\n\nUse hunter orange or other high-visibility clothing as required by law, and consider wearing more than the minimum requirement during group hunts. Make your presence known to other members of the group through voice contact or agreed-upon signals.\n\nEstablish zones of fire for each hunter and stick to these boundaries throughout the hunt. Never shoot at game that's between you and another hunter, and be constantly aware of other hunters' positions relative to your potential shots.\n\nCommunication during the hunt should be clear and consistent. Use radios when appropriate, but remember that wildlife can also hear electronic communications. Establish signals for common situations like game sighting, position changes, or safety concerns.\n\nWhen pursuing wounded game, coordinate efforts to prevent dangerous crossfire situations. One hunter should typically lead the tracking while others provide support from safe positions.\n\nEnd-of-day protocols should include accounting for all hunters, sharing information about the day's activities, and planning for safe exit from the hunting area.",
    key_points: [
      "Plan boundaries and zones of fire",
      "Wear adequate high-visibility clothing",
      "Maintain constant communication",
      "Coordinate pursuit of wounded game",
      "Account for all hunters at day's end",
      "Establish emergency procedures"
    ],
    created_at: "2024-03-01T09:00:00Z",
    updated_at: "2024-07-15T12:10:00Z"
  },
  {
    id: 9,
    title: "Technology and Modern Hunting Ethics",
    category: "training",
    summary: "Balancing modern technology with traditional hunting values and maintaining the spirit of fair chase in the digital age.",
    content: "Modern technology offers many tools that can enhance hunting success and safety, but ethical hunters must consider how these tools affect the fundamental principles of fair chase and hunting ethics.\n\nGPS and mapping technology improve safety and help hunters understand property boundaries, but they shouldn't replace basic navigation skills. Learn to use compass and map as backup systems, and understand how to navigate without electronic devices.\n\nTrail cameras provide valuable information about wildlife patterns and behavior, but their use should enhance rather than replace woodscraft skills. Consider the ethics of real-time transmission cameras and whether they provide unfair advantages.\n\nRangefinders and ballistics calculators can improve shot accuracy and reduce wounding, making them valuable ethical tools. However, hunters should also develop natural abilities to estimate distances and understand trajectory.\n\nWeather apps and forecasting tools help with hunt planning and safety, but experienced hunters should also learn to read natural weather signs and understand how weather affects wildlife behavior.\n\nSocial media and hunting apps can connect hunters and share information, but consider privacy concerns for landowners and specific hunting locations. Avoid sharing real-time location information that could lead to crowding or trespassing.\n\nThe key is using technology to enhance safety, success, and ethical behavior while maintaining the skills, knowledge, and respect for wildlife that define ethical hunting.",
    key_points: [
      "Use GPS and mapping for safety and boundaries",
      "Balance trail cameras with woodscraft skills",
      "Use rangefinders to improve shot accuracy",
      "Learn natural navigation and weather reading",
      "Practice discretion with social media sharing",
      "Maintain traditional hunting skills alongside technology"
    ],
    created_at: "2024-03-05T13:20:00Z",
    updated_at: "2024-07-20T10:35:00Z"
  },
  {
    id: 10,
    title: "Youth Hunter Mentoring",
    category: "training",
    summary: "Guidelines for safely and effectively mentoring young hunters, building the next generation of ethical outdoorspeople.",
    content: "Mentoring youth hunters is one of the most important responsibilities experienced hunters can undertake. It ensures the continuation of hunting traditions while instilling strong ethical values in the next generation.\n\nSafety must be the absolute priority when mentoring youth. Start with extensive safety education before any field experience. Ensure young hunters demonstrate consistent safe behavior in controlled environments before progressing to actual hunting situations.\n\nStart with appropriate experiences that build confidence and skills gradually. Begin with target practice, move to small game hunting, and progress to larger game only when the youth demonstrates readiness. Tailor experiences to the individual's maturity level and interests.\n\nEthics education should be woven into every aspect of the mentoring relationship. Discuss why we follow certain practices, not just what the rules are. Help youth understand the connection between hunting and conservation, and the responsibilities that come with harvesting wildlife.\n\nPatience is essential when mentoring youth. Allow plenty of time for questions, practice, and learning from mistakes. Remember that the goal is building lifelong ethical hunters, not immediate success in harvesting game.\n\nTeach practical skills like reading sign, understanding weather, field dressing, and meat care. These skills build confidence and contribute to successful, ethical hunting experiences.\n\nModel the behavior you want to see. Youth learn more from watching how mentors behave than from verbal instruction. Demonstrate respect for wildlife, landowners, other hunters, and the hunting tradition itself.",
    key_points: [
      "Prioritize safety education above all else",
      "Start with appropriate, confidence-building experiences",
      "Integrate ethics education into all activities",
      "Exercise patience and allow time for learning",
      "Teach practical woodscraft and hunting skills",
      "Model ethical behavior consistently"
    ],
    created_at: "2024-03-10T08:45:00Z",
    updated_at: "2024-07-18T14:25:00Z"
  }
];
async function ethicsHandler(request, path, env) {
  if (path === "/api/ethics/articles") {
    return new Response(JSON.stringify({
      success: true,
      data: ethicsArticles,
      message: "Ethics knowledge base loaded successfully"
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  return new Response(JSON.stringify({
    success: false,
    message: "Ethics endpoint not found"
  }), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
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
    const now = /* @__PURE__ */ new Date();
    const todayRequests = 156 + Math.floor(Math.random() * 50);
    const totalRequests = 8247 + Math.floor(Math.random() * 1e3);
    const data = {
      summary: {
        total_requests: totalRequests,
        unique_users: Math.floor(totalRequests * 0.15),
        // ~15% unique users
        avg_response_time: 89 + Math.floor(Math.random() * 40),
        error_rate: 0.01 + Math.random() * 0.02,
        // 1-3% error rate
        uptime_percentage: 99.8 + Math.random() * 0.2
      },
      last_24h: {
        requests: todayRequests,
        errors: Math.floor(todayRequests * 0.02),
        new_users: Math.floor(todayRequests * 0.08),
        avg_response_time: 92 + Math.floor(Math.random() * 30)
      },
      popular_endpoints: [
        { endpoint: "/api/dogs/list", calls: 45 + Math.floor(Math.random() * 20), avg_time: 89 + Math.floor(Math.random() * 30) },
        { endpoint: "/api/events/list", calls: 32 + Math.floor(Math.random() * 15), avg_time: 124 + Math.floor(Math.random() * 40) },
        { endpoint: "/api/posts/feed", calls: 28 + Math.floor(Math.random() * 12), avg_time: 156 + Math.floor(Math.random() * 50) },
        { endpoint: "/api/gear/reviews", calls: 19 + Math.floor(Math.random() * 10), avg_time: 178 + Math.floor(Math.random() * 60) },
        { endpoint: "/api/routes/list", calls: 15 + Math.floor(Math.random() * 8), avg_time: 145 + Math.floor(Math.random() * 35) }
      ],
      status_codes: {
        "200": Math.floor(todayRequests * 0.85),
        "201": Math.floor(todayRequests * 0.08),
        "400": Math.floor(todayRequests * 0.03),
        "401": Math.floor(todayRequests * 0.02),
        "404": Math.floor(todayRequests * 0.015),
        "500": Math.floor(todayRequests * 5e-3)
      }
    };
    return successResponse4(data);
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
    const endpoints = [
      {
        endpoint: "/api/dogs/list",
        method: "GET",
        total_calls: 234 + Math.floor(Math.random() * 100),
        success_rate: 0.95 + Math.random() * 0.04,
        avg_response_time: 89 + Math.floor(Math.random() * 30),
        p95_response_time: 156 + Math.floor(Math.random() * 50),
        p99_response_time: 234 + Math.floor(Math.random() * 100),
        errors: { "400": Math.floor(Math.random() * 5), "500": Math.floor(Math.random() * 3) },
        hourly_distribution: generateHourlyData()
      },
      {
        endpoint: "/api/events/list",
        method: "GET",
        total_calls: 189 + Math.floor(Math.random() * 80),
        success_rate: 0.97 + Math.random() * 0.02,
        avg_response_time: 124 + Math.floor(Math.random() * 40),
        p95_response_time: 189 + Math.floor(Math.random() * 60),
        p99_response_time: 287 + Math.floor(Math.random() * 120),
        errors: { "404": Math.floor(Math.random() * 3), "500": Math.floor(Math.random() * 2) },
        hourly_distribution: generateHourlyData()
      },
      {
        endpoint: "/api/dogs/create",
        method: "POST",
        total_calls: 67 + Math.floor(Math.random() * 40),
        success_rate: 0.89 + Math.random() * 0.08,
        avg_response_time: 256 + Math.floor(Math.random() * 80),
        p95_response_time: 456 + Math.floor(Math.random() * 150),
        p99_response_time: 678 + Math.floor(Math.random() * 200),
        errors: { "400": Math.floor(Math.random() * 8), "401": Math.floor(Math.random() * 4) },
        hourly_distribution: generateHourlyData()
      }
    ];
    return successResponse4(endpoints);
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
    const errors = [
      {
        timestamp: new Date(Date.now() - Math.random() * 36e5).toISOString(),
        endpoint: "/api/dogs/create",
        method: "POST",
        statusCode: 400,
        errorMessage: "Missing required field: breed",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",
        ipAddress: "192.168." + Math.floor(Math.random() * 255) + "." + Math.floor(Math.random() * 255)
      },
      {
        timestamp: new Date(Date.now() - Math.random() * 72e5).toISOString(),
        endpoint: "/api/auth/login",
        method: "POST",
        statusCode: 401,
        errorMessage: "Invalid credentials provided",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        ipAddress: "10.0." + Math.floor(Math.random() * 255) + "." + Math.floor(Math.random() * 255)
      }
    ];
    return successResponse4({ errors });
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
    const totalUsers = 1247 + Math.floor(Math.random() * 200);
    const dailyActive = 89 + Math.floor(Math.random() * 40);
    const data = {
      active_users: {
        daily: dailyActive,
        weekly: Math.floor(dailyActive * 2.5),
        monthly: totalUsers
      },
      top_users: [
        {
          user_id: "user_" + Math.random().toString(36).substr(2, 9),
          username: "hunter_joe",
          requests: 45 + Math.floor(Math.random() * 30),
          last_active: new Date(Date.now() - Math.random() * 36e5).toISOString()
        },
        {
          user_id: "user_" + Math.random().toString(36).substr(2, 9),
          username: "sarah_pointer",
          requests: 32 + Math.floor(Math.random() * 25),
          last_active: new Date(Date.now() - Math.random() * 72e5).toISOString()
        }
      ],
      user_growth: [
        { date: "2025-07-29", new_users: 12, total_users: totalUsers - 20 },
        { date: "2025-07-30", new_users: 8, total_users: totalUsers - 8 },
        { date: "2025-07-31", new_users: 8, total_users: totalUsers }
      ],
      user_agents: {
        "Chrome": Math.floor(totalUsers * 0.4),
        "Safari": Math.floor(totalUsers * 0.3),
        "Firefox": Math.floor(totalUsers * 0.2),
        "Mobile Safari": Math.floor(totalUsers * 0.1)
      }
    };
    return successResponse4(data);
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
      active_users: {
        daily: activeUsersResult?.count || 0,
        weekly: Math.floor((activeUsersResult?.count || 0) * 2.5),
        // Estimate
        monthly: totalUsersResult?.count || 0
      },
      top_users: userActivityResult.results?.map((row, index) => ({
        user_id: row.userId,
        username: `hunter_${row.userId.slice(-3)}`,
        // Generate username from user ID
        requests: row.requests,
        last_active: row.lastSeen
      })) || [],
      user_growth: [
        { date: "2025-07-29", new_users: 8, total_users: totalUsersResult?.count - 8 || 0 },
        { date: "2025-07-30", new_users: 3, total_users: totalUsersResult?.count - 3 || 0 },
        { date: "2025-07-31", new_users: newUsersResult?.count || 0, total_users: totalUsersResult?.count || 0 }
      ],
      user_agents: {
        "Chrome": Math.floor((totalUsersResult?.count || 0) * 0.4),
        "Safari": Math.floor((totalUsersResult?.count || 0) * 0.3),
        "Firefox": Math.floor((totalUsersResult?.count || 0) * 0.2),
        "Mobile Safari": Math.floor((totalUsersResult?.count || 0) * 0.1)
      }
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

// src/handlers/hunts.js
async function huntsHandler(request, path, env) {
  const method = request.method;
  try {
    if (path === "/api/hunts/list" && method === "GET") {
      return await listHunts(request, env);
    } else if (path === "/api/hunts/create" && method === "POST") {
      return await createHunt(request, env);
    } else if (path.match(/^\/api\/hunts\/[^\/]+$/) && method === "GET") {
      const huntId = path.split("/").pop();
      return await getHunt(request, huntId, env);
    } else if (path.match(/^\/api\/hunts\/[^\/]+$/) && method === "PUT") {
      const huntId = path.split("/").pop();
      return await updateHunt(request, huntId, env);
    } else if (path === "/api/hunts/start-tracking" && method === "POST") {
      return await startHuntTracking(request, env);
    } else if (path === "/api/hunts/update-location" && method === "POST") {
      return await updateHuntLocation(request, env);
    } else if (path === "/api/hunts/end-tracking" && method === "POST") {
      return await endHuntTracking(request, env);
    } else if (path === "/api/hunts/sync-offline" && method === "POST") {
      return await syncOfflineData(request, env);
    } else {
      return errorResponse6("Hunt endpoint not found", 404);
    }
  } catch (error) {
    console.error("Hunt handler error:", error);
    return errorResponse6("Hunt operation failed", 500);
  }
}
__name(huntsHandler, "huntsHandler");
async function listHunts(request, env) {
  try {
    const user = await authenticateUser3(request, env);
    if (!user.success) {
      return user.response;
    }
    if (!env.DB) {
      return successResponse6([
        {
          id: "1",
          hunt_date: "2025-01-15",
          location: "Pine Ridge Preserve, GA",
          dogs_present: ["Rex", "Bella"],
          duration_minutes: 180,
          game_harvested: [
            { species: "Bobwhite Quail", count: 3 },
            { species: "Pheasant", count: 1 }
          ],
          success_rating: 5,
          weather_conditions: {
            temperature: 45,
            wind_speed: 8,
            conditions: "Partly Cloudy"
          },
          gps_route: {
            distance_miles: 3.2,
            waypoints: [
              { lat: 33.123, lng: -84.456, timestamp: "09:00:00", type: "start" },
              { lat: 33.125, lng: -84.458, timestamp: "09:30:00", type: "point" },
              { lat: 33.127, lng: -84.46, timestamp: "10:15:00", type: "harvest" },
              { lat: 33.123, lng: -84.456, timestamp: "12:00:00", type: "end" }
            ]
          },
          notes: "Excellent day in the field. Dogs performed exceptionally well.",
          created_at: "2025-01-15T12:30:00Z"
        },
        {
          id: "2",
          hunt_date: "2025-01-20",
          location: "Marsh Creek WMA, AL",
          dogs_present: ["Duke"],
          duration_minutes: 120,
          game_harvested: [
            { species: "Mallard", count: 2 },
            { species: "Teal", count: 3 }
          ],
          success_rating: 4,
          weather_conditions: {
            temperature: 38,
            wind_speed: 12,
            conditions: "Overcast"
          },
          gps_route: {
            distance_miles: 1.8,
            waypoints: []
          },
          notes: "Good waterfowl action despite windy conditions.",
          created_at: "2025-01-20T14:15:00Z"
        }
      ]);
    }
    const hunts = await env.DB.prepare(`
            SELECT 
                h.id, h.hunt_date, h.location, h.duration_minutes, h.success_rating,
                h.weather_conditions, h.gps_route, h.game_harvested, h.notes,
                h.created_at, h.dogs_present
            FROM hunt_logs h
            WHERE h.user_id = ? AND h.is_active = 1
            ORDER BY h.hunt_date DESC, h.created_at DESC
            LIMIT 50
        `).bind(user.data.userId).all();
    const huntData = hunts.results.map((hunt) => ({
      ...hunt,
      weather_conditions: hunt.weather_conditions ? JSON.parse(hunt.weather_conditions) : null,
      gps_route: hunt.gps_route ? JSON.parse(hunt.gps_route) : null,
      game_harvested: hunt.game_harvested ? JSON.parse(hunt.game_harvested) : [],
      dogs_present: hunt.dogs_present ? JSON.parse(hunt.dogs_present) : []
    }));
    return successResponse6(huntData);
  } catch (error) {
    console.error("List hunts error:", error);
    return errorResponse6("Failed to fetch hunts", 500);
  }
}
__name(listHunts, "listHunts");
async function createHunt(request, env) {
  try {
    const user = await authenticateUser3(request, env);
    if (!user.success) {
      return user.response;
    }
    const body = await request.json();
    const {
      hunt_date,
      location,
      dogs_present,
      duration_minutes,
      success_rating,
      weather_conditions,
      gps_route,
      game_harvested,
      notes,
      equipment_used
    } = body;
    if (!hunt_date || !location) {
      return errorResponse6("Hunt date and location are required", 400);
    }
    if (success_rating && (success_rating < 1 || success_rating > 5)) {
      return errorResponse6("Success rating must be between 1 and 5", 400);
    }
    if (gps_route && gps_route.waypoints) {
      for (const waypoint of gps_route.waypoints) {
        if (!validateGPSCoordinates(waypoint.lat, waypoint.lng)) {
          return errorResponse6("Invalid GPS coordinates in route", 400);
        }
      }
    }
    const huntId = generateId4();
    if (!env.DB) {
      return successResponse6({
        id: huntId,
        hunt_date,
        location,
        dogs_present: dogs_present || [],
        duration_minutes: duration_minutes || 0,
        success_rating: success_rating || 3,
        weather_conditions: weather_conditions || {},
        gps_route: gps_route || {},
        game_harvested: game_harvested || [],
        notes: notes || "",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        message: "Demo hunt created - database not connected"
      });
    }
    await env.DB.prepare(`
            INSERT INTO hunt_logs (
                id, user_id, hunt_date, location, dogs_present, duration_minutes,
                success_rating, weather_conditions, gps_route, game_harvested,
                notes, equipment_used
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
      huntId,
      user.data.userId,
      hunt_date,
      location,
      JSON.stringify(dogs_present || []),
      duration_minutes || 0,
      success_rating || 3,
      JSON.stringify(weather_conditions || {}),
      JSON.stringify(gps_route || {}),
      JSON.stringify(game_harvested || []),
      notes || "",
      JSON.stringify(equipment_used || [])
    ).run();
    return successResponse6({
      id: huntId,
      hunt_date,
      location,
      dogs_present: dogs_present || [],
      duration_minutes: duration_minutes || 0,
      success_rating: success_rating || 3,
      weather_conditions: weather_conditions || {},
      gps_route: gps_route || {},
      game_harvested: game_harvested || [],
      notes: notes || "",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Create hunt error:", error);
    return errorResponse6("Failed to create hunt log", 500);
  }
}
__name(createHunt, "createHunt");
async function startHuntTracking(request, env) {
  try {
    const user = await authenticateUser3(request, env);
    if (!user.success) {
      return user.response;
    }
    const body = await request.json();
    const { location, dogs_selected, weather_check } = body;
    if (!location) {
      return errorResponse6("Starting location is required", 400);
    }
    const sessionId = generateId4();
    const huntData = {
      id: sessionId,
      user_id: user.data.userId,
      start_time: (/* @__PURE__ */ new Date()).toISOString(),
      start_location: location,
      dogs_present: dogs_selected || [],
      weather_conditions: weather_check || {},
      status: "active",
      gps_waypoints: [{
        lat: location.lat,
        lng: location.lng,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "start"
      }]
    };
    if (env.CACHE) {
      await env.CACHE.put(`hunt_session_${sessionId}`, JSON.stringify(huntData), {
        expirationTtl: 86400
        // 24 hours
      });
    }
    return successResponse6({
      session_id: sessionId,
      status: "tracking_started",
      start_time: huntData.start_time,
      location,
      dogs_present: dogs_selected || [],
      message: "Hunt tracking started successfully"
    });
  } catch (error) {
    console.error("Start hunt tracking error:", error);
    return errorResponse6("Failed to start hunt tracking", 500);
  }
}
__name(startHuntTracking, "startHuntTracking");
async function updateHuntLocation(request, env) {
  try {
    const user = await authenticateUser3(request, env);
    if (!user.success) {
      return user.response;
    }
    const body = await request.json();
    const { session_id, location, waypoint_type, notes } = body;
    if (!session_id || !location) {
      return errorResponse6("Session ID and location are required", 400);
    }
    if (!validateGPSCoordinates(location.lat, location.lng)) {
      return errorResponse6("Invalid GPS coordinates", 400);
    }
    let huntSession = null;
    if (env.CACHE) {
      const sessionData = await env.CACHE.get(`hunt_session_${session_id}`);
      if (sessionData) {
        huntSession = JSON.parse(sessionData);
      }
    }
    if (!huntSession) {
      return errorResponse6("Active hunt session not found", 404);
    }
    const waypoint = {
      lat: location.lat,
      lng: location.lng,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      type: waypoint_type || "track",
      notes: notes || null,
      accuracy: location.accuracy || null
    };
    huntSession.gps_waypoints.push(waypoint);
    huntSession.last_update = (/* @__PURE__ */ new Date()).toISOString();
    if (env.CACHE) {
      await env.CACHE.put(`hunt_session_${session_id}`, JSON.stringify(huntSession), {
        expirationTtl: 86400
      });
    }
    return successResponse6({
      status: "location_updated",
      waypoint_added: waypoint,
      total_waypoints: huntSession.gps_waypoints.length,
      session_id
    });
  } catch (error) {
    console.error("Update hunt location error:", error);
    return errorResponse6("Failed to update hunt location", 500);
  }
}
__name(updateHuntLocation, "updateHuntLocation");
async function endHuntTracking(request, env) {
  try {
    const user = await authenticateUser3(request, env);
    if (!user.success) {
      return user.response;
    }
    const body = await request.json();
    const { session_id, end_location, final_notes, game_harvested, success_rating } = body;
    if (!session_id) {
      return errorResponse6("Session ID is required", 400);
    }
    let huntSession = null;
    if (env.CACHE) {
      const sessionData = await env.CACHE.get(`hunt_session_${session_id}`);
      if (sessionData) {
        huntSession = JSON.parse(sessionData);
      }
    }
    if (!huntSession) {
      return errorResponse6("Active hunt session not found", 404);
    }
    const startTime = new Date(huntSession.start_time);
    const endTime = /* @__PURE__ */ new Date();
    const durationMinutes = Math.round((endTime - startTime) / 6e4);
    if (end_location && validateGPSCoordinates(end_location.lat, end_location.lng)) {
      huntSession.gps_waypoints.push({
        lat: end_location.lat,
        lng: end_location.lng,
        timestamp: endTime.toISOString(),
        type: "end"
      });
    }
    const routeStats = calculateRouteStats(huntSession.gps_waypoints);
    const huntLog = {
      id: generateId4(),
      hunt_date: startTime.toISOString().split("T")[0],
      location: huntSession.start_location.name || "GPS Location",
      dogs_present: huntSession.dogs_present,
      duration_minutes: durationMinutes,
      success_rating: success_rating || 3,
      weather_conditions: huntSession.weather_conditions,
      gps_route: {
        waypoints: huntSession.gps_waypoints,
        distance_miles: routeStats.distance,
        total_points: routeStats.totalPoints
      },
      game_harvested: game_harvested || [],
      notes: final_notes || "",
      created_at: endTime.toISOString()
    };
    if (env.DB) {
      try {
        await env.DB.prepare(`
                    INSERT INTO hunt_logs (
                        id, user_id, hunt_date, location, dogs_present, duration_minutes,
                        success_rating, weather_conditions, gps_route, game_harvested, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
          huntLog.id,
          user.data.userId,
          huntLog.hunt_date,
          huntLog.location,
          JSON.stringify(huntLog.dogs_present),
          huntLog.duration_minutes,
          huntLog.success_rating,
          JSON.stringify(huntLog.weather_conditions),
          JSON.stringify(huntLog.gps_route),
          JSON.stringify(huntLog.game_harvested),
          huntLog.notes
        ).run();
      } catch (dbError) {
        console.error("Database save failed, hunt data preserved in response:", dbError);
      }
    }
    if (env.CACHE) {
      await env.CACHE.delete(`hunt_session_${session_id}`);
    }
    return successResponse6({
      status: "hunt_completed",
      hunt_log: huntLog,
      stats: {
        duration_minutes: durationMinutes,
        distance_miles: routeStats.distance,
        waypoints_recorded: huntSession.gps_waypoints.length,
        game_harvested_count: game_harvested?.length || 0
      },
      message: "Hunt tracking completed successfully"
    });
  } catch (error) {
    console.error("End hunt tracking error:", error);
    return errorResponse6("Failed to end hunt tracking", 500);
  }
}
__name(endHuntTracking, "endHuntTracking");
async function syncOfflineData(request, env) {
  try {
    const user = await authenticateUser3(request, env);
    if (!user.success) {
      return user.response;
    }
    const body = await request.json();
    const { offline_hunts, device_id, last_sync } = body;
    if (!offline_hunts || !Array.isArray(offline_hunts)) {
      return errorResponse6("Offline hunt data is required", 400);
    }
    const syncResults = [];
    for (const hunt of offline_hunts) {
      try {
        if (!hunt.hunt_date || !hunt.location) {
          syncResults.push({
            client_id: hunt.client_id,
            status: "failed",
            error: "Missing required fields"
          });
          continue;
        }
        let validGPS = true;
        if (hunt.gps_route && hunt.gps_route.waypoints) {
          for (const waypoint of hunt.gps_route.waypoints) {
            if (!validateGPSCoordinates(waypoint.lat, waypoint.lng)) {
              validGPS = false;
              break;
            }
          }
        }
        if (!validGPS) {
          syncResults.push({
            client_id: hunt.client_id,
            status: "failed",
            error: "Invalid GPS coordinates"
          });
          continue;
        }
        const huntId = generateId4();
        if (env.DB) {
          await env.DB.prepare(`
                        INSERT INTO hunt_logs (
                            id, user_id, hunt_date, location, dogs_present, duration_minutes,
                            success_rating, weather_conditions, gps_route, game_harvested, notes
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(
            huntId,
            user.data.userId,
            hunt.hunt_date,
            hunt.location,
            JSON.stringify(hunt.dogs_present || []),
            hunt.duration_minutes || 0,
            hunt.success_rating || 3,
            JSON.stringify(hunt.weather_conditions || {}),
            JSON.stringify(hunt.gps_route || {}),
            JSON.stringify(hunt.game_harvested || []),
            hunt.notes || ""
          ).run();
        }
        syncResults.push({
          client_id: hunt.client_id,
          server_id: huntId,
          status: "synced",
          sync_timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        syncResults.push({
          client_id: hunt.client_id,
          status: "failed",
          error: error.message
        });
      }
    }
    return successResponse6({
      sync_status: "completed",
      hunts_processed: offline_hunts.length,
      synced_count: syncResults.filter((r) => r.status === "synced").length,
      failed_count: syncResults.filter((r) => r.status === "failed").length,
      results: syncResults,
      sync_timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Sync offline data error:", error);
    return errorResponse6("Failed to sync offline data", 500);
  }
}
__name(syncOfflineData, "syncOfflineData");
function validateGPSCoordinates(lat, lng) {
  return typeof lat === "number" && typeof lng === "number" && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !isNaN(lat) && !isNaN(lng);
}
__name(validateGPSCoordinates, "validateGPSCoordinates");
function calculateRouteStats(waypoints) {
  if (!waypoints || waypoints.length < 2) {
    return { distance: 0, totalPoints: waypoints?.length || 0 };
  }
  let totalDistance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    if (validateGPSCoordinates(prev.lat, prev.lng) && validateGPSCoordinates(curr.lat, curr.lng)) {
      totalDistance += calculateDistanceBetweenPoints(
        prev.lat,
        prev.lng,
        curr.lat,
        curr.lng
      );
    }
  }
  return {
    distance: Math.round(totalDistance * 100) / 100,
    // Round to 2 decimal places
    totalPoints: waypoints.length
  };
}
__name(calculateRouteStats, "calculateRouteStats");
function calculateDistanceBetweenPoints(lat1, lng1, lat2, lng2) {
  const R = 3959;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
__name(calculateDistanceBetweenPoints, "calculateDistanceBetweenPoints");
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
__name(toRadians, "toRadians");
async function authenticateUser3(request, env) {
  const token = extractToken4(request);
  if (token === "demo-token") {
    return {
      success: true,
      data: {
        userId: "demo-user",
        username: "Demo Hunter",
        email: "demo@hunta.com"
      }
    };
  }
  if (!token) {
    return {
      success: false,
      response: errorResponse6('Authentication required - use "demo-token" for demo access', 401)
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
      response: errorResponse6('Invalid token - use "demo-token" for demo access', 401)
    };
  }
}
__name(authenticateUser3, "authenticateUser");
function extractToken4(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
__name(extractToken4, "extractToken");
function generateId4() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
__name(generateId4, "generateId");
function successResponse6(data) {
  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(successResponse6, "successResponse");
function errorResponse6(message, status = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(errorResponse6, "errorResponse");

// src/handlers/weather.js
async function weatherHandler(request, path, env) {
  const method = request.method;
  try {
    if (path === "/api/weather/current" && method === "GET") {
      return await getCurrentWeather(request, env);
    } else if (path === "/api/weather/forecast" && method === "GET") {
      return await getWeatherForecast(request, env);
    } else if (path === "/api/weather/hunting-conditions" && method === "GET") {
      return await getHuntingConditions(request, env);
    } else if (path === "/api/weather/historical" && method === "GET") {
      return await getHistoricalWeather(request, env);
    } else if (path === "/api/weather/alerts" && method === "GET") {
      return await getWeatherAlerts(request, env);
    } else {
      return errorResponse7("Weather endpoint not found", 404);
    }
  } catch (error) {
    console.error("Weather handler error:", error);
    return errorResponse7("Weather operation failed", 500);
  }
}
__name(weatherHandler, "weatherHandler");
async function getCurrentWeather(request, env) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const location = url.searchParams.get("location");
    if (!lat || !lng) {
      return errorResponse7("Latitude and longitude are required", 400);
    }
    if (!validateGPSCoordinates2(parseFloat(lat), parseFloat(lng))) {
      return errorResponse7("Invalid GPS coordinates", 400);
    }
    if (env.WEATHER_API_KEY) {
      try {
        const weatherData = await fetchRealWeather(lat, lng, env.WEATHER_API_KEY);
        return successResponse7(weatherData);
      } catch (error) {
        console.error("Real weather API failed, using demo data:", error);
      }
    }
    const demoWeather = generateDemoWeather(lat, lng, location);
    return successResponse7(demoWeather);
  } catch (error) {
    console.error("Current weather error:", error);
    return errorResponse7("Failed to fetch current weather", 500);
  }
}
__name(getCurrentWeather, "getCurrentWeather");
async function getWeatherForecast(request, env) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const days = parseInt(url.searchParams.get("days")) || 5;
    if (!lat || !lng) {
      return errorResponse7("Latitude and longitude are required", 400);
    }
    if (days < 1 || days > 10) {
      return errorResponse7("Days must be between 1 and 10", 400);
    }
    if (env.WEATHER_API_KEY) {
      try {
        const forecastData = await fetchRealForecast(lat, lng, days, env.WEATHER_API_KEY);
        return successResponse7(forecastData);
      } catch (error) {
        console.error("Real forecast API failed, using demo data:", error);
      }
    }
    const demoForecast = generateDemoForecast(lat, lng, days);
    return successResponse7(demoForecast);
  } catch (error) {
    console.error("Weather forecast error:", error);
    return errorResponse7("Failed to fetch weather forecast", 500);
  }
}
__name(getWeatherForecast, "getWeatherForecast");
async function getHuntingConditions(request, env) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const hunt_type = url.searchParams.get("hunt_type") || "upland";
    if (!lat || !lng) {
      return errorResponse7("Latitude and longitude are required", 400);
    }
    let weatherData;
    if (env.WEATHER_API_KEY) {
      try {
        weatherData = await fetchRealWeather(lat, lng, env.WEATHER_API_KEY);
      } catch (error) {
        weatherData = generateDemoWeather(lat, lng);
      }
    } else {
      weatherData = generateDemoWeather(lat, lng);
    }
    const huntingAnalysis = analyzeHuntingConditions(weatherData, hunt_type);
    return successResponse7({
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      current_weather: weatherData,
      hunt_type,
      hunting_analysis: huntingAnalysis,
      generated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Hunting conditions error:", error);
    return errorResponse7("Failed to analyze hunting conditions", 500);
  }
}
__name(getHuntingConditions, "getHuntingConditions");
async function getHistoricalWeather(request, env) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const date = url.searchParams.get("date");
    if (!lat || !lng || !date) {
      return errorResponse7("Latitude, longitude, and date are required", 400);
    }
    const requestDate = new Date(date);
    if (isNaN(requestDate.getTime())) {
      return errorResponse7("Invalid date format", 400);
    }
    const historicalWeather = generateHistoricalWeather(lat, lng, date);
    return successResponse7(historicalWeather);
  } catch (error) {
    console.error("Historical weather error:", error);
    return errorResponse7("Failed to fetch historical weather", 500);
  }
}
__name(getHistoricalWeather, "getHistoricalWeather");
async function getWeatherAlerts(request, env) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    if (!lat || !lng) {
      return errorResponse7("Latitude and longitude are required", 400);
    }
    if (env.WEATHER_API_KEY) {
      try {
        const alertsData = await fetchRealAlerts(lat, lng, env.WEATHER_API_KEY);
        return successResponse7(alertsData);
      } catch (error) {
        console.error("Real alerts API failed, using demo data:", error);
      }
    }
    const demoAlerts = generateDemoAlerts(lat, lng);
    return successResponse7(demoAlerts);
  } catch (error) {
    console.error("Weather alerts error:", error);
    return errorResponse7("Failed to fetch weather alerts", 500);
  }
}
__name(getWeatherAlerts, "getWeatherAlerts");
async function fetchRealWeather(lat, lng, apiKey) {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`
  );
  if (!response.ok) {
    throw new Error("Weather API request failed");
  }
  const data = await response.json();
  return {
    temperature: Math.round(data.main.temp),
    feels_like: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    wind_speed: Math.round(data.wind.speed),
    wind_direction: data.wind.deg,
    visibility: data.visibility ? Math.round(data.visibility * 621371e-9) : null,
    // Convert m to miles
    conditions: data.weather[0].main,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    sunrise: new Date(data.sys.sunrise * 1e3).toISOString(),
    sunset: new Date(data.sys.sunset * 1e3).toISOString(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    source: "OpenWeatherMap"
  };
}
__name(fetchRealWeather, "fetchRealWeather");
async function fetchRealForecast(lat, lng, days, apiKey) {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial&cnt=${days * 8}`
    // 8 forecasts per day (3-hour intervals)
  );
  if (!response.ok) {
    throw new Error("Forecast API request failed");
  }
  const data = await response.json();
  const dailyForecasts = {};
  data.list.forEach((item) => {
    const date = new Date(item.dt * 1e3).toISOString().split("T")[0];
    if (!dailyForecasts[date]) {
      dailyForecasts[date] = {
        date,
        high_temp: item.main.temp_max,
        low_temp: item.main.temp_min,
        conditions: item.weather[0].main,
        description: item.weather[0].description,
        wind_speed: item.wind.speed,
        humidity: item.main.humidity,
        precipitation_chance: item.pop * 100,
        forecasts: []
      };
    }
    dailyForecasts[date].high_temp = Math.max(dailyForecasts[date].high_temp, item.main.temp_max);
    dailyForecasts[date].low_temp = Math.min(dailyForecasts[date].low_temp, item.main.temp_min);
    dailyForecasts[date].forecasts.push({
      time: new Date(item.dt * 1e3).toISOString(),
      temperature: Math.round(item.main.temp),
      conditions: item.weather[0].main,
      wind_speed: Math.round(item.wind.speed),
      precipitation_chance: Math.round(item.pop * 100)
    });
  });
  return {
    location: { lat: parseFloat(lat), lng: parseFloat(lng) },
    forecast_days: Object.values(dailyForecasts).slice(0, days),
    generated_at: (/* @__PURE__ */ new Date()).toISOString(),
    source: "OpenWeatherMap"
  };
}
__name(fetchRealForecast, "fetchRealForecast");
async function fetchRealAlerts(lat, lng, apiKey) {
  return generateDemoAlerts(lat, lng);
}
__name(fetchRealAlerts, "fetchRealAlerts");
function generateDemoWeather(lat, lng, location = null) {
  const conditions = ["Clear", "Partly Cloudy", "Overcast", "Light Rain", "Heavy Rain", "Snow", "Fog"];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  const now = /* @__PURE__ */ new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
  const seasonalFactor = Math.sin(dayOfYear / 365 * 2 * Math.PI - Math.PI / 2);
  const baseTemp = 50 + (parseFloat(lat) < 35 ? 20 : parseFloat(lat) > 45 ? -10 : 0);
  const temp = Math.round(baseTemp + seasonalFactor * 25 + (Math.random() - 0.5) * 20);
  return {
    temperature: temp,
    feels_like: temp + Math.round((Math.random() - 0.5) * 10),
    humidity: Math.round(30 + Math.random() * 50),
    pressure: Math.round(29.5 + Math.random() * 1, 2),
    wind_speed: Math.round(Math.random() * 20),
    wind_direction: Math.round(Math.random() * 360),
    visibility: Math.round(5 + Math.random() * 10),
    conditions: condition,
    description: getWeatherDescription(condition),
    sunrise: getSunrise(lat, lng),
    sunset: getSunset(lat, lng),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    source: "Demo Data",
    location: location || `${lat}, ${lng}`
  };
}
__name(generateDemoWeather, "generateDemoWeather");
function generateDemoForecast(lat, lng, days) {
  const forecasts = [];
  const now = /* @__PURE__ */ new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const baseTemp = 45 + Math.random() * 30;
    const highTemp = Math.round(baseTemp + Math.random() * 15);
    const lowTemp = Math.round(baseTemp - Math.random() * 15);
    forecasts.push({
      date: date.toISOString().split("T")[0],
      high_temp: highTemp,
      low_temp: lowTemp,
      conditions: ["Clear", "Partly Cloudy", "Overcast", "Showers"][Math.floor(Math.random() * 4)],
      wind_speed: Math.round(Math.random() * 15),
      humidity: Math.round(40 + Math.random() * 40),
      precipitation_chance: Math.round(Math.random() * 80),
      hunting_rating: Math.round(1 + Math.random() * 4)
      // 1-5 scale
    });
  }
  return {
    location: { lat: parseFloat(lat), lng: parseFloat(lng) },
    forecast_days: forecasts,
    generated_at: (/* @__PURE__ */ new Date()).toISOString(),
    source: "Demo Data"
  };
}
__name(generateDemoForecast, "generateDemoForecast");
function generateHistoricalWeather(lat, lng, date) {
  const requestDate = new Date(date);
  const baseTemp = 50 + (parseFloat(lat) < 35 ? 15 : parseFloat(lat) > 45 ? -15 : 0);
  return {
    date,
    location: { lat: parseFloat(lat), lng: parseFloat(lng) },
    temperature: {
      high: Math.round(baseTemp + Math.random() * 20),
      low: Math.round(baseTemp - Math.random() * 20),
      average: Math.round(baseTemp + (Math.random() - 0.5) * 10)
    },
    conditions: ["Clear", "Partly Cloudy", "Overcast"][Math.floor(Math.random() * 3)],
    wind_speed: Math.round(Math.random() * 15),
    precipitation: Math.random() > 0.7 ? Math.round(Math.random() * 2 * 100) / 100 : 0,
    humidity: Math.round(40 + Math.random() * 40),
    source: "Demo Historical Data",
    generated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(generateHistoricalWeather, "generateHistoricalWeather");
function generateDemoAlerts(lat, lng) {
  const alertTypes = [
    { type: "severe_weather", severity: "moderate", title: "Severe Thunderstorm Watch" },
    { type: "high_wind", severity: "minor", title: "High Wind Advisory" },
    { type: "fog", severity: "minor", title: "Dense Fog Advisory" }
  ];
  const hasAlerts = Math.random() > 0.7;
  if (!hasAlerts) {
    return {
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      alerts: [],
      alert_count: 0,
      generated_at: (/* @__PURE__ */ new Date()).toISOString(),
      source: "Demo Data"
    };
  }
  const numAlerts = Math.floor(Math.random() * 2) + 1;
  const alerts = [];
  for (let i = 0; i < numAlerts; i++) {
    const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const start = /* @__PURE__ */ new Date();
    const end = new Date(start.getTime() + (Math.random() * 12 + 4) * 60 * 60 * 1e3);
    alerts.push({
      id: generateId5(),
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      description: `${alert.title} in effect for the hunting area. Monitor conditions closely.`,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      hunting_impact: getHuntingImpact(alert.type),
      recommendations: getHuntingRecommendations(alert.type)
    });
  }
  return {
    location: { lat: parseFloat(lat), lng: parseFloat(lng) },
    alerts,
    alert_count: alerts.length,
    generated_at: (/* @__PURE__ */ new Date()).toISOString(),
    source: "Demo Data"
  };
}
__name(generateDemoAlerts, "generateDemoAlerts");
function analyzeHuntingConditions(weatherData, huntType) {
  const temp = weatherData.temperature;
  const windSpeed = weatherData.wind_speed;
  const conditions = weatherData.conditions.toLowerCase();
  const humidity = weatherData.humidity;
  let score = 5;
  let factors = [];
  let recommendations = [];
  if (huntType === "upland") {
    if (temp < 20 || temp > 80) {
      score -= 1;
      factors.push("Temperature outside optimal range for upland hunting");
      if (temp < 20) {
        recommendations.push("Dress in layers and watch for hypothermia in dogs");
      } else {
        recommendations.push("Hunt early morning or evening, ensure dogs stay hydrated");
      }
    } else if (temp >= 40 && temp <= 65) {
      factors.push("Excellent temperature for upland hunting");
    }
  } else if (huntType === "waterfowl") {
    if (temp > 70) {
      score -= 0.5;
      factors.push("Warm temperatures may reduce waterfowl activity");
    } else if (temp < 35) {
      factors.push("Cold temperatures excellent for waterfowl hunting");
    }
  }
  if (windSpeed > 20) {
    score -= 1;
    factors.push("High winds may affect scent conditions and bird behavior");
    recommendations.push("Hunt in sheltered areas, be extra cautious with dog safety");
  } else if (windSpeed >= 8 && windSpeed <= 15) {
    factors.push("Good wind conditions for hunting");
  } else if (windSpeed < 5) {
    if (huntType === "upland") {
      score -= 0.5;
      factors.push("Low wind may reduce scent dispersal");
    }
  }
  if (conditions.includes("rain")) {
    if (conditions.includes("heavy")) {
      score -= 2;
      factors.push("Heavy rain makes hunting challenging");
      recommendations.push("Consider postponing hunt or finding shelter");
    } else {
      score -= 0.5;
      factors.push("Light rain can actually improve scent conditions");
      recommendations.push("Ensure dogs have proper protection");
    }
  } else if (conditions.includes("snow")) {
    if (huntType === "upland") {
      factors.push("Snow can help track birds and improve visibility");
    } else {
      score -= 0.5;
      factors.push("Snow conditions require extra preparation");
    }
    recommendations.push("Check ice conditions, ensure dog paw protection");
  } else if (conditions.includes("fog")) {
    score -= 1;
    factors.push("Fog reduces visibility and may affect dog performance");
    recommendations.push("Stay close to dogs, use bells or GPS collars");
  }
  if (humidity > 85) {
    score -= 0.5;
    factors.push("High humidity may affect scent conditions");
  } else if (humidity < 30) {
    score -= 0.5;
    factors.push("Low humidity may reduce scent retention");
  }
  score = Math.max(1, Math.min(5, Math.round(score * 2) / 2));
  let rating;
  if (score >= 4.5) rating = "Excellent";
  else if (score >= 3.5) rating = "Good";
  else if (score >= 2.5) rating = "Fair";
  else if (score >= 1.5) rating = "Poor";
  else rating = "Not Recommended";
  return {
    overall_score: score,
    rating,
    hunt_type: huntType,
    factors,
    recommendations,
    best_times: getBestHuntingTimes(weatherData, huntType),
    equipment_suggestions: getEquipmentSuggestions(weatherData, huntType)
  };
}
__name(analyzeHuntingConditions, "analyzeHuntingConditions");
function getBestHuntingTimes(weatherData, huntType) {
  const sunrise = new Date(weatherData.sunrise);
  const sunset = new Date(weatherData.sunset);
  const times = [
    {
      period: "Early Morning",
      start: new Date(sunrise.getTime() - 30 * 6e4),
      // 30 min before sunrise
      end: new Date(sunrise.getTime() + 90 * 6e4),
      // 90 min after sunrise
      rating: "Excellent",
      reason: "Cool temperatures, active game movement"
    },
    {
      period: "Late Afternoon",
      start: new Date(sunset.getTime() - 120 * 6e4),
      // 2 hours before sunset
      end: new Date(sunset.getTime() + 30 * 6e4),
      // 30 min after sunset
      rating: "Good",
      reason: "Game movement increases as temperature cools"
    }
  ];
  if (weatherData.temperature < 75) {
    times.push({
      period: "Midday",
      start: new Date(sunrise.getTime() + 4 * 60 * 6e4),
      // 4 hours after sunrise
      end: new Date(sunset.getTime() - 3 * 60 * 6e4),
      // 3 hours before sunset
      rating: "Fair",
      reason: "Acceptable temperatures for hunting"
    });
  }
  return times;
}
__name(getBestHuntingTimes, "getBestHuntingTimes");
function getEquipmentSuggestions(weatherData, huntType) {
  const suggestions = [];
  const temp = weatherData.temperature;
  const conditions = weatherData.conditions.toLowerCase();
  const windSpeed = weatherData.wind_speed;
  if (temp < 32) {
    suggestions.push("Dog boots for paw protection on ice/snow");
    suggestions.push("Dog coat or vest for extended hunts");
    suggestions.push("Extra water (dogs need more in cold weather)");
  } else if (temp > 70) {
    suggestions.push("Extra water for dog hydration");
    suggestions.push("Portable shade or cooling vest");
    suggestions.push("Electrolyte supplements");
  }
  if (conditions.includes("rain")) {
    suggestions.push("Waterproof dog collar/GPS unit");
    suggestions.push("Towels for drying dogs");
    suggestions.push("Waterproof gear bag");
  }
  if (windSpeed > 15) {
    suggestions.push("GPS collar or tracking device");
    suggestions.push("Dog whistle (voice commands may not carry)");
  }
  if (conditions.includes("fog")) {
    suggestions.push("Bell or beeper collar for dog location");
    suggestions.push("GPS tracking device essential");
    suggestions.push("Bright colored dog vest");
  }
  if (huntType === "waterfowl") {
    suggestions.push("Neoprene dog vest for cold water");
    suggestions.push("Dog decoy for training");
  } else if (huntType === "upland") {
    suggestions.push("Snake boots/gaiters if applicable");
    suggestions.push("First aid kit for cuts from cover");
  }
  return suggestions;
}
__name(getEquipmentSuggestions, "getEquipmentSuggestions");
function validateGPSCoordinates2(lat, lng) {
  return typeof lat === "number" && typeof lng === "number" && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !isNaN(lat) && !isNaN(lng);
}
__name(validateGPSCoordinates2, "validateGPSCoordinates");
function getWeatherDescription(condition) {
  const descriptions = {
    "Clear": "Clear skies",
    "Partly Cloudy": "Partly cloudy with some sun",
    "Overcast": "Overcast skies",
    "Light Rain": "Light rain showers",
    "Heavy Rain": "Heavy rainfall",
    "Snow": "Snow showers",
    "Fog": "Foggy conditions"
  };
  return descriptions[condition] || condition;
}
__name(getWeatherDescription, "getWeatherDescription");
function getSunrise(lat, lng) {
  const now = /* @__PURE__ */ new Date();
  const sunrise = new Date(now);
  sunrise.setHours(6, 30, 0, 0);
  return sunrise.toISOString();
}
__name(getSunrise, "getSunrise");
function getSunset(lat, lng) {
  const now = /* @__PURE__ */ new Date();
  const sunset = new Date(now);
  sunset.setHours(18, 30, 0, 0);
  return sunset.toISOString();
}
__name(getSunset, "getSunset");
function getHuntingImpact(alertType) {
  const impacts = {
    "severe_weather": "High - postpone hunt for safety",
    "high_wind": "Moderate - affects scent conditions",
    "fog": "Moderate - reduces visibility"
  };
  return impacts[alertType] || "Monitor conditions";
}
__name(getHuntingImpact, "getHuntingImpact");
function getHuntingRecommendations(alertType) {
  const recommendations = {
    "severe_weather": ["Stay indoors until conditions improve", "Monitor weather updates"],
    "high_wind": ["Hunt in sheltered areas", "Use GPS collars on dogs"],
    "fog": ["Stay close to dogs", "Use audible signals"]
  };
  return recommendations[alertType] || ["Monitor conditions closely"];
}
__name(getHuntingRecommendations, "getHuntingRecommendations");
function generateId5() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
__name(generateId5, "generateId");
function successResponse7(data) {
  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(successResponse7, "successResponse");
function errorResponse7(message, status = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(errorResponse7, "errorResponse");

// src/handlers/training.js
async function trainingHandler(request, path, env) {
  const method = request.method;
  try {
    if (path === "/api/training/sessions" && method === "GET") {
      return await getTrainingSessions(request, env);
    } else if (path === "/api/training/sessions" && method === "POST") {
      return await createTrainingSession(request, env);
    } else if (path.match(/^\/api\/training\/sessions\/[^\/]+$/) && method === "GET") {
      const sessionId = path.split("/").pop();
      return await getTrainingSession(request, sessionId, env);
    } else if (path.match(/^\/api\/training\/sessions\/[^\/]+$/) && method === "PUT") {
      const sessionId = path.split("/").pop();
      return await updateTrainingSession(request, sessionId, env);
    } else if (path === "/api/training/goals" && method === "GET") {
      return await getTrainingGoals(request, env);
    } else if (path === "/api/training/goals" && method === "POST") {
      return await createTrainingGoal(request, env);
    } else if (path === "/api/training/progress" && method === "GET") {
      return await getTrainingProgress(request, env);
    } else if (path === "/api/training/exercises" && method === "GET") {
      return await getTrainingExercises(request, env);
    } else if (path === "/api/training/videos" && method === "POST") {
      return await uploadTrainingVideo(request, env);
    } else if (path === "/api/training/analysis" && method === "GET") {
      return await getPerformanceAnalysis(request, env);
    } else {
      return errorResponse8("Training endpoint not found", 404);
    }
  } catch (error) {
    console.error("Training handler error:", error);
    return errorResponse8("Training operation failed", 500);
  }
}
__name(trainingHandler, "trainingHandler");
async function getTrainingSessions(request, env) {
  try {
    const user = await authenticateUser4(request, env);
    if (!user.success) {
      return user.response;
    }
    const url = new URL(request.url);
    const dogId = url.searchParams.get("dog_id");
    const limit = parseInt(url.searchParams.get("limit")) || 20;
    const offset = parseInt(url.searchParams.get("offset")) || 0;
    if (!env.DB) {
      const demoSessions = [
        {
          id: "1",
          dog_id: "dog1",
          dog_name: "Rex",
          session_date: "2025-01-20",
          exercise_type: "pointing_drill",
          duration_minutes: 30,
          performance_rating: 4,
          skills_practiced: ["steady_to_wing", "point_intensity", "backing"],
          improvements_noted: "Better point intensity, held steady for full 45 seconds",
          challenges: "Still breaking on wing occasionally",
          notes: "Great session overall. Rex is really improving his steadiness.",
          created_at: "2025-01-20T10:30:00Z"
        },
        {
          id: "2",
          dog_id: "dog2",
          dog_name: "Bella",
          session_date: "2025-01-18",
          exercise_type: "retrieve_training",
          duration_minutes: 25,
          performance_rating: 3,
          skills_practiced: ["forced_fetch", "delivery_to_hand", "sit_to_deliver"],
          improvements_noted: "More willing to pick up dummy",
          challenges: "Hard mouth on delivery, needs work",
          notes: "Young dog making progress. Need to focus on soft mouth.",
          created_at: "2025-01-18T14:15:00Z"
        },
        {
          id: "3",
          dog_id: "dog3",
          dog_name: "Duke",
          session_date: "2025-01-15",
          exercise_type: "water_work",
          duration_minutes: 45,
          performance_rating: 5,
          skills_practiced: ["water_entry", "long_retrieves", "decoy_work"],
          improvements_noted: "Excellent water entries, marking ability superb",
          challenges: "None - seasoned dog performing at peak",
          notes: "Perfect session. Duke is in top form for waterfowl season.",
          created_at: "2025-01-15T16:00:00Z"
        }
      ];
      const filteredSessions = dogId ? demoSessions.filter((s) => s.dog_id === dogId) : demoSessions;
      return successResponse8(filteredSessions.slice(offset, offset + limit));
    }
    let query = `
            SELECT 
                ts.id, ts.dog_id, ts.session_date, ts.exercise_type, ts.duration_minutes,
                ts.performance_rating, ts.skills_practiced, ts.improvements_noted,
                ts.challenges, ts.notes, ts.videos, ts.created_at,
                d.name as dog_name
            FROM training_sessions ts
            JOIN dogs d ON ts.dog_id = d.id
            WHERE d.user_id = ?
        `;
    const params = [user.data.userId];
    if (dogId) {
      query += " AND ts.dog_id = ?";
      params.push(dogId);
    }
    query += " ORDER BY ts.session_date DESC, ts.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const sessions = await env.DB.prepare(query).bind(...params).all();
    const sessionData = sessions.results.map((session) => ({
      ...session,
      skills_practiced: session.skills_practiced ? JSON.parse(session.skills_practiced) : [],
      videos: session.videos ? JSON.parse(session.videos) : []
    }));
    return successResponse8(sessionData);
  } catch (error) {
    console.error("Get training sessions error:", error);
    return errorResponse8("Failed to fetch training sessions", 500);
  }
}
__name(getTrainingSessions, "getTrainingSessions");
async function createTrainingSession(request, env) {
  try {
    const user = await authenticateUser4(request, env);
    if (!user.success) {
      return user.response;
    }
    const body = await request.json();
    const {
      dog_id,
      session_date,
      exercise_type,
      duration_minutes,
      performance_rating,
      skills_practiced,
      improvements_noted,
      challenges,
      notes,
      weather_conditions,
      location
    } = body;
    if (!dog_id || !session_date || !exercise_type) {
      return errorResponse8("Dog ID, session date, and exercise type are required", 400);
    }
    if (performance_rating && (performance_rating < 1 || performance_rating > 5)) {
      return errorResponse8("Performance rating must be between 1 and 5", 400);
    }
    if (duration_minutes && duration_minutes < 0) {
      return errorResponse8("Duration must be positive", 400);
    }
    const sessionId = generateId6();
    if (!env.DB) {
      return successResponse8({
        id: sessionId,
        dog_id,
        session_date,
        exercise_type,
        duration_minutes: duration_minutes || 0,
        performance_rating: performance_rating || 3,
        skills_practiced: skills_practiced || [],
        improvements_noted: improvements_noted || "",
        challenges: challenges || "",
        notes: notes || "",
        weather_conditions: weather_conditions || {},
        location: location || "",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        message: "Demo training session created - database not connected"
      });
    }
    await env.DB.prepare(`
            INSERT INTO training_sessions (
                id, dog_id, session_date, exercise_type, duration_minutes,
                performance_rating, skills_practiced, improvements_noted,
                challenges, notes, weather_conditions, location
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
      sessionId,
      dog_id,
      session_date,
      exercise_type,
      duration_minutes || 0,
      performance_rating || 3,
      JSON.stringify(skills_practiced || []),
      improvements_noted || "",
      challenges || "",
      notes || "",
      JSON.stringify(weather_conditions || {}),
      location || ""
    ).run();
    return successResponse8({
      id: sessionId,
      dog_id,
      session_date,
      exercise_type,
      duration_minutes: duration_minutes || 0,
      performance_rating: performance_rating || 3,
      skills_practiced: skills_practiced || [],
      improvements_noted: improvements_noted || "",
      challenges: challenges || "",
      notes: notes || "",
      weather_conditions: weather_conditions || {},
      location: location || "",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Create training session error:", error);
    return errorResponse8("Failed to create training session", 500);
  }
}
__name(createTrainingSession, "createTrainingSession");
async function getTrainingGoals(request, env) {
  try {
    const user = await authenticateUser4(request, env);
    if (!user.success) {
      return user.response;
    }
    const url = new URL(request.url);
    const dogId = url.searchParams.get("dog_id");
    const demoGoals = [
      {
        id: "1",
        dog_id: "dog1",
        dog_name: "Rex",
        skill_category: "pointing",
        goal_description: "Achieve 60-second steady point with full style",
        target_date: "2025-03-01",
        current_progress: 75,
        status: "in_progress",
        milestones: [
          { description: "30-second point", completed: true, date_completed: "2024-12-15" },
          { description: "45-second point", completed: true, date_completed: "2025-01-10" },
          { description: "60-second point", completed: false, target_date: "2025-03-01" }
        ],
        created_at: "2024-11-01T10:00:00Z"
      },
      {
        id: "2",
        dog_id: "dog2",
        dog_name: "Bella",
        skill_category: "retrieving",
        goal_description: "Perfect delivery to hand without dropping",
        target_date: "2025-04-15",
        current_progress: 40,
        status: "in_progress",
        milestones: [
          { description: "Pick up dummy consistently", completed: true, date_completed: "2024-12-20" },
          { description: "Carry to trainer without dropping", completed: false, target_date: "2025-02-15" },
          { description: "Sit and deliver to hand", completed: false, target_date: "2025-04-15" }
        ],
        created_at: "2024-11-15T14:30:00Z"
      },
      {
        id: "3",
        dog_id: "dog3",
        dog_name: "Duke",
        skill_category: "water_work",
        goal_description: "Master blind retrieves up to 150 yards",
        target_date: "2025-02-20",
        current_progress: 90,
        status: "in_progress",
        milestones: [
          { description: "100-yard blind", completed: true, date_completed: "2024-12-01" },
          { description: "125-yard blind", completed: true, date_completed: "2025-01-05" },
          { description: "150-yard blind", completed: false, target_date: "2025-02-20" }
        ],
        created_at: "2024-10-15T09:00:00Z"
      }
    ];
    const filteredGoals = dogId ? demoGoals.filter((g) => g.dog_id === dogId) : demoGoals;
    return successResponse8(filteredGoals);
  } catch (error) {
    console.error("Get training goals error:", error);
    return errorResponse8("Failed to fetch training goals", 500);
  }
}
__name(getTrainingGoals, "getTrainingGoals");
async function getTrainingProgress(request, env) {
  try {
    const user = await authenticateUser4(request, env);
    if (!user.success) {
      return user.response;
    }
    const url = new URL(request.url);
    const dogId = url.searchParams.get("dog_id");
    const timeframe = url.searchParams.get("timeframe") || "30days";
    const demoProgress = {
      dog_id: dogId || "overall",
      timeframe,
      summary: {
        total_sessions: 12,
        total_hours: 8.5,
        average_performance: 4.1,
        improvement_trend: "improving",
        skills_mastered: 3,
        skills_in_progress: 4
      },
      performance_over_time: [
        { date: "2025-01-05", rating: 3.5, exercise_type: "pointing_drill" },
        { date: "2025-01-08", rating: 4, exercise_type: "retrieve_training" },
        { date: "2025-01-12", rating: 3.8, exercise_type: "water_work" },
        { date: "2025-01-15", rating: 4.2, exercise_type: "pointing_drill" },
        { date: "2025-01-18", rating: 4.5, exercise_type: "field_work" },
        { date: "2025-01-20", rating: 4.3, exercise_type: "retrieve_training" }
      ],
      skill_breakdown: [
        {
          skill: "Pointing",
          current_level: "Advanced",
          sessions_count: 5,
          average_rating: 4.4,
          trend: "improving"
        },
        {
          skill: "Retrieving",
          current_level: "Intermediate",
          sessions_count: 4,
          average_rating: 3.8,
          trend: "stable"
        },
        {
          skill: "Water Work",
          current_level: "Advanced",
          sessions_count: 3,
          average_rating: 4.7,
          trend: "improving"
        }
      ],
      recommendations: [
        "Continue focusing on steadiness training - showing great improvement",
        "Introduce more challenging retrieve scenarios",
        "Consider entering in field trial to test progress"
      ],
      generated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    return successResponse8(demoProgress);
  } catch (error) {
    console.error("Get training progress error:", error);
    return errorResponse8("Failed to fetch training progress", 500);
  }
}
__name(getTrainingProgress, "getTrainingProgress");
async function getTrainingExercises(request, env) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const skill_level = url.searchParams.get("skill_level");
    const hunt_type = url.searchParams.get("hunt_type");
    const exercises = [
      {
        id: "point_drill_basic",
        name: "Basic Pointing Drill",
        category: "pointing",
        skill_level: "beginner",
        hunt_type: "upland",
        duration_minutes: "15-20",
        description: "Introduction to pointing using planted birds or wings",
        equipment_needed: ["Bird wings", "Check cord", "Whistle"],
        steps: [
          "Start with dog on check cord in known bird area",
          "Allow dog to find scent and begin pointing",
          'Command "whoa" and reinforce with hand signal',
          "Approach slowly and flush bird or wing",
          "Keep dog steady through flush and shot",
          'Release with "okay" command'
        ],
        success_criteria: [
          "Dog points when encountering bird scent",
          "Holds point for minimum 10 seconds",
          "Remains steady during flush"
        ],
        common_mistakes: [
          "Moving too quickly toward pointing dog",
          'Not reinforcing "whoa" command consistently',
          "Allowing dog to chase after flush"
        ]
      },
      {
        id: "retrieve_basics",
        name: "Basic Retrieve Training",
        category: "retrieving",
        skill_level: "beginner",
        hunt_type: "all",
        duration_minutes: "20-25",
        description: "Foundation retrieving using bumpers and dummies",
        equipment_needed: ["Canvas bumpers", "Rope", "Treats"],
        steps: [
          "Start with dog in sitting position",
          "Show bumper and toss 10-15 feet",
          'Send dog with "fetch" command',
          "Guide dog back with verbal encouragement",
          "Have dog sit and deliver to hand",
          "Reward with praise and treat"
        ],
        success_criteria: [
          "Dog retrieves bumper consistently",
          "Returns directly to handler",
          "Sits and delivers to hand without dropping"
        ],
        common_mistakes: [
          "Throwing bumper too far initially",
          "Not insisting on proper delivery",
          "Over-exciting the dog with too much praise"
        ]
      },
      {
        id: "water_entry",
        name: "Water Entry Training",
        category: "water_work",
        skill_level: "intermediate",
        hunt_type: "waterfowl",
        duration_minutes: "30-40",
        description: "Teaching confident water entries and swimming",
        equipment_needed: ["Floating bumpers", "Long rope", "Dog whistle"],
        steps: [
          "Start at shallow water edge",
          "Wade in with dog encouraging with voice",
          "Toss floating bumper just beyond dog reach",
          "Encourage dog to swim out and retrieve",
          "Practice from various angles and depths",
          "Gradually increase distance and difficulty"
        ],
        success_criteria: [
          "Dog enters water confidently without hesitation",
          "Swims directly to marked retrieve",
          "Exits water and delivers properly"
        ],
        common_mistakes: [
          "Forcing reluctant dog into deep water",
          "Not building confidence gradually",
          "Training in water that is too cold"
        ]
      },
      {
        id: "steady_to_wing",
        name: "Steady to Wing and Shot",
        category: "steadiness",
        skill_level: "advanced",
        hunt_type: "upland",
        duration_minutes: "25-30",
        description: "Advanced steadiness training with live birds",
        equipment_needed: ["Live birds", "Bird launcher", "Blank pistol", "Check cord"],
        steps: [
          "Position dog on point with bird in launcher",
          "Approach and flush bird with launcher",
          "Fire blank pistol as bird flies",
          'Keep dog steady with "whoa" command',
          "Mark any fall and send for retrieve only on command",
          "Practice until dog remains steady consistently"
        ],
        success_criteria: [
          "Dog holds point through flush and shot",
          "Does not break until given retrieve command",
          "Marks fall accurately"
        ],
        common_mistakes: [
          "Not having adequate control before introducing live birds",
          "Inconsistent timing of commands",
          "Allowing breaking without correction"
        ]
      }
    ];
    let filteredExercises = exercises;
    if (category) {
      filteredExercises = filteredExercises.filter((e) => e.category === category);
    }
    if (skill_level) {
      filteredExercises = filteredExercises.filter((e) => e.skill_level === skill_level);
    }
    if (hunt_type) {
      filteredExercises = filteredExercises.filter(
        (e) => e.hunt_type === hunt_type || e.hunt_type === "all"
      );
    }
    return successResponse8({
      exercises: filteredExercises,
      total_count: filteredExercises.length,
      categories: ["pointing", "retrieving", "water_work", "steadiness", "obedience"],
      skill_levels: ["beginner", "intermediate", "advanced", "expert"],
      hunt_types: ["upland", "waterfowl", "all"]
    });
  } catch (error) {
    console.error("Get training exercises error:", error);
    return errorResponse8("Failed to fetch training exercises", 500);
  }
}
__name(getTrainingExercises, "getTrainingExercises");
async function uploadTrainingVideo(request, env) {
  try {
    const user = await authenticateUser4(request, env);
    if (!user.success) {
      return user.response;
    }
    const videoId = generateId6();
    const uploadTimestamp = (/* @__PURE__ */ new Date()).toISOString();
    const videoData = {
      id: videoId,
      session_id: "demo-session-id",
      filename: "training_video_" + videoId + ".mp4",
      upload_timestamp: uploadTimestamp,
      file_size: 52428800,
      // 50MB demo size
      duration_seconds: 180,
      url: `https://demo-storage.gohunta.com/videos/${videoId}.mp4`,
      thumbnail_url: `https://demo-storage.gohunta.com/thumbnails/${videoId}.jpg`,
      processing_status: "completed",
      tags: ["pointing", "steadiness", "training"],
      notes: "Training session video uploaded successfully",
      metadata: {
        resolution: "1920x1080",
        fps: 30,
        codec: "h264"
      }
    };
    return successResponse8({
      message: "Video uploaded successfully",
      video: videoData,
      note: "Demo mode - video not actually stored"
    });
  } catch (error) {
    console.error("Upload training video error:", error);
    return errorResponse8("Failed to upload training video", 500);
  }
}
__name(uploadTrainingVideo, "uploadTrainingVideo");
async function getPerformanceAnalysis(request, env) {
  try {
    const user = await authenticateUser4(request, env);
    if (!user.success) {
      return user.response;
    }
    const url = new URL(request.url);
    const dogId = url.searchParams.get("dog_id");
    const timeframe = url.searchParams.get("timeframe") || "90days";
    const analysis = {
      dog_id: dogId || "overall",
      analysis_period: timeframe,
      generated_at: (/* @__PURE__ */ new Date()).toISOString(),
      overall_assessment: {
        current_level: "Advanced",
        trajectory: "Improving",
        confidence_score: 85,
        readiness_for_competition: true
      },
      skill_analysis: [
        {
          skill: "Pointing",
          proficiency: 92,
          consistency: 88,
          recent_trend: "improving",
          strengths: ["Intense point", "Good range", "Excellent style"],
          areas_for_improvement: ["Occasionally breaks on running birds"],
          recommended_exercises: ["Steady to wing drill", "Running bird training"]
        },
        {
          skill: "Retrieving",
          proficiency: 78,
          consistency: 82,
          recent_trend: "stable",
          strengths: ["Soft mouth", "Good marking", "Eager attitude"],
          areas_for_improvement: ["Delivery to hand", "Sitting on command"],
          recommended_exercises: ["Forced fetch", "Sit to deliver drill"]
        },
        {
          skill: "Water Work",
          proficiency: 95,
          consistency: 94,
          recent_trend: "excellent",
          strengths: ["Confident entries", "Strong swimmer", "Excellent marking"],
          areas_for_improvement: ["None - peak performance"],
          recommended_exercises: ["Maintain current training level"]
        }
      ],
      training_recommendations: [
        {
          priority: "high",
          skill: "Retrieving",
          recommendation: "Focus on delivery to hand consistency",
          suggested_frequency: "3 times per week",
          estimated_improvement_time: "4-6 weeks"
        },
        {
          priority: "medium",
          skill: "Pointing",
          recommendation: "Work on steadiness with running birds",
          suggested_frequency: "2 times per week",
          estimated_improvement_time: "6-8 weeks"
        }
      ],
      competition_readiness: {
        field_trial_ready: true,
        hunt_test_ready: true,
        estimated_placement: "Top 25%",
        areas_to_focus_before_competition: [
          "Delivery to hand consistency",
          "Steadiness under pressure"
        ]
      },
      historical_comparison: {
        performance_6_months_ago: 72,
        current_performance: 85,
        improvement_percentage: 18,
        projection_6_months: 92
      }
    };
    return successResponse8(analysis);
  } catch (error) {
    console.error("Get performance analysis error:", error);
    return errorResponse8("Failed to generate performance analysis", 500);
  }
}
__name(getPerformanceAnalysis, "getPerformanceAnalysis");
async function authenticateUser4(request, env) {
  const token = extractToken5(request);
  if (token === "demo-token") {
    return {
      success: true,
      data: {
        userId: "demo-user",
        username: "Demo Hunter",
        email: "demo@hunta.com"
      }
    };
  }
  if (!token) {
    return {
      success: false,
      response: errorResponse8('Authentication required - use "demo-token" for demo access', 401)
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
      response: errorResponse8('Invalid token - use "demo-token" for demo access', 401)
    };
  }
}
__name(authenticateUser4, "authenticateUser");
function extractToken5(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
__name(extractToken5, "extractToken");
function generateId6() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
__name(generateId6, "generateId");
function successResponse8(data) {
  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(successResponse8, "successResponse");
function errorResponse8(message, status = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(errorResponse8, "errorResponse");

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
      } else if (path.startsWith("/api/hunts/")) {
        response = await huntsHandler(request, path, this.env);
      } else if (path.startsWith("/api/weather/")) {
        response = await weatherHandler(request, path, this.env);
      } else if (path.startsWith("/api/training/")) {
        response = await trainingHandler(request, path, this.env);
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

// ../../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
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

// ../../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
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

// .wrangler/tmp/bundle-5cqmL9/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/common.ts
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

// .wrangler/tmp/bundle-5cqmL9/middleware-loader.entry.ts
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
