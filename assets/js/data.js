// KABOVELO 360 — SITE DATA
// Edit this file to update divisions, services, prices, intakes, demo work, clients and the founder profile.
// After changing prices or services run `npm run catalog` so the payment server uses the same prices.

// SITE SETTINGS
const SITE = {
    email: 'admin@kabovelo360.co.zm',
    phone: '+260979813471',
    phoneDisplay: '+260 979 813 471',
    whatsapp: 'https://wa.me/260979813471',
    location: 'Lusaka, Zambia',
    currency: 'ZMW',
    // Payment API (Cloudflare Worker). Local testing uses the dev server automatically.
    apiBase: ['localhost', '127.0.0.1'].includes(location.hostname)
        ? 'http://localhost:8787'
        : 'https://kabovelo-api.YOUR-SUBDOMAIN.workers.dev',
    // Largest amount accepted in one mobile money payment (confirm with Lipila).
    // Must match ONLINE_LIMIT in api/wrangler.toml.
    onlineLimit: 150000
};
// True once the payment API address above has been filled in
const PAYMENTS_LIVE = !SITE.apiBase.includes('YOUR-SUBDOMAIN');

// FILM ACADEMY INTAKES — shown on the enrollment page
const ACADEMY_INTAKES = [
    { id: '2027-01', label: 'January 2027 Intake', starts: '11 Jan 2027' },
    { id: '2027-03', label: 'March 2027 Intake', starts: '08 Mar 2027' },
    { id: '2027-05', label: 'May 2027 Intake', starts: '10 May 2027' }
];

const UNIT_LABELS = { day: 'day', week: 'week', month: 'month', year: 'year' };

// "K12,500", "from K300,000", "K18,750 / day", "Free / Grant"
function formatKwacha(amount) {
    return 'K' + Math.round(amount).toLocaleString('en-US');
}
function formatPrice(pkg, { short = false } = {}) {
    if (!pkg.payable && pkg.payable !== undefined) return pkg.priceLabel;
    let s = formatKwacha(pkg.price);
    if (pkg.unit) s += short ? `/${pkg.unit === 'month' ? 'mo' : pkg.unit === 'year' ? 'yr' : pkg.unit}` : ` / ${UNIT_LABELS[pkg.unit]}`;
    if (pkg.note && !short) s += ` ${pkg.note.toLowerCase()}`;
    return pkg.from ? `from ${s}` : s;
}
// payable online = has a price and is within the mobile money limit
function isPayableOnline(pkg) {
    return pkg.payable !== false && pkg.price > 0 && pkg.price <= SITE.onlineLimit;
}

