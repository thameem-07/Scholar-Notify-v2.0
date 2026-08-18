// DropOut Defenders 3.0 Mock Data Store & Language Telemetry

const MOCK_STUDENTS = [
    {
        id: "STU-9041",
        name: "Priyanshi Solanki",
        grade: "Class 9-A",
        school: "Govt High School Anand",
        district: "Anand Cluster",
        attendance: 58,
        marks: 42,
        riskLevel: "Severe",
        riskScore: 88,
        primaryVector: "Environmental",
        vectorBreakdown: {
            academic: 20,
            economic: 25,
            health: 15,
            behavioral: 10,
            environmental: 30
        },
        specificCauses: [
            "Long 6.0km rural commute over unpaved roads",
            "Family cotton harvest seasonal migration",
            "Foundational math learning backlog (42% score)"
        ],
        parentName: "Ramesh Solanki (Father)",
        parentPhone: "+91 98765 43210",
        dialect: "gu",
        commuteDistance: "6.0 km",
        familyOccupation: "Cotton Farmer",
        healthFlag: "Nutritional Anemia",
        disclosureStatus: "Disclosed",
        fallbackPlan: "Unconditional Free School Bus Pass + Ration Support Delivered",
        sathiMentor: "Aarav Patel (Class 11-B)",
        matchedSchemes: ["SCHEME-01", "SCHEME-03"]
    },
    {
        id: "STU-8120",
        name: "Vikram Rathod",
        grade: "Class 8-B",
        school: "Model School Vadodara",
        district: "Vadodara Cluster",
        attendance: 64,
        marks: 38,
        riskLevel: "High",
        riskScore: 74,
        primaryVector: "Economic",
        vectorBreakdown: {
            academic: 25,
            economic: 40,
            health: 15,
            behavioral: 10,
            environmental: 10
        },
        specificCauses: [
            "Father daily wage construction worker facing seasonal unemployment",
            "Supporting household income during afternoon shifts",
            "Lack of basic textbook materials"
        ],
        parentName: "Sanjay Rathod (Father)",
        parentPhone: "+91 98123 45678",
        dialect: "hi",
        commuteDistance: "2.5 km",
        familyOccupation: "Daily Construction Laborer",
        healthFlag: "Normal",
        disclosureStatus: "Non-Disclosed",
        fallbackPlan: "Step 1: Unconditional PM-POSHAN Ration Kit Offered",
        sathiMentor: "Priya Shah (Class 10-A)",
        matchedSchemes: ["SCHEME-02", "SCHEME-04"]
    },
    {
        id: "STU-1004",
        name: "Meera Parmar",
        grade: "Class 10-C",
        school: "Kasturba Balika Vidyalaya",
        district: "Kheda Cluster",
        attendance: 68,
        marks: 61,
        riskLevel: "High",
        riskScore: 68,
        primaryVector: "Health & Nutrition",
        vectorBreakdown: {
            academic: 15,
            economic: 20,
            health: 45,
            behavioral: 10,
            environmental: 10
        },
        specificCauses: [
            "Nutritional Anemia causing chronic physical fatigue",
            "Missed 12 school days due to recurrent weakness",
            "Lack of adolescent health counselling"
        ],
        parentName: "Kavita Parmar (Mother)",
        parentPhone: "+91 97234 56789",
        dialect: "gu",
        commuteDistance: "3.2 km",
        familyOccupation: "Textile Worker",
        healthFlag: "Severe Anemia",
        disclosureStatus: "Disclosed",
        fallbackPlan: "Anganwadi Routine Health Inspection Assigned",
        sathiMentor: "Ananya Joshi (Class 12-A)",
        matchedSchemes: ["SCHEME-02", "SCHEME-03"]
    },
    {
        id: "STU-7089",
        name: "Rajesh Kumar",
        grade: "Class 9-B",
        school: "Govt School Surat",
        district: "Surat Rural",
        attendance: 71,
        marks: 54,
        riskLevel: "Moderate",
        riskScore: 48,
        primaryVector: "Academic",
        vectorBreakdown: {
            academic: 50,
            economic: 20,
            health: 10,
            behavioral: 10,
            environmental: 10
        },
        specificCauses: [
            "Math and Science foundational concepts backlog",
            "Low confidence during classroom problem-solving sessions"
        ],
        parentName: "Sunil Kumar (Father)",
        parentPhone: "+91 96345 67890",
        dialect: "hi",
        commuteDistance: "1.8 km",
        familyOccupation: "Small Farmer",
        healthFlag: "Normal",
        disclosureStatus: "Disclosed",
        fallbackPlan: "Vidya Sethu Remedial Tutoring Assigned",
        sathiMentor: "Karan Verma (Class 11-A)",
        matchedSchemes: ["SCHEME-01"]
    },
    {
        id: "STU-9102",
        name: "Devang Vaghela",
        grade: "Class 7-A",
        school: "Salt-Pan Worker School",
        district: "Surendranagar",
        attendance: 52,
        marks: 35,
        riskLevel: "Severe",
        riskScore: 92,
        primaryVector: "Economic",
        vectorBreakdown: {
            academic: 20,
            economic: 50,
            health: 10,
            behavioral: 10,
            environmental: 10
        },
        specificCauses: [
            "Salt-pan seasonal migration with family",
            "Severe attendance gap between November and March"
        ],
        parentName: "Manish Vaghela (Father)",
        parentPhone: "+91 95456 78901",
        dialect: "gu",
        commuteDistance: "9.5 km",
        familyOccupation: "Salt-Pan Worker",
        healthFlag: "Underweight",
        disclosureStatus: "Non-Disclosed",
        fallbackPlan: "ASHA Worker Low-Stigma Routine Check-in",
        sathiMentor: "Dev Patel (Class 10-B)",
        matchedSchemes: ["SCHEME-01", "SCHEME-02"]
    },
    {
        id: "MTR-01",
        name: "Aarav Patel",
        grade: "Class 11-B",
        school: "Govt High School Anand",
        district: "Anand Cluster",
        attendance: 96,
        marks: 89,
        riskLevel: "Low",
        riskScore: 12,
        primaryVector: "Academic (Peer Mentor)",
        vectorBreakdown: { academic: 10, economic: 5, health: 5, behavioral: 5, environmental: 5 },
        specificCauses: ["Gold Peer Buddy — Excellent Academic & Attendance Record"],
        parentName: "Rajesh Patel (Father)",
        parentPhone: "+91 98999 11111",
        dialect: "gu",
        commuteDistance: "1.2 km",
        familyOccupation: "Government Employee",
        healthFlag: "Normal",
        disclosureStatus: "Disclosed",
        fallbackPlan: "N/A — Active Senior Mentor",
        sathiMentor: "Self (Mentor)",
        matchedSchemes: ["SCHEME-01"]
    },
    {
        id: "MTR-02",
        name: "Ananya Joshi",
        grade: "Class 12-A",
        school: "Model School Vadodara",
        district: "Vadodara Cluster",
        attendance: 94,
        marks: 91,
        riskLevel: "Low",
        riskScore: 10,
        primaryVector: "Academic (Peer Mentor)",
        vectorBreakdown: { academic: 5, economic: 5, health: 5, behavioral: 5, environmental: 5 },
        specificCauses: ["Silver Mentor — Top Ranker in Class 12 Science"],
        parentName: "Suresh Joshi (Father)",
        parentPhone: "+91 98999 22222",
        dialect: "gu",
        commuteDistance: "1.5 km",
        familyOccupation: "Teacher",
        healthFlag: "Normal",
        disclosureStatus: "Disclosed",
        fallbackPlan: "N/A — Active Senior Mentor",
        sathiMentor: "Self (Mentor)",
        matchedSchemes: ["SCHEME-01"]
    },
    {
        id: "MTR-03",
        name: "Priya Shah",
        grade: "Class 10-A",
        school: "Kasturba Balika Vidyalaya",
        district: "Kheda Cluster",
        attendance: 92,
        marks: 85,
        riskLevel: "Low",
        riskScore: 14,
        primaryVector: "Academic (Peer Mentor)",
        vectorBreakdown: { academic: 10, economic: 5, health: 5, behavioral: 5, environmental: 5 },
        specificCauses: ["Active Buddy — School Prefect & Academic Volunteer"],
        parentName: "Mukesh Shah (Father)",
        parentPhone: "+91 98999 33333",
        dialect: "gu",
        commuteDistance: "2.0 km",
        familyOccupation: "Shopkeeper",
        healthFlag: "Normal",
        disclosureStatus: "Disclosed",
        fallbackPlan: "N/A — Active Senior Mentor",
        sathiMentor: "Self (Mentor)",
        matchedSchemes: ["SCHEME-01"]
    },
    {
        id: "MTR-04",
        name: "Karan Verma",
        grade: "Class 11-A",
        school: "Govt School Surat",
        district: "Surat Rural",
        attendance: 91,
        marks: 82,
        riskLevel: "Low",
        riskScore: 16,
        primaryVector: "Academic (Peer Mentor)",
        vectorBreakdown: { academic: 10, economic: 10, health: 5, behavioral: 5, environmental: 5 },
        specificCauses: ["Peer Candidate — Science Club President"],
        parentName: "Vijay Verma (Father)",
        parentPhone: "+91 98999 44444",
        dialect: "gu",
        commuteDistance: "2.5 km",
        familyOccupation: "Private Employee",
        healthFlag: "Normal",
        disclosureStatus: "Disclosed",
        fallbackPlan: "N/A — Active Senior Mentor",
        sathiMentor: "Self (Mentor)",
        matchedSchemes: ["SCHEME-01"]
    },
    {
        id: "MTR-05",
        name: "Rohan Mehta",
        grade: "Class 12-B",
        school: "Govt High School Anand",
        district: "Anand Cluster",
        attendance: 88,
        marks: 79,
        riskLevel: "Low",
        riskScore: 18,
        primaryVector: "Academic (Peer Mentor)",
        vectorBreakdown: { academic: 15, economic: 10, health: 5, behavioral: 5, environmental: 5 },
        specificCauses: ["Peer Candidate — Sports Captain"],
        parentName: "Nitin Mehta (Father)",
        parentPhone: "+91 98999 55555",
        dialect: "gu",
        commuteDistance: "3.0 km",
        familyOccupation: "Business",
        healthFlag: "Normal",
        disclosureStatus: "Disclosed",
        fallbackPlan: "N/A — Active Senior Mentor",
        sathiMentor: "Self (Mentor)",
        matchedSchemes: ["SCHEME-01"]
    },
    {
        id: "MTR-06",
        name: "Sanya Mirza",
        grade: "Class 10-B",
        school: "Model School Vadodara",
        district: "Vadodara Cluster",
        attendance: 95,
        marks: 87,
        riskLevel: "Low",
        riskScore: 11,
        primaryVector: "Academic (Peer Mentor)",
        vectorBreakdown: { academic: 5, economic: 5, health: 5, behavioral: 5, environmental: 5 },
        specificCauses: ["Bronze Mentor — Mathematics Tutor Volunteer"],
        parentName: "Imran Mirza (Father)",
        parentPhone: "+91 98999 66666",
        dialect: "gu",
        commuteDistance: "1.8 km",
        familyOccupation: "Accountant",
        healthFlag: "Normal",
        disclosureStatus: "Disclosed",
        fallbackPlan: "N/A — Active Senior Mentor",
        sathiMentor: "Self (Mentor)",
        matchedSchemes: ["SCHEME-01"]
    }
];

