import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import { Typography } from "@material-ui/core";
import { fontFamilyDemiBold } from "../../styles/theme";
import Divider from "../../common/Divider";
import NumberSelect from "../../elements/form/NumberSelect";

const styles = theme => ({
	container: {
		marginTop: theme.spacing.unit * 3,
		marginBottom: theme.spacing.unit
	},
	price: {
		fontSize: theme.typography.fontSize * 2,
		fontFamily: fontFamilyDemiBold,
		color: theme.palette.secondary.main
	},
	name: {
		fontSize: theme.typography.fontSize,
		fontFamily: fontFamilyDemiBold
	}
});

const TicketSelection = props => {
	const {
		available,
		classes,
		error,
		name,
		description,
		price,
		amount,
		increment,
		onNumberChange,
		validateFields,
		limitPerPerson
	} = props;

	const incrementText =
		increment > 1 ? `(Tickets must be bought in groups of ${increment})` : "";

	return (
		<div>
			<Divider style={{ margin: 0 }} />
			<Grid alignItems="center" className={classes.container} container>
				<Grid item xs={2} sm={2} md={6} lg={3}>
					<Typography className={classes.price}>
						{available ? `$${price}` : ""}
					</Typography>
				</Grid>
				<Grid item xs={8} sm={8} md={6} lg={6}>
					<Typography className={classes.name}>{name}</Typography>
					{/* <Typography variant="caption">
					{description} {incrementText}
				</Typography> */}
				</Grid>

				<Grid item xs={2} sm={2} md={6} lg={3}>
					<NumberSelect
						onIncrement={() => {
							const currentAmount = amount ? amount : 0;
							let newAmount = Number(currentAmount) + increment;

							console.log("increment: ", increment);

							if (limitPerPerson) {
								if (limitPerPerson > newAmount) {
									newAmount = limitPerPerson;
								}
							}

							onNumberChange(newAmount);
							validateFields();
						}}
						onDecrement={() => {
							const currentAmount = amount ? amount : 0;
							let newAmount = Number(currentAmount) - increment;
							if (newAmount < 0) {
								newAmount = 0;
							}

							onNumberChange(newAmount);
							validateFields();
						}}
					>
						{amount}
					</NumberSelect>
				</Grid>
			</Grid>
		</div>
	);
};

TicketSelection.propTypes = {
	available: PropTypes.bool,
	onNumberChange: PropTypes.func.isRequired,
	name: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	price: PropTypes.number.isRequired,
	error: PropTypes.string,
	amount: PropTypes.number,
	increment: PropTypes.number.isRequired,
	validateFields: PropTypes.func.isRequired,
	limitPerPerson: PropTypes.number,
	classes: PropTypes.object.isRequired
};

export default withStyles(styles)(TicketSelection);
