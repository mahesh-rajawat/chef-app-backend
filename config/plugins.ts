module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'local',
      providerOptions: {},
    },
  },
  email: {
    config: {
      provider: 'sendgrid',
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY'),
      },
      settings: {
        defaultFrom: 'support@cheflink.app',
        defaultReplyTo: 'support@cheflink.app',
      },
    },
  },
  graphql: {
    config: {
      apolloServer: {
        introspection: true,
      },
    },
  },
});