const video = document.getElementById('video');
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('models/tiny_face_detector_model-weights_manifest.json'),
    faceapi.nets.faceLandmark68Net.loadFromUri('models/face_landmark_68_model-weights_manifest.json'),
    faceapi.nets.faceRecognitionNet.loadFromUri('models/face_recognition_model-weights_manifest.json'),
    faceapi.nets.faceExpressionNet.loadFromUri('models/face_expression_model-weights_manifest.json')
]).then(startVideo);

async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        document.getElementById('video').srcObject = stream;
    } catch (err) {
        console.error("Error accessing webcam", err);
    }
}

 video.addEventListener('play', () => {
    const displaySize = { width: document.getElementById('video').width, height: document.getElementById('video').height };
    faceapi.matchDimensions(document.getElementById('canvas'), displaySize);
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(document.getElementById('video'), new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors().withFaceExpressions();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        document.getElementById('canvas').getContext('2d').clearRect(0, 0, document.getElementById('canvas').width, document.getElementById('canvas').height);

        faceapi.draw.drawDetections(document.getElementById('canvas'), resizedDetections);
        //faceapi.draw.drawFaceLandmarks(document.getElementById('canvas'), resizedDetections);                               //To draw facial landmarks
        isFaceDetected = detections.length > 0;
        if (!isFaceDetected) {
            showMessage("No Face Detected");
        } else {
            hideMessage();
        }
    }, 100);
});   


document.getElementById('captureBtn1').addEventListener('click', () => {
    captureImage(1);
});

document.getElementById('captureBtn2').addEventListener('click', () => {
    captureImage(2);
});

let capturedDetails;
let isFaceDetected = false;
let descriptors = { desc1: null, desc2: null };
const threshold = 0.4;

function captureImage(imageNumber) {
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = document.getElementById('video').videoWidth;
    captureCanvas.height = document.getElementById('video').videoHeight;
    const ctx = captureCanvas.getContext('2d');
    ctx.drawImage(document.getElementById('video'), 0, 0, captureCanvas.width, captureCanvas.height);

    faceapi.detectAllFaces(captureCanvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions()
        .then(detections => {
            if (detections.length > 1) {
                console.log(document.getElementById('result').textContent = `Multiple faces detected in Image ${imageNumber}`);
            } else if (detections.length === 1 && detections[0].landmarks) {
                console.log(`Captured Image${imageNumber} Details:`, detections);
                capturedDetails = detections;
                descriptors[`desc${imageNumber}`] = detections[0]?.descriptor; // Assuming there is only one face in the captured image
                updateResult();
            } else {
                console.log(document.getElementById('result').textContent = `Not able to detect face in Image ${imageNumber}`);
            }
        });
}

function updateResult() {
    if (descriptors.desc1 && descriptors.desc2) {
        const distance = faceapi.utils.round(faceapi.euclideanDistance(descriptors.desc1, descriptors.desc2));
        let text = distance;
        let bgColor = '#ffffff';
        let matchResult = '';

        if (distance > threshold) {
            text += ' (no match)';
            bgColor = '#ce7575';
            matchResult = 'Images Do Not Match!';
        } else {
            text += ' (match)';
            bgColor = '#75ce75';
            matchResult = 'Images Match!';
        }

        document.getElementById('result').textContent = text;
        document.getElementById('result').style.backgroundColor = bgColor;

        // Display the result in the console
        console.log(matchResult);
    }
}

function showMessage(msg) {
    document.getElementById('message').textContent = msg;
    document.getElementById('message').style.visibility = 'visible';
}

function hideMessage() {
    document.getElementById('message').style.visibility = 'hidden';
}
