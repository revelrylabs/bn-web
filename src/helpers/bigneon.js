import Bigneon from "bn-api-node/dist/bundle.client.js";

let bigneon;

export const bigneonFactory = (options = {}, headers = {}, mockData) => {
	if (!bigneon) {
		options = {
			...{
				protocol: process.env.REACT_APP_API_PROTOCOL,
				host: process.env.REACT_APP_API_HOST,
				port: process.env.REACT_APP_API_PORT,
				timeout: process.env.REACT_APP_API_TIMEOUT || 30000,
				basePath: process.env.REACT_APP_API_BASEPATH || "",
				prefix: "https://thingproxy.freeboard.io/fetch/https://staging.bigneon.com/api/"
			},
			...options
		};
		bigneon = new Bigneon.Server(options, headers, mockData);
	}
	const accessToken = localStorage.getItem("access_token");
	if (accessToken) {
		bigneon.client.setToken(accessToken);
	}
	return bigneon;
};

export default bigneonFactory;
