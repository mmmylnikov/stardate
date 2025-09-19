import datetime as dt
from unittest.mock import MagicMock

from stardate.github_birthdays_sync import get_local_file_date


def test_file_exists_returns_date() -> None:
    """Ensure returns the correct modification date when the file exists."""
    mock_path = MagicMock()
    mock_path.exists.return_value = True
    fixed_timestamp = 1694524800.0
    mock_path.stat.return_value.st_mtime = fixed_timestamp

    local_file_date = get_local_file_date(mock_path)
    expected_date = dt.datetime.fromtimestamp(fixed_timestamp, tz=dt.UTC).date()
    assert local_file_date == expected_date
    mock_path.exists.assert_called_once()
    mock_path.stat.assert_called_once()


def test_file_does_not_exist_returns_none() -> None:
    """Ensure returns None when the file does not exist."""
    mock_path = MagicMock()
    mock_path.exists.return_value = False

    local_file_date = get_local_file_date(mock_path)
    assert local_file_date is None
    mock_path.exists.assert_called_once()
    mock_path.stat.assert_not_called()
