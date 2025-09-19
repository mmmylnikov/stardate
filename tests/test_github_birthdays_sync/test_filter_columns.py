from typing import Any

from stardate.github_birthdays_sync import filter_columns

ORIGIN_KEY_KEEP = ('name', 'url', 'stars')


def test_filter_columns_basic() -> None:
    """Ensure returns dict containing only keys specified in ORIGIN_KEY_KEEP."""
    input_data = {
        'data': [
            {
                'name': 'repo1',
                'url': 'https://repo1',
                'stars': 100,
                'forks': 50,
            },
            {
                'name': 'repo2',
                'url': 'https://repo2',
                'forks': 30,
                'issues': 10,
            },
            {'name': 'repo3', 'stars': 200},
        ]
    }
    expected = [
        {'name': 'repo1', 'url': 'https://repo1', 'stars': 100},
        {'name': 'repo2', 'url': 'https://repo2'},
        {'name': 'repo3', 'stars': 200},
    ]
    columns = filter_columns(input_data, ORIGIN_KEY_KEEP)
    assert columns == expected


def test_filter_columns_empty_data() -> None:
    """Ensure returns empty listwhen the input JSON data is empty or missing."""
    assert filter_columns({'data': []}, ORIGIN_KEY_KEEP) == []
    assert filter_columns({}, ORIGIN_KEY_KEEP) == []


def test_filter_columns_no_keys() -> None:
    """Ensure returns empty dict if the repositories contain no keys."""
    input_data = {'data': [{'forks': 10, 'issues': 5}, {'license': 'MIT'}]}
    expected: list[dict[str, Any]] = [{}, {}]
    columns = filter_columns(input_data, ORIGIN_KEY_KEEP)
    assert columns == expected
