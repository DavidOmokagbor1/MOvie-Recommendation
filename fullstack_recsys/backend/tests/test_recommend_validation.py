"""Unit tests for /recommend validation and happy path (mocked ML API + DB)."""
from unittest.mock import MagicMock, patch


class TestRecommendValidation:
    def test_empty_payload_returns_400(self, app_client):
        # Empty dict is falsy; route treats it as missing data
        resp = app_client.post('/recommend', json={})
        assert resp.status_code == 400
        assert resp.get_json()['error'] == 'MISSING_DATA'

    def test_missing_context_returns_400(self, app_client):
        resp = app_client.post('/recommend', json={'model': 'EASE'})
        assert resp.status_code == 400
        assert resp.get_json()['error'] == 'MISSING_CONTEXT'

    def test_empty_context_returns_400(self, app_client):
        resp = app_client.post('/recommend', json={'model': 'EASE', 'context': []})
        assert resp.status_code == 400
        assert resp.get_json()['error'] in ('MISSING_CONTEXT', 'INVALID_CONTEXT')

    def test_non_numeric_context_returns_400(self, app_client):
        resp = app_client.post('/recommend', json={
            'model': 'EASE',
            'context': ['abc', 'def'],
        })
        assert resp.status_code == 400
        assert resp.get_json()['error'] == 'INVALID_CONTEXT_FORMAT'

    def test_missing_model_returns_400(self, app_client):
        resp = app_client.post('/recommend', json={'context': [1, 2]})
        assert resp.status_code == 400
        assert resp.get_json()['error'] == 'MISSING_MODEL'

    def test_invalid_model_returns_400(self, app_client):
        resp = app_client.post('/recommend', json={
            'model': 'NotAModel',
            'context': [1, 2],
        })
        assert resp.status_code == 400
        data = resp.get_json()
        assert data['error'] == 'INVALID_MODEL'
        assert 'EASE' in data['available_models']

    def test_successful_recommend_with_mocked_ml_api(self, app_client):
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {'result': [10, 20]}

        movies = [
            {'id': 10, 'title': 'Movie A', 'genre': 'Action', 'date': None, 'poster': None},
            {'id': 20, 'title': 'Movie B', 'genre': 'Drama', 'date': None, 'poster': None},
        ]

        with patch('run.requests.post', return_value=mock_response) as mock_post, \
             patch('run.get_movies_by_ids', return_value=movies):
            resp = app_client.post('/recommend', json={
                'model': 'EASE',
                'context': [1, 2, 3],
            })

        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data['result']) == 2
        assert data['result'][0]['title'] == 'Movie A'
        mock_post.assert_called_once()
