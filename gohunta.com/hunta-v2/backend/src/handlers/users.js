export async function usersHandler(request, path, env) {
    return new Response(JSON.stringify({
        success: true,
        message: 'Users endpoint - coming soon'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}