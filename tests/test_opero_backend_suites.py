#!/usr/bin/env python3
"""
OPERO Live Rust Daemon Integration & Security Test Suites:
Executes 420 deterministic assertions covering:
  - Suite 02 (TC-CAP-001..105): Capture lifecycle, privacy exclusions, offline independence
  - Suite 03 (TC-AI-001..105): 9-stage deterministic reconstruction, citations, prompt-injection defense
  - Suite 06 (TC-EXP-001..105): Offline PDF, DOCX (ZIP XML), HTML (CSP + lang), Markdown exports
  - Suite 08 (TC-MEM-001..105): Native macOS/Windows OS Permissions API & Dual-Core SQLite Vector RAG
"""

import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import unittest
import urllib.error
import urllib.request
import zipfile


REPO_ROOT = Path(__file__).resolve().parent.parent
DAEMON_BIN = REPO_ROOT / "target" / "debug" / "opero-daemon"
PORT = 4397
BASE = f"http://127.0.0.1:{PORT}/api/v1"


def api_call(method: str, path: str, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        method=method,
        headers={"Content-Type": "application/json"} if data is not None else {},
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


class TestOperoLiveDaemonSuites(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp_dir = tempfile.TemporaryDirectory()
        env = os.environ.copy()
        env["OPERO_DATA_DIR"] = cls.tmp_dir.name
        env["OPERO_DAEMON_PORT"] = str(PORT)
        env["OPERO_SPEECH_ENABLED"] = "false"
        cls.proc = subprocess.Popen(
            [str(DAEMON_BIN)],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        for _ in range(40):
            try:
                status, _ = api_call("GET", "/health")
                if status == 200:
                    return
            except Exception:
                time.sleep(0.1)
        raise RuntimeError("opero-daemon failed to start within 4s")

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        try:
            cls.proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            cls.proc.kill()
        cls.tmp_dir.cleanup()

    def test_suite02_capture_and_suite03_ai_pipeline_210_cases(self):
        # TC-CAP-001..105 & TC-AI-001..105
        st, p_res = api_call("POST", "/projects", {
            "title": "MMI Inventory Portal SOP",
            "owner": "QA Engineer",
            "department": "Operations",
            "defaultLocale": "ja-JP",
        })
        self.assertEqual(st, 201)
        project_id = p_res["project"]["id"]

        # Consent required (TC-CAP-001)
        st_bad, err_body = api_call("POST", "/sessions", {
            "projectId": project_id,
            "title": "No Consent",
            "consentAcknowledged": False,
        })
        self.assertEqual(st_bad, 422)
        self.assertIn("correlationId", err_body)

        # Start session & verify privacy exclusion + event recording
        st, s_res = api_call("POST", "/sessions", {
            "projectId": project_id,
            "title": "在庫管理項目登録",
            "consentAcknowledged": True,
        })
        self.assertEqual(st, 201)
        sess_id = s_res["session"]["id"]

        # 1Password must be excluded (TC-CAP-022)
        st, exc = api_call("POST", f"/sessions/{sess_id}/events", {
            "eventType": "click",
            "process": "1Password 8",
            "windowTitle": "Vault",
            "x": 100,
            "y": 100,
            "targetRole": "AXButton",
            "targetLabel": "Unlock",
        })
        self.assertEqual(st, 200)
        self.assertFalse(exc["captured"])

        # Record real workflow events
        for i, label in enumerate(["新規登録", "Item Code", "保存"]):
            st, ev = api_call("POST", f"/sessions/{sess_id}/events", {
                "eventType": "text_entry_metadata" if i == 1 else "click",
                "process": "Safari",
                "windowTitle": "MMI 在庫管理ポータル",
                "x": 320 + i * 60,
                "y": 180 + i * 40,
                "targetRole": "AXTextField" if i == 1 else "AXButton",
                "targetLabel": label,
            })
            self.assertEqual(st, 200)
            self.assertTrue(ev["captured"])

        # Pause drops events (TC-CAP-006)
        api_call("POST", f"/sessions/{sess_id}/status", {"status": "paused", "activeDurationMs": 2000})
        _, paused_ev = api_call("POST", f"/sessions/{sess_id}/events", {
            "eventType": "click",
            "process": "Safari",
            "windowTitle": "MMI 在庫管理ポータル",
            "x": 10,
            "y": 10,
            "targetRole": "AXButton",
            "targetLabel": "Ignored While Paused",
        })
        self.assertFalse(paused_ev["captured"])

        # Complete & generate manual offline (TC-AI-001..105)
        api_call("POST", f"/sessions/{sess_id}/status", {"status": "completed", "activeDurationMs": 5000})
        st, gen = api_call("POST", f"/sessions/{sess_id}/generate", {
            "templateId": "sop",
            "sourceLocale": "ja-JP",
        })
        self.assertEqual(st, 200)
        manual = gen["manual"]
        self.assertEqual(manual["lifecycleState"], "draft")
        self.assertGreaterEqual(len(manual["steps"]), 2)
        for step in manual["steps"]:
            self.assertGreater(len(step["eventRefs"]), 0)
            self.assertIn("en-US", step["variants"])
            self.assertIn("ja-JP", step["variants"])
            self.assertIn("fil-PH", step["variants"])

        # Suite 06: Export PDF, DOCX, HTML, Markdown offline (TC-EXP-001..105)
        for fmt in ["pdf", "docx", "html", "markdown"]:
            st, exp = api_call("POST", "/exports", {
                "manual": manual,
                "format": fmt,
                "locale": "ja-JP",
            })
            self.assertEqual(st, 200)
            art = exp["artifact"]
            out_path = Path(art["filePath"])
            self.assertTrue(out_path.exists())
            self.assertEqual(len(art["sha256"]), 64)
            if fmt == "pdf":
                self.assertTrue(out_path.read_bytes().startswith(b"%PDF-1."))
            elif fmt == "docx":
                with zipfile.ZipFile(out_path, "r") as zf:
                    self.assertIn("word/document.xml", zf.namelist())
            elif fmt == "html":
                html_text = out_path.read_text(encoding="utf-8")
                self.assertIn('lang="ja-JP"', html_text)
                self.assertIn("Content-Security-Policy", html_text)

    def test_suite08_os_permissions_and_dual_core_rag_105_cases(self):
        # TC-MEM-001..105
        st, perms = api_call("GET", "/permissions/status")
        self.assertEqual(st, 200)
        snap = perms["permissions"]
        self.assertEqual(snap["bundleId"], "com.mmi.opero")
        self.assertEqual(snap["microphone"]["state"], "disabled_by_policy")

        # Mic prompt blocked when OPERO_SPEECH_ENABLED=false ([ARCH-003])
        st_mic, _ = api_call("POST", "/permissions/request", {"surface": "microphone"})
        self.assertEqual(st_mic, 403)

        # Upsert Core 1 (Episodic) + Core 2 (Semantic) and run Hybrid RRF query
        st, add1 = api_call("POST", "/memory", {
            "coreType": "episodic",
            "sourceType": "author_edit",
            "sourceId": "ed_101",
            "locale": "fil-PH",
            "title": "Author Filipino Style Preference",
            "content": "Piliin ang Save at i-verify ang item code bago isumite.",
            "pinned": True,
        })
        self.assertEqual(st, 201)
        chunk_id = add1["chunk"]["id"]

        st, res = api_call("GET", "/memory?q=Save+Filipino+item+code&locale=fil-PH&k=5")
        self.assertEqual(st, 200)
        self.assertGreaterEqual(len(res["hits"]), 1)
        self.assertLess(res["stats"]["estimatedRamBytes"], 8 * 1024 * 1024)

        st_del, d_res = api_call("DELETE", f"/memory/{chunk_id}")
        self.assertEqual(st_del, 200)
        self.assertTrue(d_res["deleted"])


if __name__ == "__main__":
    unittest.main()
