from insightface.app import FaceAnalysis

app = FaceAnalysis(name="buffalo_l")  # REQUIRED in your version
app.prepare(ctx_id=0)

print("InsightFace loaded successfully")