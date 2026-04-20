const diseases = [
    {
        name: 'Healthy',
        confidence: 97,
        description: 'The leaf appears healthy with no visible signs of disease.',
        remedies: ['Maintain proper watering schedule', 'Ensure adequate sunlight', 'Regular fertilization']
    },
    // ... (rest same as before)
];

... (prediction logic changes)
Green condition: g > 110 && r < g * 0.9 && b < g * 0.9
Healthy score = greenRatio * 5
Thresh implicit via max score

