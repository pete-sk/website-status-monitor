import unittest
from app import app


class TestApp(unittest.TestCase):
    def setUp(self) -> None:
        app.config['TESTING'] = True
        app.config['DEBUG'] = False
        self.app = app.test_client()

    def tearDown(self) -> None:
        pass

    def test_index(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)

    def test_check_status(self):
        response_no_url = self.app.get('/status')
        self.assertEqual(response_no_url.status_code, 400)

        response_invalid_url = self.app.get('/status?url=example.com')
        self.assertEqual(response_invalid_url.status_code, 422)

        response_website_down = self.app.get('/status?url=https://www.at8jxzx6msweu4v598jat8jxzx6msweu4v598jat8jxzx6msweu4v598j.com')
        self.assertEqual(response_website_down.status_code, 200)
        self.assertFalse(response_website_down.json['websiteUp'])


if __name__ == '__main__':
    unittest.main()
