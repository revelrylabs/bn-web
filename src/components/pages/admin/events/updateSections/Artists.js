import React, { Component } from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";
import { Typography, withStyles } from "@material-ui/core";
import moment from "moment";

import Button from "../../../../elements/Button";
import notifications from "../../../../../stores/notifications";
import AutoCompleteGroup from "../../../../common/form/AutoCompleteGroup";
import Bigneon from "../../../../../helpers/bigneon";
import EventArtist from "./EventArtist";
import LeftAlignedSubCard from "../../../../elements/LeftAlignedSubCard";
import eventUpdateStore from "../../../../../stores/eventUpdate";

const styles = theme => ({
	paddedContent: {
		paddingRight: theme.spacing.unit * 12,
		paddingLeft: theme.spacing.unit * 12,
		marginTop: theme.spacing.unit * 4
	}
});

const formatForSaving = artists => {
	const artistArray = artists.map(({ id, setTime }) => ({
		artist_id: id,
		set_time: setTime
			? moment.utc(setTime).format(moment.HTML5_FMT.DATETIME_LOCAL_MS)
			: null
	}));

	return artistArray;
};

const formatForInput = artistArray => {
	const artists = artistArray.map(({ artist, set_time }) => {
		return {
			id: artist.id,
			setTime: set_time
				? moment.utc(set_time, moment.HTML5_FMT.DATETIME_LOCAL_MS)
				: null
		};
	});

	return artists;
};

@observer
class ArtistDetails extends Component {
	constructor(props) {
		super(props);

		this.state = {
			artists: props.artists,
			showArtistSelect: false,
			availableArtists: null,
			errors: {},
			isSubmitting: false
		};
	}

	componentDidMount() {
		Bigneon()
			.artists.index()
			.then(response => {
				const { data, paging } = response.data; //@TODO Implement pagination
				this.setState({ availableArtists: data });
			})
			.catch(error => {
				console.error(error);

				let message = "Loading artists failed.";
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

	addNewArtist(id) {
		eventUpdateStore.addArtist(id);

		if (eventUpdateStore.artists.length === 1) {
			const { availableArtists } = this.state;
			const selectedArtist = availableArtists.find(a => a.id === id);
			if (selectedArtist && selectedArtist.image_url) {
				if (!eventUpdateStore.event.promoImageUrl) {
					//Assume the promo image is the headliner artist
					eventUpdateStore.updateEvent({
						promoImageUrl: selectedArtist.image_url
					});
				}
			}
		}
	}

	createNewArtist(name) {
		//TODO make a creatingArtist state var to show it's being done so the user doesn't keep trying
		const artistDetails = { name, bio: "", youtube_video_urls: [] }; //TODO remove youtube_video_urls when it's not needed

		Bigneon()
			.artists.create(artistDetails)
			.then(response => {
				const { id } = response.data;
				//Once inserted we need it in availableArtists right away
				this.setState(({ availableArtists }) => {
					availableArtists.push({ id, ...artistDetails });
					return { availableArtists };
				});

				//Add the
				this.addNewArtist(id);
			})
			.catch(error => {
				console.error(error);
				this.setState({ isSubmitting: false });

				let message = "Creating new artist failed.";
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

				this.setState({ isSubmitting: false });
			});
	}

	renderAddNewArtist() {
		//Pass through the currently selected artist if one has been selected
		const { availableArtists } = this.state;
		if (availableArtists === null) {
			return <Typography variant="body1">Loading artists...</Typography>;
		}

		const artistsObj = {};
		availableArtists.forEach(artist => {
			artistsObj[artist.id] = artist.name;
		});

		const { artists } = eventUpdateStore;

		const isHeadline = artists && artists.length < 1;

		return (
			<AutoCompleteGroup
				value={""}
				items={artistsObj}
				name={"artists"}
				label={`Add your ${isHeadline ? "headline act*" : "supporting act"}`}
				placeholder={"eg. Childish Gambino"}
				onChange={artistId => {
					if (artistId) {
						this.addNewArtist(artistId);
						this.setState({ showArtistSelect: false });
					}
				}}
				formatCreateLabel={label => `Create a new artist "${label}"`}
				onCreateOption={this.createNewArtist.bind(this)}
			/>
		);
	}

	render() {
		const { classes } = this.props;
		const { availableArtists, showArtistSelect, errors } = this.state;
		const { artists } = eventUpdateStore;

		return (
			<div>
				{artists.map((eventArtist, index) => {
					const { id, setTime } = eventArtist;

					let name = "Loading..."; // If we haven't loaded all the available artists we won't have this guys name yet
					let thumb_image_url = "";
					let socialAccounts = {};
					if (availableArtists) {
						const artist = availableArtists.find(artist => artist.id === id);

						if (artist) {
							name = artist.name;
							thumb_image_url = artist.thumb_image_url || artist.image_url;
							const {
								bandcamp_username,
								facebook_username,
								instagram_username,
								snapchat_username,
								soundcloud_username,
								website_url
							} = artist;
							socialAccounts = {
								bandcamp: bandcamp_username,
								facebook: facebook_username,
								instagram: instagram_username,
								snapchat: snapchat_username,
								soundcloud: soundcloud_username,
								website: website_url
							};
						}
					}

					return (
						<LeftAlignedSubCard key={index}>
							<EventArtist
								socialAccounts={socialAccounts}
								typeHeading={index === 0 ? "Headline act *" : "Supporting act"}
								title={name}
								setTime={setTime}
								onChangeSetTime={setTime => {
									eventUpdateStore.changeArtistSetTime(index, setTime);
								}}
								imgUrl={
									thumb_image_url || "/images/profile-pic-placeholder.png"
								}
								error={errors.artists ? errors.artists[index] : null}
								onDelete={() => {
									eventUpdateStore.removeArtist(index);
								}}
							/>
						</LeftAlignedSubCard>
					);
				})}

				<div className={classes.paddedContent}>
					{showArtistSelect || artists.length === 0
						? this.renderAddNewArtist()
						: null}

					{artists.length > 0 && !showArtistSelect ? (
						<Button
							variant="additional"
							onClick={() => this.setState({ showArtistSelect: true })}
						>
							Add supporting artist
						</Button>
					) : null}
				</div>
			</div>
		);
	}
}

ArtistDetails.propTypes = {
	eventId: PropTypes.string,
	organizationId: PropTypes.string.isRequired,
	artists: PropTypes.array.isRequired
};

export const Artists = withStyles(styles)(ArtistDetails);
export const formatArtistsForSaving = formatForSaving;
export const formatArtistsForInputs = formatForInput;
