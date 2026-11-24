"""Tests for app.py routes.

git.Repo and sentry_sdk are patched at the sys.modules level before import
because they run at module scope (_repo = Repo(...) and sentry_sdk.init(...)).
"""
import os
import sys
from unittest.mock import MagicMock, mock_open, patch

import pytest

# --- must happen before `import app` ---
_mock_repo = MagicMock()
sys.modules['git'] = MagicMock(Repo=MagicMock(return_value=_mock_repo))
sys.modules['sentry_sdk'] = MagicMock()

# Stub packages installed from git that may not be present in the test environment
_fb = MagicMock()
sys.modules['firebase_to_xml'] = _fb
sys.modules['firebase_to_xml.__main__'] = _fb
sys.modules['firebase_to_xml.get_records_from_firebase'] = _fb
sys.modules['firebase_to_xml.record_json_to_yaml'] = _fb

_meta = MagicMock()
sys.modules['metadata_xml'] = _meta
sys.modules['metadata_xml.template_functions'] = _meta

_hakai = MagicMock()
sys.modules['hakai_metadata_conversion'] = _hakai
sys.modules['hakai_metadata_conversion.citation_cff'] = _hakai
sys.modules['hakai_metadata_conversion.erddap'] = _hakai

os.environ.setdefault('FIREBASE_SERVICE_ACCOUNT_KEY', '{}')
os.environ['RECORD_API_TOKEN'] = 'test-token'

from app import app, delete_record, get_complete_path, git_push, _run_with_lock_retry  # noqa: E402


SAMPLE_RECORD = {
    'title': {'en': 'Test Dataset Title From Firebase'},
    'status': 'published',
    'language': 'en',
    'identifier': 'abc12',
    'filename': 'test_record',
    'metadataScope': 'dataset',
}


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as c:
        yield c


@pytest.fixture(autouse=True)
def reset_git_mock():
    _mock_repo.reset_mock()
    yield


# ---------------------------------------------------------------------------
# Helper: get_complete_path
# ---------------------------------------------------------------------------

class TestGetCompletePath:
    def test_published_path(self):
        assert get_complete_path('published', 'hakai', 'rec', '.xml') == 'xml/hakai/rec.xml'

    def test_submitted_inserts_unpublished(self):
        assert get_complete_path('submitted', 'hakai', 'rec', '.xml') == 'xml/unpublished/hakai/rec.xml'

    def test_draft_has_no_unpublished(self):
        assert get_complete_path('draft', 'hakai', 'rec', '.yaml') == 'xml/hakai/rec.yaml'


# ---------------------------------------------------------------------------
# Helper: delete_record
# ---------------------------------------------------------------------------

class TestDeleteRecord:
    # git runs from the repo root (xml_folder), so anything handed to it has to be
    # relative to that root. Passing glob's "xml/..." paths straight through made
    # git rm fail the pathspec and 500 the whole request.
    def test_paths_are_relative_to_the_repo_root(self):
        found = {'xml/**/hakai/rec.xml': ['xml/hakai/rec.xml', 'xml/unpublished/hakai/rec.xml']}
        with patch('app.glob.glob', side_effect=lambda pattern, **k: found.get(pattern, [])):
            delete_record('rec', 'hakai')
        paths, kwargs = _mock_repo.index.remove.call_args
        assert paths[0] == ['hakai/rec.xml', 'unpublished/hakai/rec.xml']
        assert kwargs == {'working_tree': True}

    def test_no_matches_skips_git(self):
        with patch('app.glob.glob', return_value=[]):
            delete_record('rec', 'hakai')
        _mock_repo.index.remove.assert_not_called()

    def test_one_glob_per_extension(self):
        # recursive ** already matches zero directories, so a second non-recursive
        # glob would only duplicate every path it found
        with patch('app.glob.glob', return_value=[]) as mock_glob:
            delete_record('rec', 'hakai')
        assert [c.args[0] for c in mock_glob.call_args_list] == [
            'xml/**/hakai/rec.xml',
            'xml/**/hakai/rec.yaml',
            'xml/**/hakai/rec.cff',
            'xml/**/hakai/rec.erddap',
        ]


