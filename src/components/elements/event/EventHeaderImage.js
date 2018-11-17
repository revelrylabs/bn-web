import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Hidden from "@material-ui/core/Hidden";
import classNames from "classnames";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import SupportingArtistsLabel from "../../pages/events/SupportingArtistsLabel";
import { fontFamilyBold, fontFamilyDemiBold } from "../../styles/theme";
import DateFlag from "./DateFlag";

const styles = theme => ({
	blurContainer: {
		width: "100%",
		overflow: "hidden",
		position: "relative"
	},
	blurryImage: {
		width: "110%",
		backgroundColor: "linear-gradient(to top, #000000, rgba(0, 0, 0, 0))",
		backgroundRepeat: "no-repeat",
		backgroundSize: "cover",
		backgroundPosition: "center",

		position: "absolute",
		WebkitFilter: "blur(5.5px)",
		filter: "blur(5.5px)",
		left: -15,
		right: -15,
		top: -15,
		bottom: -15
	},
	content: {
		position: "absolute",
		left: 0
	},
	desktopContent: {
		paddingLeft: theme.spacing.unit * 12,
		paddingBottom: theme.spacing.unit * 3,
		display: "flex",
		flexDirection: "column",
		justifyContent: "flex-end"
	},
	mobileContent: {
		padding: theme.spacing.unit * 3,
		paddingTop: theme.spacing.unit * 6
	},
	topLineInfo: {
		marginTop: theme.spacing.unit * 2,
		color: "#FFFFFF",
		textTransform: "uppercase",
		fontFamily: fontFamilyBold,
		fontSize: theme.typography.fontSize * 1.1,
		lineHeight: 1,
		marginBottom: theme.spacing.unit
	},
	topLineInfoMobile: {
		lineHeight: 2,
		fontSize: theme.typography.fontSize * 0.9
	},
	eventName: {
		color: "#FFFFFF",
		fontFamily: fontFamilyBold,
		fontSize: theme.typography.fontSize * 3,
		lineHeight: 1,
		marginBottom: theme.spacing.unit
	},
	eventNameMobile: {
		fontSize: theme.typography.fontSize * 3,
		marginBottom: 0
	},
	withArtists: {
		color: "#9da3b4",
		fontFamily: fontFamilyDemiBold,
		fontSize: theme.typography.fontSize * 2,
		lineHeight: 1
	},
	withArtistsDetailed: {
		color: "#FFFFFF",
		fontSize: theme.typography.fontSize * 1.6,
		lineHeight: 1
	},
	withArtistsMobile: {
		color: "#9da3b4",
		fontFamily: fontFamilyDemiBold,
		lineHeight: 2,
		fontSize: theme.typography.fontSize * 1.5
	},
	spaceLine: {
		marginTop: theme.spacing.unit * 2,
		marginBottom: theme.spacing.unit * 2,
		width: 40,
		borderBottom: `3px solid ${theme.palette.secondary.main}`
	},
	smallDetailsText: {
		marginTop: theme.spacing.unit * 2,
		color: "#FFFFFF",
		fontSize: theme.typography.fontSize * 1,
		lineHeight: 1.4
	}
});