// ECOSYSTEM DATA STRUCTURE WITH RICH IMAGERY FOR ALL 5 DIVISIONS
const ECOSYSTEM_DIVISIONS = {
            'film-farm': {
                id: 'film-farm',
                name: 'Film Farm',
                tagline: 'High-End Feature Film, Television & Digital Production Studio',
                badgeColor: 'border-armyGreenBright/50 text-armyGreenLight bg-armyGreen/30',
                icon: 'fa-film',
                accentColor: '#6E915B',
                bannerImg: '/assets/images/film-farm.jpg',
                description: 'Film Farm is the cinematic engine of KABOVELO 360. We handle full-cycle cinematic storytelling, narrative script development, high-end feature production, red-carpet VFX, and cinema-grade gear rentals.',
                stats: '140+ Projects Completed | Cinema RED/ARRI Workflows',
                services: [
                    {
                        id: 'ff-1',
                        title: 'Pre-Production & Script Development',
                        division: 'Film Farm',
                        image: '/assets/images/stock/script-writing.jpg',
                        shortDesc: 'Complete narrative architecture, script doctoring, storyboarding, and budget packaging.',
                        fullDesc: 'Transforming raw ideas into production-ready screenplays. Includes story structure analysis, table reads, concept art creation, location mapping, and pitch deck creation for investors.',
                        turnaround: '2 - 6 Weeks depending on script length',
                        packages: {
                            starter: { name: 'Indie Concept', price: 62500, items: ['Script Coverage', 'Beat Sheet', '10 Storyboard Frames'] },
                            pro: { name: 'Feature Ready', price: 162500, items: ['Full Screenplay Polish', 'Complete Storyboard', 'Investor Pitch Deck'] },
                            enterprise: { name: '360 Franchise', price: 300000, from: true, items: ['Series Bible', 'Legal Clearance', 'Full Directorial Breakdown'] }
                        }
                    },
                    {
                        id: 'ff-2',
                        title: 'Full Feature Film & Series Production',
                        division: 'Film Farm',
                        image: '/assets/images/team/directing-actors-bw.jpg',
                        shortDesc: 'Turnkey principal photography execution with world-class directors and crew.',
                        fullDesc: 'End-to-end production management including directors, DPs, sound engineers, production designers, gaffers, and safety marshals equipped for large scale commercial or narrative film sets.',
                        turnaround: 'Custom Production Schedule',
                        packages: {
                            starter: { name: 'Short Film Unit', price: 375000, items: ['3 Days Principal Shoot', '4K Cinema Crew', 'Basic Lighting Kit'] },
                            pro: { name: 'Commercial Series', price: 1125000, items: ['10 Days Production', 'RED/ARRI Multi-Cam', 'Full Grip & Lighting Truck'] },
                            enterprise: { name: 'Theatrical Feature', price: 3000000, from: true, items: ['Full Feature Unit', 'Celebrity Talent Booking', 'International Location Crew'] }
                        }
                    },
                    {
                        id: 'ff-3',
                        title: 'Cinema Equipment & Studio Rental',
                        division: 'Film Farm',
                        image: '/assets/images/team/studio-lighting.jpg',
                        shortDesc: 'Access state-of-the-art camera packages, lenses, lighting, and sound stages.',
                        fullDesc: 'Tier-1 production rentals featuring ARRI ALEXA 35, RED V-Raptor, Cooke Anamorphic optics, Wireless Video Systems, Heavy-duty Drones, and Sound Stage soundproof studios.',
                        turnaround: 'Daily or Weekly Lock-outs',
                        packages: {
                            starter: { name: 'Solo Filmmaker Kit', price: 19000, unit: 'day', items: ['Cinema Rig + Prime Lenses', 'Wireless Mic Set', 'LED Panel Pair'] },
                            pro: { name: 'Studio Production Suite', price: 62500, unit: 'day', items: ['Dual RED Cameras', 'Aperture Lighting Grid', 'Sound Stage Access'] },
                            enterprise: { name: 'Master Fleet', price: 175000, unit: 'week', items: ['Custom Camera & Grip Truck', 'DIT Cart', 'Full Crew Technicians'] }
                        }
                    },
                    {
                        id: 'ff-4',
                        title: 'Post-Production & VFX Suite',
                        division: 'Film Farm',
                        image: '/assets/images/stock/post-production.jpg',
                        shortDesc: 'Color grading, CGI compositing, offline/online editing, and mastering.',
                        fullDesc: 'Precision post-production suite driven by DaVinci Resolve Studio colorists, VFX artists, and NLE editors providing theatrical DCI-P3 mastering and Dolby Vision exports.',
                        turnaround: '1 - 4 Weeks',
                        packages: {
                            starter: { name: 'Color & Edit Polish', price: 75000, items: ['4K Picture Cut', 'DaVinci Color Grade', 'Stereo Mix'] },
                            pro: { name: 'VFX Heavy Package', price: 237500, items: ['Cleanups & CGI Compositing', 'Dolby Atmos Audio', 'DCP Cinema Export'] },
                            enterprise: { name: 'Master Feature Suite', price: 625000, from: true, items: ['3D CGI Integration', 'Frame-by-frame Paint', 'Global Localization Deliverables'] }
                        }
                    },
                    {
                        id: 'ff-5',
                        title: 'Sound Design & Cinematic Scoring',
                        division: 'Film Farm',
                        image: '/assets/images/stock/sound-studio.jpg',
                        shortDesc: 'Custom orchestral/electronic scoring, Foley recording, and 5.1/Atmos mixing.',
                        fullDesc: 'Immersive audio engineering that breathes emotion into visual media. Custom compositions, Foley sound effects creation, dialogue cleaning, and surround sound mastering.',
                        turnaround: '1 - 3 Weeks',
                        packages: {
                            starter: { name: 'Indie Score', price: 45000, items: ['Original Main Theme', 'Foley Sound Effects', '2.0 Stereo Master'] },
                            pro: { name: 'Broadcast Surround', price: 120000, items: ['Full Film Scoring', '5.1 Surround Mix', 'ADR Session Recording'] },
                            enterprise: { name: 'Orchestral Atmos', price: 375000, from: true, items: ['Live Instrument Ensembles', 'Dolby Atmos Mixing', 'Global OST Release'] }
                        }
                    },
                    {
                        id: 'ff-6',
                        title: 'Location Scouting & Permitting',
                        division: 'Film Farm',
                        image: '/assets/images/stock/location-scouting.jpg',
                        shortDesc: 'Exclusive filming locations, government permits, and local logistics.',
                        fullDesc: 'Unlocking breathtaking architectural, urban, and natural locations. Full handling of film permits, community relations, security protocols, and location management.',
                        turnaround: '3 - 7 Days',
                        packages: {
                            starter: { name: 'City Permit Pack', price: 30000, items: ['3 Location Lookbooks', 'Standard City Permits'] },
                            pro: { name: 'Full Scouting Unit', price: 87500, items: ['10+ Verified Locations', 'Commercial Permits', 'On-Site Location Manager'] },
                            enterprise: { name: 'Expedition Logistics', price: 200000, from: true, items: ['Remote / Closed Access Permits', 'Full Safety Unit', 'Basecamp Setup'] }
                        }
                    }
                ]
            },
            'film-academy': {
                id: 'film-academy',
                name: 'Film Academy',
                tagline: 'Next-Generation Cinema & Digital Arts Educational Institution',
                badgeColor: 'border-armyGreenBright/50 text-armyGreenLight bg-armyGreen/30',
                icon: 'fa-graduation-cap',
                accentColor: '#5C7A4C',
                bannerImg: '/assets/images/team/academy-on-set.jpg',
                description: 'KABOVELO Film Academy bridges masterclass mentorship with hands-on set experience. From aspiring directors to technicians, we train world-class creative talent.',
                stats: '2,800+ Graduates | Industry Certified Instructors',
                services: [
                    {
                        id: 'fa-1',
                        title: 'Screenwriting & Directing Masterclasses',
                        division: 'Film Academy',
                        image: '/assets/images/team/academy-classroom.jpg',
                        shortDesc: 'Intensive mentorship on dramatic structure, actor guidance, and visual tone.',
                        fullDesc: 'Learn screenwriting blueprints and directorial vision from award-winning filmmakers. Includes script workshops, visual shot-listing, and direct scene rehearsals.',
                        turnaround: '6-Week Cohort or Intensive Weekend',
                        packages: {
                            starter: { name: 'Weekend Bootcamp', price: 12500, items: ['12 Hours Live Workshops', 'Script Feedback', 'Certificate'] },
                            pro: { name: 'Director Cohort', price: 47500, items: ['6-Week Mentorship', 'Direct 1 Short Scene on Set', 'Industry Showcase'] },
                            enterprise: { name: 'Executive Masterclass', price: 112500, items: ['1-on-1 Directing Coach', 'Feature Script Development', 'Festival Pitch Slot'] }
                        }
                    },
                    {
                        id: 'fa-2',
                        title: 'Cinematography & Lighting Workshops',
                        division: 'Film Academy',
                        image: '/assets/images/team/lighting-workshop.jpg',
                        shortDesc: 'Hands-on training with ARRI/RED camera systems and advanced lighting grids.',
                        fullDesc: 'Master optics, lens choices, exposure science, and dramatic lighting techniques. Practical studio exercises on real film sets with professional gaffers.',
                        turnaround: '4-Week Hands-On Program',
                        packages: {
                            starter: { name: 'Camera Fundamentals', price: 16000, items: ['Camera Operating Basics', 'Standard 3-Point Lighting', 'Lab Access'] },
                            pro: { name: 'Advanced Cinematographer', price: 55000, items: ['Anamorphic & Prime Lenses', 'Complex Dolly/Gimbal Shots', 'Reel Scene Shoot'] },
                            enterprise: { name: 'DP Fellowship', price: 125000, items: ['Master DP Mentorship', 'Dedicated Crew for Shoot', 'Color Grading Integration'] }
                        }
                    },
                    {
                        id: 'fa-3',
                        title: 'Method Acting for Screen',
                        division: 'Film Academy',
                        image: '/assets/images/team/directing-actors.jpg',
                        shortDesc: 'Camera-specific acting techniques, audition mastery, and demo reel creation.',
                        fullDesc: 'Shift from stage to screen. Master micro-expressions, emotional recall, cold reading, hitting marks, and working seamlessly with directors.',
                        turnaround: '8-Week Acting Studio',
                        packages: {
                            starter: { name: 'Screen Essentials', price: 14000, items: ['Audition Technique', 'Self-Tape Training', 'Group Scene Study'] },
                            pro: { name: 'Professional Actor', price: 44000, items: ['Monologue & Scene Work', '4K Cinematic Demo Reel', 'Casting Director Review'] },
                            enterprise: { name: 'Lead Artist Prep', price: 95000, items: ['Private Character Coaching', 'Feature Role Prep', 'Agent Showcase Session'] }
                        }
                    },
                    {
                        id: 'fa-4',
                        title: 'Editing & VFX Certification',
                        division: 'Film Academy',
                        image: '/assets/images/stock/editing-suite.jpg',
                        shortDesc: 'Certified training in DaVinci Resolve, Premiere Pro, Nuke, and Unreal Engine.',
                        fullDesc: 'Comprehensive post-production curriculum covering narrative editing, color science, motion graphics, and virtual production workflows.',
                        turnaround: '8-Week Certification',
                        packages: {
                            starter: { name: 'NLE Fundamentals', price: 17500, items: ['Editing Mechanics', 'Basic Sound Clean', 'Software Certificate'] },
                            pro: { name: 'Pro Post Specialist', price: 60000, items: ['Advanced Color Grading', '2D/3D VFX Compositing', 'Industry Portfolio'] },
                            enterprise: { name: 'Virtual Prod Master', price: 137500, items: ['Unreal Engine 5 for Film', 'LED Wall Operating', '1-on-1 Studio Internship'] }
                        }
                    },
                    {
                        id: 'fa-5',
                        title: 'Youth Media Mentorship Program',
                        division: 'Film Academy',
                        image: '/assets/images/stock/youth-mentorship.jpg',
                        shortDesc: 'Empowering young creators (ages 15-22) with digital storytelling skills.',
                        fullDesc: 'In partnership with Hope Foundation, providing youth with hands-on digital media literacy, mobile cinematography, editing, and creative storytelling tools.',
                        turnaround: '12-Week Incubator',
                        packages: {
                            starter: { name: 'Sponsored Youth', price: 0, payable: false, priceLabel: 'Free / Grant', items: ['Mobile Filmmaking Gear', 'Weekly Mentorship', 'Community Film Fest'] },
                            pro: { name: 'School Academy Hub', price: 75000, items: ['On-Site High School Training', 'Equipment Access', 'Student Showcase'] },
                            enterprise: { name: 'Corporate Social Partner', price: 250000, items: ['Sponsor 20 Youth Scholars', 'Co-Branded Film Premiere', 'Impact Doc'] }
                        }
                    }
                ]
            },
            'fashion-avenue': {
                id: 'fashion-avenue',
                name: 'Fashion Avenue',
                tagline: 'High Fashion Couture, Film Wardrobe & Sustainable Innovation',
                badgeColor: 'border-armyGreenBright/50 text-armyGreenLight bg-armyGreen/30',
                icon: 'fa-vest-patches',
                accentColor: '#8BAE77',
                bannerImg: '/assets/images/fashion-avenue.jpg',
                description: 'Fashion Avenue elevates visual identity. We design bespoke film costumes, orchestrate runway collections, provide styling, and engineer sustainable apparel innovations.',
                stats: '65+ Runway Collections | Cinematic Costume Design',
                services: [
                    {
                        id: 'fav-1',
                        title: 'Film Costume Design & Wardrobe',
                        division: 'Fashion Avenue',
                        image: '/assets/images/stock/costume-design.jpg',
                        shortDesc: 'Custom period, futuristic, or contemporary wardrobe creation for film & TV.',
                        fullDesc: 'Character-driven costume design tailored for the camera. Includes concept sketches, fabric sourcing, custom tailoring, aging/distressing techniques, and onset wardrobe supervisors.',
                        turnaround: '2 - 8 Weeks',
                        packages: {
                            starter: { name: 'Indie Wardrobe', price: 87500, items: ['Costume Plotting', '5 Custom Character Outfits', 'Set Stylist'] },
                            pro: { name: 'Feature Film Wardrobe', price: 300000, items: ['Full Cast Wardrobe', 'Custom Period Tailoring', 'Onset Wardrobe Truck'] },
                            enterprise: { name: 'Blockbuster Couture', price: 875000, from: true, items: ['Specialty Armor/SFX Outfits', 'Multi-Unit Wardrobe Crew', 'International Sourcing'] }
                        }
                    },
                    {
                        id: 'fav-2',
                        title: 'High Fashion & Runway Collections',
                        division: 'Fashion Avenue',
                        image: '/assets/images/stock/runway.jpg',
                        shortDesc: 'Bespoke couture design, runway production, and collection showcases.',
                        fullDesc: 'Designing and staging show-stopping fashion collections. From pattern making to runway choreography, lighting design, and global press exposure.',
                        turnaround: '1 - 3 Months',
                        packages: {
                            starter: { name: 'Capsule Collection', price: 125000, items: ['8 Custom Look Designs', 'Lookbook Photo Shoot', 'Fabric Sourcing'] },
                            pro: { name: 'Runway Showcase', price: 450000, items: ['20 Look Collection', 'Runway Show Production', 'Model Casting & Makeup'] },
                            enterprise: { name: 'Global Fashion Week', price: 1250000, from: true, items: ['Couture Line Creation', 'International Runway Event', 'PR & Media Blitz'] }
                        }
                    },
                    {
                        id: 'fav-3',
                        title: 'Personal Styling & Image Consulting',
                        division: 'Fashion Avenue',
                        image: '/assets/images/stock/styling.jpg',
                        shortDesc: 'Executive branding, red carpet styling, and personal wardrobe curation.',
                        fullDesc: 'Refining the visual presence of executives, artists, and public figures. Wardrobe audits, luxury personal shopping, and flawless red carpet styling.',
                        turnaround: '3 - 10 Days',
                        packages: {
                            starter: { name: 'Executive Refresh', price: 37500, items: ['Style Consultation', '3 Key Outfits Curation', 'Personal Shopping'] },
                            pro: { name: 'Red Carpet Glamour', price: 105000, items: ['Custom Runway Outfit', 'Hair & Makeup Team', 'Press Event Prep'] },
                            enterprise: { name: 'Annual Identity Retainer', price: 300000, unit: 'year', items: ['Full Seasonal Wardrobes', '24/7 VIP Event Styling', 'Travel Packing Prep'] }
                        }
                    },
                    {
                        id: 'fav-4',
                        title: 'Model Coaching & Portfolio',
                        division: 'Fashion Avenue',
                        image: '/assets/images/stock/model-portfolio.jpg',
                        shortDesc: 'Runway walk perfection, posing techniques, and high-fashion editorial shoots.',
                        fullDesc: 'Developing raw talent into high-fashion runway models. Directing posture, camera angles, movement, expression, and shooting elite agency portfolios.',
                        turnaround: '2-Week Program',
                        packages: {
                            starter: { name: 'Portfolio Essentials', price: 21000, items: ['3 Outfit Editorial Shoot', 'Basic Runway Walk', '10 Retouched Images'] },
                            pro: { name: 'Agency Ready', price: 52500, items: ['High Fashion Lookbook Shoot', 'Advanced Runway Coaching', 'Agency Placement Intro'] },
                            enterprise: { name: 'Supermodel Development', price: 120000, items: ['International Model Boot Camp', 'Video Motion Portfolio', 'Contract Consultation'] }
                        }
                    },
                    {
                        id: 'fav-5',
                        title: 'Sustainable Apparel Innovation',
                        division: 'Fashion Avenue',
                        image: '/assets/images/stock/sustainable-apparel.jpg',
                        shortDesc: 'Eco-conscious fabric R&D, zero-waste patterning, and ethical manufacturing.',
                        fullDesc: 'Leading fashion towards zero impact. Development using organic textiles, recycled fibers, natural dye processes, and ethical short-run production lines.',
                        turnaround: '4 - 10 Weeks',
                        packages: {
                            starter: { name: 'Eco Material Audit', price: 50000, items: ['Sustainable Sourcing Map', 'Zero-Waste Patterning', 'Eco Certification Guidance'] },
                            pro: { name: 'Sustainable Prototype', price: 162500, items: ['Eco-Collection Sampling', 'Biodegradable Packaging', 'Impact Report'] },
                            enterprise: { name: 'Ethical Brand Launch', price: 500000, from: true, items: ['Full Sustainable Apparel Line', 'Ethical Factory Contracting', 'Carbon Neutral Supply Chain'] }
                        }
                    }
                ]
            },
            'hope-foundation': {
                id: 'hope-foundation',
                name: 'Hope Foundation',
                tagline: 'Empowering Creative Youth, Amplifying Social Impact & Diversity',
                badgeColor: 'border-armyGreenBright/50 text-armyGreenLight bg-armyGreen/30',
                icon: 'fa-hand-holding-heart',
                accentColor: '#4A633D',
                bannerImg: '/assets/images/hope-foundation.jpg',
                description: 'The social conscience of KABOVELO 360. We deploy creative grants, film scholarships, community screening tours, and leadership programs to elevate underrepresented voices.',
                stats: 'K3.8M+ Grants Awarded | 12,000+ Community Audience',
                services: [
                    {
                        id: 'hf-1',
                        title: 'Creative Arts Youth Empowerment',
                        division: 'Hope Foundation',
                        image: '/assets/images/stock/youth-arts.jpg',
                        shortDesc: 'Community arts centers, creative equipment grants, and youth workshops.',
                        fullDesc: 'Establishing accessible creative hubs in underserved communities. Providing cameras, art supplies, music gear, and structured mentorship to ignite young talent.',
                        turnaround: 'Ongoing Community Initiative',
                        packages: {
                            starter: { name: 'Community Hub Grant', price: 0, payable: false, priceLabel: 'Grant Supported', items: ['Arts Equipment Pack', 'Weekly Workshops', 'Youth Mentor'] },
                            pro: { name: 'Regional Youth Program', price: 125000, note: 'Sponsorship', items: ['Sponsor 15 Creative Youth', 'Exhibition Event', 'Equipment Donation'] },
                            enterprise: { name: 'Ecosystem Creative Center', price: 625000, note: 'Support', items: ['Build Fully Equipped Youth Studio', 'Year-Round Curriculum', 'Global Showcase'] }
                        }
                    },
                    {
                        id: 'hf-2',
                        title: 'Film & Media Scholarships',
                        division: 'Hope Foundation',
                        image: '/assets/images/stock/scholarships.jpg',
                        shortDesc: 'Full tuition scholarships for underprivileged film & design students.',
                        fullDesc: 'Funding promising young storytellers to attend KABOVELO Film Academy with full tuition coverage, living stipends, and guaranteed film set placement.',
                        turnaround: 'Bi-Annual Scholarship Cycles',
                        packages: {
                            starter: { name: 'Single Scholar Support', price: 62500, items: ['Full Academy Tuition', 'Gear Allowance', '1-on-1 Industry Mentor'] },
                            pro: { name: 'Cohort Patron', price: 250000, items: ['Sponsor 5 Student Scholars', 'Co-Named Scholarship', 'Graduation Short Feature'] },
                            enterprise: { name: 'Endowment Fund Partner', price: 1250000, from: true, items: ['Permanent Scholarship Trust', 'Board Advisory Seat', 'Impact Documentary'] }
                        }
                    },
                    {
                        id: 'hf-3',
                        title: 'Community Outreach Screenings',
                        division: 'Hope Foundation',
                        image: '/assets/images/stock/outdoor-cinema.jpg',
                        shortDesc: 'Mobile cinema tours bringing socially conscious films to rural & urban hubs.',
                        fullDesc: 'Pop-up outdoor cinema units equipped with inflatable 4K screens and solar power, screening inspirational and educational cinema followed by community dialogues.',
                        turnaround: 'Mobile Cinema Deployments',
                        packages: {
                            starter: { name: 'Local Cinema Night', price: 37500, items: ['Mobile Screen & Audio', 'Community Screening Permit', 'Panel Discussion'] },
                            pro: { name: 'Regional Impact Tour', price: 150000, items: ['5 Community Stops', 'Educational Film Screenings', 'Youth Workshop Sessions'] },
                            enterprise: { name: 'National Cinema Outreach', price: 500000, from: true, items: ['20 City/Town Tour', 'Sponsorship Branding', 'Documentary Tour Feature'] }
                        }
                    },
                    {
                        id: 'hf-4',
                        title: 'Social Impact Campaigns',
                        division: 'Hope Foundation',
                        image: '/assets/images/stock/impact-campaign.jpg',
                        shortDesc: 'High-impact media campaigns advocating human rights, climate, and health.',
                        fullDesc: 'Fusing Film Farm storytelling and Marketing Lab strategy to create powerful public service announcements and advocacy films that drive policy and awareness.',
                        turnaround: '3 - 8 Weeks',
                        packages: {
                            starter: { name: 'Advocacy Spot', price: 100000, items: ['60-Sec PSA Production', 'Social Media Activation', 'Impact Kit'] },
                            pro: { name: 'Global Impact Film', price: 375000, items: ['Short Impact Doc (15 min)', 'Distribution Campaign', 'NGO Partner Activation'] },
                            enterprise: { name: 'Movement Infrastructure', price: 1125000, from: true, items: ['Full Multimedia Campaign', 'Policy Maker Screenings', 'Global PR Blitz'] }
                        }
                    },
                    {
                        id: 'hf-5',
                        title: 'Women in Creative Leadership Grants',
                        division: 'Hope Foundation',
                        image: '/assets/images/stock/women-leadership.jpg',
                        shortDesc: 'Dedicated funding, mentorship, and equipment for female directors & designers.',
                        fullDesc: 'Dismantling industry gender gaps by providing seed capital, executive producers, and marketing support to women-led film and fashion projects.',
                        turnaround: 'Annual Grant Cycle',
                        packages: {
                            starter: { name: 'Seed Grant Partner', price: 75000, items: ['Direct Grant to Female Director', 'Production Support', 'Festival Prep'] },
                            pro: { name: 'Production Grant Sponsor', price: 300000, items: ['Fund Short Film or Runway Line', 'Full Ecosystem Mentorship', 'Executive Producer Credit'] },
                            enterprise: { name: 'Leadership Incubator', price: 1000000, from: true, items: ['Fund 4 Female-Led Projects', 'Global Festival Premiere', 'Impact Showcase'] }
                        }
                    }
                ]
            },
            'marketing-lab': {
                id: 'marketing-lab',
                name: 'Marketing Lab',
                tagline: '360° Brand Strategy, Digital Media Performance & PR Activation',
                badgeColor: 'border-armyGreenBright/50 text-armyGreenLight bg-armyGreen/30',
                icon: 'fa-chart-line',
                accentColor: '#3B4E32',
                bannerImg: '/assets/images/marketing-lab.jpg',
                description: 'The growth engine of KABOVELO 360. We turn brands into culture by merging cinematic content creation, data-driven digital media, global PR, and influencer storytelling.',
                stats: '300+ Brand Campaigns | High ROI Performance Media',
                services: [
                    {
                        id: 'ml-1',
                        title: '360° Brand Strategy & Identity',
                        division: 'Marketing Lab',
                        image: '/assets/images/marketing-lab.jpg',
                        shortDesc: 'Complete visual branding, market positioning, and brand guidelines.',
                        fullDesc: 'Architecting unforgettable brand identities. Includes brand voice, typography, color architecture, logo systems, archetype positioning, and complete brand books.',
                        turnaround: '2 - 4 Weeks',
                        packages: {
                            starter: { name: 'Brand Launchpack', price: 70000, items: ['Logo & Visual Suite', 'Typography & Palette', 'Basic Style Guide'] },
                            pro: { name: '360° Corporate Brand', price: 187500, items: ['Full Brand Architecture', 'Comprehensive Brand Book', 'Collateral Design'] },
                            enterprise: { name: 'Global Brand Rebrand', price: 550000, from: true, items: ['Global Market Positioning', 'Trademark Clearance Prep', 'Internal & External Rollout'] }
                        }
                    },
                    {
                        id: 'ml-2',
                        title: 'Digital Marketing & Performance Media',
                        division: 'Marketing Lab',
                        image: '/assets/images/stock/analytics.jpg',
                        shortDesc: 'Data-driven Meta, Google, TikTok ad campaigns targeting high conversion.',
                        fullDesc: 'Maximizing ROI through precision audience targeting, A/B ad creative testing, funnel optimization, and real-time performance analytics dashboards.',
                        turnaround: 'Monthly Retainer Workflow',
                        packages: {
                            starter: { name: 'Growth Engine', price: 50000, unit: 'month', items: ['Up to $5k Ad Spend Managed', 'Weekly Optimization', 'Ad Creative Variations'] },
                            pro: { name: 'Scale Architecture', price: 137500, unit: 'month', items: ['Up to $25k Ad Spend Managed', 'Multi-Funnel Strategy', 'Custom Analytics Dashboard'] },
                            enterprise: { name: 'Enterprise Performance', price: 350000, unit: 'month', items: ['Omnichannel Ad Management', 'Dedicated Data Scientist', 'High-Scale Growth'] }
                        }
                    },
                    {
                        id: 'ml-3',
                        title: 'PR & Global Media Relations',
                        division: 'Marketing Lab',
                        image: '/assets/images/stock/pr-media.jpg',
                        shortDesc: 'Press release distribution, top-tier magazine features, and crisis management.',
                        fullDesc: 'Securing tier-1 press coverage across fashion, film, tech, and business publications (Forbes, Vogue, Variety, TechCrunch).',
                        turnaround: 'Campaign or Retainer',
                        packages: {
                            starter: { name: 'Press Blast', price: 62500, items: ['Press Release Drafting', 'Targeted Syndication', 'Guaranteed 5 Features'] },
                            pro: { name: 'Tier-1 Media Blitz', price: 175000, items: ['Top-Tier Magazine Placement', 'Founder Interviews', 'Press Conference'] },
                            enterprise: { name: 'Global PR Retainer', price: 450000, unit: 'month', items: ['Dedicated Publicist', '24/7 Crisis Management', 'International Press Tour'] }
                        }
                    },
                    {
                        id: 'ml-4',
                        title: 'Social Media Management',
                        division: 'Marketing Lab',
                        image: '/assets/images/stock/marketing-desk.jpg',
                        shortDesc: 'Full content creation, community growth, and channel management.',
                        fullDesc: 'End-to-end management of Instagram, TikTok, LinkedIn, and YouTube channels. Scripting reels, high-aesthetic photo posts, community engagement, and analytics.',
                        turnaround: 'Monthly Retainer',
                        packages: {
                            starter: { name: 'Core Presence', price: 45000, unit: 'month', items: ['12 Posts / Reels Monthly', 'Caption & Hashtag Strategy', 'Monthly Analytics'] },
                            pro: { name: 'High-Volume Viral', price: 105000, unit: 'month', items: ['25 Cinematic Reels/Posts', 'Daily Community Mgmt', 'Influencer Collabs'] },
                            enterprise: { name: '360 Channel Takeover', price: 250000, unit: 'month', items: ['Daily High-End Content', 'Dedicated On-Set Creator', 'Global Audience Scaling'] }
                        }
                    },
                    {
                        id: 'ml-5',
                        title: 'Content Creation & Influencer Marketing',
                        division: 'Marketing Lab',
                        image: '/assets/images/stock/influencer.jpg',
                        shortDesc: 'Cinematic social ad creation paired with targeted creator partnerships.',
                        fullDesc: 'Leveraging Film Farm visual production to craft viral UGC and cinematic ads, distributed through curated influencer creator networks.',
                        turnaround: '2 - 3 Weeks',
                        packages: {
                            starter: { name: 'Creator Pack', price: 75000, items: ['5 Micro-Influencer Collabs', '3 Cinematic Social Ads', 'Usage Rights'] },
                            pro: { name: 'Influencer Campaign', price: 237500, items: ['15 Macro Creator Placements', 'Full Content Production', 'Tracking Links & ROI'] },
                            enterprise: { name: 'Celebrity Ambassador', price: 750000, from: true, items: ['A-List Celebrity Alignment', 'High-Production Commercial', 'Global Campaign Rights'] }
                        }
                    }
                ]
            }
        };

