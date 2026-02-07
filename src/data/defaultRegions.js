export const defaultRegions = [
    {
        "id": "global-survival-manual",
        "name": "Global Survival Guide",
        "type": "guide",
        "size": 15.5,
        "description": "Essential survival info valid anywhere (First Aid, Knots, Fire)",
        "coordinates": [0, 0],
        "modules": ["wiki"]
    },
    {
        "id": "new-york-city",
        "name": "New York City, USA",
        "type": "city",
        "size": 45.2,
        "description": "Detailed offline maps and shelter locations for NYC.",
        "coordinates": [40.7128, -74.0060],
        "modules": ["map-tiles", "shelters"]
    }
];
