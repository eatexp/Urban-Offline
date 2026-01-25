import { Users, Navigation, Shield, Zap, Droplets } from 'lucide-react';

/**
 * Emergency Scenario Templates
 *
 * Each scenario defines:
 * - id: URL-friendly identifier
 * - name: Display name for UI
 * - icon: Lucide icon component
 * - color: Tailwind color class (for consistency)
 * - description: What this scenario covers
 * - priority: Context priority (which user context matters most)
 * - promptTemplate: Function that generates LLM prompt
 */

export const EMERGENCY_SCENARIOS = {
    'riot-nearby': {
        id: 'riot-nearby',
        name: 'RIOT NEARBY',
        icon: Users,
        color: 'red',
        description: 'Civil unrest, riots, or protests in your area',
        priority: ['location', 'inventory', 'resources'],
        promptTemplate: (userContext) => `
You are generating an emergency protocol for: **RIOT NEARBY**

Scenario: Civil unrest/riots are occurring in the user's area. They need immediate action steps to protect themselves and secure resources.

User Context:
${userContext}

Generate EXACTLY 5 steps following these rules:
1. Each step = ONE sentence, ONE action
2. Use simple language (no jargon)
3. Reference user's actual context (e.g., "ground floor" if they mentioned it)
4. Prioritize: Immediate safety > Resource security > Communication > Documentation
5. Use UK terminology and context

Format each step as a numbered list:
1. [Action] ([Brief context explaining why, max 10 words])
2. [Action] ([Brief context])
...

Focus on:
- Securing water/food supplies immediately
- Protecting entry points (especially if ground floor)
- Family communication before networks congest
- Staying away from windows/vulnerable areas
- Deciding shelter-in-place vs. evacuation based on their specific location
        `
    },

    'evacuate-now': {
        id: 'evacuate-now',
        name: 'EVACUATE NOW',
        icon: Navigation,
        color: 'orange',
        description: 'Immediate evacuation required',
        priority: ['inventory', 'location', 'medical'],
        promptTemplate: (userContext) => `
You are generating an emergency protocol for: **EVACUATE NOW**

Scenario: User must evacuate their location immediately (flood, fire, gas leak, or escalating civil unrest). They need a clear action sequence.

User Context:
${userContext}

Generate EXACTLY 5 steps following these rules:
1. Each step = ONE sentence, ONE action
2. Use simple language
3. Reference items they ACTUALLY have (don't suggest items not in their inventory)
4. Prioritize: Critical items > Safe exit > Navigation > Communication > Destination
5. Use UK terminology

Format as numbered list:
1. [Action] ([Brief context, max 10 words])
2. [Action] ([Brief context])
...

Focus on:
- Grab essentials they already have (refer to their inventory)
- Account for medical needs (allergies, medications they mentioned)
- Safe exit route from their specific home layout
- Family member rendezvous points
- Alternate routes if main roads blocked
        `
    },

    'shelter-in-place': {
        id: 'shelter-in-place',
        name: 'SHELTER IN PLACE',
        icon: Shield,
        color: 'blue',
        description: 'Stay inside and secure your location',
        priority: ['location', 'resources', 'inventory'],
        promptTemplate: (userContext) => `
You are generating an emergency protocol for: **SHELTER IN PLACE**

Scenario: Dangerous conditions outside (riot, chemical hazard, extreme weather). User must secure their location and prepare to stay inside for extended period.

User Context:
${userContext}

Generate EXACTLY 5 steps following these rules:
1. Each step = ONE sentence, ONE action
2. Use simple language
3. Work with what they have (check their inventory/resources)
4. Prioritize: Entry security > Water > Air quality > Communication > Inventory check
5. Use UK terminology

Format as numbered list:
1. [Action] ([Brief context, max 10 words])
2. [Action] ([Brief context])
...

Focus on:
- Securing all entry points (based on their home layout)
- Storing emergency water if they don't have enough
- Sealing gaps if airborne hazard
- Accounting for their specific vulnerabilities (ground floor, shared entrance, etc.)
- Rationing existing supplies
        `
    },

    'power-out': {
        id: 'power-out',
        name: 'POWER OUT',
        icon: Zap,
        color: 'amber',
        description: 'Extended power outage',
        priority: ['resources', 'inventory', 'location'],
        promptTemplate: (userContext) => `
You are generating an emergency protocol for: **POWER OUT**

Scenario: Extended power outage (hours to days). User needs to preserve food, manage heating/cooling, and prepare for infrastructure failure.

User Context:
${userContext}

Generate EXACTLY 5 steps following these rules:
1. Each step = ONE sentence, ONE action
2. Use simple language
3. Use their actual resources (check what they have)
4. Prioritize: Food preservation > Heating/cooling > Lighting > Communication > Safety
5. Use UK terminology and climate context

Format as numbered list:
1. [Action] ([Brief context, max 10 words])
2. [Action] ([Brief context])
...

Focus on:
- Preserving fridge/freezer food based on UK climate
- Alternative heating (if winter) or cooling (if summer)
- Using torches/candles they have in inventory
- Charging devices with any power banks they mentioned
- Preparing for water supply failure (UK infrastructure dependencies)
        `
    },

    'no-water': {
        id: 'no-water',
        name: 'NO WATER',
        icon: Droplets,
        color: 'blue',
        description: 'Water supply failure',
        priority: ['resources', 'inventory', 'location'],
        promptTemplate: (userContext) => `
You are generating an emergency protocol for: **NO WATER**

Scenario: Water supply failure. User needs to secure water immediately and prepare for extended outage.

User Context:
${userContext}

Generate EXACTLY 5 steps following these rules:
1. Each step = ONE sentence, ONE action
2. Use simple language
3. Work with their actual water resources and purification tools
4. Prioritize: Immediate collection > Existing supply check > Purification > Rationing > Sourcing plan
5. Use UK terminology

Format as numbered list:
1. [Action] ([Brief context, max 10 words])
2. [Action] ([Brief context])
...

Focus on:
- Filling bathtub/containers immediately if water pressure still available
- Checking their current water supplies (they may have already mentioned)
- Using purification methods they actually have (tablets, filter, boiling capability)
- Rationing based on number of people and existing supply
- UK-specific: Water company contact, nearest natural water sources in urban UK
        `
    }
};