// FOUNDER / DIRECTOR PROFILE
// Replace `name` with the founder's real name — it appears on the Home and About pages.
const FOUNDER = {
    name: 'Founder & Creative Director',
    title: 'CEO · Film Director · Educator',
    portrait: '/assets/images/team/director-portrait.jpg',
    portraitAlt: '/assets/images/team/director-bw.jpg',
    quote: 'Every story deserves a crew that believes in it — and every young creative deserves a set to learn on.',
    bio: [
        'The founder of KABOVELO 360 is a filmmaker and educator who built the ecosystem from a single conviction: creative talent grows fastest when production, training and opportunity live under one roof.',
        'Through Film Farm and the KABOVELO Film Academy, our founder leads hands-on masterclasses in directing, blocking and lighting — taking students out of the classroom and onto working sets alongside professional crews.'
    ],
    highlights: [
        { icon: 'fa-clapperboard', label: 'Director', text: 'Narrative, documentary & commercial work' },
        { icon: 'fa-chalkboard-user', label: 'Educator', text: 'Leads Film Academy masterclasses' },
        { icon: 'fa-people-group', label: 'Mentor', text: 'Youth media & creative leadership' }
    ],
    // Photos of the director teaching & on set (used in About, Home, Impact and Film Academy)
    sessions: [
        { src: '/assets/images/team/director-masterclass.jpg', caption: 'Directing masterclass — studio session' },
        { src: '/assets/images/team/academy-classroom.jpg', caption: 'Film Academy classroom — script & story' },
        { src: '/assets/images/team/academy-on-set.jpg', caption: 'On-set teaching — working the frame' },
        { src: '/assets/images/team/directing-actors.jpg', caption: 'Directing actors under studio light' },
        { src: '/assets/images/team/academy-blocking.jpg', caption: 'Blocking a scene with students' },
        { src: '/assets/images/team/lighting-workshop.jpg', caption: 'Lighting workshop — dramatic key light' },
        { src: '/assets/images/team/director-studio.jpg', caption: 'Q&A on the blue-screen stage' },
        { src: '/assets/images/team/directing-actors-bw.jpg', caption: 'Performance notes between takes' }
    ]
};

