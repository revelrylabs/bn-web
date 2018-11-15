import React, { Component } from "react";
import { Typography, withStyles, CardMedia } from "@material-ui/core";
import { observer } from "mobx-react";
import Grid from "@material-ui/core/Grid";
import PropTypes from "prop-types";
import { Paper } from "@material-ui/core";
import { Link } from "react-router-dom";

import Button from "../../elements/Button";
import notifications from "../../../stores/notifications";
import selectedEvent from "../../../stores/selectedEvent";
import user from "../../../stores/user";
import EventSummaryGrid from "./EventSummaryGrid";
import cart from "../../../stores/cart";

const styles = theme => ({
	card: {
		padding: theme.spacing.unit * 4
	},
	buttonsContainer: {
		justifyContent: "flex-end",
		display: "flex"
	},
	media: {
		height: 200,
		width: "100%",
		borderRadius: theme.shape.borderRadius
	}
});

@observer
class CheckoutSuccess extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	componentDidMount() {
		user.toggleSideMenu(false);
		cart.emptyCart(); //TODO move this to after they've submitted the final form

		if (
			this.props.match &&
			this.props.match.params &&
			this.props.match.params.id
		) {
			const { id } = this.props.match.params;

			selectedEvent.refreshResult(id, errorMessage => {
				notifications.show({
					message: errorMessage,
					variant: "error"
				});
			});
		} else {
			//TODO return 404
		}
	}

	render() {
		const { classes } = this.props;

		const { event } = selectedEvent;

		if (event === null) {
			return <Typography variant="subheading">Loading...</Typography>;
		}

		if (event === false) {
			return <Typography variant="subheading">Event not found.</Typography>;
		}

		const { name, displayEventStartDate, promo_image_url } = event;

		return (
			<Paper className={classes.card}>
				<Grid container spacing={24}>
					<Grid item xs={12} sm={8} lg={8}>
						<Typography variant="display3" component="h3">
							Success!
						</Typography>

						<Typography variant="display1" component="h3">
							You're going to this event
						</Typography>

						<Typography variant="body1">{displayEventStartDate}</Typography>
						<Typography variant="body1">
							Doors: 8:00PM / Show: 9:00PM
						</Typography>
						<Typography variant="body1">This event is all ages</Typography>
						<Typography variant="body1">Venue name</Typography>

						<div style={{ marginBottom: 30 }} />

						<Typography variant="body1">Order #1234</Typography>
						<Typography variant="body1">
							We've sent the receipt to {user.email}
						</Typography>
					</Grid>

					<Grid item xs={12} sm={4} lg={4}>
						<CardMedia
							className={classes.media}
							image={promo_image_url}
							title={name}
						/>
					</Grid>
				</Grid>
				<Grid container spacing={24}>
					<Grid item xs={12} sm={12} lg={12}>
						<div className={classes.buttonsContainer}>
							<Link to="/tickets">
								<Button size="large" variant="primary">
									My tickets
								</Button>
							</Link>
						</div>
					</Grid>
				</Grid>
			</Paper>
		);
	}
}

CheckoutSuccess.propTypes = {
	match: PropTypes.object.isRequired,
	classes: PropTypes.object.isRequired
};

export default withStyles(styles)(CheckoutSuccess);
