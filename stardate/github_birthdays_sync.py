import datetime as dt
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any

import requests

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


ORIGIN_DATA_OWNER = os.getenv('ORIGIN_DATA_OWNER')
ORIGIN_DATA_REPO = os.getenv('ORIGIN_DATA_REPO')
ORIGIN_DATA_FILENAME = os.getenv('ORIGIN_DATA_FILENAME')

ORIGIN_DATA_RAW_URL = (
    'https://{endpoint}/{owner}/{repo}/main/{filename}'.format(
        endpoint='raw.githubusercontent.com',
        owner=ORIGIN_DATA_OWNER,
        repo=ORIGIN_DATA_REPO,
        filename=ORIGIN_DATA_FILENAME,
    )
)
REQUESTS_TIMEOUT = 3
LOCAL_ORIGIN = Path('docs/github_data_origin.json')
LOCAL_STAR = Path('docs/github_stardata.json')
REMOVE_ORIGIN_AFTER_PROCESS = True
ORIGIN_KEY_KEEP = (
    'index',
    'category',
    'githuburl',
    '_repopath',
    '_reponame',
    '_language',
    '_homepage',
    '_github_description',
    '_organization',
    '_created_at',
    '_avatar_url',
    '_description',
    '_github_topics',
)


def get_remote_file_date_github_api(
    repo_owner: str, repo_name: str, file_path: str
) -> dt.date | None:
    """Get last modification date of file in repository using GitHub API."""
    api_url = f'https://api.github.com/repos/{repo_owner}/{repo_name}/commits'
    query_params: dict[str, str | int] = {'path': file_path, 'per_page': 1}
    response = requests.get(
        api_url, params=query_params, timeout=REQUESTS_TIMEOUT
    )
    response.raise_for_status()
    commits = response.json()
    if commits:
        last_commit_date = commits[0]['commit']['committer']['date']
        return dt.datetime.fromisoformat(last_commit_date).date()
    return None


def get_local_file_date(filepath: Path) -> dt.date | None:
    """Get the modification date of a local file."""
    if filepath.exists():
        mod_time = filepath.stat().st_mtime
        return dt.datetime.fromtimestamp(mod_time, tz=dt.UTC).date()
    return None


def download_file(url: str, local_path: Path) -> None:
    """Download a file from a URL and save it locally."""
    response = requests.get(url, timeout=REQUESTS_TIMEOUT)
    response.raise_for_status()
    with local_path.open('w', encoding='utf-8') as local_file:
        local_file.write(response.text)


def filter_columns(
    json_content: dict[str, Any],
    keys_to_keep: tuple[str, ...],
) -> list[dict[str, Any]]:
    """Filter dataset inside the JSON content to keep only specified columns."""
    return [
        {key: repo.get(key) for key in keys_to_keep if key in repo}
        for repo in json_content.get('data', [])
    ]


def stardata_sync() -> None:
    """Synchronize GitHub data by updating local files."""
    if any([
        not ORIGIN_DATA_OWNER,
        not ORIGIN_DATA_REPO,
        not ORIGIN_DATA_FILENAME,
    ]):
        raise ValueError(
            'You must specify ORIGIN_DATA_OWNER, ORIGIN_DATA_REPO and '
            'ORIGIN_DATA_FILENAME in environment variables.'
        )

    remote_date = get_remote_file_date_github_api(
        repo_owner='dylanhogg',
        repo_name='awesome-python',
        file_path='github_data.json',
    )
    local_date = get_local_file_date(LOCAL_STAR)

    if remote_date is not None and (
        local_date is None or remote_date > local_date
    ):
        logger.info('Updating github_data_origin.json')
        download_file(ORIGIN_DATA_RAW_URL, LOCAL_ORIGIN)
    else:
        sys.exit('Local github_data_origin.json is up to date.')

    with LOCAL_ORIGIN.open(encoding='utf-8') as local:
        origin_data = json.load(local)

    filtered_data = filter_columns(origin_data, ORIGIN_KEY_KEEP)

    with LOCAL_STAR.open('w', encoding='utf-8') as local:
        json.dump(
            filtered_data, local, separators=(',', ':'), ensure_ascii=False
        )
        logger.info('Filtered data saved to %s', LOCAL_STAR)

    if REMOVE_ORIGIN_AFTER_PROCESS and Path(LOCAL_ORIGIN).exists():
        Path(LOCAL_ORIGIN).unlink()
        logger.info('Removed %s', LOCAL_ORIGIN)


if __name__ == '__main__':
    stardata_sync()
