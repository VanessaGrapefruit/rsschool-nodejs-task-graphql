import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphql } from 'graphql';
import { ContextType, createLoaders } from './dataloader';
import { buildSchema } from './graphql-schema';
import { graphqlBodySchema } from './schema';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  const schema = buildSchema(fastify.db);
  const context: ContextType = {
    loaders: createLoaders(fastify.db)
  }

  fastify.post(
    '/',
    {
      schema: {
        body: graphqlBodySchema,
      },
    },
    async function (request, reply) {
      const { variables, query } = request.body;
      return await graphql({
        schema,
        rootValue: {},
        source: query,
        contextValue: context,
        variableValues: variables
      });
    }
  );
};

export default plugin;