# ---------------------------------------------------------------------------
# Helper: git_push
# ---------------------------------------------------------------------------

class TestGitPush:
    def test_added_paths_are_relative_to_the_repo_root(self):
        git_push(['xml/hakai/rec.xml', 'xml/unpublished/hakai/rec.yaml'])
        _mock_repo.git.add.assert_called_once_with(
            ['hakai/rec.xml', 'unpublished/hakai/rec.yaml']
        )


# ---------------------------------------------------------------------------
# GET /recordDelete
# ---------------------------------------------------------------------------

class TestTokenFallback:
    def test_falls_back_to_legacy_env_var(self):
        # the rename can land before the deployment environment is updated
        import importlib
        with patch.dict(os.environ, {'RECORD_DELETE_TOKEN': 'legacy'}, clear=False):
            os.environ.pop('RECORD_API_TOKEN', None)
            reloaded = importlib.reload(importlib.import_module('app'))
            assert reloaded.RECORD_API_TOKEN == 'legacy'
        # restore for the remaining tests
        os.environ['RECORD_API_TOKEN'] = 'test-token'
        os.environ.pop('RECORD_DELETE_TOKEN', None)
        importlib.reload(importlib.import_module('app'))

    def test_new_name_wins_over_legacy(self):
        import importlib
        with patch.dict(
            os.environ,
            {'RECORD_API_TOKEN': 'new', 'RECORD_DELETE_TOKEN': 'legacy'},
            clear=False,
        ):
            reloaded = importlib.reload(importlib.import_module('app'))
            assert reloaded.RECORD_API_TOKEN == 'new'
        os.environ['RECORD_API_TOKEN'] = 'test-token'
        os.environ.pop('RECORD_DELETE_TOKEN', None)
        importlib.reload(importlib.import_module('app'))


class TestRecordDelete:
    def test_no_token_returns_401(self, client):
        resp = client.get('/recordDelete?filename=myfile')
        assert resp.status_code == 401
        assert 'Unauthorized' in resp.json['error']

    def test_wrong_token_returns_401(self, client):
        resp = client.get('/recordDelete?filename=myfile&token=wrong')
        assert resp.status_code == 401

    def test_valid_token_returns_200(self, client):
        with patch('app.git_pull') as mock_pull, \
             patch('app.delete_record'), \
             patch('app.git_push') as mock_push:
            resp = client.get('/recordDelete?filename=myfile&token=test-token')
            assert resp.status_code == 200
            assert resp.json['message'] == 'record deleted'
            mock_pull.assert_called_once()
            mock_push.assert_called_once_with()

    def test_filename_is_sanitized(self, client):
        with patch('app.git_pull'), \
             patch('app.delete_record') as mock_delete, \
             patch('app.git_push'):
            client.get('/recordDelete?filename=My+File%21&token=test-token')
            mock_delete.assert_called_once_with('my_file_', None)

    def test_region_forwarded_to_delete_record(self, client):
        with patch('app.git_pull'), \
             patch('app.delete_record') as mock_delete, \
             patch('app.git_push'):
            client.get('/recordDelete?filename=myfile&token=test-token&region=hakai')
            mock_delete.assert_called_once_with('myfile', 'hakai')

    def test_no_region_passes_none(self, client):
        with patch('app.git_pull'), \
             patch('app.delete_record') as mock_delete, \
             patch('app.git_push'):
            client.get('/recordDelete?filename=myfile&token=test-token')
            mock_delete.assert_called_once_with('myfile', None)


# ---------------------------------------------------------------------------
# GET /record
# ---------------------------------------------------------------------------

