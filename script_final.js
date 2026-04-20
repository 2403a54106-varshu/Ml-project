const diseases = [
    {
        name: 'Healthy',
        confidence: 97,
        icon: '🟢',
        description: 'The leaf is perfectly healthy with vibrant green color and no signs of stress.',
        remedies: ['Continue current care routine', 'Maintain proper watering schedule', 'Ensure adequate sunlight', 'Regular fertilization as needed']
    },
    {
        name: 'About to Dry',
        confidence: 92,
        icon: '🟡',
        description: 'Early signs of drying detected. Leaf edges show slight yellowing and minor wilting.',
        remedies: ['Increase watering slightly', 'Check soil moisture daily', 'Apply liquid fertilizer', 'Provide partial shade during peak sun']
    },
    {
        name: 'Dry / Wilted',
        confidence: 90,
        description: 'Significant drying and wilting. Leaf shows brown edges and drooping.',
        remedies: ['Water deeply immediately', 'Deep soak soil for 30 mins', 'Apply balanced fertilizer', 'Trim dead parts', 'Provide shade']
    },
    {
        name: 'Dead',
        confidence: 95,
        icon: '⚫',
        description: 'Leaf is dead or dying. Extensive browning, shriveling, and no green tissue.',
        remedies: ['Remove dead leaves immediately', 'Check root health', 'Improve drainage if recurring', 'Test soil pH', 'Consider plant replacement']
    },
    {
        name: 'Early Blight',
        confidence: 92,
        description: 'Dark spots with yellow halos on lower leaves (Alternaria solani).',
        remedies: ['Remove infected leaves', 'Copper fungicide', 'Improve air circulation', 'Mulch base']
    },
    {
        name: 'Late Blight',
        confidence: 88,
        description: 'Irregular lesions with white growth underneath (Phytophthora).',
        remedies: ['Fungicide immediately', 'Destroy infected parts', 'Proper spacing', 'No overhead watering']
    },
    {
        name: 'Leaf Rust',
        confidence: 89,
        description: 'Orange pustules on leaves (Puccinia fungi).',
        remedies: ['Sulfur fungicide', 'Remove debris', 'Resistant varieties', 'Better spacing']
    },
    {
        name: 'Powdery Mildew',
        confidence: 94,
        description: 'White powdery coating on leaves.',
        remedies: ['Baking soda spray', 'Air circulation', 'Base watering only']
    }
];

