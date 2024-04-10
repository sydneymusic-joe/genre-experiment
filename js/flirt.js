// please don't read this code it's not good for your mind or your soul
// written in one weird evening on the 17th of March, 2024
// by Joe Hardy joe.hardy.id.au for sydneymusic.net

let sourceGenres = null;
let doneGenres = [];
let genres = []; // filtered

document.querySelectorAll('.button a').forEach(button => button.addEventListener('click', buttonClick));

const getJSON = function(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      const status = xhr.status;
      if (status === 200) {
        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
};

function buttonClick(evt) {
	if (evt.target.dataset.action === "continue") {
		let curr = document.querySelector('.slide.visible:not(.headermode)');
		
		// kids, don't code like this at home. daddy's on a time crunch
		if (curr.parentElement.firstElementChild == curr) {
			curr.classList.add('headermode');
		}

		let next = curr.nextElementSibling;
		if (!next) { // back to roulette
			next = document.querySelector('.slide-roulette');
			loadQuote();
		}

		curr.classList.remove('visible');
		next.classList.add('visible');
	}
	else if (evt.target.dataset.action === "refresh") {
		loadQuote();
	}

	evt.stopPropagation();
	evt.preventDefault();
	return false;
}

function randomIntFromInterval(min, max) { // min and max included 
	return Math.floor(Math.random() * (max - min + 1) + min)
  }  

function loadQuote(reset = false) {
	if (!genres) {return;}

	if (reset || genres.length === 0) {
		let el = document.getElementsByClassName('selected')[0];
		switch (Array.prototype.indexOf.call(el.parentElement.children, el)) {
			case 0:
				genres = sourceGenres.filter(artist => artist.gigs.some(g => new Date(g.gigStartDate).getTime() < nextDay(1).getTime()));
				break;
			case 1:
				genres = sourceGenres.filter(artist => artist.gigs.some(g => new Date(g.gigStartDate).getTime() > nextDay(1).getTime() && new Date(g.gigStartDate).getTime() < nextDay(1, 1).getTime()));
				break;
			case 2:
				genres = sourceGenres.filter(
					artist => artist.gigs.some((g) => { 
						let now = new Date();
						now.setDate(now.getDate()+28);
						return new Date(g.gigStartDate).getTime() < now.getTime();
					}))
				break;
		}

		doneGenres = [];
	}

	let genre = null;
	do {
		if (doneGenres.length == genres.length) {
			document.getElementById('popover').classList.add('show');
			doneGenres = [];
		}

		genre = genres[randomIntFromInterval(0,genres.length-1)];
		if (doneGenres.indexOf(genre.artistname) > -1) {
			continue;
		}
		doneGenres[doneGenres.length] = genre.artistname;
		break;
	} while (true)

	document.getElementById('gigstotal').innerText = genres.length;
	document.getElementById('gigsleft').innerText = genres.length - doneGenres.length;

	const q = document.querySelector('.genrequote .quote');
	if (genre.genre.length > 30 && genre.genre.length < 60) {
		q.style.fontSize = '3.75em';
	}
	else if (genre.genre.length >= 60) {
		q.style.fontSize = '2.25em';
	}
	else {
		q.style.fontSize = '3.75em';
	}
	
	q.textContent = genre.genre;
	document.getElementById('bandName').innerText = genre.artistname;

	if (genre.gigs) {
		const gig = genre.gigs[0];
		document.getElementById('venue').innerText = gig.venue.venueName;
		document.getElementById('venue').href = 'https://sydneymusic.net/gig-guide/venues/' + gig.venue.slug;
		const gsd = new Date(gig.gigStartDate);
		document.getElementById('date').innerText = gsd.toLocaleString('en-AU', { dateStyle : 'full' });
		document.getElementById('time').innerText = gsd.toLocaleString('en-AU', { hour: 'numeric', hour12: true });
		document.getElementById('days').innerText = Math.round((gsd - new Date()) / (1000 * 3600 * 24));
		document.getElementById('headliner').innerText = gig.promotedName;
		document.getElementById('supports').innerHTML = gig.performersList ? gig.performersList.join(", ") : null;
		document.querySelector('.slide-result').classList.remove('nogig');
		document.querySelector('.links a:first-child').href = gig.ticketUrl;
		document.querySelector('.links a:nth-child(2)').href = gig.calLink;
		
		document.querySelector('.free-badge').style.display = gig.isFree ? 'block' : 'none';

		document.querySelector('.result-actions .listen a').href = genre.link;
		document.querySelector('.result-actions .insta a').href = `https://instagram.com/${genre.instagram}`;
	}
	else {
		document.querySelector('.slide-result').classList.add('nogig');
	}
}

function randomIntFromInterval(min, max) { // min and max included 
	return Math.floor(Math.random() * (max - min + 1) + min)
}  

function init() {
	Array.prototype.forEach.call(document.getElementsByClassName('filter-item'), (el) => {
		el.addEventListener('click', (evt) => {
			document.getElementsByClassName('selected')[0].classList.remove('selected');
			evt.currentTarget.classList.add('selected');
			evt.preventDefault();

			loadQuote(true);
		})
	});

	document.getElementById('resetdeck').addEventListener('click', (evt) => { loadQuote(true); evt.preventDefault(); });

	document.getElementById('share').addEventListener('click', (evt) => { if (!navigator.share) { alert("Sorry, your browser doesn't support this feature!"); evt.preventDefault(); return false; } navigator.share({url : 'https://genres.sydneymusic.net/', title : 'Blind Date With A Band'}); evt.preventDefault(); })
	document.getElementById('popover-close').addEventListener('click', (evt) => { document.getElementById('popover').classList.remove('show'); evt.preventDefault(); })

	getJSON(
		"/data/genres-munged.json",
		(response, data) => {
			sourceGenres = data.filter((artist) => {
				return artist.gigs != null;
			});

			document.getElementsByClassName('filter-item')[0].dataset.howmany = sourceGenres.filter(artist => artist.gigs.some(g => new Date(g.gigStartDate).getTime() < nextDay(1).getTime())).length;
			document.getElementsByClassName('filter-item')[1].dataset.howmany = sourceGenres.filter(artist => artist.gigs.some(g => new Date(g.gigStartDate).getTime() > nextDay(1).getTime() && new Date(g.gigStartDate).getTime() < nextDay(1, 1).getTime())).length;
			document.getElementsByClassName('filter-item')[2].dataset.howmany =
				sourceGenres.filter(
					artist => artist.gigs.some((g) => { 
						let now = new Date();
						now.setDate(now.getDate()+28);
						return new Date(g.gigStartDate).getTime() < now.getTime();
					})).length;
			
			loadQuote();
		}
	);
}

function nextDay(x, offset=0){
    var now = new Date();
	let idx = offset+1;
	while (idx-- > 0) {
		if (offset > 0 && idx > -1) {
			now.setDate(now.getDate() + 1)
		}
		now.setDate(now.getDate() + (x+(7-now.getDay())) % 7);
	}
    return now;
}

document.addEventListener('DOMContentLoaded', init(), false);
