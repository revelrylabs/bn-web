import { observable, computed, action } from "mobx";
import moment from "moment";
import notifications from "./notifications";
import Bigneon from "../helpers/bigneon";
import {
	formatEventDataForInputs,
	formatEventDataForSaving
} from "../components/pages/admin/events/updateSections/Details";
import {
	formatArtistsForInputs,
	formatArtistsForSaving
} from "../components/pages/admin/events/updateSections/Artists";
import {
	formatTicketDataForInputs,
	formatTicketDataForSaving
} from "../components/pages/admin/events/updateSections/Tickets";

//TODO separate artists and ticketTypes into their own stores

const freshEvent = formatEventDataForInputs({});
class EventUpdate {
	@observable
	id = null;

	@observable
	organizationId = null;

	@observable
	event = freshEvent;

	@observable
	organization = {};

	@observable
	venue = {};

	@observable
	artists = [];

	@observable
	ticketTypes = [];

	@observable
	ticketTypeActiveIndex = null;

	@action
	loadDetails(id) {
		this.id = id;

		Bigneon()
			.events.read({ id })
			.then(response => {
				const { artists, organization, venue, ...event } = response.data;
				const { organization_id } = event;
				this.event = formatEventDataForInputs(event);
				this.artists = formatArtistsForInputs(artists);
				this.venue = venue;
				this.organizationId = organization_id;

				this.loadTicketTypes();
			})
			.catch(error => {
				console.error(error);
				let message = "Loading event details failed.";
				if (
					error.response &&
					error.response.data &&
					error.response.data.error
				) {
					message = error.response.data.error;
				}

				notifications.show({
					message,
					variant: "error"
				});
			});
	}

	@action
	loadTicketTypes(ticket_types) {
		if (!this.id) {
			//No event yet, add one ticket by default
			this.addTicketType();
		}
		Bigneon()
			.events.ticketTypes.index({ event_id: this.id })
			.then(response => {
				const { data, paging } = response.data; //@TODO Implement pagination
				const ticket_types = data;

				let ticketTypes = [];
				if (ticket_types) {
					ticketTypes = formatTicketDataForInputs(ticket_types);
				}

				this.ticketTypes = ticketTypes;
				this.ticketTypeActiveIndex = ticketTypes.length - 1;

				//If there are no ticketType, add one
				if (this.ticketTypes.length < 1) {
					this.addTicketType();
				}
			})
			.catch(error => {
				console.error(error);

				let message = "Loading event ticket types failed.";
				if (
					error.response &&
					error.response.data &&
					error.response.data.error
				) {
					message = error.response.data.error;
				}

				notifications.show({
					message,
					variant: "error"
				});
			});
	}

	@action
	addTicketType() {
		//const endDate = this.event.eventDate ? this.event.eventDate : new Date(); //FIXME this will most certainly not work. If a user changes the event date this first ticket type date needs to change.
		let ticketTypes = this.ticketTypes;

		const ticketType = {
			name: "",
			description: "",
			capacity: "",
			priceAtDoor: "",
			increment: 1,
			limitPerPerson: 10,
			startDate: moment(), //TODO use the event date for defaults
			endDate: moment(),

			pricing: [
				{
					id: "",
					ticketId: "", //TODO remove this if not needed
					name: "Default price point",
					startDate: moment(), //TODO make this the end of the last date
					endDate: moment(),
					value: ""
				}
			]
		};

		ticketTypes.push(ticketType);

		this.ticketTypes = ticketTypes;
		this.ticketTypeActiveIndex = ticketTypes.length - 1;
	}

	@action
	ticketTypeActivate(index) {
		this.ticketTypeActiveIndex = index;
	}

	@action
	updateTicketType(index, details) {
		let ticketTypes = this.ticketTypes;
		ticketTypes[index] = { ...ticketTypes[index], ...details };
		this.ticketTypes = ticketTypes;
	}

	@action
	deleteTicketType(index) {
		let ticketTypes = this.ticketTypes;
		ticketTypes.splice(index, 1);
		this.ticketTypes = ticketTypes;
	}

	@action
	addTicketPricing(index) {
		let { ticketTypes } = this;

		let { pricing } = ticketTypes[index];

		pricing.push({
			id: "",
			ticketId: "",
			name: "",
			startDate: new Date(), //TODO make this the end of the last date
			endDate: new Date(), //TODO make this the event start time
			value: 0
		});

		ticketTypes[index].pricing = pricing;
		this.ticketTypes = ticketTypes;
	}