document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
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

    // Drag & drop events
    ['dragover', 'dragenter'].forEach(event => {
        uploadArea.addEventListener(event, (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
    });
    ['dragleave', 'drop'].forEach(event => {
        uploadArea.addEventListener(event, (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });
    });
    uploadArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    });
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
            alert('Please select image <10MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
            results.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    predictBtn.addEventListener('click', async function() {
        // Strict upload validation
        if (!previewImg.src || !previewImg.src.startsWith('data:') || previewImg.naturalWidth === 0 || previewImg.naturalHeight === 0) {
            showError('Please upload a valid image first');
            return;
        }

        predictBtn.disabled = true;
        predictBtn.textContent = '🤖 ML Analyzing...';
        spinner.style.display = 'block';

        try {
            // Leaf validation - analyzes full image for plant-like green content
            const valCanvas = document.createElement('canvas');
            const valCtx = valCanvas.getContext('2d');
            const valSize = 300;
            const valScale = Math.min(valSize / previewImg.naturalWidth, valSize / previewImg.naturalHeight, 1);
            valCanvas.width = previewImg.naturalWidth * valScale;
            valCanvas.height = previewImg.naturalHeight * valScale;
            valCtx.drawImage(previewImg, 0, 0, valCanvas.width, valCanvas.height);
            const valData = valCtx.getImageData(0, 0, valCanvas.width, valCanvas.height).data;
            
            let valGreenCount = 0, valTotalPixels = valData.length / 4;
            for (let i = 0; i < valData.length; i += 8) {
                const r = valData[i], g = valData[i+1], b = valData[i+2];
                if (g > 60 && g > Math.max(r, b) && g - Math.max(r, b) > 8) valGreenCount++; // Loose plant green
            }
            const valGreenRatio = valGreenCount / (valTotalPixels / 4);
            
            console.log('Leaf validation:', valGreenRatio.toFixed(3));
            
            if (valGreenRatio < 0.02) { // 2% threshold - passes most plant leaves
                showError('Please upload a plant leaf image (detected non-plant content).');
                return;
            }

            // Full pixel analysis (deterministic core)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxSize = 400;
            const scale = Math.min(maxSize / previewImg.naturalWidth, maxSize / previewImg.naturalHeight, 1);
            canvas.width = previewImg.naturalWidth * scale;
            canvas.height = previewImg.naturalHeight * scale;
            ctx.drawImage(previewImg, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            let greenCount = 0, brownCount = 0, darkCount = 0, whiteCount = 0, yellowCount = 0;
            const totalPixels = data.length / 4;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i+1], b = data[i+2];
                const gray = (r * 0.3 + g * 0.59 + b * 0.11);

                // Healthy green
                if (g > 110 && r < g * 0.92 && b < g * 0.92 && g > 90) greenCount++;

                // Yellow/About to dry
                if (g > 120 && r > 100 && Math.abs(r - g) < 40 && b < 100) yellowCount++;

                // Brown/Dry/Dead - very broad for dry leaves
                if ((r > 60 && g < 130 && Math.abs(r - g) < 80 && gray > 40 && gray < 170) || (r > g && r > b && r > 80)) brownCount++;


                // Dead dark
                if (gray < 60 || (r < 50 && g < 50 && b < 50)) darkCount++;

                // White mildew
                if (gray > 220 && Math.max(r,g,b) - Math.min(r,g,b) < 40) whiteCount++;
            }

            const greenRatio = greenCount / totalPixels;
            const yellowRatio = yellowCount / totalPixels;
            const brownRatio = brownCount / totalPixels;
            const darkRatio = darkCount / totalPixels;
            const whiteRatio = whiteCount / totalPixels;

            console.log('Pixel features:', {greenRatio: greenRatio.toFixed(3), yellowRatio: yellowRatio.toFixed(3), brownRatio: brownRatio.toFixed(3), darkRatio: darkRatio.toFixed(3)});

            // Refined deterministic scoring
            const scores = [
                greenRatio * 4,      // 0: Healthy
                yellowRatio * 3.5,  // 1: About to Dry
                brownRatio * 8,          // 2: Dry/Wilted - MAX priority
                darkRatio * 5.5,          // 3: Dead
                darkRatio * 4,          // 4: Blight
                whiteRatio * 5                              // 7: Mildew
            ];


            const maxIdx = scores.indexOf(Math.max(...scores));
            let disease = {...diseases[maxIdx]};
            disease.confidence = Math.floor(88 + scores[maxIdx] * 12);

            // TODO: TF.js integration here (mock for now)
            // const model = await tf.loadLayersModel(...);
            // const predictions = model.predict(tensor);
            // if (predictions) disease = tfPredToDisease(predictions);

            console.log(`Final prediction: ${disease.name} (${disease.confidence}%)`);
            showResults(disease);

        } catch (error) {
            console.error('Analysis error:', error);
            alert('Try different image');
        } finally {
            spinner.style.display = 'none';
            predictBtn.disabled = false;
            predictBtn.textContent = '🔍 Predict Disease';
        }
    });

    function showResults(disease) {
        diseaseName.innerHTML = disease.icon + ' ' + disease.name;
        confidenceText.textContent = 'Analyzed';
        confidenceFill.style.width = '100%';
        description.textContent = disease.description;
        remediesList.innerHTML = disease.remedies.map(r => `<li>${r}</li>`).join('');
        
        const card = document.querySelector('.disease-card');
        card.className = `disease-card ${disease.name.toLowerCase().replace(/\\s+/g, '-')}`;
        setTimeout(() => card.classList.add('animate'), 100);
        
        results.style.display = 'block';
        results.scrollIntoView({behavior: 'smooth'});
    }

    function showError(message) {
        diseaseName.textContent = '❌ Invalid Image';
        confidenceText.textContent = 'Error';
        confidenceFill.style.width = '0%';
        description.textContent = message;
        remediesList.innerHTML = '<li>Upload a clear, green plant leaf image for best results</li><li>Supported: JPEG, PNG under 10MB</li><li>Avoid: backgrounds, fruits, flowers, animals</li>';
        
        const card = document.querySelector('.disease-card');
        card.className = 'disease-card error';
        setTimeout(() => card.classList.add('animate'), 100);
        
        results.style.display = 'block';
        results.scrollIntoView({behavior: 'smooth'});
        
        spinner.style.display = 'none';
        predictBtn.disabled = false;
        predictBtn.textContent = '🔍 Detect Disease';
    }

    newPrediction.addEventListener('click', () => {
        results.style.display = 'none';
        previewImg.style.display = 'none';
        previewImg.src = '';
        fileInput.value = '';
        document.querySelector('.disease-card').classList.remove('animate');
        predictBtn.textContent = '🔍 Predict Disease';
    });
});

