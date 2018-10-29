import React, { Component } from "react";
import { Typography, withStyles } from "@material-ui/core";
import { observer } from "mobx-react";
import Grid from "@material-ui/core/Grid";
import PropTypes from "prop-types";
import { Paper } from "@material-ui/core";

import Button from "../../elements/Button";
import notifications from "../../../stores/notifications";
import TicketSelection from "./TicketSelection";
import PromoCodeDialog from "./PromoCodeDialog";
import selectedEvent from "../../../stores/selectedEvent";
import EventSummaryGrid from "./EventSummaryGrid";
import cart from "../../../stores/cart";
import user from "../../../stores/user";

const styles = theme => ({
	card: {
		padding: theme.spacing.unit * 4
	},
	buttonsContainer: {
		justifyContent: "flex-end",
		display: "flex"
	}
});

@observer
class CheckoutSelection extends Component {
	constructor(props) {
		super(props);

		this.state = {
			errors: {},
			openPromo: false,
			ticketSelection: {},
			isSubmitting: false
		};
	}

	componentDidMount() {
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

	validateFields() {
		//Don't validate every field if the user has not tried to submit at least once
		if (!this.submitAttempted) {
			return true;
		}

		const { ticketSelection } = this.state;
		const { ticket_types } = selectedEvent;

		let errors = {};

		Object.keys(ticketSelection).forEach(ticketTypeId => {
			const selectedTicketCount = ticketSelection[ticketTypeId];
			if (selectedTicketCount && selectedTicketCount > 0) {
				//Validate the user is buying in the correct increments
				const { increment } = ticket_types.find(({ id }) => {
					return id === ticketTypeId;
				});

				if (selectedTicketCount % increment !== 0) {
					errors[ticketTypeId] = `Please order in increments of ${increment}`;
				}
			}
		});

		this.setState({ errors });

		if (Object.keys(errors).length > 0) {
			return false;
		}

		return true;
	}

	async onSubmit() {
		const { id } = selectedEvent;
		const ticketSelection = this.getTicketQuantities();

		this.submitAttempted = true;
		if (!this.validateFields()) {
			console.warn("Validation errors: ");
			console.warn(this.state.errors);
			return false;
		}

		if (!user.isAuthenticated) {
			//Show dialog for the user to signup/login, try again on success
			user.showAuthRequiredDialog(this.onSubmit.bind(this));
			return;
		}

		let emptyCart = true;
		Object.keys(ticketSelection).forEach(ticketTypeId => {
			if (ticketSelection[ticketTypeId] && ticketSelection[ticketTypeId] > 0) {
				emptyCart = false;
			}
		});

		if (emptyCart) {
			notifications.show({
				message: "Select tickets first."
			});
			return;
		}

		this.setState({ isSubmitting: true });

		const { result, error } = await this.updateCart();

		this.setState({ isSubmitting: false });

		if (error) {
			let message = "Adding to cart failed.";
			if (error.response && error.response.data && error.response.data.error) {
				message = error.response.data.error;
			}

			notifications.show({
				message,
				variant: "error"
			});

			return;
		}

		notifications.show({
			message: "Tickets added to cart",
			variant: "success"
		});
		this.props.history.push(`/events/${id}/tickets/confirmation`);
	}

	async updateCart() {
		//TODO rewrite this one monday into a shared function
		//Take existing cart details and edited cart details
		//Make an object of ticketTypeIds, ticketPricingIds and quantityToChangeB
		//Use that object to make all the async function calls

		console.log(ticketSelection);

		//TODO this is more than likely going to be replaced by a function in bn-api-node or bn-api
		//It's way to much of a mission
		const { items, ticketCount } = cart;
		const { ticketSelection } = this.state;
		const { ticket_types } = selectedEvent;

		//If they have no existing items in cart, it's simple
		if (ticketCount === 0) {
			return cart.addToCartAsync(ticketSelection);
		}

		for (let index = 0; index < ticket_types.length; index++) {
			const ticketType = ticket_types[index];

			const { id, name } = ticketType;
			console.log(name, " = ", id);

			const ticketTypeInCart = items.find(i => {
				return i.ticket_type_id === id;
			});

			//Get the number of tickets already added to the cart
			const ticketTypeInCartQuantity = ticketTypeInCart
				? ticketTypeInCart.quantity
				: 0;

			//Get the edited number of tickets
			const ticketTypeEditQuantity =
				ticketSelection && ticketSelection[id] ? ticketSelection[id] : 0;

			if (ticketTypeEditQuantity !== null) {
				let quantityDifference =
					ticketTypeEditQuantity - ticketTypeInCartQuantity;
				if (quantityDifference > 0) {
					console.log("Increase by: ", quantityDifference);

					const selectedTickets = {};
					selectedTickets[id] = quantityDifference;
					const { result, error } = cart.addToCartAsync(selectedTickets);
					if (error) {
						console.log("Increase error");
						return { error };
					}
				} else if (quantityDifference < 0) {
					const quantityToRemove = quantityDifference * -1;

					console.log("Decrease by: ", quantityToRemove);

					const { result, error } = cart.removeFromCartAsync(
						ticketType.ticket_pricing.id,
						quantityToRemove
					);

					if (error) {
						console.log("Decrease error");
						return { error };
					}
				}
			}

			// console.log("ticketTypeInCartQuantity: ", ticketTypeInCartQuantity);
			// console.log("ticketTypeEditQuantity: ", ticketTypeEditQuantity);
		}
		return { result: true };
	}

	getTicketQuantities() {
		//If we have a ticket quantity in a state, use that, else show from existing cart if it exists there.
		const { items } = cart;
		const { ticketSelection } = this.state;

		const cartSelection = {};
		if (items) {
			items.forEach(item => {
				const { item_type, ticket_type_id, quantity } = item;
				if (item_type === "Tickets") {
					cartSelection[ticket_type_id] = quantity;
				}
			});
		}

		const mergedResults = { ...cartSelection, ...ticketSelection };
		return mergedResults;
	}

	renderTicketPricing() {
		const { ticket_types } = selectedEvent;
		const { ticketSelection, errors } = this.state;
		const { items } = cart;
		if (!ticket_types) {
			//TODO use a loader
			return null; //Still loading this
		}

		const ticketQuantities = this.getTicketQuantities(items, ticketSelection);

		return ticket_types.map(
			({ id, name, status, ticket_pricing, increment }) => {
				let description = "";
				let price = 0;
				if (ticket_pricing) {
					price = ticket_pricing.price_in_cents / 100;
					description = ticket_pricing.name;
				} else {
					description = "(Tickets currently unavailable)";
				}

				return (
					<TicketSelection
						key={id}
						name={name}
						description={description}
						available={!!ticket_pricing}
						price={price}
						error={errors[id]}
						amount={ticketQuantities[id]}
						increment={increment}
						onNumberChange={amount =>
							this.setState(({ ticketSelection }) => {
								ticketSelection[id] = Number(amount) < 0 ? 0 : amount;
								return { ticketSelection };
							})
						}
						validateFields={this.validateFields.bind(this)}
					/>
				);
			}
		);
	}

	render() {
		const { classes } = this.props;
		const { openPromo, isSubmitting } = this.state;

		const { event, venue, artists, organization, id } = selectedEvent;

		if (event === null) {
			return <Typography variant="subheading">Loading...</Typography>;
		}

		if (event === false) {
			return <Typography variant="subheading">Event not found.</Typography>;
		}

		return (
			<Paper className={classes.card}>
				<EventSummaryGrid
					event={event}
					venue={venue}
					organization={organization}
					artists={artists}
				/>

				<Grid container spacing={24}>
					<Grid item xs={12} sm={12} lg={12}>
						{this.renderTicketPricing()}

						<div className={classes.buttonsContainer}>
							<Button
								onClick={() => this.setState({ openPromo: true })}
								size="large"
								variant="default"
							>
								Apply promo code
							</Button>
							&nbsp;
							<Button
								disabled={isSubmitting}
								onClick={this.onSubmit.bind(this)}
								size="large"
								variant="primary"
							>
								{isSubmitting ? "Adding..." : "Select tickets"}
							</Button>
						</div>

						<PromoCodeDialog
							open={openPromo}
							onCancel={() => this.setState({ openPromo: false })}
							onSuccess={discount => {
								console.log(discount);
								this.setState({ openPromo: false });
							}}
						/>
					</Grid>
				</Grid>
			</Paper>
		);
	}
}

CheckoutSelection.propTypes = {
	match: PropTypes.object.isRequired,
	classes: PropTypes.object.isRequired
};

export default withStyles(styles)(CheckoutSelection);
