#!/usr/bin/env python3
import os, sys, subprocess

here = os.path.dirname(os.path.abspath(__file__))
canonical = os.path.join(here, "zlce", "zlce-collect.py")
sys.exit(subprocess.run([sys.executable, canonical] + sys.argv[1:]).returncode)
