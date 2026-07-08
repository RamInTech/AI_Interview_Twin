# app/services/code_execution_service.py
#
# Multi-language code execution for Coding/DSA rounds.
#
# Providers (CODE_EXEC_PROVIDER env var):
#   - "wandbox" (default): free public API, no key required.
#   - "piston": for a self-hosted Piston instance (set CODE_EXEC_API_URL).
#     Note: the public Piston API at emkc.org became whitelist-only in
#     Feb 2026, so it only works self-hosted or with an approved origin.
#
# Solutions are full programs: read stdin, write stdout.

import time
from typing import Dict, List, Optional

import requests

from app.config import CODE_EXECUTION_CONFIG

# Frontend language id -> (piston language/filename, wandbox language label)
LANGUAGE_MAP = {
    "python": {"piston": ("python", "main.py"), "wandbox": "Python"},
    "javascript": {"piston": ("javascript", "main.js"), "wandbox": "JavaScript"},
    "cpp": {"piston": ("c++", "main.cpp"), "wandbox": "C++"},
    # Wandbox stores sources as prog.java, so Java solutions must use a
    # non-public class (templates use `class Solution`)
    "java": {"piston": ("java", "Solution.java"), "wandbox": "Java"},
    "go": {"piston": ("go", "main.go"), "wandbox": "Go"},
    "rust": {"piston": ("rust", "main.rs"), "wandbox": "Rust"},
}


def _error_result(message: str) -> dict:
    return {
        "success": False,
        "stdout": "",
        "stderr": message,
        "compile_output": "",
        "exit_code": -1,
        "time_ms": None,
        "memory_kb": None,
    }


# -----------------------------
# Wandbox provider (default)
# -----------------------------
_wandbox_compilers: Optional[Dict[str, str]] = None


def _get_wandbox_compiler(language: str) -> Optional[str]:
    """Resolve the newest stable Wandbox compiler for a language (cached)."""
    global _wandbox_compilers
    if _wandbox_compilers is None:
        try:
            resp = requests.get(
                f"{CODE_EXECUTION_CONFIG['wandbox_url']}/list.json",
                timeout=CODE_EXECUTION_CONFIG["request_timeout_s"],
            )
            resp.raise_for_status()
            _wandbox_compilers = {}
            for comp in resp.json():
                lang = comp.get("language")
                name = comp.get("name", "")
                # Prefer the first stable (non-head) build; list is newest-first
                if lang and lang not in _wandbox_compilers and "head" not in name:
                    _wandbox_compilers[lang] = name
            print(f"[CODE-EXEC] Wandbox compilers: {_wandbox_compilers}")
        except Exception as e:
            print(f"[CODE-EXEC][WARN] Could not fetch Wandbox compilers: {e}")
            _wandbox_compilers = None
            return None
    return _wandbox_compilers.get(LANGUAGE_MAP[language]["wandbox"])


