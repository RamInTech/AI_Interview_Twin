import subprocess
import tempfile
import os

TIMEOUT = 2  # seconds

def run_code(language: str, code: str, stdin: str = ""):
    with tempfile.TemporaryDirectory() as tmp:
        try:
            # ---------------- Python ----------------
            if language == "python":
                file_path = os.path.join(tmp, "main.py")
                with open(file_path, "w") as f:
                    f.write(code)

                result = subprocess.run(
                    ["python3", file_path],
                    input=stdin,
                    capture_output=True,
                    text=True,
                    timeout=TIMEOUT
                )
                return result.stdout, result.stderr

            # ---------------- JavaScript ----------------
            elif language == "javascript":
                file_path = os.path.join(tmp, "main.js")
                with open(file_path, "w") as f:
                    f.write(code)

                result = subprocess.run(
                    ["node", file_path],
                    input=stdin,
                    capture_output=True,
                    text=True,
                    timeout=TIMEOUT
                )
                return result.stdout, result.stderr

            # ---------------- C++ ----------------
            elif language == "cpp":
                src = os.path.join(tmp, "main.cpp")
                out = os.path.join(tmp, "a.out")

                with open(src, "w") as f:
                    f.write(code)

                compile_res = subprocess.run(
                    ["g++", src, "-O2", "-o", out],
                    capture_output=True,
                    text=True
                )
                if compile_res.returncode != 0:
                    return "", compile_res.stderr

                run_res = subprocess.run(
                    [out],
                    input=stdin,
                    capture_output=True,
                    text=True,
                    timeout=TIMEOUT
                )
                return run_res.stdout, run_res.stderr

            # ---------------- Java ----------------
            elif language == "java":
                src = os.path.join(tmp, "Solution.java")

                with open(src, "w") as f:
                    f.write(code)

                compile_res = subprocess.run(
                    ["javac", src],
                    capture_output=True,
                    text=True
                )
                if compile_res.returncode != 0:
                    return "", compile_res.stderr

                run_res = subprocess.run(
                    ["java", "-cp", tmp, "Solution"],
                    input=stdin,
                    capture_output=True,
                    text=True,
                    timeout=TIMEOUT
                )
                return run_res.stdout, run_res.stderr

            else:
                return "", "Unsupported language"

        except subprocess.TimeoutExpired:
            return "", "Time Limit Exceeded"
        except Exception as e:
            return "", str(e)
