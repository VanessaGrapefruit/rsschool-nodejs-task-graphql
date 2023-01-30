import DBEntity from './DBEntity';
import { ProfileEntity } from './DBProfiles';

export type MemberTypeEntity = {
  id: string;
  discount: number;
  monthPostsLimit: number;
  profileIds: string[];
};
type CreateMemberTypeDTO = Omit<MemberTypeEntity, 'profileIds'>;
type ChangeMemberTypeDTO = Partial<Omit<MemberTypeEntity, 'id'>>;

export default class DBMemberTypes extends DBEntity<
  MemberTypeEntity,
  ChangeMemberTypeDTO,
  CreateMemberTypeDTO
> {
  constructor() {
    super();

    this.create({
      id: 'basic',
      discount: 0,
      monthPostsLimit: 20,
    });
    this.create({
      id: 'business',
      discount: 5,
      monthPostsLimit: 100,
    });

    const forbidOperationTrap: ProxyHandler<any> = {
      apply(target) {
        throw new Error(
          `forbidden operation: cannot ${target.name} a member type`
        );
      },
    };

    this.delete = new Proxy(this.delete, forbidOperationTrap);
    this.create = new Proxy(this.create, forbidOperationTrap);
  }

  async create(dto: CreateMemberTypeDTO) {
    const created = {
      ...dto,
      profileIds: [],
    };
    this.entities.push(created);
    return created;
  }

  async onProfileCreate(profile: ProfileEntity): Promise<void> {
    const memberType = await this.findOne({ key: 'id', equals: profile.memberTypeId });
    if (memberType) {
      const changed: MemberTypeEntity = { ...memberType, profileIds: [...memberType.profileIds, profile.id ]};
      await this.change(memberType.id, changed);
    }
  }

  async onProfileChanged(prevProfile: ProfileEntity, currProfile: ProfileEntity): Promise<void> {
    if (prevProfile.memberTypeId === currProfile.memberTypeId) {
      return;
    }

    const prevMemberType = await this.findOne({ key: 'id', equals: prevProfile.memberTypeId });
    const currMemberType = await this.findOne({ key: 'id', equals: currProfile.memberTypeId });

    const promises = [];
    if (prevMemberType) {
      const changed: MemberTypeEntity = { ...prevMemberType, profileIds: prevMemberType.profileIds.filter(id => id !== prevProfile.id)};
      promises.push(this.change(prevMemberType.id, changed));
    }

    if (currMemberType) {
      const changed: MemberTypeEntity = { ...currMemberType, profileIds: [...currMemberType.profileIds, currProfile.id]};
      promises.push(this.change(currMemberType.id, changed));
    }

    await Promise.all(promises);
  }

  async onProfileDelete(profile: ProfileEntity): Promise<void> {
    const memberType = await this.findOne({ key: 'id', equals: profile.memberTypeId });
    if (memberType) {
      const changed: MemberTypeEntity = { ...memberType, profileIds: memberType.profileIds.filter(id => id !== profile.id) };
      await this.change(memberType.id, changed);
    }
  }
}