// CLIENTS & PARTNERS (logos in assets/images/clients)
const CLIENTS = [
    { name: 'MTN', logo: '/assets/images/clients/mtn.svg' },
    { name: 'UNDP', logo: '/assets/images/clients/undp.png' },
    { name: 'World Vision', logo: '/assets/images/clients/world-vision.png' },
    { name: 'Ecobank', logo: '/assets/images/clients/ecobank.png' },
    { name: 'FNB', logo: '/assets/images/clients/fnb.png' },
    { name: 'Amazon Prime', logo: '/assets/images/clients/amazon-prime.png' },
    { name: 'Engineering Institution of Zambia', logo: '/assets/images/clients/engineering-institute-zambia.png' },
    { name: 'FIZ', logo: '/assets/images/clients/fiz.png' },
    { name: 'Platinum Courier Services', logo: '/assets/images/clients/platinum-courier.png' },
    { name: 'Glam & Glory', logo: '/assets/images/clients/glam-and-glory.png' }
];

// DEMO WORK / CASE STUDIES — placeholder projects for each division.
// Replace with real projects: keep the same fields and the Work page updates automatically.
const WORK_PROJECTS = [
    // FILM FARM
    {
        id: 'w-ff-1', division: 'film-farm', title: 'Roadside', type: 'Narrative Short Film', client: 'Film Farm Originals', year: '2025',
        image: '/assets/images/stock/cinema-camera.jpg',
        gallery: ['/assets/images/team/directing-actors-bw.jpg', '/assets/images/stock/location-scouting.jpg', '/assets/images/stock/post-production.jpg'],
        summary: 'A 22-minute road drama about two strangers sharing a long drive home — shot on location over five days.',
        challenge: 'A micro-budget story needing wide desert landscapes, a moving-car rig and a tight 5-day schedule.',
        approach: 'Script development, location scouting and a lean 12-person crew running dual cinema cameras, followed by an in-house colour grade and 5.1 mix.',
        results: [{ value: '5', label: 'Shoot days' }, { value: '22 min', label: 'Runtime' }, { value: '4K', label: 'DCP master' }],
        tags: ['Production', 'Post-Production', 'Sound Design']
    },
    {
        id: 'w-ff-2', division: 'film-farm', title: 'City of Gold', type: 'Documentary Series', client: 'Broadcast Partner', year: '2024',
        image: '/assets/images/stock/outdoor-shoot.jpg',
        gallery: ['/assets/images/stock/location-scouting.jpg', '/assets/images/stock/editing-suite.jpg'],
        summary: 'A four-part documentary following young entrepreneurs building businesses in a fast-growing city.',
        challenge: 'Capturing unscripted stories across multiple locations while keeping a consistent cinematic look.',
        approach: 'Run-and-gun documentary unit with drone coverage, structured story edits and a unified grading pipeline.',
        results: [{ value: '4', label: 'Episodes' }, { value: '30+', label: 'Locations' }, { value: '18', label: 'Contributors' }],
        tags: ['Documentary', 'Drone', 'Edit']
    },
    {
        id: 'w-ff-3', division: 'film-farm', title: 'Studio Sessions', type: 'Music Video & Live Sessions', client: 'Independent Artists', year: '2025',
        image: '/assets/images/team/studio-lighting.jpg',
        gallery: ['/assets/images/stock/studio-mic.jpg', '/assets/images/stock/sound-studio.jpg'],
        summary: 'A live-performance series filmed on the KABOVELO sound stage with multi-camera coverage and live audio.',
        challenge: 'Delivering broadcast-quality picture and sound in a single take per performance.',
        approach: 'Three-camera studio setup, practical lighting design and a dedicated live-mix engineer.',
        results: [{ value: '8', label: 'Sessions' }, { value: '3-cam', label: 'Live setup' }, { value: '1', label: 'Take each' }],
        tags: ['Studio Rental', 'Music', 'Live Audio']
    },
    {
        id: 'w-ff-4', division: 'film-farm', title: 'Brand Anthem', type: 'TV Commercial', client: 'Financial Services Brand', year: '2024',
        image: '/assets/images/team/directing-actors-bw.jpg',
        gallery: ['/assets/images/stock/post-production.jpg', '/assets/images/stock/script-writing.jpg'],
        summary: 'A 60-second anthem commercial celebrating everyday ambition, with 15-second social cut-downs.',
        challenge: 'One shoot needed to deliver TV, cinema and vertical social formats.',
        approach: 'Storyboarded for multi-format framing from day one, then finished with VFX clean-ups and a custom score.',
        results: [{ value: '60s', label: 'Hero spot' }, { value: '6', label: 'Cut-downs' }, { value: '3', label: 'Formats' }],
        tags: ['Commercial', 'VFX', 'Scoring']
    },

    // FILM ACADEMY
    {
        id: 'w-fa-1', division: 'film-academy', title: 'Directing Masterclass — Cohort 07', type: 'Masterclass Program', client: 'KABOVELO Film Academy', year: '2025',
        image: '/assets/images/team/director-masterclass.jpg',
        gallery: ['/assets/images/team/academy-classroom.jpg', '/assets/images/team/director-studio.jpg', '/assets/images/team/director-speaking.jpg'],
        summary: 'A six-week directing intensive led by our founder — from script analysis to directing a scene on a real set.',
        challenge: 'Turn first-time directors into confident on-set leaders in six weeks.',
        approach: 'Weekly classroom sessions on story and blocking, then practical days on the studio stage with a professional crew.',
        results: [{ value: '24', label: 'Students' }, { value: '6 wks', label: 'Program' }, { value: '12', label: 'Scenes shot' }],
        tags: ['Directing', 'Mentorship', 'On-Set']
    },
    {
        id: 'w-fa-2', division: 'film-academy', title: 'Lighting for Drama', type: 'Cinematography Workshop', client: 'KABOVELO Film Academy', year: '2025',
        image: '/assets/images/team/lighting-workshop.jpg',
        gallery: ['/assets/images/team/studio-lighting.jpg', '/assets/images/team/directing-actors-bw.jpg'],
        summary: 'A hands-on workshop on motivated lighting, contrast and mood for dramatic scenes.',
        challenge: 'Teach lighting as a storytelling tool, not just a technical setup.',
        approach: 'Students lit and shot the same scene three ways, comparing mood on monitor with the instructor.',
        results: [{ value: '3', label: 'Lighting setups' }, { value: '16', label: 'Students' }, { value: '2 days', label: 'Intensive' }],
        tags: ['Cinematography', 'Lighting', 'Workshop']
    },
    {
        id: 'w-fa-3', division: 'film-academy', title: 'Actors on Set', type: 'Screen Acting Intensive', client: 'KABOVELO Film Academy', year: '2024',
        image: '/assets/images/team/directing-actors.jpg',
        gallery: ['/assets/images/team/academy-on-set.jpg', '/assets/images/team/academy-blocking.jpg'],
        summary: 'Actors and directors trained side by side — hitting marks, working to camera and taking direction.',
        challenge: 'Bridge the gap between stage performance and the precision a camera demands.',
        approach: 'Scene work on the blue-screen stage with live playback and direct notes between takes.',
        results: [{ value: '20', label: 'Actors' }, { value: '40+', label: 'Takes reviewed' }, { value: '1', label: 'Showreel each' }],
        tags: ['Acting', 'Directing', 'Showreel']
    },
    {
        id: 'w-fa-4', division: 'film-academy', title: 'Graduate Showcase', type: 'Student Film Screening', client: 'Film Academy Graduates', year: '2024',
        image: '/assets/images/team/academy-classroom.jpg',
        gallery: ['/assets/images/stock/editing-suite.jpg', '/assets/images/stock/conference-event.jpg'],
        summary: 'An end-of-year screening of short films written, directed and edited by Academy graduates.',
        challenge: 'Give graduates a public platform and a finished film for their portfolio.',
        approach: 'Mentored post-production, festival-ready exports and a premiere screening for industry guests.',
        results: [{ value: '10', label: 'Short films' }, { value: '300', label: 'Guests' }, { value: '100%', label: 'Completion' }],
        tags: ['Graduates', 'Screening', 'Post']
    },

    // FASHION AVENUE
    {
        id: 'w-fav-1', division: 'fashion-avenue', title: 'Heritage Threads', type: 'Runway Collection', client: 'Fashion Avenue Label', year: '2025',
        image: '/assets/images/stock/runway.jpg',
        gallery: ['/assets/images/stock/fashion-editorial.jpg', '/assets/images/stock/fashion-portrait.jpg'],
        summary: 'A 20-look collection blending traditional prints with modern tailoring, staged as a live runway show.',
        challenge: 'Translate heritage textiles into contemporary silhouettes for a young audience.',
        approach: 'Pattern development, model casting, runway choreography and a filmed show for social release.',
        results: [{ value: '20', label: 'Looks' }, { value: '1', label: 'Live show' }, { value: '500+', label: 'Attendees' }],
        tags: ['Runway', 'Design', 'Production']
    },
    {
        id: 'w-fav-2', division: 'fashion-avenue', title: 'Roadside Wardrobe', type: 'Film Costume Design', client: 'Film Farm Originals', year: '2025',
        image: '/assets/images/stock/costume-design.jpg',
        gallery: ['/assets/images/stock/styling.jpg', '/assets/images/team/directing-actors-bw.jpg'],
        summary: 'Character wardrobe for the short film Roadside — every outfit aged and fitted for the camera.',
        challenge: 'Make costumes feel lived-in and consistent across a five-day continuity-heavy shoot.',
        approach: 'Character costume plots, distressing techniques and an on-set wardrobe supervisor.',
        results: [{ value: '14', label: 'Costumes' }, { value: '6', label: 'Characters' }, { value: '0', label: 'Continuity errors' }],
        tags: ['Costume', 'Film', 'Wardrobe']
    },
    {
        id: 'w-fav-3', division: 'fashion-avenue', title: 'Urban Edit', type: 'Editorial Lookbook', client: 'Streetwear Brand', year: '2024',
        image: '/assets/images/stock/fashion-street.jpg',
        gallery: ['/assets/images/stock/portrait-model.jpg', '/assets/images/stock/model-portfolio.jpg'],
        summary: 'A city-shot editorial lookbook for a streetwear drop, styled and photographed in a single day.',
        challenge: 'Create a strong visual identity for a brand-new label on a tight timeline.',
        approach: 'Location styling, model coaching and a mixed photo/video shoot for web and social.',
        results: [{ value: '12', label: 'Looks styled' }, { value: '60', label: 'Final images' }, { value: '1 day', label: 'Shoot' }],
        tags: ['Styling', 'Editorial', 'Lookbook']
    },
    {
        id: 'w-fav-4', division: 'fashion-avenue', title: 'Re:Wear Capsule', type: 'Sustainable Apparel', client: 'Fashion Avenue Label', year: '2024',
        image: '/assets/images/stock/sustainable-apparel.jpg',
        gallery: ['/assets/images/stock/fashion-retail.jpg', '/assets/images/stock/fashion-editorial.jpg'],
        summary: 'A capsule collection made from reclaimed fabric and zero-waste patterns.',
        challenge: 'Prove sustainable pieces can be both desirable and commercially viable.',
        approach: 'Material sourcing audit, zero-waste pattern cutting and a short ethical production run.',
        results: [{ value: '8', label: 'Pieces' }, { value: '90%', label: 'Reclaimed fabric' }, { value: 'Zero', label: 'Waste patterns' }],
        tags: ['Sustainability', 'Design', 'Production']
    },

    // HOPE FOUNDATION
    {
        id: 'w-hf-1', division: 'hope-foundation', title: 'Mobile Cinema Tour', type: 'Community Outreach', client: 'Hope Foundation', year: '2025',
        image: '/assets/images/stock/outdoor-cinema.jpg',
        gallery: ['/assets/images/stock/conference-event.jpg', '/assets/images/stock/volunteers.jpg'],
        summary: 'Open-air screenings of inspiring films followed by community conversations in rural and urban areas.',
        challenge: 'Bring cinema to communities with no access to theatres or reliable power.',
        approach: 'A solar-powered mobile screen unit, local volunteer teams and post-screening youth workshops.',
        results: [{ value: '12', label: 'Communities' }, { value: '4,000+', label: 'Audience' }, { value: '24', label: 'Workshops' }],
        tags: ['Outreach', 'Screenings', 'Youth']
    },
    {
        id: 'w-hf-2', division: 'hope-foundation', title: 'Young Creators Lab', type: 'Youth Empowerment', client: 'Hope Foundation', year: '2025',
        image: '/assets/images/stock/youth-arts.jpg',
        gallery: ['/assets/images/stock/youth-mentorship.jpg', '/assets/images/team/academy-blocking.jpg'],
        summary: 'A 12-week program giving young people cameras, mentors and a real brief to tell stories from their community.',
        challenge: 'Make creative careers feel reachable for young people outside the industry.',
        approach: 'Mobile filmmaking kits, weekly mentorship from Film Academy staff and a community premiere.',
        results: [{ value: '40', label: 'Young creators' }, { value: '12 wks', label: 'Program' }, { value: '15', label: 'Films made' }],
        tags: ['Mentorship', 'Youth', 'Filmmaking']
    },
    {
        id: 'w-hf-3', division: 'hope-foundation', title: 'Women Behind the Lens', type: 'Leadership Grant', client: 'Hope Foundation', year: '2024',
        image: '/assets/images/stock/women-leadership.jpg',
        gallery: ['/assets/images/stock/impact-campaign.jpg', '/assets/images/stock/team-meeting.jpg'],
        summary: 'Seed grants and mentorship for women directors and designers developing their first projects.',
        challenge: 'Close the gender gap in creative leadership roles.',
        approach: 'Grant funding, an executive producer for each project and full ecosystem support.',
        results: [{ value: '6', label: 'Grantees' }, { value: '4', label: 'Projects funded' }, { value: '100%', label: 'Mentored' }],
        tags: ['Grants', 'Leadership', 'Diversity']
    },
    {
        id: 'w-hf-4', division: 'hope-foundation', title: 'Scholars Program', type: 'Film & Media Scholarships', client: 'Hope Foundation', year: '2024',
        image: '/assets/images/stock/scholarships.jpg',
        gallery: ['/assets/images/team/academy-classroom.jpg', '/assets/images/stock/community-team.jpg'],
        summary: 'Full Film Academy scholarships for talented students who could not otherwise afford tuition.',
        challenge: 'Remove financial barriers without lowering the standard of training.',
        approach: 'Need-based selection, full tuition and gear allowances, plus guaranteed set placements.',
        results: [{ value: '18', label: 'Scholars' }, { value: '2', label: 'Intakes / yr' }, { value: '90%', label: 'Placed on sets' }],
        tags: ['Scholarships', 'Education', 'Access']
    },

    // MARKETING LAB
    {
        id: 'w-ml-1', division: 'marketing-lab', title: 'Digital Bank Launch', type: 'Performance Campaign', client: 'Financial Services Brand', year: '2025',
        image: '/assets/images/stock/marketing-dashboard.jpg',
        gallery: ['/assets/images/stock/analytics.jpg', '/assets/images/stock/workspace.jpg'],
        summary: 'A multi-channel launch campaign for a new mobile banking app, combining film content with paid media.',
        challenge: 'Drive app downloads in a crowded market within a 90-day launch window.',
        approach: 'Film Farm-produced ads, audience testing across Meta, Google and TikTok, and weekly optimisation.',
        results: [{ value: '3.4x', label: 'ROAS' }, { value: '120k', label: 'Downloads' }, { value: '90 days', label: 'Launch' }],
        tags: ['Performance', 'Paid Social', 'Content']
    },
    {
        id: 'w-ml-2', division: 'marketing-lab', title: 'Logistics Rebrand', type: 'Brand Strategy & Identity', client: 'Courier & Logistics Brand', year: '2024',
        image: '/assets/images/stock/marketing-strategy.jpg',
        gallery: ['/assets/images/stock/marketing-desk.jpg', '/assets/images/stock/workspace.jpg'],
        summary: 'A complete brand refresh — positioning, visual identity and a brand book for a growing courier company.',
        challenge: 'Modernise a trusted brand without losing the recognition it had built.',
        approach: 'Stakeholder workshops, competitor mapping, a refreshed logo system and fleet/uniform guidelines.',
        results: [{ value: '1', label: 'Brand book' }, { value: '40+', label: 'Assets' }, { value: '6 wks', label: 'Delivery' }],
        tags: ['Branding', 'Identity', 'Strategy']
    },
    {
        id: 'w-ml-3', division: 'marketing-lab', title: 'Creator Season', type: 'Influencer Campaign', client: 'Beauty & Lifestyle Brand', year: '2025',
        image: '/assets/images/stock/influencer.jpg',
        gallery: ['/assets/images/stock/workspace.jpg', '/assets/images/stock/fashion-portrait.jpg'],
        summary: 'A seasonal campaign pairing cinematic ads with a network of local creators.',
        challenge: 'Build authentic reach with a younger audience who skip traditional ads.',
        approach: 'Creator selection, co-created content, tracked links and Fashion Avenue styling for hero shoots.',
        results: [{ value: '15', label: 'Creators' }, { value: '2.1M', label: 'Views' }, { value: '8.5%', label: 'Engagement' }],
        tags: ['Influencer', 'Social', 'Content']
    },
    {
        id: 'w-ml-4', division: 'marketing-lab', title: 'Premiere Night PR', type: 'PR & Media Relations', client: 'Film Farm Originals', year: '2024',
        image: '/assets/images/stock/pr-media.jpg',
        gallery: ['/assets/images/stock/conference-event.jpg', '/assets/images/stock/team-meeting.jpg'],
        summary: 'Press strategy and launch event for a Film Farm premiere, from media invites to post-event coverage.',
        challenge: 'Generate national press attention for an independent film release.',
        approach: 'Press kit, media screenings, talent interviews and a red-carpet premiere night.',
        results: [{ value: '25', label: 'Press features' }, { value: '12', label: 'Interviews' }, { value: '1', label: 'Premiere' }],
        tags: ['PR', 'Events', 'Media']
    }
];

function getDivisionByName(name) {
    return Object.values(ECOSYSTEM_DIVISIONS).find(d => d.name === name);
}

function getAllServices() {
    return Object.values(ECOSYSTEM_DIVISIONS).flatMap(div => div.services);
}
