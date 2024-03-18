import 'dotenv/config';
import { GraphQLClient, gql } from 'graphql-request';
import genres from '../data/genres.json' assert { type : 'json' };
import * as fs from 'fs/promises';
import ical from 'ical-generator';

const client = new GraphQLClient(
	`https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE}`,
	{
		headers: {
			authorization: `Bearer ${process.env.CONTENTFUL_TOKEN}`
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

	gigList = await doQuery(`query
	{
		eventsCollection(
			order: [gigStartDate_ASC sys_firstPublishedAt_ASC],
			limit : 1000,
			where : {
				AND : [
					{ gigStartDate_gte : "2024-03-17" },
					{ gigStartDate_lte : "2024-04-17"},
					{
					OR : [
						{performersList_contains_some : ${JSON.stringify(bands)} },
						{promotedName_in : ${JSON.stringify(bands)} }
					  ]
					}
				  ]
				}
			) {
			items {
				gigStartDate
				promotedName
				ticketUrl
				performersList
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
		}
	}`);
	
	if (!gigList) {
		console.error('Failed to get gig list')
		return;
	}

	gigList.eventsCollection.items.forEach(event => {
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
	
	munge.forEach(mungeNode => {
		let filtered = gigList.eventsCollection.items.filter((gigItem) => { return gigItem.promotedName.indexOf(mungeNode.artistname) > -1 || (gigItem.performersList != null && gigItem.performersList.includes(mungeNode.artistname)); });
		if (filtered.length == 0) {
			return true;
		}
		mungeNode.gigs = filtered;
	});

	fs.writeFile("../data/genres-munged.json", JSON.stringify(munge));
}

mungeData().catch(console.error);