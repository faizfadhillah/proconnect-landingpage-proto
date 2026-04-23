// ProConnect — shared job listings data
// Each job has:
//   slug, title, company, location, country, initials, c1, c2 (logo gradient)
//   salary (display), salaryMin, salaryMax, salaryBucket, type, department,
//   experience, posted (display), postedRank (lower = newer), badges[],
//   tags[], perks[], description (HTML), responsibilities[], requirements[], benefits[]

const JOBS = [
  {
    slug: 'mandarin-oriental-fom-bali',
    title: 'Front Office Manager',
    company: 'Mandarin Oriental',
    location: 'Bali, Indonesia',
    country: 'Indonesia',
    initials: 'MO',
    c1: '#1E4BA8', c2: '#3A66D1',
    salary: '$3,800 – $4,500',
    salaryMin: 3800, salaryMax: 4500, salaryBucket: '2000-4000',
    type: 'Full-time',
    department: 'Front Office',
    experience: 'Senior',
    posted: '2 days ago',
    postedRank: 1,
    badges: ['new','verified'],
    tags: ['Opera PMS','5★ Experience','ID+EN'],
    perks: ['Accommodation','Relocation'],
    shortDesc: 'Lead the front office team at a luxury beachfront resort. Opera PMS and 5★ experience required.',
    responsibilities: [
      'Lead and mentor a front office team of 18 across reception, concierge, and guest services',
      'Oversee daily operations to ensure seamless check-in/check-out and 95%+ guest satisfaction scores',
      'Drive upsell revenue via room upgrades, late check-out, and dining reservations',
      'Coordinate with housekeeping, F&B, and engineering for VIP arrivals',
      'Manage guest feedback loops and resolve escalations within 2 hours'
    ],
    requirements: [
      '5+ years in front office leadership at a 5★ international property',
      'Advanced Opera PMS proficiency — configuration, reporting, and training',
      'Fluent English + Bahasa Indonesia (or willingness to learn within 6 months)',
      'Proven track record improving NPS or guest satisfaction metrics',
      'Degree in Hospitality Management preferred; ProConnect Skill Passport verified'
    ],
    benefits: [
      'Competitive base salary + quarterly performance bonus',
      'On-property staff accommodation or housing allowance',
      'Full relocation support (flights, shipping, visa)',
      'Private medical insurance for you + one dependent',
      '30 days annual leave + 2 complimentary stays/year at any Mandarin Oriental property',
      'Ongoing learning via Mandarin Oriental University'
    ]
  },

  {
    slug: 'shangri-la-executive-chef-kl',
    title: 'Executive Chef — Italian Kitchen',
    company: 'Shangri-La Hotel',
    location: 'Kuala Lumpur, Malaysia',
    country: 'Malaysia',
    initials: 'SL',
    c1: '#DC2626', c2: '#F97316',
    salary: '$4,200 – $5,500',
    salaryMin: 4200, salaryMax: 5500, salaryBucket: '4000+',
    type: 'Full-time',
    department: 'Kitchen',
    experience: 'Executive',
    posted: '5 days ago',
    postedRank: 2,
    badges: ['urgent','verified'],
    tags: ['Italian cuisine','Menu development','Team of 14'],
    perks: ['Accommodation','Relocation','Visa'],
    shortDesc: 'Lead the signature Italian restaurant kitchen. Menu design, cost control, and team mentorship.',
    responsibilities: [
      'Own the menu design, seasonal refreshes, and signature dish development for the flagship Italian restaurant',
      'Lead a brigade of 14 kitchen staff — CDPs, commis, stewards, and pastry',
      'Maintain food cost at or below 28% through supplier negotiation and portion control',
      'Uphold HACCP standards and lead the hygiene audit readiness program',
      'Partner with F&B Director on wine pairings, private dining events, and PR tastings'
    ],
    requirements: [
      '8+ years culinary experience with 3+ years as head/executive chef at a 5★ hotel or fine-dining restaurant',
      'Deep expertise in Italian cuisine — pasta-making, risotto, regional specialties',
      'Formal culinary training (Le Cordon Bleu, ALMA, or equivalent)',
      'Demonstrable food-cost and P&L management',
      'Strong English; Italian or Bahasa Malaysia is a plus'
    ],
    benefits: [
      'Housing allowance or on-property accommodation',
      'Complete relocation and work-visa sponsorship for family',
      'Annual performance bonus (up to 3 months salary)',
      'Medical + dental insurance for family',
      'Discounted/comp rates across Shangri-La group globally',
      'Professional development budget of $3,000/year'
    ]
  },

  {
    slug: 'four-seasons-spa-therapist-chiangmai',
    title: 'Senior Spa Therapist',
    company: 'Four Seasons Resort',
    location: 'Chiang Mai, Thailand',
    country: 'Thailand',
    initials: 'FS',
    c1: '#16A34A', c2: '#22C55E',
    salary: '$1,800 – $2,400',
    salaryMin: 1800, salaryMax: 2400, salaryBucket: '1000-2000',
    type: 'Full-time',
    department: 'Spa & Wellness',
    experience: 'Mid',
    posted: '1 week ago',
    postedRank: 3,
    badges: ['verified'],
    tags: ['Thai massage','Aromatherapy','CIDESCO'],
    perks: ['Accommodation','Relocation'],
    shortDesc: 'Deliver signature Lanna-inspired treatments in an award-winning jungle resort spa.',
    responsibilities: [
      'Perform signature Four Seasons wellness treatments — Thai massage, aromatherapy, body scrubs',
      'Consult with guests on personalized wellness journeys',
      'Maintain meticulous sanitation and treatment-room setup standards',
      'Mentor junior therapists on technique and guest experience',
      'Contribute to seasonal menu development using local Lanna herbs and traditions'
    ],
    requirements: [
      'CIDESCO, ITEC, or equivalent internationally recognized certification',
      '3+ years experience in a luxury spa environment',
      'Advanced Thai massage certification required; additional modalities (Swedish, Deep Tissue) preferred',
      'Conversational English; Thai language ability a plus',
      'Passion for wellness, hospitality, and cultural authenticity'
    ],
    benefits: [
      'On-property shared staff accommodation',
      'Relocation support for international hires',
      'Service charge share (typically $400–600/month additional)',
      'Complimentary wellness treatments monthly',
      'Employee meal program',
      'Global Four Seasons staff rates'
    ]
  },

  {
    slug: 'marriott-revenue-manager-singapore',
    title: 'Revenue Manager — Cluster',
    company: 'Marriott International',
    location: 'Singapore',
    country: 'Singapore',
    initials: 'M',
    c1: '#7F1D1D', c2: '#B91C1C',
    salary: '$5,500 – $7,000',
    salaryMin: 5500, salaryMax: 7000, salaryBucket: '4000+',
    type: 'Full-time',
    department: 'Management',
    experience: 'Senior',
    posted: '3 days ago',
    postedRank: 1,
    badges: ['new','remote','verified'],
    tags: ['One Yield','IDeaS','Multi-property'],
    perks: ['Relocation','Visa'],
    shortDesc: 'Own revenue strategy for 3 Marriott properties in SEA. Remote-friendly with 30% travel.',
    responsibilities: [
      'Set pricing strategy across 3 Marriott properties (Singapore, Manila, Jakarta)',
      'Own weekly revenue calls, forecast accuracy, and GOPPAR targets',
      'Optimize channel mix — direct, OTA, GDS, wholesale',
      'Partner with Sales, Marketing, and Operations on pricing campaigns',
      'Present monthly performance to regional VP'
    ],
    requirements: [
      '6+ years revenue management at international hotel brands',
      'Expert in One Yield (or equivalent Marriott tools), IDeaS, and STR reports',
      'Cluster / multi-property experience required',
      'Strong financial modeling skills in Excel',
      'Degree in Hospitality, Economics, or related field'
    ],
    benefits: [
      'Remote-first with quarterly property visits (fully expensed)',
      'Singapore work pass sponsorship',
      'Relocation package for international hires',
      'Annual bonus tied to portfolio GOPPAR performance',
      'Marriott Explore rates globally',
      'Home-office setup stipend'
    ]
  },

  {
    slug: 'anantara-guest-relations-hoian',
    title: 'Guest Relations Officer',
    company: 'Anantara Resorts',
    location: 'Hoi An, Vietnam',
    country: 'Vietnam',
    initials: 'A',
    c1: '#166534', c2: '#22C55E',
    salary: '$900 – $1,400',
    salaryMin: 900, salaryMax: 1400, salaryBucket: '0-1000',
    type: 'Full-time',
    department: 'Front Office',
    experience: 'Entry',
    posted: '1 day ago',
    postedRank: 1,
    badges: ['new','verified'],
    tags: ['English','Hospitality diploma','Guest-first'],
    perks: ['Accommodation'],
    shortDesc: 'Perfect first hospitality role at a UNESCO heritage-site resort. Training program included.',
    responsibilities: [
      'Welcome arriving guests and conduct personalized property orientations',
      'Respond to guest requests, complaints, and feedback within service standards',
      'Coordinate with housekeeping, F&B, and concierge to anticipate guest needs',
      'Maintain guest profiles in the PMS to personalize return stays',
      'Assist with VIP amenity setup and in-room welcomes'
    ],
    requirements: [
      'Diploma in Hospitality Management or equivalent (fresh graduates welcome)',
      'Strong conversational English; additional languages a plus',
      'Warm, genuine demeanor and poised communication',
      'Service-oriented mindset with attention to detail',
      'Willingness to work shifts including weekends and holidays'
    ],
    benefits: [
      'Shared on-property staff accommodation with meals',
      'Comprehensive onboarding + Anantara Academy training',
      'Service charge share',
      'Clear career-progression path (GRO → Assistant FO Manager in 2–3 years)',
      'Anantara staff rates globally (up to 80% off)',
      'ProConnect Skill Passport verification included'
    ]
  },

  {
    slug: 'peninsula-concierge-manila',
    title: 'Head Concierge — Les Clefs d\'Or',
    company: 'The Peninsula',
    location: 'Manila, Philippines',
    country: 'Philippines',
    initials: 'P',
    c1: '#0F2352', c2: '#1E4BA8',
    salary: '$2,800 – $3,600',
    salaryMin: 2800, salaryMax: 3600, salaryBucket: '2000-4000',
    type: 'Full-time',
    department: 'Front Office',
    experience: 'Senior',
    posted: '4 days ago',
    postedRank: 2,
    badges: ['urgent','verified'],
    tags: ['Les Clefs d\'Or','VIP service','Multilingual'],
    perks: ['Relocation'],
    shortDesc: 'Lead the concierge team at the Peninsula Manila. Les Clefs d\'Or membership strongly preferred.',
    responsibilities: [
      'Lead a 6-person concierge team handling all guest requests, dining, tours, and bespoke experiences',
      'Maintain the property\'s little black book of preferred vendors, venues, and experiences across Manila',
      'Handle VIP guests including celebrities, diplomats, and heads of state',
      'Train team on Les Clefs d\'Or standards and Peninsula service culture',
      'Partner with PR and marketing on guest-experience storytelling'
    ],
    requirements: [
      'Les Clefs d\'Or membership (or active pathway to membership)',
      '7+ years luxury hotel concierge experience',
      'Deep Manila network — restaurants, cultural venues, private experiences',
      'Fluent English + Filipino; additional languages highly valued',
      'Impeccable grooming and presentation'
    ],
    benefits: [
      'Relocation support for international candidates',
      'Annual service-charge share',
      'Peninsula staff rates worldwide',
      'Les Clefs d\'Or annual congress attendance sponsored',
      'Medical + life insurance',
      'Transportation allowance'
    ]
  }
];
