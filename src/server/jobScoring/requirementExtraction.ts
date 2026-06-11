/**
 * Hard Requirement Extraction Helpers for Fit Analysis V2
 * 
 * These functions extract specific requirements from job text
 * to enable accurate fit scoring and gap analysis.
 */

export interface ExtractedRequirements {
  requiredYears: number | null;
  requiredTechnologies: string[];
  requiredDomains: string[];
  requiredCredentials: string[];
  requiredLanguages: string[];
  experienceLevel: string | null;
  locationConstraints: string[];
  seniorityLevel: string | null;
}

/**
 * Extract required years of experience from job text
 */
export function extractRequiredYears(text: string): number | null {
  const t = text.toLowerCase();
  
  // Patterns for explicit year requirements
  const patterns = [
    /(\d{1,2})\s*\+?\s*years?\s+of\s+(?:relevant\s+|professional\s+|hands-on\s+|work\s+)?experience/i,
    /(\d{1,2})\s*\+?\s*years?\s+experience\b/i,
    /minimum\s+(?:of\s+)?(\d{1,2})\s*\+?\s*years?/i,
    /at\s+least\s+(\d{1,2})\s*\+?\s*years?/i,
    /experience\s*[:\-–]\s*(\d{1,2})\s*\+?\s*years?/i,
    /(\d{1,2})\s*[-–]\s*\d{1,2}\s*years?\s+of\s+experience/i,
    /(\d{1,2})\s*\+?\s*years?\s+in\s+(?:software\s+)?development/i,
  ];

  for (const pattern of patterns) {
    const match = t.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }

  // Check for range patterns like "3-5 years"
  const rangeMatch = t.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s*years?/i);
  if (rangeMatch) {
    // Use the lower end of the range for conservative estimation
    return parseInt(rangeMatch[1]);
  }

  return null;
}

/**
 * Extract required technologies from job text
 */
export function extractRequiredTechnologies(text: string): string[] {
  const t = text.toLowerCase();
  const technologies: string[] = [];

  // Programming languages
  const languages = [
    'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust',
    'ruby', 'php', 'swift', 'kotlin', 'scala', 'clojure', 'haskell', 'dart'
  ];

  // ML/AI frameworks
  const mlFrameworks = [
    'pytorch', 'tensorflow', 'keras', 'scikit-learn', 'pandas', 'numpy',
    'jax', 'flax', 'huggingface', 'langchain', 'openai', 'anthropic',
    'cohere', 'transformers', 'llama', 'mistral', 'gemini'
  ];

  // Infrastructure/DevOps
  const infrastructure = [
    'kubernetes', 'docker', 'aws', 'gcp', 'azure', 'terraform', 'ansible',
    'jenkins', 'github actions', 'gitlab ci', 'circleci', 'prometheus',
    'grafana', 'elasticsearch', 'kibana', 'logstash', 'nginx', 'apache'
  ];

  // Databases
  const databases = [
    'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
    'dynamodb', 'bigquery', 'snowflake', 'redshift', 'clickhouse'
  ];

  // Frontend frameworks
  const frontend = [
    'react', 'vue', 'angular', 'svelte', 'next.js', 'gatsby', 'webpack',
    'vite', 'tailwind', 'bootstrap', 'material-ui', 'antd'
  ];

  // Backend frameworks
  const backend = [
    'express', 'django', 'flask', 'spring boot', 'rails', 'laravel', 'fastapi',
    'nest.js', 'koa', 'fiber', 'gin', 'echo'
  ];

  // All technologies to check
  const allTechnologies = [...languages, ...mlFrameworks, ...infrastructure, ...databases, ...frontend, ...backend];

  for (const tech of allTechnologies) {
    if (t.includes(tech)) {
      technologies.push(tech);
    }
  }

  // Check for specific patterns
  const specificPatterns = [
    /machine\s+learning/i,
    /deep\s+learning/i,
    /artificial\s+intelligence/i,
    /large\s+language\s+models?/i,
    /llms?/i,
    /computer\s+vision/i,
    /natural\s+language\s+processing/i,
    /nlp/i,
    /mlops/i,
    /data\s+science/i,
    /data\s+engineering/i,
    /software\s+engineering/i,
    /full.?stack/i,
    /front.?end/i,
    /back.?end/i,
    /devops/i,
    /site\s+reliability/i,
    /sre/i,
  ];

  for (const pattern of specificPatterns) {
    if (t.match(pattern)) {
      technologies.push(pattern.source.replace(/\\s\+/g, ' ').replace(/[\/\\i]/g, ''));
    }
  }

  return [...new Set(technologies)]; // Remove duplicates
}

/**
 * Extract required domains from job text
 */
export function extractRequiredDomains(text: string): string[] {
  const t = text.toLowerCase();
  const domains: string[] = [];

  const domainPatterns = [
    'enterprise software',
    'fintech', 'financial technology',
    'healthcare', 'health tech',
    'e-commerce', 'ecommerce',
    'social media',
    'gaming', 'games',
    'education', 'edtech',
    'automotive',
    'manufacturing',
    'retail',
    'travel',
    'telecommunications',
    'government', 'public sector',
    'non-profit',
    'startup',
    'consulting',
    'banking',
    'insurance',
    'real estate',
    'logistics',
    'supply chain',
    'energy',
    'media',
    'entertainment',
    'sports',
    'food tech',
    'agriculture',
    'biotech',
    'pharmaceuticals',
  ];

  for (const domain of domainPatterns) {
    if (t.includes(domain)) {
      domains.push(domain);
    }
  }

  return [...new Set(domains)];
}