class TestRecordUpdate:
    def test_no_token_returns_401(self, client):
        resp = client.get('/record?path=hakai/user1/rec1')
        assert resp.status_code == 401
        assert resp.json['error'] == 'Unauthorized'

    def test_wrong_token_returns_401(self, client):
        resp = client.get('/record?path=hakai/user1/rec1&token=wrong')
        assert resp.status_code == 401

    def test_unauthorized_does_not_touch_firebase_or_git(self, client):
        with patch('app.get_records_from_firebase') as fb, \
             patch('app.delete_record') as delete, \
             patch('app.git_pull') as pull:
            client.get('/record?path=hakai/user1/rec1')
            fb.assert_not_called()
            delete.assert_not_called()
            pull.assert_not_called()

    @pytest.mark.parametrize('path', ['hakai', 'hakai/user1', 'hakai/user1/rec1/extra', 'hakai//rec1'])
    def test_malformed_path_returns_400(self, client, path):
        resp = client.get(f'/record?path={path}&token=test-token')
        assert resp.status_code == 400
        assert 'Invalid path' in resp.json['error']

    def test_basename_from_record_is_sanitized(self, client):
        # a glob metacharacter in the record's filename would otherwise match
        # every record in the region when delete_record globs for it
        record = {**SAMPLE_RECORD, 'status': 'draft', 'filename': '*'}
        with patch('app.get_records_from_firebase', return_value=[record]), \
             patch('app.git_pull'), \
             patch('app.delete_record') as delete:
            client.get('/record?path=hakai/user1/rec1&token=test-token')
            basename = delete.call_args[0][0]
            assert basename == '_'

    def test_missing_path_returns_500(self, client):
        resp = client.get('/record?token=test-token')
        assert resp.status_code == 500
        assert 'Missing path' in resp.json['error']

    def test_empty_record_returns_not_found(self, client):
        with patch('app.get_records_from_firebase', return_value=[{}]):
            resp = client.get('/record?path=hakai/user1/rec1&token=test-token')
            assert resp.json['message'] == 'not found'

    def test_record_without_title_returns_not_found(self, client):
        with patch('app.get_records_from_firebase', return_value=[{'status': 'published'}]):
            resp = client.get('/record?path=hakai/user1/rec1&token=test-token')
            assert resp.json['message'] == 'not found'

    def test_draft_status_skips_file_writing(self, client):
        record = {**SAMPLE_RECORD, 'status': 'draft'}
        with patch('app.get_records_from_firebase', return_value=[record]), \
             patch('app.git_pull'), \
             patch('app.delete_record'):
            resp = client.get('/record?path=hakai/user1/rec1&token=test-token')
            assert resp.status_code == 200
            assert resp.json['message'] == ''

    def test_draft_commits_the_deletion_of_its_old_files(self, client):
        # otherwise the removal sits staged until some unrelated request commits it
        record = {**SAMPLE_RECORD, 'status': 'draft'}
        with patch('app.get_records_from_firebase', return_value=[record]), \
             patch('app.git_pull'), \
             patch('app.delete_record', return_value=['xml/hakai/test_record.xml']), \
             patch('app.git_push') as mock_push:
            client.get('/record?path=hakai/user1/rec1&token=test-token')
            mock_push.assert_called_once_with()

    def test_draft_with_nothing_to_delete_does_not_commit(self, client):
        record = {**SAMPLE_RECORD, 'status': 'draft'}
        with patch('app.get_records_from_firebase', return_value=[record]), \
             patch('app.git_pull'), \
             patch('app.delete_record', return_value=[]), \
             patch('app.git_push') as mock_push:
            client.get('/record?path=hakai/user1/rec1&token=test-token')
            mock_push.assert_not_called()

    def test_published_record_returns_url(self, client):
        with patch('app.get_records_from_firebase', return_value=[SAMPLE_RECORD]), \
             patch('app.git_pull'), \
             patch('app.delete_record'), \
             patch('app.record_json_to_yaml', return_value={}), \
             patch('app.metadata_to_xml', return_value='<xml/>'), \
             patch('yaml.safe_dump', return_value='key: val'), \
             patch('app.citation_cff', return_value='cff: 1.0'), \
             patch('app.global_attributes', return_value='<erddap/>'), \
             patch('app.git_push'), \
             patch('pathlib.Path.mkdir'), \
             patch('builtins.open', mock_open()):
            resp = client.get('/record?path=hakai/user1/rec1&token=test-token')
            assert resp.status_code == 200
            assert 'test_record' in resp.json['message']

    def test_published_record_calls_git_push(self, client):
        with patch('app.get_records_from_firebase', return_value=[SAMPLE_RECORD]), \
             patch('app.git_pull'), \
             patch('app.delete_record'), \
             patch('app.record_json_to_yaml', return_value={}), \
             patch('app.metadata_to_xml', return_value='<xml/>'), \
             patch('yaml.safe_dump', return_value='key: val'), \
             patch('app.citation_cff', return_value='cff: 1.0'), \
             patch('app.global_attributes', return_value='<erddap/>'), \
             patch('app.git_push') as mock_push, \
             patch('pathlib.Path.mkdir'), \
             patch('builtins.open', mock_open()):
            client.get('/record?path=hakai/user1/rec1&token=test-token')
            mock_push.assert_called_once()
            pushed_files = mock_push.call_args[0][0]
            assert any(f.endswith('.xml') for f in pushed_files)
            assert any(f.endswith('.yaml') for f in pushed_files)
            assert any(f.endswith('.cff') for f in pushed_files)
            assert any(f.endswith('.erddap') for f in pushed_files)

    def test_submitted_record_writes_to_unpublished(self, client):
        record = {**SAMPLE_RECORD, 'status': 'submitted'}
        with patch('app.get_records_from_firebase', return_value=[record]), \
             patch('app.git_pull'), \
             patch('app.delete_record'), \
             patch('app.record_json_to_yaml', return_value={}), \
             patch('app.metadata_to_xml', return_value='<xml/>'), \
             patch('yaml.safe_dump', return_value='key: val'), \
             patch('app.citation_cff', return_value='cff: 1.0'), \
             patch('app.global_attributes', return_value='<erddap/>'), \
             patch('app.git_push') as mock_push, \
             patch('pathlib.Path.mkdir'), \
             patch('builtins.open', mock_open()):
            client.get('/record?path=hakai/user1/rec1&token=test-token')
            pushed_files = mock_push.call_args[0][0]
            assert all('unpublished' in f for f in pushed_files)

    def test_delete_record_called_with_region(self, client):
        with patch('app.get_records_from_firebase', return_value=[SAMPLE_RECORD]), \
             patch('app.git_pull'), \
             patch('app.delete_record') as mock_delete, \
             patch('app.record_json_to_yaml', return_value={}), \
             patch('app.metadata_to_xml', return_value='<xml/>'), \
             patch('yaml.safe_dump', return_value='key: val'), \
             patch('app.citation_cff', return_value='cff: 1.0'), \
             patch('app.global_attributes', return_value='<erddap/>'), \
             patch('app.git_push'), \
             patch('pathlib.Path.mkdir'), \
             patch('builtins.open', mock_open()):
            client.get('/record?path=hakai/user1/rec1&token=test-token')
            mock_delete.assert_called_once_with('test_record', 'hakai')

    def test_conversion_error_returns_500(self, client):
        with patch('app.get_records_from_firebase', return_value=[SAMPLE_RECORD]), \
             patch('app.git_pull'), \
             patch('app.delete_record'), \
             patch('app.record_json_to_yaml', side_effect=Exception('conversion failed')):
            resp = client.get('/record?path=hakai/user1/rec1&token=test-token')
            assert resp.status_code == 500
            assert 'Error creating xml' in resp.json['error']


