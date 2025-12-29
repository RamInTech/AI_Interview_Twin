from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from codeeditor.models import RunRequest, RunResponse
from codeeditor.executor import run_code

app = FastAPI()

# Allow frontend access (local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/run", response_model=RunResponse)
def run(req: RunRequest):
    stdout, stderr = run_code(req.language, req.code, req.stdin)
    return RunResponse(stdout=stdout, stderr=stderr)
