const diseases = [
    {
        name: 'Healthy',
        confidence: 98,
        description: 'The leaf appears healthy with no visible signs of disease.',
        remedies: ['Maintain proper watering schedule', 'Ensure adequate sunlight', 'Regular fertilization']
    },
    {
        name: 'Dry Leaf / Wilted',
        confidence: 90,
        description: 'Leaf shows signs of drying or wilting, likely due to water stress or nutrient deficiency.',
        remedies: ['Increase watering frequency', 'Check soil moisture', 'Apply balanced fertilizer', 'Provide shade during heat']
    },
    {
        name: 'Early Blight',
        confidence: 92,
        description: 'Dark spots with yellow halos on lower leaves, caused by Alternaria solani.',
        remedies: ['Remove infected leaves', 'Apply fungicide (Copper-based)', 'Improve air circulation', 'Mulch around base']
    },
    {
        name: 'Late Blight',
        confidence: 87,
        description: 'Large irregular lesions with white fuzzy growth on leaf undersides, caused by Phytophthora.',
        remedies: ['Apply protective fungicide immediately', 'Remove and destroy infected plant parts', 'Space plants properly', 'Avoid overhead watering']
    },
    {
        name: 'Leaf Rust',
        confidence: 89,
        description: 'Orange-yellow pustules on leaf surfaces, caused by Puccinia fungi.',
        remedies: ['Apply sulfur-based fungicide', 'Remove debris in fall', 'Plant resistant varieties', 'Increase spacing between plants']
    },
    {
        name: 'Powdery Mildew',
        confidence: 94,
        description: 'White powdery spots on leaf surfaces, caused by various fungi.',
        remedies: ['Apply baking soda solution (1 tbsp per gallon)', 'Improve air circulation', 'Avoid excessive nitrogen fertilizer', 'Water at base of plant']
    }
];

