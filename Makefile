# DEV

style_wps:
	flake8 . --select=WPS

style_ruff:
	ruff check .

format_ruff:
	ruff format .

style:
	make format_ruff style_ruff style_wps

types:
	mypy .

check:
	make style types

test:
	pytest


# CI/CD (dev)

actci:
	act -W ".github/workflows/ci.yml"

actcd:
	act -W ".github/workflows/cd.yml" workflow_dispatch --var-file ".github/workflows/cd.variables"


# CORE

starsync:
	uv run stardate/github_birthdays_sync.py

