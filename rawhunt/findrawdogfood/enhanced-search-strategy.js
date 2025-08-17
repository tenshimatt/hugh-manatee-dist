// Enhanced search strategy for maximum coverage
// Updated to use both OLD and NEW Places API strategically

const SEARCH_STRATEGIES = {
  // Phase 1: Use OLD API for bulk collection (cheaper)
  bulk_collection: {
    api: 'legacy',
    target: 'major_cities_and_grid',
    expected_yield: '50,000+ locations'
  },
  
  // Phase 2: Use NEW API for gap filling (more locations)
  gap_filling: {
    api: 'new',
    target: 'rural_areas_and_specialized',
    expected_yield: '20,000+ additional locations'
  }
};

// Enhanced search terms for better coverage
const ENHANCED_SEARCH_TERMS = [
  // Basic terms
  'raw dog food store',
  'pet nutrition center',
  'holistic pet food',
  
  // Specific supplier types
  'raw pet food supplier',
  'freeze dried dog food',
  'natural dog food store',
  'organic pet food',
  'barf diet supplier',
  'raw feeding supplies',
  
  // Related business types that often carry raw food
  'pet supply store',
  'pet food store', 
  'holistic veterinarian',
  'animal feed store',
  'farm supply store'
];

// Geographic strategies for complete coverage
const COVERAGE_STRATEGIES = [
  {
    name: 'major_cities',
    description: 'Top 500 US cities',
    api_calls: 2500,
    expected_results: 15000
  },
  {
    name: 'grid_search',
    description: '10km grid across USA',
    api_calls: 5000,
    expected_results: 25000  
  },
  {
    name: 'zip_code_search',
    description: 'Search by ZIP codes',
    api_calls: 3000,
    expected_results: 15000
  },
  {
    name: 'rural_areas',
    description: 'Small towns and rural',
    api_calls: 2000,
    expected_results: 8000
  }
];
