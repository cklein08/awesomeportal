import md5 from 'md5';

export type ProfileWithImage = {
  picture?: string;
  avatar?: string;
  user_image?: string;
  profile_image?: string;
  image?: string;
  imsProfile?: { picture?: string };
  email?: string;
  profile?: { picture?: string; avatar?: string };
} | null | undefined;

/**
 * Profile image URL: IMS/userinfo fields first, then Gravatar from email
 * (matches account.adobe.com profile image source when no picture from IMS).
 */
function firstNonEmptyString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return '';
}

export function getProfilePictureUrl(profile: ProfileWithImage): string {
  if (!profile) return '';
  const r = profile as Record<string, unknown>;
  const fromAdobeExtras = firstNonEmptyString(r.photo, r.userpic, r.userPic, r.avatarUrl);
  const fromProfile =
    fromAdobeExtras ||
    (profile.picture ??
      profile.avatar ??
      profile.user_image ??
      profile.profile_image ??
      profile.image ??
      profile.profile?.picture ??
      profile.profile?.avatar ??
      (profile.imsProfile as { picture?: string } | undefined)?.picture ??
      '');
  if (fromProfile) return fromProfile;
  const email = profile.email?.trim().toLowerCase();
  if (email) return `https://www.gravatar.com/avatar/${md5(email)}?s=48&d=identicon`;
  return '';
}
