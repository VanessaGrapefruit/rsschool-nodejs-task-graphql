import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';
import { validate } from 'uuid';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  const { posts, users } = fastify.db;

  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return await posts.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity | void> {
      const id = request.params.id;

      if (!id || !validate(id)) {
        reply.code(400).send({ error: 'Invalid postId' });
      }

      const post = await posts.findOne({ key: 'id', equals: id });

      if (post) {
        return post;
      } else {
        reply.code(404).send({ error: 'Post not found' });
      }
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity | void> {
      const body = request.body;
      const user = await users.findOne({ key: 'id', equals: body.userId });

      if (user) {
        const created = await posts.create(request.body);
        fastify.db.onPostCreate(created);
        return created;
      } else {
        reply.code(400).send({ error: 'Invalid userId' });
      }
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity | void> {
      const id = request.params.id;

      if (!id || !validate(id)) {
        reply.code(400).send({ error: 'Invalid postId' });
      }

      try {
        const deleted = await posts.delete(id);
        fastify.db.onPostDelete(deleted);
        return deleted;
      } catch {
        reply.code(404).send({ error: 'Post not found' });
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity | void> {
      const id = request.params.id;

      if (!id || !validate(id)) {
        reply.code(400).send({ error: 'Invalid postId' });
      }

      try {
        const changed = await posts.change(id, request.body);
        return changed;
      } catch {
        reply.code(404).send({ error: 'Post not foun' });
      }
    }
  );
};

export default plugin;
