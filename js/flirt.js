// please don't read this code it's not good for your mind or your soul
// written in one weird evening on the 17th of March, 2024
// by Joe Hardy joe.hardy.id.au for sydneymusic.net

let genres = null;
let doneGenres = [];

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

function loadQuote() {
	if (!genres) {return;}

	let genre = null;
	do {
		if (doneGenres.length == genres.length) {
			doneGenres = [];
		}

		genre = genres[randomIntFromInterval(0,genres.length-1)];
		if (doneGenres.indexOf(genre.artistname) > -1) {
			continue;
		}
		doneGenres[doneGenres.length] = genre.artistname;
		break;
	} while (true)

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
	getJSON(
		"/data/genres-munged.json",
		(response, data) => {
			genres = data.filter((artist) => {
				return artist.gigs != null;
			});
			loadQuote();
		}
	);
}

document.addEventListener('DOMContentLoaded', init(), false);