/**
 * Fallback protocol templates (used when LLM unavailable)
 */
export const FALLBACK_PROTOCOLS = {
    'riot-nearby': {
        steps: [
            { text: 'Fill bathtub with water immediately', context: 'Tap water may be cut off' },
            { text: 'Lock all doors and windows', context: 'Secure entry points' },
            { text: 'Move away from street-facing windows', context: 'Avoid projectiles' },
            { text: 'Charge all devices while power available', context: 'Network may fail' },
            { text: 'Monitor news and stay inside', context: 'Wait for all-clear' }
        ]
    },
    'evacuate-now': {
        steps: [
            { text: 'Grab essential documents and medications', context: 'Critical items first' },
            { text: 'Take water and non-perishable food', context: 'Unknown duration' },
            { text: 'Exit via safest route', context: 'Avoid danger zones' },
            { text: 'Head to pre-planned safe location', context: 'Or away from threat' },
            { text: 'Contact family when safe', context: 'Inform of your status' }
        ]
    },
    'shelter-in-place': {
        steps: [
            { text: 'Lock and secure all entry points', context: 'Front, back, windows' },
            { text: 'Fill bathtub and containers with water', context: 'Supply may be disrupted' },
            { text: 'Close windows and seal gaps if airborne threat', context: 'Minimize exposure' },
            { text: 'Gather emergency supplies in one room', context: 'Central safe room' },
            { text: 'Monitor official channels for updates', context: 'Wait for all-clear' }
        ]
    },
    'power-out': {
        steps: [
            { text: 'Avoid opening fridge and freezer', context: 'Preserve cold' },
            { text: 'Use torch, not candles near flammables', context: 'Fire safety' },
            { text: 'Charge devices with power banks', context: 'While battery lasts' },
            { text: 'Layer clothing if cold', context: 'No heating available' },
            { text: 'Check on vulnerable neighbors', context: 'Community resilience' }
        ]
    },
    'no-water': {
        steps: [
            { text: 'Fill bathtub and all containers immediately', context: 'Pressure may drop' },
            { text: 'Check existing water supplies', context: 'Know what you have' },
            { text: 'Ration water: 2 liters per person per day', context: 'Survival minimum' },
            { text: 'Boil water from unknown sources for 1 minute', context: 'Kill pathogens' },
            { text: 'Contact water company for restoration time', context: 'Plan ahead' }
        ]
    }
};

/**
 * Get scenario by ID
 */
export function getScenario(scenarioId) {
    return EMERGENCY_SCENARIOS[scenarioId] || null;
}

/**
 * Get all scenarios as array
 */
export function getAllScenarios() {
    return Object.values(EMERGENCY_SCENARIOS);
}

/**
 * Get fallback protocol for scenario
 */
export function getFallbackProtocol(scenarioId) {
    return FALLBACK_PROTOCOLS[scenarioId] || null;
}