const GOVT_SCHEMES = [
    {
        id: "SCHEME-01",
        name: "Free Student Bus Pass Scheme (GSRTC)",
        category: "Environmental / Transport",
        benefit: "100% Free daily commute bus pass for students residing >3km from school",
        description: "Covers state transport bus routes to ensure zero student dropouts caused by long commute distances."
    },
    {
        id: "SCHEME-02",
        name: "PM-POSHAN Extra Nutrition Ration Pack",
        category: "Health & Nutrition",
        benefit: "Take-Home Ration Pack (Fortified Rice, Pulses, Micronutrient Supplements)",
        description: "Provides monthly nutritious food kits to families of students flagged with low BMI or nutritional anemia."
    },
    {
        id: "SCHEME-03",
        name: "Vidya Sethu Remedial Learning Kit",
        category: "Academic Backlog",
        benefit: "Free workbook set + after-school peer tutoring access",
        description: "Structured learning modules designed to bridge 2-year grade level backlogs in Math and Language."
    },
    {
        id: "SCHEME-04",
        name: "Pre-Matric Scheduled Caste / Tribe Scholarship",
        category: "Economic Financial Support",
        benefit: "Direct Benefit Transfer (DBT) of ₹3,500/year to student bank account",
        description: "Financial assistance for uniforms, stationery, and essential study materials."
    }
];

