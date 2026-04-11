import os
import insightface
from insightface.app import FaceAnalysis

print("Initializing InsightFace...")
print("This will download the 300MB 'buffalo_l' model package to ~/.insightface/models/ if it's not already there.")

# Initialize the FaceAnalysis app which automatically pulls down RetinaFace and ArcFace
app = FaceAnalysis(name='buffalo_l')
app.prepare(ctx_id=0, det_size=(640, 640))

print("Model successfully loaded! You are ready to start coding the enrollment and matching pipelines.")
