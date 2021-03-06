import React, { Component } from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";
import { withStyles, Grid, Collapse } from "@material-ui/core";
import moment from "moment";

import Button from "../../../../elements/Button";
import notifications from "../../../../../stores/notifications";
import InputGroup from "../../../../common/form/InputGroup";
import DateTimePickerGroup from "../../../../common/form/DateTimePickerGroup";
import SelectGroup from "../../../../common/form/SelectGroup";
import Bigneon from "../../../../../helpers/bigneon";
import eventUpdateStore from "../../../../../stores/eventUpdate";

const styles = theme => ({});

const validateFields = event => {
	const errors = {};

	const {
		name,
		eventDate,
		venueId,
		doorTime,
		ageLimit,
		additionalInfo,
		topLineInfo,
		videoUrl
	} = event;

	if (!name) {
		errors.name = "Event name required.";
	}

	if (topLineInfo) {
		if (topLineInfo.length > 100) {
			errors.topLineInfo = "Top line info is limited to 100 characters.";
		}
	}

	//TODO validate all fields

	if (Object.keys(errors).length > 0) {
		return errors;
	}

	return null;
};

const formatDataForSaving = (event, organizationId) => {
	const {
		name,
		eventDate,
		publishDate,
		venueId,
		doorTime,
		showTime,
		ageLimit,
		additionalInfo,
		topLineInfo,
		promoImageUrl
	} = event;

	const eventDetails = {
		name,
		organization_id: organizationId,
		age_limit: Number(ageLimit),
		additional_info: additionalInfo,
		top_line_info: topLineInfo
	};

	if (eventDate) {
		//TODO eventDate = eventDate + show time and door time need evenData added to them
		eventDetails.event_start = moment
			.utc(eventDate)
			.format(moment.HTML5_FMT.DATETIME_LOCAL_MS);
	}

	if (doorTime) {
		//TODO doorTime = doorTime + eventDate
		eventDetails.door_time = moment
			.utc(doorTime)
			.format(moment.HTML5_FMT.DATETIME_LOCAL_MS);
	}

	if (publishDate) {
		eventDetails.publish_date = moment
			.utc(publishDate)
			.format(moment.HTML5_FMT.DATETIME_LOCAL_MS);
	}

	if (promoImageUrl) {
		eventDetails.promo_image_url = promoImageUrl;
	}

	if (venueId) {
		eventDetails.venue_id = venueId;
	}

	return eventDetails;
};

const formatDataForInputs = event => {
	const {
		age_limit,
		door_time,
		event_start,
		name,
		venue_id,
		organization_id,
		additional_info,
		top_line_info,
		video_url,
		promo_image_url,
		external_url,
		publish_date
	} = event;

	const eventDetails = {
		status: "", //TODO get from API
		name: name || "",
		eventDate: event_start
			? moment.utc(event_start, moment.HTML5_FMT.DATETIME_LOCAL_MS)
			: new Date(),
		showTime: event_start
			? moment.utc(event_start, moment.HTML5_FMT.DATETIME_LOCAL_MS)
			: null,
		doorTime: door_time
			? moment.utc(door_time, moment.HTML5_FMT.DATETIME_LOCAL_MS)
			: null,
		publishDate: publish_date
			? moment.utc(publish_date, moment.HTML5_FMT.DATETIME_LOCAL_MS)
			: new Date(),
		ageLimit: age_limit || "",
		venueId: venue_id || "",
		additionalInfo: additional_info || "",
		topLineInfo: top_line_info ? top_line_info : "",
		videoUrl: video_url || "",
		showTopLineInfo: !!top_line_info,
		promoImageUrl: promo_image_url,
		externalTicketsUrl: external_url ? external_url : null
	};

	return eventDetails;
};

@observer
class Details extends Component {
	constructor(props) {
		super(props);

		this.state = {
			venues: null
		};

		this.changeDetails = this.changeDetails.bind(this);
	}

	changeDetails(details) {
		eventUpdateStore.updateEvent(details);
	}

	componentDidMount() {
		this.loadVenues();
	}

