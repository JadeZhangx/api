function fetchEvents() {
    const genre = document.getElementById('genre').value;
    const date = document.getElementById('date').value;
    const city = document.getElementById('city').value;

    let apiUrl = `http://localhost:3000/api/events?`; // Adjust the port if necessary

    if (genre) apiUrl += `genre=${encodeURIComponent(genre)}&`;
    if (date) apiUrl += `date=${encodeURIComponent(date)}&`;
    if (city) apiUrl += `city=${encodeURIComponent(city)}`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            displayResults(data.events);
        })
        .catch(error => {
            console.error('Fetch error:', error);
            document.getElementById('results').innerHTML = '<p>Error fetching data.</p>';
        });
}


function displayResults(events) {
    const results = document.getElementById('results');
    results.innerHTML = '';
    if (events && events.length) {
        events.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.innerHTML = `
                <h3>${event.name}</h3>
                <p>Venue: ${event.venue.name}, ${event.venue.address}</p>
                <p>Date: ${event.date} at ${event.time}</p>
                <p>Popularity: ${event.popularity}</p>
                <p>Description: ${event.description}</p>
                <p>Tickets: ${event.availability} at $${event.ticket_price}</p>
            `;
            results.appendChild(eventDiv);
        });
    } else {
        results.innerHTML = '<p>No events found.</p>';
    }
}
