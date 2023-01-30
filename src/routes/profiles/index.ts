import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { validate } from 'uuid';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  const { profiles, users } = fastify.db;

  fastify.get('/', async function (request, reply): Promise<
    ProfileEntity[]
  > {
    return await profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | void> {
      const id = request.params.id;

      if (!id || !validate(id)) {
        reply.code(400).send({ error: 'Invalide profileId' });
      }

      const profile = await profiles.findOne({ key: 'id', equals: id });
      if (profile) {
        return profile;
      } else {
        reply.code(404).send({ error: 'Profile not found' });
      }
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profile = await profiles.create(request.body);

      const errorObj = await fastify.db.onProfileCreate(profile);
      if (errorObj) {
        reply.code(400).send(errorObj);
      }
      
      return profile;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | void> {
      const id = request.params.id;

      if (!id || !validate(id)) {
        reply.code(400).send({ error: 'Invalide profileId' });
      }

      try {
        const deleted = await profiles.delete(id);
        await fastify.db.onProfileDelete(deleted);
        return deleted;
      } catch (e) {
        reply.code(404).send({ error: 'Profile not found' });
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | void> {
      const id = request.params.id;

      if (!id || !validate(id)) {
        reply.code(400).send({ error: 'Invalide profileId' });
      }

      const profile = await profiles.findOne({ key: 'id', equals: id });
      if (profile) {
        const changed = await profiles.change(id, request.body);
        await fastify.db.onProfileChange(profile, changed);
        return changed;
      } else {
        reply.code(404).send({ error: 'Profile not found' });
      }
    }
  );
};

export default plugin;
