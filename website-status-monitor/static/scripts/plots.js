let plots = {}


function createPlot(siteId) {
    const responses = sites[siteId].getResponsesWithinInterval()
    const latencies = responses.map(function (response) {return response['latency']})
    const times = responses.map(function (response) {return response['time']})

    const data = {
        labels: times,
        datasets: [{
            label: 'Latency (ms)',
            backgroundColor: 'rgb(55, 83, 139)',
            borderColor: 'rgb(55, 83, 139)',
            data: latencies,
        }]
    }

    const config = {
        type: 'line',
        data: data,
        options: {
            scales: {
                x: {
                    type: 'time',
                },
            },
            title: {
                display: false,
            },
            responsive: true,
        },
    }

    const plot = new Chart(document.querySelector(`#plot-${siteId}`), config)
    plots[siteId] = plot
}


function updatePlot(siteId) {
    const responses = sites[siteId].getResponsesWithinInterval()
    const latencies = responses.map(function (response) {return response['latency']})
    const times = responses.map(function (response) {return response['time']})

    const plot = plots[siteId]
    plot.config.data.datasets[0].data = latencies
    plot.config.data.labels = times
    plot.update()
}
