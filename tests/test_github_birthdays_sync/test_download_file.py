from pathlib import Path
from unittest.mock import MagicMock, mock_open, patch

import pytest

from stardate.github_birthdays_sync import download_file


@patch('stardate.github_birthdays_sync.requests.get')
@patch('builtins.open', new_callable=mock_open)
def test_download_file_success(
    mock_file_open: MagicMock,
    mock_requests_get: MagicMock,
) -> None:
    """Ensure download_file successfully downloads & writes content to file."""
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.text = 'file content here'
    mock_requests_get.return_value = mock_response

    mock_path = MagicMock(spec=Path)
    mock_path.open = mock_file_open

    test_url = 'http://example.com/file.txt'

    download_file(test_url, mock_path)

    mock_requests_get.assert_called_once_with(
        test_url, timeout=download_file.__globals__['REQUESTS_TIMEOUT']
    )
    mock_path.open.assert_called_once_with('w', encoding='utf-8')
    mock_file_open().write.assert_called_once_with('file content here')


@patch('stardate.github_birthdays_sync.requests.get')
def test_download_file_raises_for_status(mock_requests_get: MagicMock) -> None:
    """Ensure download_file raises exception if response status is bad."""
    mock_response = MagicMock()
    mock_response.raise_for_status.side_effect = Exception('Bad response')
    mock_requests_get.return_value = mock_response

    mock_path = MagicMock(spec=Path)

    with pytest.raises(Exception, match='Bad response'):
        download_file('http://example.com/file.txt', mock_path)
