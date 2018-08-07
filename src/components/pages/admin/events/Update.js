import React, { Component } from "react";
import { Typography, withStyles } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card";
import moment from "moment";

import InputGroup from "../../../common/form/InputGroup";
import DateTimePickerGroup from "../../../common/form/DateTimePickerGroup";
import SelectGroup from "../../../common/form/SelectGroup";

import Button from "../../../common/Button";
import notifications from "../../../../stores/notifications";
import api from "../../../../helpers/api";

const styles = theme => ({
	paper: {
		padding: theme.spacing.unit,
		marginBottom: theme.spacing.unit
	}
});

class EventsUpdate extends Component {
	constructor(props) {
		super(props);

		//Check if we're editing an existing event
		let eventId = null;
		if (props.match && props.match.params && props.match.params.id) {
			eventId = props.match.params.id;
		}

		// pub name: String,
		// pub organization_id: Uuid,
		// pub venue_id: Uuid,
		// pub event_start: NaiveDateTime,
		this.state = {
			eventId,
			name: "",
			eventDate: null,
			organizations: null,
			organizationId: "",
			venues: [],
			venueId: "",
			errors: {},
			isSubmitting: false
		};
	}

	componentDidMount() {
		const { eventId } = this.state;

		if (eventId) {
			//TODO get all fields required, not just name
			api()
				.get(`/events/${eventId}`)
				.then(response => {
					const { name } = response.data;

					this.setState({
						name: name || ""
					});
				})
				.catch(error => {
					console.error(error);
					this.setState({ isSubmitting: false });
					notifications.show({
						message: "Loading venue details failed.",
						variant: "error"
					});
				});
		}

		api()
			.get("/organizations")
			.then(response => {
				const { data } = response;
				this.setState({ organizations: data });
			})
			.catch(error => {
				console.error(error);
				notifications.show({
					message: "Loading organizations failed.",
					variant: "error"
				});
			});
	}

	loadVenues(organizationId) {
		this.setState({ venues: null }, () => {
			//TODO use the org id once an admin can assign a venue to an org
			//TODO use `/venues/organizations/${organizationId}`
			api()
				.get(`/venues`)
				.then(response => {
					const { data } = response;
					console.log("venues: ", data);
					this.setState({ venues: data });
				})
				.catch(error => {
					console.error(error);
					notifications.show({
						message: "Updating venues failed.",
						variant: "error"
					});
				});
		});
	}

	validateFields() {
		//Don't validate every field if the user has not tried to submit at least once
		if (!this.submitAttempted) {
			return null;
		}

		const { name, eventDate, organizationId, venueId } = this.state;

		const errors = {};

		if (!name) {
			errors.name = "Missing event name.";
		}

		if (!organizationId) {
			errors.organizationId = "Choose an organization.";
		}

		if (!venueId) {
			errors.venueId = "Choose venue.";
		}

		if (!eventDate) {
			errors.eventDate = "Specify the event date.";
		}

		//TODO validte additional fields

		this.setState({ errors });

		if (Object.keys(errors).length > 0) {
			return false;
		}

		return true;
	}

	createNewEvent(params, onSuccess) {
		console.log(JSON.stringify(params));
		api()
			.post("/events", params)
			.then(response => {
				const { id } = response.data;
				onSuccess(id);
			})
			.catch(error => {
				console.error(error);
				this.setState({ isSubmitting: false });
				notifications.show({
					message: "Create event failed.",
					variant: "error"
				});
			});
	}

	updateEvent(id, params, onSuccess) {
		api()
			.put(`/events/${id}`, { ...params, id })
			.then(() => {
				onSuccess(id);
			})
			.catch(error => {
				console.error(error);
				this.setState({ isSubmitting: false });
				notifications.show({
					message: "Update event failed.",
					variant: "error"
				});
			});
	}

	onSubmit(e) {
		e.preventDefault();

		this.submitAttempted = true;

		if (!this.validateFields()) {
			return false;
		}

		const { eventId, name, eventDate, organizationId, venueId } = this.state;

		const eventDetails = {
			name,
			venue_id: venueId,
			event_start: moment.utc(eventDate).format()
		};

		//If we're updating an existing venue
		if (eventId) {
			this.updateEvent(eventId, eventDetails, id => {
				notifications.show({
					message: "Event updated",
					variant: "success"
				});

				this.props.history.push("/admin/events");
			});

			return;
		}

		this.createNewEvent(
			{ ...eventDetails, organization_id: organizationId }, //TODO add orgId here
			id => {
				this.updateVenue(id, eventDetails, id => {
					notifications.show({
						message: "Event created",
						variant: "success"
					});

					this.props.history.push("/admin/events");
				});
			}
		);
	}

	renderOrganizations() {
		const { organizationId, organizations, errors } = this.state;
		if (organizations === null) {
			return <Typography variant="body1">Loading organizations...</Typography>;
		}

		const organizationsObj = {};

		organizations.forEach(organization => {
			organizationsObj[organization.id] = organization.name;
		});

		return (
			<SelectGroup
				value={organizationId}
				items={organizationsObj}
				error={errors.organizationId}
				name={"organization"}
				label={"Organization"}
				onChange={e => {
					const organizationId = e.target.value;
					this.setState({ organizationId });
					//Reload venues belonging to this org
					this.loadVenues(organizationId);
				}}
				onBlur={this.validateFields.bind(this)}
			/>
		);
	}

	renderVenues() {
		const { venueId, venues, errors } = this.state;

		const venuesObj = {};

		let lable = "";

		if (venues !== null) {
			venues.forEach(venue => {
				venuesObj[venue.id] = venue.name;
			});
			lable = "Venue";
		} else {
			lable = "Loading venues...";
		}

		return (
			<SelectGroup
				value={venueId}
				items={venuesObj}
				error={errors.venueId}
				name={"venues"}
				missingItemsLabel={"No available venues"}
				label={lable}
				onChange={e => {
					const venueId = e.target.value;
					this.setState({ venueId });
				}}
				onBlur={this.validateFields.bind(this)}
			/>
		);
	}

	render() {
		const { eventId, name, eventDate, errors, isSubmitting } = this.state;
		const { classes } = this.props;

		return (
			<div>
				<Typography variant="display3">
					{eventId ? "Update" : "Create"} event
				</Typography>

				<Grid container spacing={24}>
					<Grid item xs={12} sm={10} lg={8}>
						<Card className={classes.paper}>
							<form
								noValidate
								autoComplete="off"
								onSubmit={this.onSubmit.bind(this)}
							>
								<CardContent>
									<InputGroup
										error={errors.name}
										value={name}
										name="name"
										label="Event name"
										type="text"
										onChange={e => this.setState({ name: e.target.value })}
										onBlur={this.validateFields.bind(this)}
									/>

									<DateTimePickerGroup
										error={errors.eventDate}
										value={eventDate}
										name="eventDate"
										label="Event date"
										onChange={eventDate => this.setState({ eventDate })}
										onBlur={this.validateFields.bind(this)}
									/>

									{!eventId ? this.renderOrganizations() : null}

									{this.renderVenues()}
								</CardContent>

								<CardActions>
									<Button
										disabled={isSubmitting}
										type="submit"
										style={{ marginRight: 10 }}
										customClassName="callToAction"
									>
										{isSubmitting ? "Creating..." : "Create"}
									</Button>
								</CardActions>
							</form>
						</Card>
					</Grid>
				</Grid>
			</div>
		);
	}
}

export default withStyles(styles)(EventsUpdate);