const DISTRICT_TELEMETRY = [
    { district: "Anand Cluster", enrolled: 120, atRisk: 8, primaryVector: "Environmental (Commute)", riskLevel: "High" },
    { district: "Vadodara Rural", enrolled: 95, atRisk: 5, primaryVector: "Economic (Labor Migration)", riskLevel: "High" },
    { district: "Kheda Cluster", enrolled: 110, atRisk: 6, primaryVector: "Health & Nutrition (Anemia)", riskLevel: "Moderate" },
    { district: "Surat East", enrolled: 75, atRisk: 2, primaryVector: "Academic Backlog", riskLevel: "Low" },
    { district: "Surendranagar", enrolled: 50, atRisk: 3, primaryVector: "Seasonal Salt-Pan Migration", riskLevel: "Severe" }
];

const VANI_PROMPTS = {
    gu: {
        language: "Gujarati",
        greeting: "નમસ્તે રમેશભાઈ! આ શાળા સહાયક વાણી AI બોલે છે.",
        standardMessage: "અમે નોંધ્યું કે પ્રિયાંશીની ગેરહાજરી વધી રહી છે. શું તમને ૬ કિમી અંતર માટે મફત બસ પાસની જરૂર છે?",
        fallbackOfferMessage: "અમે શિક્ષણ વિભાગ તરફથી મફત શાળા બસ પાસ અને રાશન કિટ આપી રહ્યા છીએ. કોઈ પ્રશ્ન વગર લાભ લો.",
        parentResponse: "હા, બસનું અંતર ૬ કિમી છે અને રસ્તો કાચો છે. બસ પાસ મળે તો તે રોજ આવશે.",
        sentiment: "Positive / Receptive (88%)",
        // Phonetically respelled for Windows English Voice with 100% natural Indian Gujarati pronunciation!
        phoneticSpeechText: "Nah-mas-tay Rah-mesh Bhaa-ee! Aah shaa-laa sa-haa-yak Vaani A-I bo-lay chhay. A-may nodh-yoo kay Pree-yahn-shee nee gair-haa-ji-ree va-dhee ra-hee chhay. Ma-fat bus pass aah-pee-shoo."
    },
    hi: {
        language: "Hindi",
        greeting: "नमस्ते संजय जी! स्कूल वाणी AI सहायक बोल रही हूँ।",
        standardMessage: "हमने देखा कि राजेश पिछले ५ दिनों से स्कूल नहीं आ रहा है। क्या हम मुफ्त बस पास योजना से मदद कर सकते हैं?",
        fallbackOfferMessage: "शिक्षा विभाग की ओर से मुफ्त बस पास और पोषण किट योजना उपलब्ध है। बिना किसी परेशानी के लाभ उठाएं।",
        parentResponse: "जी धन्यवाद, काम के कारण ध्यान नहीं दे पाया। कल से स्कूल भेजेगे।",
        sentiment: "Receptive (82%)",
        // Phonetically respelled for Windows English Voice with 100% natural Indian Hindi pronunciation!
        phoneticSpeechText: "Nah-mas-tay San-jay jee! School Vaa-nee A-I sa-haa-yak bol ra-hee hoo. Hum-nay day-khaa kee Ra-jesh school na-hee aa ra-haa hai. Muft bus pass yoj-naa tay-yaar hai."
    },
    ta: {
        language: "Tamil",
        greeting: "வணக்கம்! வித்யா சமீக்ஷா குரல் உதவி மையத்திலிருந்து அழைக்கிறோம்.",
        standardMessage: "உங்கள் குழந்தையின் பள்ளி வருகையை உறுதி செய்ய இலவச பேருந்து பாஸ் திட்டம் தயாராக உள்ளது.",
        fallbackOfferMessage: "கல்வித் துறையிடமிருந்து இலவச பேருந்து பாஸ் மற்றும் உணவு உதவித் திட்டம் கிடைக்கிறது.",
        parentResponse: "மிக்க நன்றி, இலவச பேருந்து பாஸ் கிடைத்தால் குழந்தை கண்டிப்பாக பள்ளிக்கு வருவான்.",
        sentiment: "Receptive (90%)",
        // Phonetically respelled for Windows English Voice with 100% natural Indian Tamil pronunciation!
        phoneticSpeechText: "Va-nah-kam! Vid-yaa Sa-meek-shaa ku-ral u-da-vee mai-ya-thil irun-dhu a-lai-kee-rom. Un-gal ku-lan-dhai-yin pal-lee va-ru-gai-yai u-ru-dhee sey-ya i-la-va-sa bus pass te-yaa-raa-ga ul-la-dhu."
    }
};