/**
 * Extract required credentials from job text
 */
export function extractRequiredCredentials(text: string): string[] {
  const t = text.toLowerCase();
  const credentials: string[] = [];

  // Degree requirements
  if (t.includes('phd') || t.includes('doctorate') || t.includes('doctoral')) {
    credentials.push('PhD');
  }
  
  if (t.includes('master') || t.includes('ms') || t.includes('m.s')) {
    credentials.push('Master');
  }
  
  if (t.includes('bachelor') || t.includes('bs') || t.includes('b.s') || t.includes('undergraduate')) {
    credentials.push('Bachelor');
  }

  // Research requirements
  if (t.includes('first-author') || t.includes('first author') || t.includes('lead author')) {
    credentials.push('First-author publications');
  }
  
  if (t.includes('publications') || t.includes('published') || t.includes('papers')) {
    credentials.push('Publications');
  }
  
  if (t.includes('research') && (t.includes('scientist') || t.includes('experience'))) {
    credentials.push('Research experience');
  }

  // Security requirements
  if (t.includes('security clearance') || t.includes('clearance')) {
    credentials.push('Security clearance');
  }

  // Certifications
  const certifications = [
    'aws certified', 'azure certified', 'gcp certified',
    'pmp', 'csm', 'cspo', 'safe', 'itil',
    'ccna', 'ccnp', 'cissp', 'cisa',
    'react certification', 'aws solutions architect',
    'google cloud professional', 'microsoft certified'
  ];

  for (const cert of certifications) {
    if (t.includes(cert)) {
      credentials.push(cert);
    }
  }

  return [...new Set(credentials)];
}

/**
 * Extract required languages from job text
 */
export function extractRequiredLanguages(text: string): string[] {
  const t = text.toLowerCase();
  const languages: string[] = [];

  const languagePatterns = [
    { pattern: /english/i, name: 'English' },
    { pattern: /spanish/i, name: 'Spanish' },
    { pattern: /french/i, name: 'French' },
    { pattern: /german/i, name: 'German' },
    { pattern: /italian/i, name: 'Italian' },
    { pattern: /portuguese/i, name: 'Portuguese' },
    { pattern: /dutch/i, name: 'Dutch' },
    { pattern: /chinese/i, name: 'Chinese' },
    { pattern: /japanese/i, name: 'Japanese' },
    { pattern: /korean/i, name: 'Korean' },
    { pattern: /russian/i, name: 'Russian' },
    { pattern: /arabic/i, name: 'Arabic' },
    { pattern: /hindi/i, name: 'Hindi' },
  ];

  for (const { pattern, name } of languagePatterns) {
    if (t.match(pattern)) {
      languages.push(name);
    }
  }

  return [...new Set(languages)];
}

/**
 * Extract location constraints from job text
 */
export function extractLocationConstraints(text: string): string[] {
  const t = text.toLowerCase();
  const constraints: string[] = [];

  // Country-specific constraints
  if (t.includes('us-only') || t.includes('usa only') || t.includes('united states only')) {
    constraints.push('US-only');
  }
  
  if (t.includes('eu-only') || t.includes('europe only') || t.includes('european union only')) {
    constraints.push('EU-only');
  }

  // Location requirements
  if (t.includes('on-site') || t.includes('onsite') || t.includes('in-office')) {
    constraints.push('On-site required');
  }
  
  if (t.includes('relocation required') || t.includes('must relocate')) {
    constraints.push('Relocation required');
  }

  // Regional constraints
  const regions = [
    'north america', 'south america', 'europe', 'asia', 'africa', 'australia',
    'united states', 'canada', 'mexico', 'uk', 'united kingdom', 'germany',
    'france', 'spain', 'italy', 'netherlands', 'sweden', 'norway', 'denmark',
    'poland', 'czech republic', 'hungary', 'romania', 'bulgaria',
    'china', 'japan', 'south korea', 'india', 'singapore', 'australia',
    'new zealand', 'brazil', 'argentina', 'chile', 'colombia', 'peru'
  ];

  for (const region of regions) {
    if (t.includes(region)) {
      constraints.push(region);
    }
  }

  return [...new Set(constraints)];
}

/**
 * Extract seniority level from job text
 */
export function extractSeniorityLevel(text: string): string | null {
  const t = text.toLowerCase();

  // Seniority patterns
  const seniorityPatterns = [
    { pattern: /intern|internship|trainee/i, level: 'internship' },
    { pattern: /junior|jr|entry.?level|associate/i, level: 'junior' },
    { pattern: /mid.?level|intermediate|2-3 years|3-5 years/i, level: 'mid' },
    { pattern: /senior|sr|lead|principal|5\+ years|7\+ years/i, level: 'senior' },
    { pattern: /staff|principal|architect|10\+ years/i, level: 'staff' },
    { pattern: /manager|head|director|vp|c-level/i, level: 'management' },
  ];

  for (const { pattern, level } of seniorityPatterns) {
    if (t.match(pattern)) {
      return level;
    }
  }

  return null;
}

/**
 * Extract all requirements from job text
 */
export function extractAllRequirements(text: string): ExtractedRequirements {
  return {
    requiredYears: extractRequiredYears(text),
    requiredTechnologies: extractRequiredTechnologies(text),
    requiredDomains: extractRequiredDomains(text),
    requiredCredentials: extractRequiredCredentials(text),
    requiredLanguages: extractRequiredLanguages(text),
    experienceLevel: extractSeniorityLevel(text),
    locationConstraints: extractLocationConstraints(text),
    seniorityLevel: extractSeniorityLevel(text),
  };
}
