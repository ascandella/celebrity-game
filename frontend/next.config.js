const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

module.exports = (phase, { defaultConfig }) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      env: {
        // default clojure backend in development / docker
        apiBase: "ws://localhost:3030",
      },
    };
  }

  return {
    env: {
      apiBase: process.env.CELEBRITY_BACKEND,
    },
  };
};
