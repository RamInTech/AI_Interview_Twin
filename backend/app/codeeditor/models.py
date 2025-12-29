from pydantic import BaseModel

class RunRequest(BaseModel):
    language: str
    code: str
    stdin: str = ""

class RunResponse(BaseModel):
    stdout: str
    stderr: str
