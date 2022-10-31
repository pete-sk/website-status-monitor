"""Runs a simple Flask server in cycles, where the server is up for a specified percentage of the cycle,
and down for the rest of the time."""

from flask import Flask
import sys
import time
import multiprocessing

app = Flask(__name__)


@app.get('/')
def index():
    return '', 200


def run_server(port):
    app.run(port=port)


if __name__ == '__main__':
    PORT = int(sys.argv[1])
    UPTIME_PERCENTAGE = float(sys.argv[2])

    # length in seconds of the full server run cycle (uptime + downtime)
    # e.g. If CYCLE_LENGTH is 60 and UPTIME_PERCENTAGE is .75, then the server is running for 45 second
    # and being stopped for 15 seconds.
    CYCLE_LENGTH = int(sys.argv[3])

    if len(sys.argv) != 4:
        raise Exception('Incorrect number of arguments - should be 3 (PORT, UPTIME_PERCENTAGE, CYCLE_LENGTH).')

    uptime = CYCLE_LENGTH * UPTIME_PERCENTAGE
    downtime = CYCLE_LENGTH - uptime

    while True:
        p = multiprocessing.Process(target=run_server, name='Run Test Server', args=(PORT,))
        p.start()
        print('test server running')
        time.sleep(uptime)

        if p.is_alive():
            p.terminate()
            # cleanup
            p.join()

        print('test server stopped')
        time.sleep(downtime)
