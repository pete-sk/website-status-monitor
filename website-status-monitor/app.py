from flask import Flask, render_template, request, jsonify
import requests
import time

app = Flask(__name__)


@app.get('/')
def index():
    return render_template('index.html')


@app.get('/status')
def check_status():
    """Tries connecting to the specified URL and returns the website status, latency (if applicable),
     and a UNIX timestamp current at the beginning of the connection."""
    args = request.args
    site_url = args.get('url')

    if not site_url:
        return jsonify({'error': 'No URL specified'}), 400

    website_up = False
    latency = None

    # current unix timestamp in milliseconds
    now = int(time.time() * 1000)

    try:
        response = requests.get(url=site_url, timeout=3)
        first_digit_of_status_code = str(response.status_code)[0]
        if first_digit_of_status_code == '2':
            website_up = True
            latency = response.elapsed.total_seconds()
            # convert to milliseconds
            latency = int(latency * 1000)

    except (requests.exceptions.MissingSchema,
            requests.exceptions.InvalidSchema,
            requests.exceptions.InvalidURL):
        return jsonify({'error': 'Invalid URL'}), 422

    except (requests.exceptions.ConnectTimeout,
            requests.exceptions.ConnectionError):
        # connection timed out or failed
        pass

    return jsonify({'time': now, 'websiteUp': website_up, 'latency': latency})


if __name__ == '__main__':
    app.run(debug=True)
