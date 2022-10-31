let sites = {}
let schedules = {}


class Site {
    static counter = 0

    /**
      *
      * @param {string} url URL address of the website.
      * @param {number} requestPeriod Period of time (in milliseconds) between requests.
      * @param {number} uptimeInterval Period of time (in milliseconds) over which uptime will be calculated.
      */
    constructor(url, requestPeriod, uptimeInterval) {
        this.id = Site.counter
        this.timeAdded = Date.now()

        this.url = url
        this.requestPeriod = requestPeriod
        this.uptimeInterval = uptimeInterval

        this.responses = []

        Site.counter += 1
        window.localStorage.setItem('siteCounter', Site.counter)
    }

    /**
      *
      * @param {Object} response Object containing info obtained with a website status check.
      * @param {boolean} response.websiteUp Connection status.
      * @param {number} response.latency Response latency (in milliseconds).
      * @param {number} response.time Unix timestamp (in milliseconds) current at the beginning of the connection.
      */
    saveResponse(response) {
        console.log(response)
        this.responses.push(response)
    }

    getResponsesWithinInterval() {
        const now = Date.now()
        const timeIntervalAgo = now - this.uptimeInterval
        const responsesWithinInterval = this.responses.filter((response) => response['time'] >= timeIntervalAgo)
        return responsesWithinInterval
    }

    calculateUptime() {
        const responsesWithinInterval = this.getResponsesWithinInterval()
        const upCount = responsesWithinInterval.filter((response) => response['websiteUp'] === true).length
        const percentage = Math.round((upCount/responsesWithinInterval.length)*100)
        return percentage
    }

    calculateMeteringTime() {
        const now = Date.now()
        const meteringTime = now - this.timeAdded
        return meteringTime
    }
}


/** show new website in the dashboard */
function displaySite(siteId) {
    const siteUrl = sites[siteId].url

    const uptimeInterval = sites[siteId].uptimeInterval
    const uptimeIntervalMinutes = uptimeInterval / 60000


	const monitoredSite = document.createElement('div')
    monitoredSite.setAttribute('class', 'monitoredSite')
    monitoredSite.setAttribute('id', `monitoredSite-${siteId}`)

    const deleteSiteButton = document.createElement('button')
    deleteSiteButton.setAttribute('class', 'deleteSiteButton')
    deleteSiteButton.setAttribute('id', `deleteSiteButton-${siteId}`)
    deleteSiteButton.innerHTML += 'Delete'
    monitoredSite.appendChild(deleteSiteButton)


    const plotContainer = document.createElement('div')
    plotContainer.setAttribute('class', 'plotContainer')
    plotContainer.setAttribute('id', `plotContainer-${siteId}`)

    const canvas = document.createElement('canvas')
    canvas.setAttribute('id', `plot-${siteId}`)
    plotContainer.appendChild(canvas)

    monitoredSite.appendChild(plotContainer)


    const siteStats = document.createElement('div')
    siteStats.setAttribute('class', 'siteStats')

    const siteUrlHref = document.createElement('a')
    siteUrlHref.setAttribute('id', `siteUrl-${siteId}`)
    siteUrlHref.setAttribute('href', siteUrl)
    siteUrlHref.innerHTML += siteUrl

    siteStats.appendChild(siteUrlHref)


    const uptimeText = document.createElement('p')
    uptimeText.insertAdjacentHTML('afterbegin', 'Uptime: ')

    const uptimePercentageSpan = document.createElement('span')
    uptimePercentageSpan.setAttribute('id', `uptimePercentage-${siteId}`)
    uptimePercentageSpan.innerHTML += '0'
    uptimeText.appendChild(uptimePercentageSpan)

    uptimeText.insertAdjacentHTML('beforeend', '% over ')

    const uptimeIntervalSpan = document.createElement('span')
    uptimeIntervalSpan.setAttribute('id', `uptimeInterval-${siteId}`)
    uptimeIntervalSpan.innerHTML += uptimeIntervalMinutes
    uptimeText.appendChild(uptimeIntervalSpan)

    uptimeText.insertAdjacentHTML('beforeend', ' minutes')

    siteStats.appendChild(uptimeText)


    const meteringText = document.createElement('p')
    meteringText.insertAdjacentHTML('afterbegin', 'Metering for ')

    const meteringTime = document.createElement('span')
    meteringTime.setAttribute('id', `meteringTime-${siteId}`)
    meteringTime.innerHTML += '0 seconds'
    meteringText.appendChild(meteringTime)

    siteStats.appendChild(meteringText)


    monitoredSite.appendChild(siteStats)

    document.querySelector('#monitoredSitesList').appendChild(monitoredSite)

    createPlot(siteId)

	// remove site when delete button clicked
    document.querySelector(`#deleteSiteButton-${siteId}`).addEventListener('click', event => {
        removeSite(siteId)
    })
}


function removeSite(siteId) {
    stopMetering(siteId)
    delete sites[siteId]
    persistSitesInLocalStorage()
    delete plots[siteId]
    document.querySelector(`#monitoredSite-${siteId}`).remove()
    console.log(`deleted site ${siteId}`)
}