# ---------------------------------------------------------------------------
# POST /recordToXML
# ---------------------------------------------------------------------------

class TestRecordToXML:
    def test_returns_xml_string(self, client):
        with patch('app.record_json_to_yaml', return_value={}), \
             patch('app.metadata_to_xml', return_value='<xml/>'):
            resp = client.post('/recordToXML', json=SAMPLE_RECORD)
            assert resp.status_code == 200
            assert resp.json['message']['xml'] == '<xml/>'

    def test_conversion_error_returns_500(self, client):
        with patch('app.record_json_to_yaml', return_value={}), \
             patch('app.metadata_to_xml', side_effect=Exception('bad input')):
            resp = client.post('/recordToXML', json=SAMPLE_RECORD)
            assert resp.status_code == 500
            assert 'Error creating xml' in resp.json['error']


# ---------------------------------------------------------------------------
# POST /recordToYAML
# ---------------------------------------------------------------------------

class TestRecordToYAML:
    def test_returns_yaml_string(self, client):
        with patch('app.record_json_to_yaml', return_value={'key': 'value'}):
            resp = client.post('/recordToYAML', json=SAMPLE_RECORD)
            assert resp.status_code == 200
            assert 'record' in resp.json['message']
            assert 'key' in resp.json['message']['record']


# ---------------------------------------------------------------------------
# POST /recordToCFF
# ---------------------------------------------------------------------------

