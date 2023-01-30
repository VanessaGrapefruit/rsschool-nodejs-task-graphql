import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';
import { validate } from 'uuid';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  const memberTypes = fastify.db.memberTypes;

  fastify.get('/', async function (request, reply): Promise<
    MemberTypeEntity[]
  > {
    return await memberTypes.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity | void> {
      const id = request.params.id;

      const memberType = await memberTypes.findOne({ key: 'id', equals: id });
      if (memberType) {
        return memberType;
      } else {
        reply.code(404).send({ error: 'MemberType not found' });
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity | void> {
      const id = request.params.id;

      try {
        const changed = await memberTypes.change(id, request.body);
        return changed;
      } catch {
        reply.code(404).send({ error: 'MemberType not found' });
      }
    }
  );
};

export default plugin;
