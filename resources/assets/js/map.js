const $ = require('jquery')
const renderBusiness = require('./components/business')
const {hideElement, showElement, enableElement, disableElement} = require('./util')

window.jQuery = $

let isMobile
let map
let businesses = []
let markers = []
let $businessPopup
let $businessListContainer
let $searchButton
let $closeButton

let $moreInfoPopup
let $moreInfoLink
let $moreInfoCloseButton

function findBusiness(uid) {
    let business = null;
    businesses.forEach(b => {
        if (parseInt(b.uid, 10) === parseInt(uid, 10)) {
            business = b
        }
    })
    return business;
}

function findMarker(uid) {
    let marker = null;
    markers.forEach(m => {
        if (parseInt(m.businessUid, 10) === parseInt(uid, 10)) {
            marker = m
        }
    })
    return marker;
}

function setupElements() {
    $businessPopup = $('#business-popup')
    $businessListContainer = $('#business-list-container')
    $searchButton = $('#submit')
    $closeButton = $('#business-popup-close')

    $moreInfoPopup = $('#more-info-popup')
    $moreInfoLink = $('#more-info')
    $moreInfoCloseButton = $('#more-info-popup-close')
    $moreInfoLink.on('click', function() {
        showElement($moreInfoPopup)
    });
    $moreInfoCloseButton.on('click', function() {
        hideElement($moreInfoPopup)
    });

    $businessPopup.on('click', '#copy-business-url', function () {
        $('#share-business-url').select();
        document.execCommand('copy');
    });

    $businessPopup.on('click', '#close-share-business-url', function () {
        $('#share-business-url-container').hide();
    });

    $businessPopup.on('click', '#open-share-business-url', function (event) {
        event.preventDefault();
        $('#share-business-url-container').show();
        $('#share-business-url').select();
    });

}

function setupForm() {
// enable/disable search button
    $('#location').keyup(function (e) {
        if (e.which === 13) {
            return
        }
        const $location = $(this)
        if ($location.val()) {
            enableElement($searchButton)
        } else {
            disableElement($searchButton)
        }
    })
}

function initMap () {
    isMobile = $(window).width() < 768; // matches bootstrap sm/md breakpoint

    map = new window.google.maps.Map(document.getElementById(isMobile ? 'map-mobile' : 'map-desktop'), {
        zoom: 10,
        center: {lat: 51.5073509, lng: -0.1277583}
    });

    map.addListener('click', function () {
        hideRepairer();
    });

    $('#copy-url').click(function () {
        $('#share-url').select();
        document.execCommand('copy');
    });

    $('#close-share-url').click(function () {
        $('#share-url-container').hide();
    });

    $('#open-share-url').click(function (event) {
        event.preventDefault();
        $('#share-url-container').show();
        $('#share-url').select();
    });

    $.fn.stars = function() {
        return this.each(function(i,e){$(e).html($('<span/>').width($(e).text()*16));});
    };
    $('.stars').stars();
}

function search() {

    initMap();


    $(document).ready(() => {
        window.location.hash = ''

        // when embedded in iframe
        if (top != self) {
            hideElement($('.sidebar__logo'));
            hideElement($('#more-info'));
        }

        setupElements();

        // add form handler
        $('#search').submit(function (event) {
            event.preventDefault()

            let query = createQuery();

            onSearch(query, function () {
                window.history.pushState({
                        query: query,
                        zoom: 13
                    },
                    'Searching for Repair Shops in ' + query.location,
                    '/?' + $.param(query)
                );
            });
        });
        setupForm();

        // close button should hide the displayed business
        $closeButton.click(hideRepairer)

        // back and forward browser button support
        window.onpopstate = function () {
            if (window.location.hash && window.location.hash.length > 1) {
                const uid = parseInt(window.location.hash.substring(1), 10)
                let business = findBusiness(uid);
                let marker = findMarker(uid);
                if (business && marker) {
                    showRepairer(business, marker)
                }
            } else {
                hideRepairer()


                let query = getQueryParameters()

                $('[name="location"]').val(query.location ? decodeURIComponent(query.location) : '');
                $('[name="category"]').val(query.category ? decodeURIComponent(query.category) : '');
                $('[name="radius"]').val(query.radius ? query.radius : 7);

                onSearch(createQuery())
            }
        }

        // search for businesses on page load
        onSearch(createQuery())
    })

}

function loadBusiness(businessId) {

    initMap();

    $(document).ready(function () {

        setupElements();

        setupForm();

        // close button should hide the displayed business
        $closeButton.click(hideRepairer)

        // back and forward browser button support
        window.onpopstate = function () {
            if (window.location.hash && window.location.hash.length > 1) {
                const uid = parseInt(window.location.hash.substring(1), 10)
                let business = findBusiness(uid);
                let marker = findMarker(uid);
                if (business && marker) {
                    showRepairer(business, marker)
                }
            } else {
                hideRepairer()
            }
        }

        // search for businesses on page load
        onSearch(createQuery(), function () {
            let business = findBusiness(businessId);
            let marker = findMarker(businessId);
            if (business && marker) {
                showRepairer(business, marker)
            }
        })

    })

}

