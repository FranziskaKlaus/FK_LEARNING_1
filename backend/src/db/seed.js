const { db, initializeDatabase } = require('./schema');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

initializeDatabase();

// Sectors
const sectors = [
  { id: uuidv4(), name: 'Healthcare', slug: 'healthcare', icon: '🏥', description: 'Doctors, hospitals, clinics, pharmacies', color: '#EF4444', sort_order: 1 },
  { id: uuidv4(), name: 'Education', slug: 'education', icon: '🎓', description: 'Schools, universities, teachers, tutors', color: '#8B5CF6', sort_order: 2 },
  { id: uuidv4(), name: 'Finance & Banking', slug: 'finance', icon: '🏦', description: 'Banks, insurance, financial advisors', color: '#10B981', sort_order: 3 },
  { id: uuidv4(), name: 'Legal Services', slug: 'legal', icon: '⚖️', description: 'Lawyers, notaries, law firms', color: '#6366F1', sort_order: 4 },
  { id: uuidv4(), name: 'Retail & E-commerce', slug: 'retail', icon: '🛒', description: 'Shops, online stores, marketplaces', color: '#F59E0B', sort_order: 5 },
  { id: uuidv4(), name: 'Hospitality & Travel', slug: 'hospitality', icon: '✈️', description: 'Hotels, restaurants, travel agencies', color: '#06B6D4', sort_order: 6 },
  { id: uuidv4(), name: 'Technology', slug: 'technology', icon: '💻', description: 'Tech companies, software, IT services', color: '#3B82F6', sort_order: 7 },
  { id: uuidv4(), name: 'Government & Public Services', slug: 'government', icon: '🏛️', description: 'Government offices, public services', color: '#64748B', sort_order: 8 },
  { id: uuidv4(), name: 'Real Estate', slug: 'real-estate', icon: '🏠', description: 'Real estate agents, property management', color: '#84CC16', sort_order: 9 },
  { id: uuidv4(), name: 'Utilities & Energy', slug: 'utilities', icon: '⚡', description: 'Energy providers, water, telecom', color: '#F97316', sort_order: 10 },
];

const insertSector = db.prepare(`
  INSERT OR IGNORE INTO sectors (id, name, slug, icon, description, color, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

sectors.forEach(s => {
  insertSector.run(s.id, s.name, s.slug, s.icon, s.description, s.color, s.sort_order);
});

// Entity types per sector
const entityTypes = [];
const sectorRows = db.prepare('SELECT * FROM sectors').all();
const sectorMap = Object.fromEntries(sectorRows.map(s => [s.slug, s]));

const typeDefinitions = {
  healthcare: ['Doctor', 'Hospital', 'Clinic', 'Pharmacy', 'Dentist', 'Therapist', 'Lab'],
  education: ['Teacher', 'School', 'University', 'Tutor', 'Online Course', 'Training Center'],
  finance: ['Bank', 'Insurance Company', 'Financial Advisor', 'Credit Union', 'Loan Provider'],
  legal: ['Lawyer', 'Law Firm', 'Notary', 'Court'],
  retail: ['Online Store', 'Physical Shop', 'Marketplace', 'Brand'],
  hospitality: ['Hotel', 'Restaurant', 'Travel Agency', 'Airline', 'Tour Operator'],
  technology: ['Software Company', 'IT Service', 'App/Platform', 'Tech Support'],
  government: ['Government Office', 'Public Agency', 'Municipality'],
  'real-estate': ['Real Estate Agent', 'Property Manager', 'Developer'],
  utilities: ['Energy Provider', 'Telecom', 'Internet Provider', 'Water Utility'],
};

const insertEntityType = db.prepare(`
  INSERT OR IGNORE INTO entity_types (id, sector_id, name, slug)
  VALUES (?, ?, ?, ?)
`);

for (const [sectorSlug, types] of Object.entries(typeDefinitions)) {
  const sector = sectorMap[sectorSlug];
  if (!sector) continue;
  for (const typeName of types) {
    const slug = typeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    insertEntityType.run(uuidv4(), sector.id, typeName, slug);
  }
}

// Sample entities
const healthcareSector = sectorMap['healthcare'];
const educationSector = sectorMap['education'];
const financeSector = sectorMap['finance'];

const entities = [
  {
    id: uuidv4(), name: 'City General Hospital', slug: 'city-general-hospital',
    sector_id: healthcareSector?.id, description: 'A major public hospital serving the city',
    address: '123 Medical Drive', city: 'New York', country: 'USA',
    website: 'https://example.com', phone: '+1-555-0100', email: 'info@citygeneral.example.com'
  },
  {
    id: uuidv4(), name: 'Dr. Sarah Mitchell - Cardiology', slug: 'dr-sarah-mitchell-cardiology',
    sector_id: healthcareSector?.id, description: 'Board-certified cardiologist with 20 years experience',
    address: '45 Heart Lane', city: 'Boston', country: 'USA',
    website: 'https://example.com', phone: '+1-555-0101', email: 'dr.mitchell@example.com'
  },
  {
    id: uuidv4(), name: 'Green Valley Academy', slug: 'green-valley-academy',
    sector_id: educationSector?.id, description: 'K-12 private school with excellent academic programs',
    address: '789 Education Blvd', city: 'Chicago', country: 'USA',
    website: 'https://example.com', phone: '+1-555-0200', email: 'info@greenvalley.example.com'
  },
  {
    id: uuidv4(), name: 'First National Bank', slug: 'first-national-bank',
    sector_id: financeSector?.id, description: 'Full-service banking for personal and business needs',
    address: '1 Bank Street', city: 'Los Angeles', country: 'USA',
    website: 'https://example.com', phone: '+1-555-0300', email: 'support@fnb.example.com'
  },
];

const insertEntity = db.prepare(`
  INSERT OR IGNORE INTO entities (id, name, slug, sector_id, description, address, city, country, website, phone, email)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

entities.forEach(e => {
  if (e.sector_id) {
    insertEntity.run(e.id, e.name, e.slug, e.sector_id, e.description, e.address, e.city, e.country, e.website, e.phone, e.email);
  }
});

// Admin user
const adminPassword = bcrypt.hashSync('admin123', 10);
db.prepare(`
  INSERT OR IGNORE INTO users (id, email, username, password_hash, full_name, is_verified, is_admin)
  VALUES (?, ?, ?, ?, ?, 1, 1)
`).run(uuidv4(), 'admin@reviewplatform.com', 'admin', adminPassword, 'Platform Admin');

console.log('Database seeded successfully!');
console.log('Admin credentials: admin@reviewplatform.com / admin123');
