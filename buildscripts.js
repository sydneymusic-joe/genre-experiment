import 'dotenv/config';
import { GraphQLClient, gql } from 'graphql-request';
import genres from './data/genres.json' with { type : 'json' };
import * as fs from 'fs/promises';
import ical from 'ical-generator';

const client = new GraphQLClient(
	`https://graphql.datocms.com/`,
	{
		headers: {
			'Authorization': `Bearer ${process.env.DATOCMS_TOKEN}`
		}
	}
);

function doQuery(query) {
	return client.request(
		gql`
			${query}
		`
	);
}

async function mungeData() {
	let gigList;

	let munge = genres;
	const bands = genres.map((item) => { return item.artistname; })

	let startDate = new Date();
	let endDate = new Date();
	endDate.setDate(endDate.getDate() + 30);
console.log(endDate.toISOString());
	gigList = await doQuery(`
	query {
		allEvents(
			orderBy: [gigStartDate_ASC _firstPublishedAt_ASC],
			first : 500,
			filter : {
				gigStartDate : { gte : "${startDate.toISOString()}",lte : "${endDate.toISOString()}" }
			}
		)
		{
			gigStartDate
			promotedName
			ticketUrl
			performersListJson
			furtherInfo
			furtherInfoContributorInitials
			isFree
			venue {
				venueName
				address
				suburb
				url,
				slug
			}
		}
	}`);
	
	if (!gigList) {
		console.error('Failed to get gig list')
		return;
	}

	gigList.allEvents.forEach(event => {
		const v = event.venue;
		const start = new Date(event.gigStartDate);
		const end = new Date(start);
		end.setTime(start.getTime() + 60 * 60 * 1000 * 2.5); // Default to 2.5 hours
	
		const cal = ical();
		cal.createEvent({
			start,
			end,
			summary:
				event.promotedName + (event.performersList ? ' w/ ' + event.performersList.join(', ') : ''),
			url: event.ticketUrl,
			location:
				v.venueName +
				(v.address ? ', ' + v.address : '') +
				(v.suburb ? ', ' + v.suburb : '')
		});
		event.calLink = `data:text/calendar;charset=utf8,${encodeURIComponent(cal.toString())}`;
	});

	gigList.allEvents.filter(ev => {
		let artist;
		if (ev.performersListJson) {
			for (const p in ev.performersListJson) {
				artist = genres.find(g => g.artistname.toLowerCase().trim() == ev.performersListJson[p].toLowerCase().replace(/\[.*?\]/, "").trim());
			}
		}

		if (!artist) {
			artist = genres.find(g => g.artistname.toLowerCase().trim() == ev.promotedName.replace(/\[.*?\]/, "").toLowerCase().trim());
		}

		if (artist) {
			if (!artist.gigs) {
				artist.gigs = []
			}
			artist.gigs[artist.gigs.length] = ev;
			return true;
		}
	});

	fs.writeFile("data/genres-munged.json", JSON.stringify(munge));
}

mungeData().catch(console.error);