	@action
	updateEvent(eventDetails) {
		this.event = { ...this.event, ...eventDetails };

		//If they're updating the ID, update the root var
		const { id } = eventDetails;
		if (id) {
			this.id = id;
		}
	}

	@action
	updateOrganizationId(organizationId) {
		this.organizationId = organizationId;
	}

	@action
	updateArtists(artists) {
		this.artists = artists;
	}

	@action
	addArtist(id) {
		let artists = this.artists;
		artists.push({ id, setTime: null });
		this.artists = artists;
	}

	@action
	changeArtistSetTime(index, setTime) {
		let artists = this.artists;
		artists[index].setTime = setTime;
		this.artists = artists;
	}

	@action
	removeArtist(index) {
		let artists = this.artists;
		artists.splice(index, 1);
		this.artists = artists;
	}

	@action
	async saveEventDetails() {
		this.hasSubmitted = true;

		let id = this.id;
		const { artists, event, organizationId, ticketTypes } = this;

		const formattedEventDetails = formatEventDataForSaving(
			event,
			organizationId
		);

		if (id) {
			const result = await this.saveEvent(formattedEventDetails);
			if (!result) {
				return false;
			}
		} else {
			const id = await this.createNewEvent(formattedEventDetails);
			if (!id) {
				return false;
			}

			this.id = id;
		}

		const formattedArtists = formatArtistsForSaving(artists);

		const artistsResult = this.saveArtists(formattedArtists);
		if (!artistsResult) {
			return false;
		}

		const formattedTicketTypes = formatTicketDataForSaving(ticketTypes);
		for (let index = 0; index < formattedTicketTypes.length; index++) {
			const ticketType = formattedTicketTypes[index];
			const result = await this.saveTicketType(ticketType);
			if (!result) {
				return false;
			}
		}

		return true;
	}

	async saveEvent(params) {
		return new Promise(resolve => {
			Bigneon()
				.events.update({ ...params, id: this.id })
				.then(id => {
					resolve(id);
				})
				.catch(error => {
					console.error(error);
					notifications.show({
						message: "Update event failed.",
						variant: "error"
					});
					resolve(false);
				});
		});
	}

	async createNewEvent(params) {
		return new Promise(resolve => {
			Bigneon()
				.events.create(params)
				.then(response => {
					const { id } = response.data;
					resolve(id);
				})
				.catch(error => {
					console.error(error);
					notifications.show({
						message: "Create event failed.",
						variant: "error"
					});
					resolve(false);
				});
		});
	}

	async saveArtists(artistsToSave) {
		return new Promise(resolve => {
			Bigneon()
				.events.artists.update({ event_id: this.id, artists: artistsToSave })
				.then(() => {
					resolve(true);
				})
				.catch(error => {
					console.error(error);
					notifications.show({
						message: "Updating artists failed.",
						variant: "error"
					});
					resolve(false);
				});
		});
	}

	async saveTicketType(ticketType) {
		const { id } = ticketType;

		if (id) {
			return new Promise(resolve => {
				Bigneon()
					.events.ticketTypes.update({
						id,
						event_id: this.id,
						...ticketType
					})
					.then(() => {
						resolve(true);
					})
					.catch(error => {
						console.warn({
							id,
							event_id: this.id,
							...ticketType
						});
						console.error(error);
						notifications.show({
							message: "Updating ticket type failed.",
							variant: "error"
						});
						resolve(false);
					});
			});
		} else {
			return new Promise(resolve => {
				Bigneon()
					.events.ticketTypes.create({
						event_id: this.id,
						...ticketType
					})
					.then(() => {
						resolve(true);
					})
					.catch(error => {
						console.error(error);
						notifications.show({
							message: "Creating ticket type failed.",
							variant: "error"
						});
						resolve(false);
					});
			});
		}
	}

	@action
	clearDetails() {
		this.id = null;
		this.event = freshEvent;
		this.artists = [];
		this.venue = {};
		this.organizationId = null;
		this.ticketTypes = [];
		this.ticketTypeActiveIndex = null;

		this.addTicketType();
	}
}

const eventUpdateStore = new EventUpdate();

export default eventUpdateStore;