document.addEventListener('DOMContentLoaded', function() {
    console.log('App loaded');

    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const previewImg = document.getElementById('previewImg');
    const predictBtn = document.getElementById('predictBtn');
    const spinner = document.getElementById('spinner');
    const results = document.getElementById('results');
    const diseaseName = document.getElementById('diseaseName');
    const confidenceFill = document.getElementById('confidenceFill');
    const confidenceText = document.getElementById('confidenceText');
    const description = document.getElementById('description');
    const remediesList = document.getElementById('remediesList');
    const newPrediction = document.getElementById('newPrediction');

    console.log('Elements:', {predictBtn, previewImg, spinner});

    // Drag & drop
    ['dragover', 'dragenter'].forEach(event => {
        uploadArea.addEventListener(event, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(event => {
        uploadArea.addEventListener(event, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
        });
    });

    uploadArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        console.log('Handling file:', file.name, file.type, file.size);
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('File too large (max 10MB)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            console.log('Image loaded');
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
            results.style.display = 'none';
            previewImg.onload = () => {
                console.log('Preview ready:', previewImg.naturalWidth + 'x' + previewImg.naturalHeight);
            };
        };
        reader.onerror = () => console.error('Read error');
        reader.readAsDataURL(file);
    }

    predictBtn.addEventListener('click', function() {
        console.log('Predict clicked');
        
        if (!previewImg.src || previewImg.src === 'data:,' || !previewImg.complete) {
            alert('Please upload an image first');
            return;
        }

        predictBtn.disabled = true;
        predictBtn.textContent = 'Analyzing...';
        spinner.style.display = 'block';
        
        setTimeout(() => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxSize = 300;
                const scale = Math.min(maxSize / previewImg.naturalWidth, maxSize / previewImg.naturalHeight, 1);
                canvas.width = previewImg.naturalWidth * scale;
                canvas.height = previewImg.naturalHeight * scale;
                ctx.drawImage(previewImg, 0, 0, canvas.width, canvas.height);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Image seed for variation
                let seed = 0;
                for (let i = 0; i < Math.min(1000, data.length); i += 20) {
                    seed += data[i] * 31 + data[i+1];
                }
                seed = (seed % 10000) / 10000;
                
                let brownCount = 0, greenCount = 0, darkSpots = 0;
                let totalPixels = 0;
                
                for (let i = 0; i < data.length; i += 8) {
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];
                    
                    // Green pixels
                    if (g > 120 && r < 120 && b < 120 && g > r + 10) greenCount++;
                    
                    // Brown pixels
                    if (r > 100 && g < 100 && b < 100 && r > g + 20) brownCount++;
                    
                    // Dark spots
                    const brightness = (r * 0.3 + g * 0.59 + b * 0.11);
                    if (brightness < 90) darkSpots++;
                    
                    totalPixels++;
                }
                
                const greenRatio = greenCount / totalPixels;
                const brownRatio = brownCount / totalPixels;
                const spotRatio = darkSpots / totalPixels;
                
                // Add controlled noise
                const noise = 0.1;
                const finalGreen = Math.max(0, greenRatio * (1 + (seed - 0.5) * noise * 2));
                const finalBrown = Math.max(0, brownRatio * (1 + (1 - seed) * noise));
                const finalSpots = Math.max(0, spotRatio * (1 + seed * noise));
                
                console.log(`Analysis: Green:${finalGreen.toFixed(3)}, Brown:${finalBrown.toFixed(3)}, Spots:${finalSpots.toFixed(3)}`);
                
                // Probability selection
                const probs = [
                    finalGreen * 3,     // Healthy
                    finalBrown * 2.5,   // Dry
                    finalSpots * 2,     // Blight
                    finalSpots * 1.8,   // Late Blight
                    finalBrown * 1.5,   // Rust
                    (1-finalGreen) * 2  // Mildew
                ];
                
                const maxP = Math.max(...probs);
                const normProbs = probs.map(p => Math.exp(p/maxP));
                const sum = normProbs.reduce((a,b) => a+b, 0);
                const finalProbs = normProbs.map(p => p/sum);
                
                // Select with slight randomness
                let r = seed + Math.random()*0.3;
                r = r % 1;
                let cum = 0, idx = 0;
                for (let i = 0; i < finalProbs.length; i++) {
                    cum += finalProbs[i];
                    if (r <= cum) {
                        idx = i;
                        break;
                    }
                }
                
                const disease = {...diseases[idx]};
                disease.confidence = Math.floor(80 + finalProbs[idx] * 20);
                
                console.log(`Predicted: ${disease.name} (${disease.confidence}%)`);
                showResults(disease);
                
            } catch (error) {
                console.error('Analysis error:', error);
                alert('Try another image');
            } finally {
                spinner.style.display = 'none';
                predictBtn.disabled = false;
                predictBtn.textContent = '🔍 Analyze Again';
            }
        }, 1500);
    });

    function showResults(disease) {
        const classMap = {
            'Healthy': 'healthy',
            'Dry Leaf / Wilted': 'dry',
            'Early Blight': 'blight',
            'Late Blight': 'late',
            'Leaf Rust': 'rust', 
            'Powdery Mildew': 'mildew'
        };
        const diseaseClass = classMap[disease.name] || 'blight';
        
        diseaseName.textContent = disease.name;
        confidenceText.textContent = disease.confidence + '%';
        confidenceFill.style.width = disease.confidence + '%';
        description.textContent = disease.description;
        remediesList.innerHTML = disease.remedies.map(r => `<li>${r}</li>`).join('');
        
        const card = document.querySelector('.disease-card');
        card.className = `disease-card ${diseaseClass}`;
        setTimeout(() => card.classList.add('animate'), 50);
        
        results.style.display = 'block';
        results.scrollIntoView({ behavior: 'smooth' });
    }

    newPrediction.addEventListener('click', () => {
        results.style.display = 'none';
        previewImg.src = '';
        previewImg.style.display = 'none';
        fileInput.value = '';
        predictBtn.textContent = '🔍 Detect Disease';
        diseaseName.textContent = 'Processing...';
        document.querySelector('.disease-card').classList.remove('animate');
    });
});
