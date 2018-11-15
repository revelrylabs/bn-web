import React, { Component } from "react";
import { Typography, withStyles, CardMedia } from "@material-ui/core";

import notifications from "../../../stores/notifications";
import user from "../../../stores/user";
import Bigneon from "../../../helpers/bigneon";

const styles = theme => ({});

class ReceiveTransfer extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isSubmitting: false,
			transferAuth: null
		};
	}

	componentDidMount() {
		const url = new URL(window.location.href);
		const transferAuth = {
			transfer_key:
				url.searchParams.get("transfer_key"),
			sender_user_id:
				url.searchParams.get("sender_user_id"),
			num_tickets:
				parseInt(url.searchParams.get("num_tickets")),
			signature:
				url.searchParams.get("signature"),
		};

		this.setState({ transferAuth });


		if (!user.isAuthenticated) {
			//Show dialog for the user to signup/login, try again when they're authenticated
			user.showAuthRequiredDialog(this.receiveTransfer.bind(this));
			return;
		}

		this.receiveTransfer();


	}

	receiveTransfer() {
		this.setState({ isSubmitting: true });
		const { transferAuth } = this.state;

		Bigneon()
			.tickets.transfer.receive(transferAuth)
			.then(response => {
				this.setState({ isSubmitting: false });

				notifications.show({
					message: "Tickets received.",
					variant: "success"
				});

				localStorage.removeItem("transferAuth");
				this.props.history.push(`/dashboard`);
			})
			.catch(error => {
				console.error(error);
				this.setState({ isSubmitting: false });
				notifications.show({
					message: "Receiving tickets failed.",
					variant: "error"
				});
			});
	}

	render() {
		const { isSubmitting, transferAuth } = this.state;

		if (!transferAuth) {
			return null;
		}

		return (
			<div>
				<Typography variant="display2">
					{isSubmitting ? "Receiving tickets..." : "Tickets"}
				</Typography>
			</div>
		);
	}
}

export default withStyles(styles)(ReceiveTransfer);
