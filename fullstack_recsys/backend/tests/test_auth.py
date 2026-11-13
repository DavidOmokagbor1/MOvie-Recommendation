"""Unit tests for Flask auth / validation routes (mocked DB, no live MongoDB)."""


class TestRegisterValidation:
    def test_empty_payload_returns_400(self, app_client):
        # Empty dict is falsy; route treats it as missing data
        resp = app_client.post('/api/auth/register', json={})
        assert resp.status_code == 400
        assert resp.get_json()['error'] == 'MISSING_DATA'

    def test_missing_username_returns_400(self, app_client):
        resp = app_client.post('/api/auth/register', json={
            'email': 'a@example.com',
            'password': 'secret123',
        })
        assert resp.status_code == 400
        assert resp.get_json()['error'] == 'MISSING_USERNAME'

    def test_missing_password_returns_400(self, app_client):
        resp = app_client.post('/api/auth/register', json={
            'username': 'alice',
            'email': 'a@example.com',
        })
        assert resp.status_code == 400
        assert resp.get_json()['error'] == 'MISSING_PASSWORD'

    def test_missing_email_returns_400(self, app_client):
        resp = app_client.post('/api/auth/register', json={
            'username': 'alice',
            'password': 'secret123',
        })
        assert resp.status_code == 400
        assert resp.get_json()['error'] == 'MISSING_EMAIL'

    def test_successful_register_returns_token(self, app_client):
        resp = app_client.post('/api/auth/register', json={
            'username': 'alice',
            'email': 'alice@example.com',
            'password': 'secret123',
            'age': 25,
            'gender': 'F',
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert 'token' in data
        assert data['user']['username'] == 'alice'
        assert data['user']['email'] == 'alice@example.com'

    def test_duplicate_user_returns_400(self, app_client):
        payload = {
            'username': 'bob',
            'email': 'bob@example.com',
            'password': 'secret123',
        }
        first = app_client.post('/api/auth/register', json=payload)
        assert first.status_code == 201
        second = app_client.post('/api/auth/register', json=payload)
        assert second.status_code == 400
        assert second.get_json()['error'] == 'USER_EXISTS'


class TestLoginValidation:
    def _register(self, client, username='carol', email='carol@example.com', password='secret123'):
        return client.post('/api/auth/register', json={
            'username': username,
            'email': email,
            'password': password,
        })

    def test_missing_username_returns_400(self, app_client):
        resp = app_client.post('/api/auth/login', json={'password': 'x'})
        assert resp.status_code == 400
        assert resp.get_json()['error'] == 'MISSING_USERNAME'

    def test_missing_password_returns_400(self, app_client):
        resp = app_client.post('/api/auth/login', json={'username': 'carol'})
        assert resp.status_code == 400
        assert resp.get_json()['error'] == 'MISSING_PASSWORD'

    def test_invalid_credentials_returns_401(self, app_client):
        self._register(app_client)
        resp = app_client.post('/api/auth/login', json={
            'username': 'carol',
            'password': 'wrong-password',
        })
        assert resp.status_code == 401
        assert resp.get_json()['error'] == 'INVALID_CREDENTIALS'

    def test_successful_login_returns_token(self, app_client):
        self._register(app_client)
        resp = app_client.post('/api/auth/login', json={
            'username': 'carol',
            'password': 'secret123',
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'token' in data
        assert data['user']['username'] == 'carol'

    def test_get_current_user_requires_token(self, app_client):
        resp = app_client.get('/api/auth/user')
        assert resp.status_code == 401
        assert resp.get_json()['error'] == 'MISSING_TOKEN'

    def test_get_current_user_with_valid_token(self, app_client):
        reg = self._register(app_client, username='dave', email='dave@example.com')
        token = reg.get_json()['token']
        resp = app_client.get(
            '/api/auth/user',
            headers={'Authorization': f'Bearer {token}'},
        )
        assert resp.status_code == 200
        assert resp.get_json()['user']['username'] == 'dave'
