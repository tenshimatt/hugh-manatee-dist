export async function postsHandler(request, path, env) {
    return new Response(JSON.stringify({
        success: true,
        data: [],
        message: 'Brag board posts - coming soon'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}