function startMetering(siteId) {
    const requestPeriod = sites[siteId].requestPeriod
    const schedule = setInterval(checkStatus, requestPeriod, siteId)
    schedules[siteId] = {'schedule': schedule}
    checkStatus(siteId)
}


function stopMetering(siteId) {
    if (schedules[siteId]) {
        const schedule = schedules[siteId]['schedule']
        clearInterval(schedule)
        delete schedules[siteId]
    }
}


/** check website status via an endpoint and update results */
function checkStatus(siteId) {
    const siteUrl = sites[siteId].url
    const encodedSiteUrl = encodeURIComponent(siteUrl)

    const checkStatusUrl = `/status?url=${encodedSiteUrl}`

    const xhr = new XMLHttpRequest()
    xhr.open('GET', checkStatusUrl, true)
    xhr.send()

    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const response = JSON.parse(xhr.responseText)

            sites[siteId].saveResponse(response)
            persistSitesInLocalStorage()
            showUpdatedInfo(siteId)
        }
    }
}


/** update info in the dashboard */
function showUpdatedInfo(siteId) {
    const uptimePercentage = sites[siteId].calculateUptime()
    document.querySelector(`#uptimePercentage-${siteId}`).textContent = uptimePercentage

    const meteringTime = sites[siteId].calculateMeteringTime()
    const meteringTimeMinutes = meteringTime / 60000

    let meteringTimeFormatted;

    if (meteringTimeMinutes < 1) {
        meteringTimeFormatted = `${Math.floor(meteringTimeMinutes * 60)} seconds`
    } else {
        meteringTimeFormatted = `${Math.floor(meteringTimeMinutes)} minutes`
    }

    document.querySelector(`#meteringTime-${siteId}`).textContent = meteringTimeFormatted

    updatePlot(siteId)
}


function persistSitesInLocalStorage() {
    window.localStorage.setItem('sites', JSON.stringify(sites))
}


function loadSitesFromLocalStorage() {
    let parsedSites = JSON.parse(window.localStorage.getItem('sites'))

    Object.keys(parsedSites).forEach(siteId => {
        const parsedSite = parsedSites[siteId]

        const id = parsedSite.id
        const timeAdded = parsedSite.timeAdded
        const requestPeriod = parsedSite.requestPeriod
        const uptimeInterval = parsedSite.uptimeInterval
        const url = parsedSite.url
        const responses = parsedSite.responses

        const site = new Site(url, requestPeriod, uptimeInterval)
        site.id = id
        site.timeAdded = timeAdded
        site.responses = responses

        sites[site.id] = site
        displaySite(site.id)
        startMetering(siteId)
    })
}


// load data from local storage on page load
window.addEventListener('load', (event) => {
    Site.counter = Number(window.localStorage.getItem('siteCounter'))
    loadSitesFromLocalStorage()
})


// add site
document.querySelector('#addSiteButton').addEventListener('click', event => {
    let valid = true

    // validate requestPeriod
    if (requestPeriodInput.value < 1 || requestPeriodInput.value > 300) {
        valid = false
        alert('Please enter a valid Request Period')
    }

    // validate uptimeInterval
    if (uptimeIntervalInput.value < 1) {
        valid = false
        alert('Please enter a valid Uptime Interval')
    }

    // validate URL
    let completeUrl;
    try {
        let siteUrl = new URL(document.querySelector('#newSiteUrlInput').value)
        const port = document.querySelector('#portInput').value
        siteUrl.port = port
        completeUrl = siteUrl.toString()
    } catch (error) {
        valid = false
        alert('Please enter a valid URL')
        console.error(error)
    }

    if (valid) {
        const requestPeriod = document.querySelector('#requestPeriodInput').value
        const uptimeInterval = document.querySelector('#uptimeIntervalInput').value

        const requestPeriodMilliseconds = requestPeriod * 1000
        const uptimeIntervalMilliseconds = uptimeInterval * 60000

        const site = new Site(completeUrl, requestPeriodMilliseconds, uptimeIntervalMilliseconds)
        sites[site.id] = site
        persistSitesInLocalStorage()
        displaySite(site.id)

        if (document.querySelector('#switchMeteringButton').value === 'on') {
            startMetering(site.id)
        }

        document.querySelector('#requestPeriodInput').value = 5
        document.querySelector('#uptimeIntervalInput').value = 2
        document.querySelector('#newSiteUrlInput').value = ''
        document.querySelector('#portInput').value = ''
    }
})


// switch metering
const switchMeteringButton = document.querySelector('#switchMeteringButton')
switchMeteringButton.addEventListener('click', event => {
    if (switchMeteringButton.value === 'off') {

        Object.keys(sites).forEach(siteId => {
            startMetering(siteId)
        })

        switchMeteringButton.value = 'on'
        switchMeteringButton.innerHTML = 'Stop All Metering'

    } else if (switchMeteringButton.value === 'on') {

        Object.keys(sites).forEach(siteId => {
            stopMetering(siteId)
        })

        switchMeteringButton.value = 'off'
        switchMeteringButton.innerHTML = 'Start Metering'
    }
})
