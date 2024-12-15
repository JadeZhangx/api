// API Configuration
const apiKey = '0CVsc25tkoGkd6QOOe0w9qFnUnYWIciF';
const searchForm = document.getElementById('searchForm');
const eventsContainer = document.getElementById('eventsContainer');
const errorContainer = document.getElementById('errorContainer');
const loadingContainer = document.getElementById('loadingContainer');

// Store current events globally
let currentEvents = [];

// Event handler for form submission
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const location = document.getElementById('location').value;
    const genre = document.getElementById('genre').value;
    const eventDate = document.getElementById('eventDate').value;

    // Clear previous results and errors
    eventsContainer.innerHTML = '';
    errorContainer.innerHTML = '';
    loadingContainer.innerHTML = `
        <div class="loading">
            <div class="loading-text">
                <span>Discovering amazing events</span>
                <span class="dots">...</span>
            </div>
        </div>`;

    try {
        const events = await fetchEvents(location, genre, eventDate);
        displayEvents(events);
    } catch (error) {
        handleError(error);
    }
});

// Fetch events from Ticketmaster API
async function fetchEvents(location, genre, eventDate) {
    try {
        let apiUrl = `https://app.ticketmaster.com/discovery/v2/events.json?`;
        
        const params = new URLSearchParams({
            apikey: apiKey,
            classificationName: 'music',
            size: 100,
            sort: 'date,asc'
        });

        if (location) {
            params.append('keyword', location);
            params.append('city', location);
        }

        // Enhanced genre handling
        if (genre) {
            params.append('genreId', genre);
            // For EDM/Techno, also include related subgenres
            if (genre === 'KnvZfZ7vAvF') {
                params.append('subGenreId', 'KnvZfZ7vAv1'); // Electronic
                params.append('includeFamily', 'true');
            }
        }

        if (eventDate) {
            const startDate = new Date(eventDate);
            const endDate = new Date(eventDate);
            endDate.setDate(endDate.getDate() + 1);

            params.append('startDateTime', startDate.toISOString().slice(0, 19) + 'Z');
            params.append('endDateTime', endDate.toISOString().slice(0, 19) + 'Z');
        }

        apiUrl += params.toString();
        console.log('Requesting:', apiUrl);

        const response = await axios.get(apiUrl);
        console.log('API Response:', response.data);

        let events = [];
        if (response.data._embedded && response.data._embedded.events) {
            events = response.data._embedded.events;
            
            // Additional filtering for EDM/Techno events
            if (genre === 'KnvZfZ7vAvF') {
                events = events.filter(event => {
                    const genres = getGenreNames(event);
                    return genres.some(g => 
                        g.includes('electronic') || 
                        g.includes('edm') || 
                        g.includes('techno') || 
                        g.includes('house') || 
                        g.includes('dance') ||
                        g.includes('trance')
                    );
                });
            }
        }

        currentEvents = events;
        return events;

    } catch (error) {
        console.error('API Error:', error.response ? error.response.data : error);
        throw error;
    }
}

// Helper function to get genre names from event
function getGenreNames(event) {
    const genres = [];
    
    if (event.classifications) {
        event.classifications.forEach(classification => {
            if (classification.genre) {
                genres.push(classification.genre.name.toLowerCase());
            }
            if (classification.subGenre) {
                genres.push(classification.subGenre.name.toLowerCase());
            }
            if (classification.segment) {
                genres.push(classification.segment.name.toLowerCase());
            }
        });
    }
    
    return genres;
}

// Display events in the container
function displayEvents(events) {
    loadingContainer.innerHTML = '';
    eventsContainer.innerHTML = '';

    if (events.length === 0) {
        errorContainer.innerHTML = `
            <div class="error">
                No events found matching your criteria.<br>
                Try adjusting your filters or search terms.
            </div>`;
        document.getElementById('filterContainer').style.display = 'none';
        return;
    }

    // Show filters and update count
    document.getElementById('filterContainer').style.display = 'block';
    document.querySelector('.filter-count').textContent = `${events.length} events found`;

    events.forEach(event => {
        const eventCard = createEventCard(event);
        eventsContainer.appendChild(eventCard);
    });
}

// Create event card element
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';

    const image = event.images.find(img => img.ratio === '16_9' && img.width > 500) || event.images[0];
    
    let priceRange = 'Price information not available';
    if (event.priceRanges && event.priceRanges[0]) {
        const min = event.priceRanges[0].min;
        const max = event.priceRanges[0].max;
        if (min === max) {
            priceRange = `$${min.toFixed(2)}`;
        } else {
            priceRange = `$${min.toFixed(2)} - $${max.toFixed(2)}`;
        }
    }

    const eventDate = new Date(event.dates.start.dateTime || event.dates.start.localDate);
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

    const genres = getGenreNames(event);
    const genreText = genres.length > 0 ? 
        `<br><strong>Genre:</strong> ${genres.slice(0, 2).join(', ')}` : '';

    card.innerHTML = `
        <img src="${image.url}" alt="${event.name}" class="event-image">
        <div class="event-details">
            <h3 class="event-title">${event.name}</h3>
            <p class="event-info">
                <strong>Venue:</strong> ${event._embedded?.venues?.[0]?.name || 'Venue TBA'}<br>
                <strong>Date:</strong> ${eventDate.toLocaleDateString(undefined, dateOptions)}<br>
                <strong>Time:</strong> ${event.dates.start.dateTime ? 
                    eventDate.toLocaleTimeString(undefined, timeOptions) : 'Time TBA'}
                ${genreText}
            </p>
            <p class="event-price">${priceRange}</p>
            <a href="${event.url}" target="_blank" class="buy-ticket">Buy Tickets</a>
        </div>
    `;

    return card;
}

