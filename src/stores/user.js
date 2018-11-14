import { observable, computed, action } from "mobx";
import decodeJWT from "../helpers/decodeJWT";
import notifications from "./notifications";
import Bigneon from "../helpers/bigneon";
import cart from "./cart";

class User {
	@observable
	id = null;

	@observable
	token = null;

	@observable
	firstName = "";

	@observable
	lastName = "";

	@observable
	email = "";

	@observable
	phone = "";

	@observable
	profilePicUrl = "";

	@observable
	roles = [];

	@observable
	showRequiresAuthDialog = false;

	@action
	refreshUser(onSuccess = null, onError = null) {
		const token = localStorage.getItem("access_token");
		if (!token) {
			onError ? onError("Missing access token") : null;
			this.onLogout();
			return;
		}

		//Every time the user is loaded, refresh the token first. This is always called on the first load.
		//There could be a better way, open to suggestions.
		this.refreshToken(
			() => {
				Bigneon()
					.users.current()
					.then(response => {
						const { data } = response;

						const {
							user: {
								id,
								first_name,
								last_name,
								email,
								phone,
								profile_pic_url
							},
							scopes, //TODO use these instead of roles
							organization_roles,
							organization_scopes, //TODO use these instead of roles
							roles
						} = data;

						//TODO eventually this won't be like this as scopes will be on an org level and not a global one but for now the frontend needs to work to continue the checkout
						let globalRoles = roles;
						Object.keys(organization_roles).forEach(organizationId => {
							globalRoles = globalRoles.concat(
								organization_roles[organizationId]
							);
						});

						const jwtData = decodeJWT(token);

						const {
							sub //UserId
						} = jwtData;

						this.token = token;
						this.id = id;
						this.firstName = first_name;
						this.lastName = last_name;
						this.email = email;
						this.phone = phone;
						this.roles = globalRoles;
						this.profilePicUrl = profile_pic_url;

						if (onSuccess) {
							onSuccess({
								id,
								firstName: first_name,
								lastName: last_name,
								email,
								phone,
								profilePicUrl: this.profilePicUrl
							});
						}

						cart.refreshCart();
					})
					.catch(error => {
						console.error(error);
						if (onError) {
							onError ? onError(error.message) : null;
						} else {
							//TODO if we get a 401, try refresh the token and then try this all again. But don't create a recursive loop.
							//If we get a 401, assume the token expired
							if (error.response && error.response.status === 401) {
								console.log("Unauthorized, logging out.");
								notifications.show({
									message: "Session expired",
									variant: "info"
								});
								this.onLogout();
							} else {
								notifications.show({
									message: error.message,
									variant: "error"
								});
							}
						}
					});
			},
			e => {
				console.log(e);
			}
		);
	}

	@action
	refreshToken(onSuccess, onError) {
		const refresh_token = localStorage.getItem("refresh_token");
		if (!refresh_token) {
			onError("Missing refresh token.");
			return;
		}

		Bigneon()
			.auth.refresh({ refresh_token })
			.then(response => {
				const { access_token, refresh_token } = response.data;
				localStorage.setItem("access_token", access_token);
				localStorage.setItem("refresh_token", refresh_token);
				onSuccess();
			})
			.catch(error => {
				console.error(error);

				if (
					error.response &&
					error.response.status &&
					error.response.status === 404
				) {
					//If it's a 404 the user is now gone
					notifications.show({
						message: "User no longer exists.",
						variant: "error"
					});
					this.onLogout();
				} else {
					notifications.show({
						message: "Failed to refresh session.",
						variant: "error"
					});

					onError(error);
				}
			});
	}

	//After logout
	@action
	onLogout() {
		this.token = false;
		this.id = null;
		this.firstName = "";
		this.lastName = "";
		this.email = "";
		this.phone = "";
		this.roles = [];
		this.profilePicUrl = "";

		localStorage.removeItem("access_token");
		localStorage.removeItem("refresh_token");

		//If they logged in with facebook, kill that session also
		if (window.FB) {
			window.FB.getLoginStatus(({ status }) => {
				if (status === "connected") {
					window.FB.logout(() => {});
				}
			});
		}

		cart.emptyCart();
	}

	//Dialog is kept in Container.js ready to popup when it's needed
	@action
	showAuthRequiredDialog(onSuccess) {
		this.showRequiresAuthDialog = true;

		if (onSuccess) {
			this.onAuthDialogSuccess = onSuccess;
		}
	}

	@action
	onSuccessAuthRequiredDialog() {
		this.showRequiresAuthDialog = false;

		if (this.onAuthDialogSuccess) {
			this.onAuthDialogSuccess();
		}
	}

	@action
	hideAuthRequiredDialog() {
		this.showRequiresAuthDialog = false;
	}

	@computed
	get isAuthenticated() {
		//If the token is set, return 'true'.
		//If it's not set yet been checked it's 'null'.
		//If it has been checked but not authed then it's 'false'
		return this.token ? !!this.token : this.token;
	}

	@computed
	get isAdmin() {
		//console.log(this.roles);
		return this.roles.indexOf("Admin") > -1;
	}

	@computed
	get isOrgOwner() {
		return this.roles.indexOf("OrgOwner") > -1;
	}

	@computed
	get isOrgMember() {
		return this.roles.indexOf("OrgMember") > -1;
	}

	@computed
	get isUser() {
		return this.roles.indexOf("User") > -1;
	}

	@computed
	get isGuest() {
		//If they haven't signed in yet
		return !this.token;
	}
}

const user = new User();

export default user;