const EventHeaderImage = props => {
	const {
		classes,
		variant,
		promo_image_url,
		displayEventStartDate,
		displayDoorTime,
		displayShowTime,
		name,
		top_line_info,
		eventStartDateMoment,
		artists,
		age_limit,
		height
	} = props;

	return (
		<div>
			{/* DESKTOP */}
			<Hidden smDown implementation="css">
				<div className={classes.blurContainer} style={{ height }}>
					<div
						className={classes.blurryImage}
						style={{
							backgroundImage: `url(${promo_image_url})`,
							height: height * 1.1
						}}
					/>
				</div>

				<Grid
					className={classNames(classes.content, classes.desktopContent)}
					style={{
						top: height * 0.35 * (variant === "detailed" ? 0.2 : 1),
						height
					}}
					container
				>
					<Grid item xs={12} sm={12} lg={6}>
						{variant === "simple" ? (
							<div>
								<Typography className={classes.topLineInfo}>
									{top_line_info}
								</Typography>
								<Typography className={classes.eventName}>{name}</Typography>
								<Typography className={classes.withArtists}>
									<SupportingArtistsLabel artists={artists} />
								</Typography>
							</div>
						) : null}

						{variant === "detailed" ? (
							<div>
								<DateFlag variant="rounded" date={eventStartDateMoment} />
								<Typography className={classes.topLineInfo}>
									{top_line_info}
								</Typography>
								<Typography className={classes.eventName}>{name}</Typography>
								<Typography className={classes.withArtistsDetailed}>
									<SupportingArtistsLabel artists={artists} />
								</Typography>

								<div className={classes.spaceLine} />

								<Typography className={classes.smallDetailsText}>
									{displayEventStartDate}
									<br />
									Doors {displayDoorTime} - Show {displayShowTime}
									<br />
									{age_limit
										? `This event is for over ${age_limit} year olds`
										: "This event is for all ages"}
								</Typography>
							</div>
						) : null}
					</Grid>
				</Grid>
			</Hidden>

			{/* Mobile */}
			<Hidden mdUp>
				<div className={classes.blurContainer} style={{ height }}>
					<div
						className={classes.blurryImage}
						style={{
							backgroundImage: `url(${promo_image_url})`,
							height: height * 1.1
						}}
					/>
				</div>

				<div
					className={classNames(classes.content, classes.mobileContent)}
					style={{
						top: height * 0.1,
						height: height * 1.2
					}}
				>
					{variant === "simple" ? (
						<div>
							<Typography
								className={classNames({
									[classes.topLineInfo]: true,
									[classes.topLineInfoMobile]: true
								})}
							>
								{top_line_info}
							</Typography>
							<Typography
								className={classNames({
									[classes.eventName]: true,
									[classes.eventNameMobile]: true
								})}
							>
								{name}
							</Typography>
							<Typography
								className={classNames({
									[classes.withArtists]: true,
									[classes.withArtistsMobile]: true
								})}
							>
								<SupportingArtistsLabel artists={artists} />
							</Typography>
						</div>
					) : null}

					{variant === "detailed" ? (
						<div>
							<DateFlag variant="rounded" date={eventStartDateMoment} />
							<Typography
								className={classNames({
									[classes.topLineInfo]: true,
									[classes.topLineInfoMobile]: true
								})}
							>
								{top_line_info}
							</Typography>
							<Typography
								className={classNames({
									[classes.eventName]: true,
									[classes.eventNameMobile]: true
								})}
							>
								{name}
							</Typography>
							<Typography
								className={classNames({
									[classes.withArtistsMobile]: true,
									[classes.withArtistsDetailed]: true
								})}
							>
								<SupportingArtistsLabel artists={artists} />
							</Typography>

							<div className={classes.spaceLine} />

							<Typography className={classes.smallDetailsText}>
								{displayEventStartDate}
								<br />
								Doors {displayDoorTime} - Show {displayShowTime}
								<br />
								{age_limit
									? `This event is for over ${age_limit} year olds`
									: "This event is for all ages"}
							</Typography>
						</div>
					) : null}
				</div>
			</Hidden>
		</div>
	);
};

EventHeaderImage.defaultProps = {
	height: 450,
	variant: "simple"
};

EventHeaderImage.propTypes = {
	classes: PropTypes.object.isRequired,
	variant: PropTypes.oneOf(["simple", "detailed"]),
	promo_image_url: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	top_line_info: PropTypes.string,
	artists: PropTypes.array.isRequired,
	eventStartDateMoment: PropTypes.object.isRequired,
	height: PropTypes.number,
	displayEventStartDate: PropTypes.string.isRequired,
	displayDoorTime: PropTypes.string.isRequired,
	displayShowTime: PropTypes.string.isRequired,
	age_limit: PropTypes.number.isRequired
};

export default withStyles(styles)(EventHeaderImage);
