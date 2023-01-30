import * as crypto from 'node:crypto';
import DBEntity from './DBEntity';
import { ProfileEntity } from './DBProfiles';

export type UserEntity = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileId: string | null;
  userSubscribedToIds: string[];
  subscribedToUserIds: string[];
  postIds: string[];
};
type CreateUserDTO = Omit<
  UserEntity,
  'id' | 'profileId' | 'userSubscribedToIds' | 'subscribedToUserIds' | 'postIds'
>;
type ChangeUserDTO = Partial<Omit<UserEntity, 'id'>>;

export default class DBUsers extends DBEntity<
  UserEntity,
  ChangeUserDTO,
  CreateUserDTO
> {
  async create(dto: CreateUserDTO) {
    const created = {
      ...dto,
      id: crypto.randomUUID(),
      profileId: null,
      userSubscribedToIds: [],
      subscribedToUserIds: [],
      postIds: [],
    };
    this.entities.push(created);
    return created;
  }

  async delete(id: string): Promise<UserEntity> {
    const deleted = super.delete(id);
    const subscribers = await this.findMany({ key: 'subscribedToUserIds', inArray: id });
    await Promise.all(subscribers.map(subscriber => {
      return this.change(subscriber.id, { ...subscriber, subscribedToUserIds: subscriber.subscribedToUserIds.filter(i => i !== id)});
    }));
    return deleted;
  };

  async onProfileCreate(profile: ProfileEntity): Promise<{ error: string} | void> {
    const user = await this.findOne({ key: 'id', equals: profile.userId });
    if (user && user.profileId) {
      return { error: 'User already has a profile' };
    } else if (user) {
      const changed: UserEntity = { ...user, profileId: profile.id };
      await this.change(user.id, changed).catch(() => void 0);
    }
  }

  async onProfileDelete(profile: ProfileEntity): Promise<void> {
    const user = await this.findOne({ key: 'id', equals: profile.userId });
    if (user) {
      const changed: UserEntity = { ...user, profileId: null };
      await this.change(user.id, changed);
    }
  }
}
