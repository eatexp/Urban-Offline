/**
 * Service to manage content attribution and licensing compliance.
 * Tracks source, license type, and attribution text for every installed asset.
 */
export const AttributionManager = {
    // In-memory catalog of licenses for core datasets
    // In a real app, this might be loaded from a JSON file
    registry: {
        'wikimed-mini': {
            source: 'WikiProject Medicine / Kiwix',
            license: 'CC-BY-SA 3.0',
            attribution: 'Content from Wikipedia, controlled by WikiProject Medicine. Available under CC-BY-SA 3.0.',
            link: 'https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Medicine'
        },
        'environment-agency-flood': {
            source: 'Environment Agency',
            license: 'OGL v3.0',
            attribution: 'Contains Environment Agency data licensed under the Open Government Licence v3.0.',
            link: 'https://environment.data.gov.uk/'
        },
        'usage-rights-mixed': {
            source: 'Various',
            license: 'Mixed',
            attribution: 'See individual content items for specific licensing.',
            link: null
        }
    },

    getAttribution(contentId) {
        // Logic to lookup attribution based on content ID prefix or metadata
        if (contentId.startsWith('wiki-')) return this.registry['wikimed-mini'];
        if (contentId.startsWith('flood-')) return this.registry['environment-agency-flood'];
        return this.registry['usage-rights-mixed'];
    },

    getAllAttributions() {
        return Object.values(this.registry);
    }
};
