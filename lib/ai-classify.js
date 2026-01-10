// AI-powered transaction classification
// Rule-based first, with patterns for common transaction types

// Keywords that indicate INCOME
const INCOME_KEYWORDS = [
    'salary', 'credit', 'deposit', 'refund', 'cashback', 'interest',
    'dividend', 'bonus', 'reimbursement', 'received', 'income', 'cr',
    'credited', 'payment received', 'transfer from'
];

// Keywords that indicate EXPENSE
const EXPENSE_KEYWORDS = [
    'debit', 'payment', 'purchase', 'dr', 'emi', 'fee', 'charge',
    'withdrawal', 'atm', 'shopping', 'paid', 'debited', 'spent',
    'transfer to', 'bill', 'subscription'
];

// Category patterns with keywords
const CATEGORY_PATTERNS = {
    // Expense categories
    food: ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'dining', 'pizza', 'burger', 'biryani', 'kitchen', 'eat', 'meal'],
    shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'mall', 'mart', 'store', 'shop', 'retail', 'purchase'],
    transportation: ['uber', 'ola', 'rapido', 'petrol', 'fuel', 'metro', 'bus', 'train', 'cab', 'taxi', 'parking', 'toll'],
    groceries: ['grocery', 'bigbasket', 'blinkit', 'zepto', 'instamart', 'vegetables', 'fruits', 'supermarket', 'dmart'],
    utilities: ['electricity', 'water', 'gas', 'internet', 'wifi', 'broadband', 'phone', 'mobile', 'recharge', 'bill'],
    entertainment: ['netflix', 'spotify', 'hotstar', 'prime', 'movie', 'cinema', 'pvr', 'inox', 'game', 'concert'],
    healthcare: ['hospital', 'medical', 'pharmacy', 'medicine', 'doctor', 'clinic', 'health', 'diagnostic', 'lab'],
    education: ['school', 'college', 'university', 'course', 'udemy', 'coursera', 'book', 'tuition', 'fees'],
    travel: ['flight', 'hotel', 'airbnb', 'makemytrip', 'goibibo', 'irctc', 'booking', 'travel', 'trip'],
    housing: ['rent', 'maintenance', 'society', 'property', 'housing', 'apartment'],
    personal: ['salon', 'gym', 'spa', 'beauty', 'haircut', 'grooming'],
    insurance: ['insurance', 'lic', 'policy', 'premium', 'cover'],
    bills: ['emi', 'loan', 'credit card', 'bank fee', 'penalty', 'late fee'],
    gifts: ['gift', 'donation', 'charity', 'present'],

    // Income categories  
    salary: ['salary', 'payroll', 'wage', 'compensation'],
    freelance: ['freelance', 'consulting', 'project payment', 'invoice'],
    investments: ['dividend', 'interest', 'mutual fund', 'stock', 'investment', 'returns'],
    rental: ['rent received', 'rental income', 'tenant'],
    business: ['business', 'revenue', 'sales', 'client payment'],
};

/**
 * Detect transaction type (INCOME or EXPENSE) from description
 * @param {string} description - Transaction description
 * @param {number} amount - Transaction amount (positive/negative can hint type)
 * @returns {string} - 'INCOME' or 'EXPENSE'
 */
export function detectType(description, amount = 0) {
    const desc = description?.toLowerCase() || '';

    // Check for explicit income keywords
    for (const keyword of INCOME_KEYWORDS) {
        if (desc.includes(keyword)) {
            return 'INCOME';
        }
    }

    // Check for explicit expense keywords
    for (const keyword of EXPENSE_KEYWORDS) {
        if (desc.includes(keyword)) {
            return 'EXPENSE';
        }
    }

    // If amount is provided and negative, likely expense
    if (amount < 0) return 'EXPENSE';

    // Default to EXPENSE (more common for manual entries)
    return 'EXPENSE';
}

/**
 * Detect category from description
 * @param {string} description - Transaction description
 * @param {string} type - Transaction type (INCOME or EXPENSE)
 * @returns {string|null} - Category ID or null if not detected
 */
export function detectCategory(description, type = 'EXPENSE') {
    const desc = description?.toLowerCase() || '';

    // Income-specific categories
    if (type === 'INCOME') {
        const incomeCategories = ['salary', 'freelance', 'investments', 'rental', 'business'];
        for (const category of incomeCategories) {
            const patterns = CATEGORY_PATTERNS[category];
            if (patterns?.some(pattern => desc.includes(pattern))) {
                return category;
            }
        }
        return 'other-income';
    }

    // Expense categories
    const expenseCategories = [
        'food', 'shopping', 'transportation', 'groceries', 'utilities',
        'entertainment', 'healthcare', 'education', 'travel', 'housing',
        'personal', 'insurance', 'bills', 'gifts'
    ];

    for (const category of expenseCategories) {
        const patterns = CATEGORY_PATTERNS[category];
        if (patterns?.some(pattern => desc.includes(pattern))) {
            return category;
        }
    }

    return 'other-expense';
}

/**
 * Full classification - returns type, category, and confidence
 * @param {string} description - Transaction description
 * @param {number} amount - Transaction amount
 * @returns {object} - { type, category, isAiDetected, confidence }
 */
export function classifyTransaction(description, amount = 0) {
    if (!description || description.trim().length < 2) {
        return { type: null, category: null, isAiDetected: false, confidence: 0 };
    }

    const type = detectType(description, amount);
    const category = detectCategory(description, type);

    // Calculate confidence based on keyword match strength
    const desc = description.toLowerCase();
    let confidence = 0.6; // Base confidence

    // Higher confidence if multiple keywords match
    const allPatterns = CATEGORY_PATTERNS[category] || [];
    const matchCount = allPatterns.filter(p => desc.includes(p)).length;
    if (matchCount > 1) confidence = 0.8;
    if (matchCount > 2) confidence = 0.95;

    return {
        type,
        category,
        isAiDetected: true,
        confidence,
    };
}

/**
 * Get merchant name from description (simple extraction)
 * @param {string} description - Transaction description
 * @returns {string|null} - Extracted merchant name
 */
export function extractMerchant(description) {
    if (!description) return null;

    // Common patterns: "UPI/DE/.../MerchantName" or "CARD/DE/.../MerchantName"
    const parts = description.split('/');
    if (parts.length >= 3) {
        // Usually the merchant is one of the last parts
        const lastPart = parts[parts.length - 1].trim();
        if (lastPart.length > 2 && lastPart.length < 50) {
            return lastPart;
        }
    }

    // Known merchants (return cleaned name)
    const knownMerchants = {
        'swiggy': 'Swiggy',
        'zomato': 'Zomato',
        'amazon': 'Amazon',
        'flipkart': 'Flipkart',
        'uber': 'Uber',
        'ola': 'Ola',
        'netflix': 'Netflix',
        'spotify': 'Spotify',
    };

    const desc = description.toLowerCase();
    for (const [key, name] of Object.entries(knownMerchants)) {
        if (desc.includes(key)) return name;
    }

    return null;
}