def _run_wandbox(language: str, code: str, stdin: str) -> dict:
    compiler = _get_wandbox_compiler(language)
    if not compiler:
        return _error_result(
            f"No compiler available for '{language}' on the execution service."
        )

    try:
        resp = requests.post(
            f"{CODE_EXECUTION_CONFIG['wandbox_url']}/compile.json",
            json={"compiler": compiler, "code": code, "stdin": stdin},
            timeout=CODE_EXECUTION_CONFIG["request_timeout_s"],
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        return _error_result(f"Code execution service unavailable: {e}")

    compile_error = (data.get("compiler_error") or "").strip()
    signal = (data.get("signal") or "").strip()
    try:
        exit_code = int(data.get("status") or -1)
    except (TypeError, ValueError):
        exit_code = -1

    stderr = data.get("program_error", "")
    if signal:
        stderr = (stderr + f"\n[Terminated by signal: {signal}]").strip()

    return {
        "success": exit_code == 0 and not compile_error and not signal,
        "stdout": data.get("program_output", ""),
        "stderr": stderr if not compile_error else "",
        "compile_output": compile_error,
        "exit_code": exit_code,
        "time_ms": None,   # Wandbox does not report timing/memory
        "memory_kb": None,
    }


# -----------------------------
# Piston provider (self-hosted)
# -----------------------------
_piston_versions: Optional[Dict[str, str]] = None


def _get_piston_version(piston_language: str) -> str:
    global _piston_versions
    if _piston_versions is None:
        try:
            resp = requests.get(
                f"{CODE_EXECUTION_CONFIG['api_url']}/runtimes",
                timeout=CODE_EXECUTION_CONFIG["request_timeout_s"],
            )
            resp.raise_for_status()
            _piston_versions = {}
            for rt in resp.json():
                for name in [rt["language"], *rt.get("aliases", [])]:
                    _piston_versions[name] = rt["version"]
        except Exception as e:
            print(f"[CODE-EXEC][WARN] Could not fetch Piston runtimes: {e}")
            _piston_versions = {}
    return _piston_versions.get(piston_language, "*")


def _run_piston(language: str, code: str, stdin: str) -> dict:
    piston_lang, filename = LANGUAGE_MAP[language]["piston"]
    cfg = CODE_EXECUTION_CONFIG

    try:
        resp = requests.post(
            f"{cfg['api_url']}/execute",
            json={
                "language": piston_lang,
                "version": _get_piston_version(piston_lang),
                "files": [{"name": filename, "content": code}],
                "stdin": stdin,
                "compile_timeout": cfg["compile_timeout_ms"],
                "run_timeout": cfg["run_timeout_ms"],
            },
            timeout=cfg["request_timeout_s"],
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        return _error_result(f"Code execution service unavailable: {e}")

    compile_stage = data.get("compile") or {}
    run_stage = data.get("run") or {}

    compile_output = (compile_stage.get("stderr") or compile_stage.get("output") or "").strip()
    compile_failed = compile_stage.get("code") not in (None, 0)

    time_ms = run_stage.get("wall_time")
    memory = run_stage.get("memory")

    return {
        "success": (not compile_failed) and run_stage.get("code") == 0,
        "stdout": run_stage.get("stdout", ""),
        "stderr": run_stage.get("stderr", "") if not compile_failed else "",
        "compile_output": compile_output if compile_failed else "",
        "exit_code": run_stage.get("code", -1) if not compile_failed else compile_stage.get("code", -1),
        "time_ms": round(time_ms, 1) if isinstance(time_ms, (int, float)) else None,
        "memory_kb": round(memory / 1024) if isinstance(memory, (int, float)) else None,
    }


# -----------------------------
# Public API
# -----------------------------
def run_code(language: str, code: str, stdin: str = "") -> dict:
    """Execute code once with the given stdin via the configured provider."""
    if language not in LANGUAGE_MAP:
        return _error_result(
            f"Unsupported language '{language}'. Supported: {', '.join(LANGUAGE_MAP)}"
        )

    if CODE_EXECUTION_CONFIG["provider"] == "piston":
        return _run_piston(language, code, stdin)
    return _run_wandbox(language, code, stdin)


def _normalize_output(text: str) -> str:
    return "\n".join(line.rstrip() for line in (text or "").strip().splitlines())


def run_tests(language: str, code: str, tests: List[dict]) -> dict:
    """
    Run code against a list of {input, expected_output} test cases.
    Returns per-test results and a pass/fail summary.
    """
    results = []
    delay = CODE_EXECUTION_CONFIG["delay_between_tests_s"]

    for i, test in enumerate(tests):
        if i > 0:
            time.sleep(delay)

        execution = run_code(language, code, stdin=str(test.get("input", "")))
        expected = _normalize_output(str(test.get("expected_output", "")))
        actual = _normalize_output(execution["stdout"])
        passed = execution["success"] and actual == expected

        results.append({
            "index": i + 1,
            "passed": passed,
            "input": str(test.get("input", "")),
            "expected_output": expected,
            "actual_output": actual,
            "stderr": execution["stderr"],
            "compile_output": execution["compile_output"],
            "time_ms": execution["time_ms"],
            "memory_kb": execution["memory_kb"],
        })

        # A compile error will fail every test identically — stop early
        if execution["compile_output"]:
            break

    passed_count = sum(1 for r in results if r["passed"])
    times = [r["time_ms"] for r in results if r["time_ms"] is not None]
    memories = [r["memory_kb"] for r in results if r["memory_kb"] is not None]

    return {
        "results": results,
        "passed": passed_count,
        "total": len(tests),
        "all_passed": passed_count == len(tests) and len(tests) > 0,
        "avg_time_ms": round(sum(times) / len(times), 1) if times else None,
        "max_memory_kb": max(memories) if memories else None,
    }
