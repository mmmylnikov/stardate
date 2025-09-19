import datetime as dt
from unittest.mock import MagicMock, patch

from stardate.github_birthdays_sync import (
    REQUESTS_TIMEOUT,
    get_remote_file_date_github_api,
)


@patch('stardate.github_birthdays_sync.requests.get')
def test_remote_file_date_returns_date(mock_requests_get: MagicMock) -> None:
    """Ensure returns the correct last commit date from GitHub API."""
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = [
        {'commit': {'committer': {'date': '2025-09-12T00:00:00+00:00'}}}
    ]
    mock_requests_get.return_value = mock_response

    remote_file = get_remote_file_date_github_api('owner', 'repo', 'file_path')

    expected_date = dt.datetime.fromisoformat(
        '2025-09-12T00:00:00+00:00'
    ).date()
    assert remote_file == expected_date

    mock_requests_get.assert_called_once_with(
        'https://api.github.com/repos/owner/repo/commits',
        params={'path': 'file_path', 'per_page': 1},
        timeout=REQUESTS_TIMEOUT,
    )
    mock_response.raise_for_status.assert_called_once()


@patch('stardate.github_birthdays_sync.requests.get')
def test_remote_file_date_returns_none_if_empty(
    mock_requests_get: MagicMock,
) -> None:
    """Ensure returns None when GitHub API returns an empty commit list."""
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = []

    mock_requests_get.return_value = mock_response

    remote_file = get_remote_file_date_github_api('owner', 'repo', 'file_path')
    assert remote_file is None
    mock_response.raise_for_status.assert_called_once()
