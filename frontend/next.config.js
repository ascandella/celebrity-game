const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

module.exports = (phase, { defaultConfig }) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      ...defaultConfig,
      env: {
        // default clojure backend in development / docker
        apiBase: "ws://localhost:3030",
      },
    };
  }

  return {
    ...defaultConfig,
    env: {
      apiBase: process.env.CELEBRITY_BACKEND,
    },
  };
};
