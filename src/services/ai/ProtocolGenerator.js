import { RAGPipeline } from './RAGPipeline';
import { AIModelManager } from './AIModelManager';
import { userContextManager } from '../context/UserContextManager';
import { getScenario, getFallbackProtocol } from './scenarioTemplates';
import { createLogger } from '../../utils/logger';

const log = createLogger('ProtocolGenerator');

/**
 * Protocol Generator Service
 *
 * Generates personalized 5-step emergency protocols using:
 * - User context (inventory, medical, location, resources)
 * - Scenario templates
 * - Local LLM (with fallback to templates)
 *
 * Key Features:
 * - Context-aware (uses actual user inventory/location)
 * - Cognitive load optimized (5 steps, simple language)
 * - Offline-capable (fallback templates)
 * - Voice-readable output
 */

export class ProtocolGenerator {
    /**
     * Generate emergency protocol for scenario
     *
     * @param {string} scenarioId - Scenario identifier (e.g., 'riot-nearby')
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Protocol object with steps
     */
    static async generate(scenarioId, options = {}) {
        const {
            useAI = true,
            maxRetries = 1
        } = options;

        try {
            log.info('Generating protocol', { scenarioId, useAI });

            // 1. Get scenario template
            const scenario = getScenario(scenarioId);
            if (!scenario) {
                throw new Error(`Unknown scenario: ${scenarioId}`);
            }

            // 2. Get user context
            const contextSummary = await userContextManager.getContextSummary();

            // 3. Check if AI available
            const modelLoaded = AIModelManager.isModelLoaded();
            const shouldUseAI = useAI && modelLoaded;

            // 4. Generate protocol
            let protocol;
            if (shouldUseAI) {
                protocol = await this._generateWithAI(scenario, contextSummary, maxRetries);
            } else {
                log.info('Using fallback template (AI not available)');
                protocol = await this._generateFallback(scenario, contextSummary);
            }

            // 5. Add metadata
            protocol.scenarioId = scenarioId;
            protocol.scenarioName = scenario.name;
            protocol.generatedAt = new Date().toISOString();
            protocol.usedAI = shouldUseAI;

            log.info('Protocol generated successfully', {
                scenarioId,
                stepCount: protocol.steps?.length,
                usedAI: shouldUseAI
            });

            return protocol;

        } catch (error) {
            log.error('Protocol generation failed', error);

            // Return fallback on error
            const scenario = getScenario(scenarioId);
            return this._generateFallback(scenario, '');
        }
    }

    /**
     * Generate protocol using AI
     * @private
     */
    static async _generateWithAI(scenario, userContext, maxRetries = 1) {
        let attempt = 0;

        while (attempt <= maxRetries) {
            try {
                // Build prompt using scenario template
                const prompt = scenario.promptTemplate(userContext);

                // Call RAG pipeline with protocol category
                const result = await RAGPipeline.query(prompt, {
                    category: 'protocol',
                    useAI: true,
                    maxSources: 3 // Keep context window manageable
                });

                // Parse response into steps
                const steps = this._parseSteps(result.response);

                if (steps.length === 5) {
                    return {
                        steps,
                        sources: result.sources || [],
                        confidence: result.confidence || 0.8
                    };
                }

                // If not exactly 5 steps, try again
                log.warn('AI returned incorrect step count', { count: steps.length, attempt });
                attempt++;

            } catch (error) {
                log.error('AI generation attempt failed', { attempt, error });
                attempt++;
            }
        }

        // All retries failed, use fallback
        log.warn('AI generation exhausted retries, using fallback');
        return this._generateFallback(scenario, userContext);
    }

    /**
     * Generate protocol using fallback template
     * @private
     */
    static async _generateFallback(scenario, userContext) {
        const fallback = getFallbackProtocol(scenario.id);

        if (!fallback) {
            // Ultimate fallback if template missing
            return {
                steps: [
                    { text: 'Assess immediate dangers', context: 'Prioritize safety' },
                    { text: 'Secure critical resources', context: 'Water and food' },
                    { text: 'Contact emergency services if possible', context: 'Call 999/911' },
                    { text: 'Monitor official channels', context: 'Stay informed' },
                    { text: 'Follow official guidance', context: 'Await instructions' }
                ],
                sources: [],
                confidence: 0.5,
                usedFallback: true
            };
        }

        // Enhance fallback with user context if available
        const steps = this._enhanceFallbackWithContext(fallback.steps, userContext);

        return {
            steps,
            sources: [],
            confidence: 0.6,
            usedFallback: true
        };
    }

    /**
     * Parse LLM response into structured steps
     * @private
     */
    static _parseSteps(response) {
        const steps = [];

        // Try to extract numbered list (1. Action (context))
        const lines = response.split('\n');
        const numberRegex = /^(\d+)\.\s*(.+?)(?:\s*\((.+?)\))?$/;

        for (const line of lines) {
            const trimmed = line.trim();
            const match = trimmed.match(numberRegex);

            if (match) {
                const [, , text, context] = match;
                steps.push({
                    text: text.trim(),
                    context: context?.trim() || ''
                });
            }
        }

        // Fallback: Try splitting by newlines and taking first 5 non-empty
        if (steps.length === 0) {
            const nonEmpty = lines
                .map(l => l.trim())
                .filter(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('**'))
                .slice(0, 5);

            for (let i = 0; i < nonEmpty.length; i++) {
                steps.push({
                    text: nonEmpty[i].replace(/^\d+\.\s*/, '').trim(),
                    context: ''
                });
            }
        }

        return steps;
    }

    /**
     * Enhance fallback steps with user context mentions
     * @private
     */
    static _enhanceFallbackWithContext(steps, userContext) {
        if (!userContext || userContext === 'No user context configured.') {
            return steps;
        }

        // Simple context enhancement
        // Check if user mentioned specific things and add notes
        const hasWater = userContext.toLowerCase().includes('water');
        const hasGroundFloor = userContext.toLowerCase().includes('ground floor');
        const hasFamily = userContext.toLowerCase().includes('family');

        return steps.map((step, index) => {
            let enhancedContext = step.context;

            // Add context hints based on user's situation
            if (index === 0 && hasWater && step.text.toLowerCase().includes('water')) {
                enhancedContext += ' Check your stored supply';
            }
            if (hasGroundFloor && step.text.toLowerCase().includes('window')) {
                enhancedContext += ' Ground floor vulnerability';
            }
            if (hasFamily && step.text.toLowerCase().includes('contact')) {
                enhancedContext += ' Family locations noted';
            }

            return {
                ...step,
                context: enhancedContext.trim()
            };
        });
    }

    /**
     * Regenerate protocol (user requests new version)
     */
    static async regenerate(scenarioId) {
        log.info('Regenerating protocol', { scenarioId });
        // Same as generate but could add variation logic
        return this.generate(scenarioId, { useAI: true });
    }

    /**
     * Get protocol summary (for preview/testing)
     */
    static async getSummary(scenarioId) {
        const scenario = getScenario(scenarioId);
        if (!scenario) return null;

        return {
            id: scenario.id,
            name: scenario.name,
            description: scenario.description,
            icon: scenario.icon,
            color: scenario.color
        };
    }
}

export default ProtocolGenerator;
