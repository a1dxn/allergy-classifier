const log    = _log.get("web-socket");
const logOUT = log.get("out");
const logIN  = log.get("in");

module.exports = async function(webSocket, wsClient) {
	/*** on 'connection' ***/

	wsClient.emit("welcome", "hello world!");

	/*** on 'set-water-manual' ***/
	wsClient.on("set-water-manual", (data) => {
		//TODO: part of webUI - set water manual
		logIN.info("set-water-manual: Data received: %O", data);
	});

	wsClient.on("disconnect", (data) => log.debug("Client disconnected. %O", data));

};