class TestRecordToCFF:
    def test_returns_cff_string(self, client):
        with patch('app.record_json_to_yaml', return_value={}), \
             patch('app.citation_cff', return_value='cff-version: 1.2.0\n'):
            resp = client.post('/recordToCFF', json=SAMPLE_RECORD)
            assert resp.status_code == 200
            assert resp.json['message']['record'] == 'cff-version: 1.2.0\n'

    def test_conversion_error_returns_500(self, client):
        with patch('app.record_json_to_yaml', return_value={}), \
             patch('app.citation_cff', side_effect=Exception('bad input')):
            resp = client.post('/recordToCFF', json=SAMPLE_RECORD)
            assert resp.status_code == 500
            assert 'Error creating cff' in resp.json['error']


# ---------------------------------------------------------------------------
# POST /recordToERDDAP
# ---------------------------------------------------------------------------

class TestRecordToERDDAP:
    def test_returns_erddap_xml(self, client):
        with patch('app.record_json_to_yaml', return_value={}), \
             patch('app.global_attributes', return_value='<erddap/>'):
            resp = client.post('/recordToERDDAP', json=SAMPLE_RECORD)
            assert resp.status_code == 200
            assert resp.json['message']['xml'] == '<erddap/>'

    def test_conversion_error_returns_500(self, client):
        with patch('app.record_json_to_yaml', return_value={}), \
             patch('app.global_attributes', side_effect=Exception('bad input')):
            resp = client.post('/recordToERDDAP', json=SAMPLE_RECORD)
            assert resp.status_code == 500
            assert 'Error creating erddap snippet' in resp.json['error']


# ---------------------------------------------------------------------------
# 404 handler
# ---------------------------------------------------------------------------

class TestErrorHandlers:
    def test_unknown_route_returns_404_json(self, client):
        resp = client.get('/nonexistent')
        assert resp.status_code == 404
        assert resp.json['error'] == 'Not found!'


# ---------------------------------------------------------------------------
# _run_with_lock_retry
# ---------------------------------------------------------------------------

LOCK_ERROR = IOError(
    "Lock for file '/usr/src/app/xml/.git/logs/HEAD' did already exist, "
    "delete '/usr/src/app/xml/.git/logs/HEAD.lock' in case the lock is illegal"
)


class TestRunWithLockRetry:
    def test_succeeds_first_try_without_sleeping(self):
        with patch('app.time.sleep') as mock_sleep:
            result = _run_with_lock_retry(lambda: 'ok', 'op')
            assert result == 'ok'
            mock_sleep.assert_not_called()

    def test_retries_on_lock_error_then_succeeds(self):
        calls = {'n': 0}

        def flaky():
            calls['n'] += 1
            if calls['n'] < 3:
                raise LOCK_ERROR
            return 'ok'

        with patch('app.time.sleep') as mock_sleep:
            result = _run_with_lock_retry(flaky, 'op')
            assert result == 'ok'
            assert calls['n'] == 3
            assert mock_sleep.call_count == 2

    def test_non_lock_error_raises_immediately(self):
        calls = {'n': 0}

        def always_fails():
            calls['n'] += 1
            raise ValueError('some other error')

        with patch('app.time.sleep') as mock_sleep:
            with pytest.raises(ValueError):
                _run_with_lock_retry(always_fails, 'op')
            assert calls['n'] == 1
            mock_sleep.assert_not_called()

    def test_gives_up_after_max_retries(self):
        calls = {'n': 0}

        def always_locked():
            calls['n'] += 1
            raise LOCK_ERROR

        with patch('app.time.sleep'):
            with pytest.raises(IOError):
                _run_with_lock_retry(always_locked, 'op')
            assert calls['n'] == 10
