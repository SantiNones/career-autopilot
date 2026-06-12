export interface ValidationJob {
  title: string;
  company: string;
  description: string;
  expectedVerdict: "APPLY" | "MAYBE" | "SKIP";
  category: string;
}

export const validationDataset: ValidationJob[] = [
  // APPLY - 15 jobs
  {
    title: "Junior AI Engineer",
    company: "TechCorp",
    description: "Looking for a junior AI engineer to help build and deploy machine learning models. Experience with Python, TensorFlow, and cloud platforms required. Strong foundation in mathematics and statistics.",
    expectedVerdict: "APPLY",
    category: "AI/ML"
  },
  {
    title: "Applied AI Engineer",
    company: "DataScience Inc",
    description: "Join our applied AI team to develop practical AI solutions for real-world problems. Need experience with LLMs, prompt engineering, and production AI systems.",
    expectedVerdict: "APPLY",
    category: "AI/ML"
  },
  {
    title: "AI Automation Engineer",
    company: "Automation Labs",
    description: "Build AI-powered automation workflows using OpenAI APIs, Python, and modern web frameworks. Experience with API integration and workflow design essential.",
    expectedVerdict: "APPLY",
    category: "AI/ML"
  },
  {
    title: "Python React Engineer",
    company: "FullStack Solutions",
    description: "Seeking full-stack developer with Python backend and React frontend experience. Build scalable web applications with modern frameworks.",
    expectedVerdict: "APPLY",
    category: "Full Stack"
  },
  {
    title: "Junior Full Stack Engineer",
    company: "StartupHub",
    description: "Junior full-stack position working with React, Node.js, and PostgreSQL. Great opportunity to learn and grow in a fast-paced environment.",
    expectedVerdict: "APPLY",
    category: "Full Stack"
  },
  {
    title: "Frontend Developer",
    company: "UI/UX Agency",
    description: "Frontend developer with React, TypeScript, and modern CSS skills. Build responsive and accessible web applications.",
    expectedVerdict: "APPLY",
    category: "Frontend"
  },
  {
    title: "Backend Developer",
    company: "API Company",
    description: "Backend developer with Python, Node.js, and database experience. Build and maintain RESTful APIs and microservices.",
    expectedVerdict: "APPLY",
    category: "Backend"
  },
  {
    title: "Junior Software Engineer",
    company: "Tech Startup",
    description: "Entry-level software engineer position. Learn modern development practices and work on exciting projects.",
    expectedVerdict: "APPLY",
    category: "General"
  },
  {
    title: "Web Developer",
    company: "Digital Agency",
    description: "Full-stack web developer with JavaScript, HTML, CSS, and modern frameworks. Build custom websites and web applications.",
    expectedVerdict: "APPLY",
    category: "Full Stack"
  },
  {
    title: "Junior Python Developer",
    company: "Python Solutions",
    description: "Python developer for data processing and web applications. Experience with Django, Flask, or FastAPI preferred.",
    expectedVerdict: "APPLY",
    category: "Backend"
  },
  {
    title: "React Developer",
    company: "Frontend First",
    description: "React developer with TypeScript and modern state management. Build component-based user interfaces.",
    expectedVerdict: "APPLY",
    category: "Frontend"
  },
  {
    title: "Junior DevOps Engineer",
    company: "CloudOps",
    description: "Entry-level DevOps position working with AWS, Docker, and CI/CD pipelines. Learn infrastructure as code and deployment automation.",
    expectedVerdict: "APPLY",
    category: "DevOps"
  },
  {
    title: "AI Product Engineer",
    company: "AI Products",
    description: "Build AI-powered products using modern web technologies and machine learning frameworks. Full-stack role with AI focus.",
    expectedVerdict: "APPLY",
    category: "AI/ML"
  },
  {
    title: "Junior Data Engineer",
    company: "DataFlow",
    description: "Data engineer with Python, SQL, and data pipeline experience. Build and maintain data infrastructure.",
    expectedVerdict: "APPLY",
    category: "Data"
  },
  {
    title: "Full Stack Developer (Python/React)",
    company: "Tech Innovations",
    description: "Full-stack developer combining Python backend with React frontend. Experience with APIs and databases required.",
    expectedVerdict: "APPLY",
    category: "Full Stack"
  },

  // MAYBE - 10 jobs
  {
    title: "Solutions Engineer",
    company: "Enterprise Tech",
    description: "Solutions engineer to bridge technical and business teams. Need programming skills and customer-facing experience.",
    expectedVerdict: "MAYBE",
    category: "Solutions"
  },
  {
    title: "Customer Engineer",
    company: "Cloud Provider",
    description: "Customer engineer supporting enterprise clients. Technical problem-solving and communication skills essential.",
    expectedVerdict: "MAYBE",
    category: "Solutions"
  },
  {
    title: "Technical Consultant",
    company: "Consulting Firm",
    description: "Technical consultant for digital transformation projects. Need broad technical knowledge and client management skills.",
    expectedVerdict: "MAYBE",
    category: "Consulting"
  },
  {
    title: "AI Consultant",
    company: "AI Advisory",
    description: "AI consultant helping businesses implement AI solutions. Need technical understanding and business acumen.",
    expectedVerdict: "MAYBE",
    category: "Consulting"
  },
  {
    title: "Technical Account Manager",
    company: "SaaS Company",
    description: "Technical account manager with coding background. Support enterprise clients and provide technical guidance.",
    expectedVerdict: "MAYBE",
    category: "Account Management"
  },
  {
    title: "Sales Engineer",
    company: "Tech Sales",
    description: "Sales engineer with technical expertise. Support sales team with product demonstrations and technical solutions.",
    expectedVerdict: "MAYBE",
    category: "Sales"
  },
  {
    title: "Platform Engineer",
    company: "Platform Co",
    description: "Platform engineer building internal tools and infrastructure. Need systems thinking and coding skills.",
    expectedVerdict: "MAYBE",
    category: "Platform"
  },
  {
    title: "Integration Engineer",
    company: "Integration Solutions",
    description: "Integration specialist connecting different systems and APIs. Need problem-solving and technical skills.",
    expectedVerdict: "MAYBE",
    category: "Integration"
  },
  {
    title: "Technical Support Engineer",
    company: "Support Tech",
    description: "Technical support with development skills. Troubleshoot complex issues and create solutions.",
    expectedVerdict: "MAYBE",
    category: "Support"
  },
  {
    title: "Implementation Engineer",
    company: "Implementation Co",
    description: "Implementation engineer deploying software solutions for clients. Need technical and project management skills.",
    expectedVerdict: "MAYBE",
    category: "Implementation"
  },

  // SKIP - 15 jobs
  {
    title: "Senior SRE",
    company: "Large Tech",
    description: "Senior Site Reliability Engineer with 5+ years experience in large-scale infrastructure. Need deep expertise in Kubernetes, monitoring, and incident response.",
    expectedVerdict: "SKIP",
    category: "SRE"
  },
  {
    title: "Staff Engineer",
    company: "Big Tech",
    description: "Staff-level software engineer with 8+ years experience. Lead complex projects and mentor junior engineers.",
    expectedVerdict: "SKIP",
    category: "Senior"
  },
  {
    title: "Principal ML Engineer",
    company: "AI Research Lab",
    description: "Principal machine learning engineer with PhD and 10+ years experience. Lead ML research and production systems.",
    expectedVerdict: "SKIP",
    category: "Senior"
  },
  {
    title: "Head of AI",
    company: "Enterprise Corp",
    description: "Head of AI department with 15+ years experience. Lead AI strategy and team building.",
    expectedVerdict: "SKIP",
    category: "Leadership"
  },
  {
    title: "Director Engineering",
    company: "Tech Company",
    description: "Director of Engineering with 10+ years leadership experience. Manage multiple teams and technical strategy.",
    expectedVerdict: "SKIP",
    category: "Leadership"
  },
  {
    title: "Senior Backend Engineer",
    company: "Established Tech",
    description: "Senior backend engineer with 6+ years experience. Need expertise in distributed systems and high-performance applications.",
    expectedVerdict: "SKIP",
    category: "Senior"
  },
  {
    title: "Lead Full Stack Developer",
    company: "Enterprise Software",
    description: "Lead full-stack developer with 7+ years experience. Architect and lead development of complex web applications.",
    expectedVerdict: "SKIP",
    category: "Senior"
  },
  {
    title: "Principal Software Engineer",
    company: "Tech Giant",
    description: "Principal engineer with 12+ years experience. Set technical direction and solve complex architectural challenges.",
    expectedVerdict: "SKIP",
    category: "Senior"
  },
  {
    title: "VP of Engineering",
    company: "Startup",
    description: "VP of Engineering with 15+ years experience. Lead entire engineering organization and technical strategy.",
    expectedVerdict: "SKIP",
    category: "Leadership"
  },
  {
    title: "Senior DevOps Engineer",
    company: "Cloud Provider",
    description: "Senior DevOps engineer with 8+ years experience. Expert in cloud infrastructure, security, and large-scale deployments.",
    expectedVerdict: "SKIP",
    category: "Senior"
  },
  {
    title: "Chief Technology Officer",
    company: "Tech Startup",
    description: "CTO role with 15+ years experience. Lead technology vision and engineering team.",
    expectedVerdict: "SKIP",
    category: "Leadership"
  },
  {
    title: "Senior Data Scientist",
    company: "Data Company",
    description: "Senior data scientist with PhD and 8+ years experience. Lead data science projects and research.",
    expectedVerdict: "SKIP",
    category: "Senior"
  },
  {
    title: "Staff Frontend Engineer",
    company: "Frontend Company",
    description: "Staff frontend engineer with 7+ years experience. Lead frontend architecture and complex UI development.",
    expectedVerdict: "SKIP",
    category: "Senior"
  },
  {
    title: "Principal Cloud Architect",
    company: "Cloud Services",
    description: "Principal cloud architect with 10+ years experience. Design large-scale cloud solutions and best practices.",
    expectedVerdict: "SKIP",
    category: "Senior"
  },
  {
    title: "Senior Security Engineer",
    company: "Security Firm",
    description: "Senior security engineer with 8+ years experience. Expert in application security, penetration testing, and compliance.",
    expectedVerdict: "SKIP",
    category: "Senior"
  }
];

export const datasetStats = {
  total: validationDataset.length,
  apply: validationDataset.filter(job => job.expectedVerdict === "APPLY").length,
  maybe: validationDataset.filter(job => job.expectedVerdict === "MAYBE").length,
  skip: validationDataset.filter(job => job.expectedVerdict === "SKIP").length,
};
