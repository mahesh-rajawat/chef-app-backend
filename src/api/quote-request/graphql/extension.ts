
export default ({ nexus, strapi }: { nexus: any, strapi: any }) => ({
  types: [
    nexus.objectType({
      name: 'ComponentQuoteDiscussionEntry',
      definition(t: any) {
        t.id('id');
        t.string('author');
        t.string('message');
        t.field('timestamp', { type: 'DateTime' });
      },
    }),
    nexus.inputObjectType({
      name: 'ComponentQuoteDiscussionEntryInput',
      definition(t: any) {
        t.id('id');
        t.string('author');
        t.string('message');
        t.field('timestamp', { type: 'DateTime' });
      },
    }),
    nexus.extendInputType({
      type: 'QuoteRequestInput',
      definition(t: any) {
        t.list.field('discussion', {
          type: 'ComponentQuoteDiscussionEntryInput',
        });
      },
    }),
  ],
});