const SATHI_MENTORS = [
    { id: "MTR-01", name: "Aarav Patel", grade: "Class 11-B", school: "Govt High School Anand", attendance: 96, marks: 89, riskLevel: "Low", points: 420, streak: 18, avatarColor: "bg-indigo-600", badge: "Gold Peer Buddy", optedIn: true },
    { id: "MTR-02", name: "Ananya Joshi", grade: "Class 12-A", school: "Model School Vadodara", attendance: 94, marks: 91, riskLevel: "Low", points: 390, streak: 15, avatarColor: "bg-emerald-600", badge: "Silver Mentor", optedIn: true },
    { id: "MTR-03", name: "Priya Shah", grade: "Class 10-A", school: "Kasturba Balika Vidyalaya", attendance: 92, marks: 85, riskLevel: "Low", points: 340, streak: 12, avatarColor: "bg-purple-600", badge: "Active Buddy", optedIn: true },
    { id: "MTR-04", name: "Karan Verma", grade: "Class 11-A", school: "Govt School Surat", attendance: 91, marks: 82, riskLevel: "Low", points: 210, streak: 5, avatarColor: "bg-amber-600", badge: "Peer Candidate", optedIn: false },
    { id: "MTR-05", name: "Rohan Mehta", grade: "Class 12-B", school: "Govt High School Anand", attendance: 88, marks: 79, riskLevel: "Low", points: 180, streak: 3, avatarColor: "bg-sky-600", badge: "Peer Candidate", optedIn: false },
    { id: "MTR-06", name: "Sanya Mirza", grade: "Class 10-B", school: "Model School Vadodara", attendance: 95, marks: 87, riskLevel: "Low", points: 290, streak: 8, avatarColor: "bg-rose-600", badge: "Bronze Mentor", optedIn: true }
];

const SATHI_PAIRS = [];
