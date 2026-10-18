#!/usr/bin/env python3
"""Prepare the separate static website without keeping its source in the protocol repo."""
from pathlib import Path
import shutil

PUBLISHING = Path(__file__).resolve().parents[1]
SOURCE = PUBLISHING.parents[1]
ARCHIVE = PUBLISHING.parent / "2026-09-11-cleanup"
destination = PUBLISHING / "website/public/docs"
destination.mkdir(parents=True, exist_ok=True)
for name in ("PUBLIC_TESTNET.md", "PROTOCOL_CANDIDATE_V2.md", "LLM_PROTOCOL.md", "LLM_EXPERIMENTS.md",
             "EVOLUTION_PROTOCOL.md", "DATA_PIPELINE.md", "PROTOCOL_EXPERIMENTS.md", "RESEARCH_ROADMAP.md"):
    source = SOURCE / "docs" / name
    if not source.exists():
        source = ARCHIVE / "docs" / name
    shutil.copy2(source, destination / name)
papers = PUBLISHING / "website/public/papers"
papers.mkdir(exist_ok=True)
shutil.copy2(PUBLISHING / "papers/FINE2026_neuroshard_short.pdf", papers / "FINE2026_neuroshard_short.pdf")