	loadVenues() {
		this.setState({ venues: null }, () => {
			Bigneon()
				.venues.index()
				.then(response => {
					const { data, paging } = response.data; //@TODO Implement pagination
					this.setState({ venues: data });
				})
				.catch(error => {
					console.error(error);

					let message = "Loading venues failed.";
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
		});
	}

	renderVenues() {
		const { venues } = this.state;
		const { errors } = this.props;

		const { venueId } = eventUpdateStore.event;

		const venuesObj = {};

		let label = "";

		if (venues !== null) {
			venues.forEach(venue => {
				venuesObj[venue.id] = venue.name;
			});
			label = "Venue";
		} else {
			label = "Loading venues...";
		}

		return (
			<SelectGroup
				value={venueId}
				items={venuesObj}
				error={errors.venueId}
				name={"venues"}
				missingItemsLabel={"No available venues"}
				label={label}
				onChange={e => {
					const venueId = e.target.value;
					this.changeDetails({ venueId });
				}}
			/>
		);
	}

	validateFields() {
		//TODO might be needed later, use the function at the top
	}

	renderStatus() {
		const { errors } = this.props;
		const { status } = eventUpdateStore.event;

		const statusesObj = { Buy: "Buy" };

		let label = "Event status";

		return (
			<SelectGroup
				value={status}
				items={statusesObj}
				error={errors.status}
				name={"status"}
				label={label}
				onChange={e => {
					const status = e.target.value;
					this.changeDetails({ status });
				}}
			/>
		);
	}

	render() {
		const { errors = {}, validateFields } = this.props;

		const {
			name,
			eventDate,
			doorTime,
			showTime,
			ageLimit,
			additionalInfo,
			topLineInfo,
			videoUrl,
			showTopLineInfo
		} = eventUpdateStore.event;

		return (
			<Grid container spacing={24}>
				<Grid
					style={{ paddingBottom: 0, marginBottom: 0 }}
					item
					xs={12}
					sm={12}
					lg={6}
				>
					<InputGroup
						error={errors.name}
						value={name}
						name="eventName"
						label="Event name"
						placeholder="eg. Child's play"
						type="text"
						onChange={e => this.changeDetails({ name: e.target.value })}
						onBlur={validateFields}
					/>
				</Grid>

				<Grid
					style={{ paddingBottom: 0, marginBottom: 0 }}
					item
					xs={12}
					sm={12}
					lg={6}
				>
					{this.renderVenues()}
				</Grid>

				<Grid
					style={{ paddingTop: 0, marginTop: 0 }}
					item
					xs={12}
					sm={12}
					lg={12}
				>
					<Collapse in={!showTopLineInfo}>
						<Button
							variant="additional"
							// onClick= TODO onEventDetailsChange
						>
							Add additional top line info
						</Button>
					</Collapse>
					<Collapse in={showTopLineInfo}>
						<InputGroup
							error={errors.topLineInfo}
							value={topLineInfo}
							name="topLineInfo"
							label="Top line info"
							type="text"
							onChange={e =>
								this.changeDetails({ topLineInfo: e.target.value })
							}
							onBlur={validateFields}
							multiline
						/>
					</Collapse>
				</Grid>

				<Grid item xs={12} sm={12} lg={6}>
					<DateTimePickerGroup
						type="date"
						error={errors.eventDate}
						value={eventDate}
						name="eventDate"
						label="Event date"
						onChange={eventDate => {
							this.changeDetails({ eventDate });
							//TODO add this check back when possible to change the end date of a ticket if it's later than the event date
							//const tickets = this.state.tickets;
							// if (tickets.length > 0) {
							// 	if (!tickets[0].endDate) {
							// 		tickets[0].endDate = eventDate;
							// 		this.setState({ tickets });
							// 	}
							// }
						}}
						onBlur={validateFields}
					/>
				</Grid>

				<Grid item xs={12} sm={12} lg={3}>
					<DateTimePickerGroup
						error={errors.doorTime}
						value={doorTime}
						name="doorTime"
						label="Door time"
						onChange={doorTime => this.changeDetails({ doorTime })}
						onBlur={validateFields}
						format="HH:mm"
						type="time"
					/>
				</Grid>

				<Grid item xs={12} sm={12} lg={3}>
					<DateTimePickerGroup
						error={errors.showTime}
						value={showTime}
						name="showTime"
						label="Show time"
						onChange={showTime => this.changeDetails({ showTime })}
						onBlur={validateFields}
						format="HH:mm"
						type="time"
					/>
				</Grid>

				<Grid item xs={12} sm={12} lg={6}>
					<InputGroup
						error={errors.ageLimit}
						value={ageLimit}
						name="ageLimit"
						label="Age limit"
						type="number"
						onChange={e => this.changeDetails({ ageLimit: e.target.value })}
						onBlur={validateFields}
					/>
				</Grid>

				<Grid item xs={12} sm={12} lg={6}>
					{this.renderStatus()}
				</Grid>

				<Grid item xs={12} sm={12} lg={12}>
					<InputGroup
						error={errors.additionalInfo}
						value={additionalInfo}
						name="additionalInfo"
						label="Additional event info"
						type="text"
						onChange={e =>
							this.changeDetails({ additionalInfo: e.target.value })
						}
						onBlur={validateFields}
						placeholder="Enter any additional event info you require."
						multiline
					/>
				</Grid>

				<Grid item xs={12} sm={12} lg={12}>
					<InputGroup
						error={errors.videoUrl}
						value={videoUrl}
						name="videoUrl"
						label="Event video url"
						type="text"
						onChange={e => this.changeDetails({ videoUrl: e.target.value })}
						onBlur={validateFields}
						placeholder="https//vimeo.com/event-video-html"
					/>
				</Grid>
			</Grid>
		);
	}
}

Details.defaultProps = {
	errors: {}
};

Details.propTypes = {
	errors: PropTypes.object.isRequired,
	validateFields: PropTypes.func.isRequired
};

export const EventDetails = withStyles(styles)(Details);
export const validateEventFields = validateFields;
export const formatEventDataForSaving = formatDataForSaving;
export const formatEventDataForInputs = formatDataForInputs;
