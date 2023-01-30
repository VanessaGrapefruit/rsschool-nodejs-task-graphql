import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeToBodySchema,
  unsubscribeFromBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import { validate } from 'uuid';
import { NoRequiredEntity } from '../../utils/DB/errors/NoRequireEntity.error';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  const users = fastify.db.users;

  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return await users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | void> {
      const id = request.params.id;
      if (!id || !validate(id)) {
        reply.code(400).send({ error: 'Invalid userId' });
      }
      const user = await users.findOne({ key: 'id', equals: id });

      if (user) {
        return user;
      } else {
        reply.code(404).send({ error: 'User not found' });
      }
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      reply.code(201);
      return await users.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | void> {
      const id = request.params.id;
      if (!id || !validate(id)) {
        reply.code(400).type('text').send('Invalid userId');
      }

      try {
        const deleted = await users.delete(id);

        fastify.db.onUserDelete(id);

        reply.code(204);
        return deleted;
      } catch (e) {
        reply.code(404).send({ error: 'User not found' });
      }
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeToBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | void> {
      const followedId = request.body.userId;
      const subscriberId = request.params.id;
      
      if (!subscriberId || !validate(subscriberId) || !followedId || !validate(followedId)) {
        reply.code(400).send({ error: 'Invalid userId' });
      }

      const subscriber = await users.findOne({ key: 'id', equals: subscriberId });
      const followed = await users.findOne({ key: 'id', equals: followedId });
      if (!subscriber || !followed) {
        reply.code(404).send({ error: 'User not found' });
      } else if (subscriber.userSubscribedToIds.includes(followedId)) {
        reply.code(400).send(`User is already subscribed to userId: ${followedId}`);
      } else {
        const changedSubscriber: UserEntity = { ...subscriber, userSubscribedToIds: [...subscriber.userSubscribedToIds, followedId ]};
        const changedFollowed: UserEntity = { ...followed, subscribedToUserIds: [...followed.subscribedToUserIds, subscriberId] };
        
        await users.change(followedId, changedFollowed);
        return await users.change(subscriberId, changedSubscriber);
      }
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: unsubscribeFromBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | void> {
      const followedId = request.body.userId;
      const subscriberId = request.params.id;
      
      if (!subscriberId || !validate(subscriberId) || !followedId || !validate(followedId)) {
        reply.code(400).send({ error: 'Invalid userId' });
      }

      const subscriber = await users.findOne({ key: 'id', equals: subscriberId });
      const followed = await users.findOne({ key: 'id', equals: followedId });

      if (!subscriber || !followed) {
        reply.code(404).send({ error: 'User not found' });
      } else if (!subscriber.userSubscribedToIds.includes(followedId)) {
        reply.code(400).send(`User is not subscribed to userId ${followedId}`);
      } else {
        const changedSubscriber: UserEntity = { ...subscriber, userSubscribedToIds: subscriber?.userSubscribedToIds.filter(id => id !== followedId) };
        const changedFollowed: UserEntity = { ...followed, subscribedToUserIds: followed.subscribedToUserIds.filter(id => id !== subscriberId) };
        
        await users.change(followedId, changedFollowed);
        return await users.change(subscriberId, changedSubscriber);
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | void> {
      const id = request.params.id;

      if (!id || !validate(id)) {
        reply.code(400).send({ error: 'Invalid userId' });
      }

      try {
        return await users.change(id, request.body);
      } catch (e) {
        reply.code(404).send({ error: 'User not found' });
      }
    }
  );
};

export default plugin;
