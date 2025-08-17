// Updated navigation - simplified and cleaner
function getHeader() {
  return `
    <header>
        <nav class="container">
            <a href="/" class="logo">🐕 FindRawDogFood</a>
            <ul class="nav-links">
                <li><a href="/blog/the-raw-truth-why-dogs-thrive-on-barf-diet">Raw Feeding Guide</a></li>
                <li><a href="/blog">Blog</a></li>
            </ul>
        </nav>
    </header>`;
}

// Updated navigation styles - ready for your logo
function getNavStyles() {
  return `
    /* Header styles - ready for logo customization */
    header { 
        background: rgba(255,255,255,0.95); 
        backdrop-filter: blur(10px);
        box-shadow: 0 2px 20px rgba(0,0,0,0.1);
        position: sticky;
        top: 0;
        z-index: 100;
    }
    nav { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        padding: 1rem 0; 
    }
    .logo { 
        font-size: 1.8rem; 
        font-weight: bold; 
        color: #2c3e50;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        /* Ready for logo image */
    }
    .logo img {
        height: 40px;
        width: auto;
    }
    .nav-links { 
        display: flex; 
        list-style: none; 
        gap: 2rem; 
        margin: 0;
        padding: 0;
    }
    .nav-links a { 
        text-decoration: none; 
        color: #2c3e50; 
        font-weight: 500;
        transition: color 0.3s;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        transition: all 0.3s;
    }
    .nav-links a:hover { 
        color: #667eea; 
        background: rgba(102,126,234,0.1);
    }
    
    @media (max-width: 768px) {
        .nav-links { 
            display: flex;
            gap: 1rem;
        }
        .nav-links a {
            font-size: 0.9rem;
            padding: 0.3rem 0.6rem;
        }
    }`;
}