// Handle API errors
function handleError(error) {
    loadingContainer.innerHTML = '';
    let errorMessage = 'Error fetching events. ';

    if (error.response) {
        if (error.response.status === 401) {
            errorMessage += 'API authentication error. Please check the API key.';
        } else if (error.response.status === 429) {
            errorMessage += 'Too many requests. Please try again later.';
        } else if (error.response.data && error.response.data.fault) {
            errorMessage += error.response.data.fault.faultstring;
        } else {
            errorMessage += 'Please try different search criteria.';
        }
    } else if (error.request) {
        errorMessage += 'Network error. Please check your internet connection.';
    } else {
        errorMessage += 'Please try again later.';
    }

    errorContainer.innerHTML = `<div class="error">${errorMessage}</div>`;
    console.error('Detailed error:', error);
}

// Initialize date input
function initializeDateInput() {
    const dateInput = document.getElementById('eventDate');
    
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 12);
    
    const todayFormatted = today.toISOString().split('T')[0];
    const maxDateFormatted = maxDate.toISOString().split('T')[0];
    
    dateInput.min = todayFormatted;
    dateInput.max = maxDateFormatted;
}

// Initialize filters
function initializeFilters() {
    const filterContainer = document.getElementById('filterContainer');
    const applyFilters = document.getElementById('applyFilters');
    const resetFilters = document.getElementById('resetFilters');
    const sortFilter = document.getElementById('sortFilter');

    filterContainer.style.display = 'none';

    applyFilters.addEventListener('click', applyAllFilters);
    resetFilters.addEventListener('click', resetAllFilters);
    sortFilter.addEventListener('change', applyAllFilters);
}

// Apply all filters to the current events
function applyAllFilters() {
    let filteredEvents = [...currentEvents];

    const sortBy = document.getElementById('sortFilter').value;
    const availableOnly = document.getElementById('availableOnly').checked;
    const onSaleOnly = document.getElementById('onSale').checked;
    const minPrice = parseFloat(document.getElementById('minPrice').value);
    const maxPrice = parseFloat(document.getElementById('maxPrice').value);
    const rating4Plus = document.querySelector('input[value="4plus"]').checked;
    const rating3Plus = document.querySelector('input[value="3plus"]').checked;

    // Apply ticket availability filter
    if (availableOnly) {
        filteredEvents = filteredEvents.filter(event => 
            event.dates.status.code !== 'cancelled' && 
            event.dates.status.code !== 'offsale'
        );
    }

    if (onSaleOnly) {
        filteredEvents = filteredEvents.filter(event => 
            event.dates.status.code === 'onsale'
        );
    }

    // Apply price filter
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
        filteredEvents = filteredEvents.filter(event => {
            if (!event.priceRanges) return false;
            const eventMinPrice = event.priceRanges[0].min;
            const eventMaxPrice = event.priceRanges[0].max;
            
            if (!isNaN(minPrice) && eventMinPrice < minPrice) return false;
            if (!isNaN(maxPrice) && eventMaxPrice > maxPrice) return false;
            return true;
        });
    }

    // Apply rating filter
    if (rating4Plus || rating3Plus) {
        filteredEvents = filteredEvents.filter(event => {
            const popularity = event.popularity || 0;
            if (rating4Plus && popularity < 0.8) return false;
            if (rating3Plus && popularity < 0.6) return false;
            return true;
        });
    }

    // Apply sorting
    switch (sortBy) {
        case 'popularity':
            filteredEvents.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
            break;
        case 'date':
            filteredEvents.sort((a, b) => new Date(a.dates.start.dateTime) - new Date(b.dates.start.dateTime));
            break;
        case 'name':
            filteredEvents.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'price':
            filteredEvents.sort((a, b) => {
                const aPrice = a.priceRanges ? a.priceRanges[0].min : Infinity;
                const bPrice = b.priceRanges ? b.priceRanges[0].min : Infinity;
                return aPrice - bPrice;
            });
            break;
    }

    // Update filter count and display
    document.querySelector('.filter-count').textContent = `${filteredEvents.length} events found`;
    displayEvents(filteredEvents);
}

// Reset all filters
function resetAllFilters() {
    document.getElementById('sortFilter').value = 'popularity';
    document.getElementById('availableOnly').checked = false;
    document.getElementById('onSale').checked = false;
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.querySelector('input[value="4plus"]').checked = false;
    document.querySelector('input[value="3plus"]').checked = false;

    displayEvents(currentEvents);
}

// Add loading animation
const loadingDots = setInterval(() => {
    const dots = document.querySelector('.dots');
    if (dots) {
        dots.textContent = dots.textContent.length >= 3 ? '' : dots.textContent + '.';
    }
}, 500);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeDateInput();
    initializeFilters();
});