function createQuery () {

    const location = $('[name="location"]').val()
    const category =  $('[name="category"]').val()
    const radius =  $('[name="radius"]').val()

    return {
        location,
        category,
        radius: radius
    };
}

function onSearch (query, cb) {

    if (query.location || query.category) {

        trackSearch(query.category)

        let zoom = query.radius > 10 ? 10 : 13;

        doSearch(query, zoom, cb)

        $('#share-url').val(window.__env.mapShareBaseUrl + '?' + $.param(query));
    }
}


function getQueryParameters (str) {
    return (str || document.location.search).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
}

function doSearch (query, zoom, cb) {
    disableElement($searchButton)
    $.get('/map/api/business/search', query, ({searchLocation, businesses: _businesses}) => {
        clearMap()
        businesses = _businesses
        if (searchLocation) {
            map.setCenter({lat: searchLocation.latitude, lng: searchLocation.longitude})
            map.setZoom(zoom ? zoom : 13)
        }
        enableElement($searchButton)
        showElement($businessListContainer)
        businesses.forEach(addRepairer)
        let resultCountText
        if (!businesses.length) {
            resultCountText = 'Unfortunately, there are currently no results for your search'
        } else {
            resultCountText = businesses.length + ((businesses.length === 1) ? ' result ' : ' results ') + 'in your area'
        }
        $businessListContainer
            .find('.business-list-container__result-count')
            .text(resultCountText)

        if (cb){
            cb();
        }
    })
}

function clearMap () {
    hideRepairer()
    markers.forEach(marker => {
        marker.setMap(null)
    })
    markers = []
    $('.business-list__item').remove()
}

function addRepairer (business) {
    const marker = new window.google.maps.Marker({
        icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        position: {lat: business.geolocation.latitude, lng: business.geolocation.longitude},
        map: map,
        title: business.name
    })
    marker.businessUid = business.uid

    marker.addListener('click', function () {
        scrollToRepairer(business)
        triggerShowRepairer(business.uid)
    })
    markers.push(marker)

    const $business = $(`
        <li role="button" class="business-list__item" id="business-${business.uid}">
            ${renderBusiness(business, true)}
        </li>
    `)

    $business.click(() => {
        triggerShowRepairer(business.uid)
    })

    $('.business-list').append($business)
}

function scrollToRepairer (business) {
    const $sidebar = $('.sidebar')
    const $business = $sidebar.find('#business-' + business.uid)
    $sidebar.animate(({scrollTop: $business.offset().top - $sidebar.offset().top + $sidebar.scrollTop() - 100}))
}

function triggerShowRepairer (uid) {
    window.location.hash = uid
}

function showRepairer (business, marker) {
    trackRepairerSelection(business)

    resetMarkers()

    var zoomLevel = map.getZoom();
    var dpPerDegree = 256.0 * Math.pow(2, zoomLevel) / 170.0;
    var mapHeight = $('#map-desktop-container').height();
    var mapHeightPercent = 50.0 * mapHeight / 100.0;
    const latOffset = isMobile ? 0 : mapHeightPercent / dpPerDegree;

    marker.setIcon('https://maps.google.com/mapfiles/ms/icons/red-dot.png')
    map.setCenter({lat: business.geolocation.latitude + latOffset, lng: business.geolocation.longitude})

    $businessPopup.find('.business-popup__content').html(renderBusiness(business))

    showElement($businessPopup)

    $('.business-list__item').each(function () {
        const $item = $(this)
        if ($item.attr('id') === 'business-' + business.uid) {
            $item.addClass('business-list__item--active')
            $item.removeClass('business-list__item--inactive')
        } else {
            $item.addClass('business-list__item--inactive')
            $item.removeClass('business-list__item--active')
        }
    })

    showSurveyLink($businessPopup);
}

function showSurveyLink($businessPopup) {
    var $survey = $businessPopup.find(".survey-link");
    $survey.hide();

    setTimeout(function() {
        $survey.fadeIn('slow');
    }, 500);
}

function hideRepairer () {
    hideElement($businessPopup)
    $('.business-list__item').each(function () {
        const $item = $(this)
        $item.removeClass('business-list__item--inactive')
        $item.removeClass('business-list__item--active')
    })
    resetMarkers()
    window.location.hash = ''
}

function resetMarkers () {
    markers.forEach(marker => {
        marker.setIcon('https://maps.google.com/mapfiles/ms/icons/blue-dot.png')
    })
}

function trackSearch (category) {
    window.ga('send', 'event', 'search', 'submit', category || 'All Categories', {'transport': 'beacon'})
}

function trackRepairerSelection (business) {
    const value = [business.name, business.address, business.postcode].join(', ')
    window.ga('send', 'event', 'map', 'select', value, {'transport': 'beacon'})
}

module.exports = {search, loadBusiness}
