// FindRawDogFood - Paleo Ridge inspired design with Golden Retriever branding
function getUpdatedStyles() {
  return `
    :root {
      /* Golden Retriever inspired color palette */
      --primary-gold: #F4E4BC;
      --warm-cream: #FAF6E8;
      --rich-brown: #8B7355;
      --sage-green: #7A8471;
      --deep-brown: #5D4E37;
      --soft-gray: #F5F5F5;
      --text-dark: #2C2C2C;
      --accent-blue: #4A90A4;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body { 
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; 
      line-height: 1.6; 
      color: var(--text-dark);
      background: var(--warm-cream);
    }
    
    .container { max-width: 1400px; margin: 0 auto; padding: 0 20px; }
    
    /* Header - Paleo Ridge inspired */
    header { 
      background: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      position: sticky;
      top: 0;
      z-index: 100;
      border-bottom: 3px solid var(--primary-gold);
    }
    
    nav { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 1rem 0; 
    }
    
    .logo { 
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--deep-brown);
      font-weight: 700;
      font-size: 1.8rem;
    }
    
    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--primary-gold) 0%, var(--rich-brown) 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
      /* Will be replaced with golden retriever logo */
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
      color: var(--text-dark); 
      font-weight: 500;
      padding: 0.8rem 1.2rem;
      border-radius: 8px;
      transition: all 0.3s ease;
      position: relative;
    }
    
    .nav-links a:hover { 
      background: var(--primary-gold);
      color: var(--deep-brown);
      transform: translateY(-1px);
    }
    
    /* Hero Section - Clean like Paleo Ridge */
    .hero { 
      background: linear-gradient(135deg, var(--sage-green) 0%, var(--rich-brown) 100%);
      color: white; 
      text-align: center; 
      padding: 5rem 0;
      position: relative;
      overflow: hidden;
    }
    
    .hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="3" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="70" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
      opacity: 0.3;
    }
    
    .hero-content { position: relative; z-index: 2; }
    
    .hero h1 { 
      font-size: 3.2rem; 
      margin-bottom: 1.5rem; 
      font-weight: 700;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .hero p { 
      font-size: 1.3rem; 
      margin-bottom: 2.5rem; 
      max-width: 700px; 
      margin-left: auto; 
      margin-right: auto;
      opacity: 0.95;
    }
    
    /* Search Section - Paleo Ridge style */
    .search-section { 
      background: white;
      padding: 3rem 0;
      margin-top: -2rem;
      position: relative;
      z-index: 10;
    }
    
    .search-container {
      background: white;
      max-width: 900px;
      margin: 0 auto;
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.1);
      border: 1px solid var(--primary-gold);
    }
    
    .search-title {
      text-align: center;
      color: var(--deep-brown);
      font-size: 2rem;
      margin-bottom: 2rem;
      font-weight: 600;
    }
    
    .search-form { 
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .search-input { 
      padding: 1rem 1.2rem;
      border: 2px solid var(--soft-gray);
      border-radius: 10px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: var(--warm-cream);
    }
    
    .search-input:focus { 
      outline: none; 
      border-color: var(--sage-green);
      background: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(122,132,113,0.2);
    }
    
    .search-btn { 
      background: linear-gradient(135deg, var(--sage-green) 0%, var(--rich-brown) 100%);
      color: white; 
      border: none; 
      padding: 1rem 2rem; 
      border-radius: 10px; 
      cursor: pointer; 
      font-size: 1rem;
      font-weight: 600;
      transition: all 0.3s ease;
      min-width: 120px;
    }
    
    .search-btn:hover { 
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(122,132,113,0.3);
    }
    
    /* Results Section - Like Paleo Ridge sidebar */
    .results-layout {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 2rem;
      margin-top: 2rem;
    }
    
    .results-sidebar {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      max-height: 600px;
      overflow-y: auto;
    }
    
    .supplier-card { 
      padding: 1.5rem;
      border-bottom: 1px solid var(--soft-gray);
      transition: all 0.3s ease;
      cursor: pointer;
    }
    
    .supplier-card:hover { 
      background: var(--warm-cream);
      transform: translateX(4px);
    }
    
    .supplier-card:last-child {
      border-bottom: none;
    }
    
    .supplier-name { 
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--deep-brown);
      margin-bottom: 0.5rem;
    }
    
    .supplier-address { 
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    
    .supplier-rating { 
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--rich-brown);
      font-size: 0.9rem;
    }
    
    .results-map {
      background: var(--soft-gray);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      font-size: 1.1rem;
      /* Map integration placeholder */
    }
    
    /* Welcome Section */
    .welcome { 
      background: var(--warm-cream);
      padding: 4rem 0;
    }
    
    .welcome-content {
      background: white;
      padding: 3rem;
      border-radius: 16px;
      border-left: 5px solid var(--primary-gold);
      box-shadow: 0 8px 25px rgba(0,0,0,0.08);
      max-width: 900px;
      margin: 0 auto;
    }
    
    .welcome h2 { 
      color: var(--deep-brown);
      font-size: 2.2rem;
      margin-bottom: 1.5rem;
      text-align: center;
      font-weight: 600;
    }
    
    .welcome p { 
      font-size: 1.2rem;
      line-height: 1.7;
      color: #555;
      text-align: center;
    }
    
    /* Features Grid */
    .features { 
      padding: 4rem 0; 
      background: white;
    }
    
    .features h2 {
      text-align: center;
      font-size: 2.5rem;
      color: var(--deep-brown);
      margin-bottom: 3rem;
      font-weight: 600;
    }
    
    .features-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); 
      gap: 2rem; 
    }
    
    .feature-card { 
      text-align: center; 
      padding: 2.5rem 2rem;
      background: var(--warm-cream);
      border-radius: 16px;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }
    
    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(0,0,0,0.1);
      border-color: var(--primary-gold);
    }
    
    .feature-icon { 
      font-size: 3.5rem; 
      margin-bottom: 1.5rem;
      background: linear-gradient(135deg, var(--primary-gold) 0%, var(--rich-brown) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .feature-card h3 {
      color: var(--deep-brown);
      font-size: 1.4rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    
    .feature-card p {
      color: #666;
      line-height: 1.6;
    }
    
    /* Stats Section */
    .stats { 
      background: linear-gradient(135deg, var(--deep-brown) 0%, var(--rich-brown) 100%);
      color: white; 
      padding: 3rem 0; 
    }
    
    .stats-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
      gap: 2rem; 
      text-align: center; 
    }
    
    .stat h3 { 
      font-size: 2.8rem; 
      margin-bottom: 0.5rem;
      color: var(--primary-gold);
      font-weight: 700;
    }
    
    .stat p {
      font-size: 1.1rem;
      opacity: 0.9;
    }
    
    /* Footer */
    footer { 
      background: var(--deep-brown);
      color: white; 
      text-align: center; 
      padding: 2.5rem 0; 
    }
    
    footer p {
      opacity: 0.9;
      margin-bottom: 0.5rem;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .hero h1 { font-size: 2.2rem; }
      .hero p { font-size: 1.1rem; }
      .search-form { 
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      .results-layout {
        grid-template-columns: 1fr;
      }
      .nav-links { display: none; }
      .features-grid {
        grid-template-columns: 1fr;
      }
    }
    
    /* Monetization-ready styles */
    .featured-badge {
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
      color: white;
      padding: 0.3rem 0.8rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      position: absolute;
      top: 1rem;
      right: 1rem;
    }
    
    .contact-btn {
      background: var(--accent-blue);
      color: white;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 6px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .contact-btn:hover {
      background: #3A7A8A;
      transform: translateY(-1px);
    }
  `;
}