import * as crypto from 'node:crypto';
import DBEntity from './DBEntity';

export type ProfileEntity = {
  id: string;
  avatar: string;
  sex: string;
  birthday: number;
  country: string;
  street: string;
  city: string;
  memberTypeId: string;
  userId: string;
};
type CreateProfileDTO = Omit<ProfileEntity, 'id'>;
type ChangeProfileDTO = Partial<Omit<ProfileEntity, 'id' | 'userId'>>;

export default class DBProfiles extends DBEntity<
  ProfileEntity,
  ChangeProfileDTO,
  CreateProfileDTO
> {
  async create(dto: CreateProfileDTO) {
    const created = {
      ...dto,
      id: crypto.randomUUID(),
    };
    this.entities.push(created);
    return created;
  }

  async onUserDelete(userId: string) {
    const profiles = await this.findMany({ key: 'userId', equals: userId });
    await Promise.all(profiles.map(profile => {
      return this.delete(profile.id);
    }))
  }
}
